<?php
/**
 * موجّه واجهة الإدارة (Admin API)
 * كل الطلبات POST مع { action: "...", ... }.
 * الجلسة عبر ملف تعريف ارتباط، والتعديلات محمية برمز CSRF.
 */
require_once __DIR__ . '/../helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['ok' => false, 'error' => 'method'], 405);
if (!db_installed()) json_out(['ok' => false, 'error' => 'not_installed'], 503);

$in = json_in();
$action = $in['action'] ?? '';
$p = db();

/* ------------------ مصادقة ------------------ */
if ($action === 'login') {
  $u = trim($in['username'] ?? '');
  $pw = (string)($in['password'] ?? '');
  $st = $p->prepare("SELECT * FROM admins WHERE username=? AND active=1");
  $st->execute([$u]);
  $a = $st->fetch();
  if (!$a || !password_verify($pw, $a['password_hash'])) {
    json_out(['ok' => false, 'error' => 'bad_credentials'], 401);
  }
  start_admin_session();
  $_SESSION['admin'] = ['id' => (int)$a['id'], 'username' => $a['username'], 'name' => $a['name'], 'role' => $a['role']];
  json_out(['ok' => true, 'admin' => $_SESSION['admin'], 'csrf' => csrf_token()]);
}

if ($action === 'logout') {
  start_admin_session();
  $_SESSION = [];
  session_destroy();
  json_out(['ok' => true]);
}

if ($action === 'me') {
  $a = current_admin();
  if (!$a) json_out(['ok' => false, 'error' => 'unauthorized'], 401);
  json_out(['ok' => true, 'admin' => $a, 'csrf' => csrf_token()]);
}

/* كل ما بعده يتطلب تسجيل دخول */
$admin = require_admin();

/* التعديلات تتطلب CSRF */
$mutations = ['order_status','product_save','product_delete','branch_save','branch_delete',
  'category_save','category_delete','zone_save','zone_delete','settings_save','change_password'];
if (in_array($action, $mutations, true)) check_csrf();

switch ($action) {

  /* ---------------- لوحة الإحصائيات ---------------- */
  case 'dashboard': {
    $today = date('Y-m-d');
    $q = fn($sql, $args = []) => (function () use ($p, $sql, $args) { $s = $p->prepare($sql); $s->execute($args); return $s->fetch(); })();
    $todayCount = (int)$q("SELECT COUNT(*) c FROM orders WHERE substr(created_at,1,10)=?", [$today])['c'];
    $todaySales = (float)($q("SELECT COALESCE(SUM(total),0) s FROM orders WHERE substr(created_at,1,10)=? AND status NOT IN('cancelled','rejected')", [$today])['s']);
    $byStatus = [];
    $st = $p->query("SELECT status, COUNT(*) c FROM orders GROUP BY status");
    foreach ($st as $r) $byStatus[$r['status']] = (int)$r['c'];
    $totalOrders = (int)$p->query("SELECT COUNT(*) c FROM orders")->fetch()['c'];
    $products = (int)$p->query("SELECT COUNT(*) c FROM products")->fetch()['c'];
    $branches = (int)$p->query("SELECT COUNT(*) c FROM branches")->fetch()['c'];
    json_out(['ok' => true, 'stats' => compact('todayCount','todaySales','byStatus','totalOrders','products','branches')]);
  }

  /* ---------------- الطلبات ---------------- */
  case 'orders_list': {
    $status = $in['status'] ?? '';
    $sql = "SELECT o.*, b.name branch_name FROM orders o LEFT JOIN branches b ON b.id=o.branch_id";
    $args = [];
    if ($status !== '') { $sql .= " WHERE o.status=?"; $args[] = $status; }
    $sql .= " ORDER BY o.id DESC LIMIT 200";
    $st = $p->prepare($sql); $st->execute($args);
    json_out(['ok' => true, 'orders' => $st->fetchAll()]);
  }

  case 'order_get': {
    $id = (int)($in['id'] ?? 0);
    $st = $p->prepare("SELECT o.*, b.name branch_name, z.name zone_name FROM orders o LEFT JOIN branches b ON b.id=o.branch_id LEFT JOIN delivery_zones z ON z.id=o.zone_id WHERE o.id=?");
    $st->execute([$id]);
    $order = $st->fetch();
    if (!$order) json_out(['ok' => false, 'error' => 'not_found'], 404);
    $it = $p->prepare("SELECT * FROM order_items WHERE order_id=?");
    $it->execute([$id]);
    json_out(['ok' => true, 'order' => $order, 'items' => $it->fetchAll()]);
  }

  case 'order_status': {
    $id = (int)($in['id'] ?? 0);
    $status = $in['status'] ?? '';
    $allowed = ['new','confirmed','preparing','ready','out_for_delivery','delivered','completed','cancelled','rejected'];
    if (!in_array($status, $allowed, true)) json_out(['ok' => false, 'error' => 'bad_status'], 400);
    $p->prepare("UPDATE orders SET status=? WHERE id=?")->execute([$status, $id]);
    json_out(['ok' => true]);
  }

  /* ---------------- المنتجات ---------------- */
  case 'products_list': {
    $rows = $p->query("SELECT pr.*, c.name cat_name FROM products pr LEFT JOIN categories c ON c.id=pr.category_id ORDER BY pr.sort, pr.id")->fetchAll();
    // إرفاق التوفر لكل منتج
    $avStmt = $p->prepare("SELECT branch_id, price, in_stock FROM product_branch WHERE product_id=?");
    $pgStmt = $p->prepare("SELECT group_id FROM product_option_groups WHERE product_id=?");
    foreach ($rows as &$r) {
      $avStmt->execute([$r['id']]);
      $r['availability'] = $avStmt->fetchAll();
      $pgStmt->execute([$r['id']]);
      $r['optionGroups'] = array_map(fn($x) => (int)$x['group_id'], $pgStmt->fetchAll());
    }
    json_out(['ok' => true, 'products' => $rows]);
  }

  case 'product_save': {
    $d = $in['product'] ?? [];
    $id = (int)($d['id'] ?? 0);
    $fields = [
      $d['name'] ?? '', (int)($d['category_id'] ?? 0), $d['description'] ?? '', $d['emoji'] ?? '🍮',
      (float)($d['base_price'] ?? 0), ($d['sale_price'] === '' || $d['sale_price'] === null) ? null : (float)$d['sale_price'],
      !empty($d['is_featured']) ? 1 : 0, !empty($d['is_new']) ? 1 : 0, (int)($d['points'] ?? 0),
      (int)($d['sort'] ?? 0), !empty($d['active']) ? 1 : 0,
    ];
    if ($id) {
      $sql = "UPDATE products SET name=?,category_id=?,description=?,emoji=?,base_price=?,sale_price=?,is_featured=?,is_new=?,points=?,sort=?,active=? WHERE id=?";
      $fields[] = $id;
      $p->prepare($sql)->execute($fields);
    } else {
      $sql = "INSERT INTO products (name,category_id,description,emoji,base_price,sale_price,is_featured,is_new,points,sort,active) VALUES (?,?,?,?,?,?,?,?,?,?,?)";
      $p->prepare($sql)->execute($fields);
      $id = (int)$p->lastInsertId();
    }
    // التوفر لكل فرع
    if (isset($d['availability']) && is_array($d['availability'])) {
      $p->prepare("DELETE FROM product_branch WHERE product_id=?")->execute([$id]);
      $ins = $p->prepare("INSERT INTO product_branch (product_id,branch_id,price,in_stock) VALUES (?,?,?,?)");
      foreach ($d['availability'] as $av) {
        if (empty($av['enabled'])) continue;
        $ins->execute([$id, (int)$av['branch_id'], (float)($av['price'] ?? 0), !empty($av['in_stock']) ? 1 : 0]);
      }
    }
    // مجموعات الخيارات
    if (isset($d['optionGroups']) && is_array($d['optionGroups'])) {
      $p->prepare("DELETE FROM product_option_groups WHERE product_id=?")->execute([$id]);
      $ins = $p->prepare("INSERT INTO product_option_groups (product_id,group_id,sort) VALUES (?,?,?)");
      $s = 0;
      foreach ($d['optionGroups'] as $gid) $ins->execute([$id, (int)$gid, ++$s]);
    }
    json_out(['ok' => true, 'id' => $id]);
  }

  case 'product_delete': {
    $id = (int)($in['id'] ?? 0);
    $p->prepare("DELETE FROM product_branch WHERE product_id=?")->execute([$id]);
    $p->prepare("DELETE FROM product_option_groups WHERE product_id=?")->execute([$id]);
    $p->prepare("DELETE FROM products WHERE id=?")->execute([$id]);
    json_out(['ok' => true]);
  }

  /* ---------------- الفروع ---------------- */
  case 'branches_list': {
    json_out(['ok' => true, 'branches' => $p->query("SELECT * FROM branches ORDER BY sort, id")->fetchAll()]);
  }

  case 'branch_save': {
    $d = $in['branch'] ?? [];
    $id = (int)($d['id'] ?? 0);
    $f = [
      $d['name'] ?? '', $d['city'] ?? '', $d['area'] ?? '', $d['phone'] ?? '', $d['whatsapp'] ?? '', $d['address'] ?? '',
      !empty($d['is_open']) ? 1 : 0, $d['hours'] ?? '', !empty($d['allow_delivery']) ? 1 : 0, !empty($d['allow_pickup']) ? 1 : 0,
      (float)($d['min_order'] ?? 0), (int)($d['prep_time'] ?? 20), (int)($d['sort'] ?? 0), !empty($d['active']) ? 1 : 0,
    ];
    if ($id) {
      $f[] = $id;
      $p->prepare("UPDATE branches SET name=?,city=?,area=?,phone=?,whatsapp=?,address=?,is_open=?,hours=?,allow_delivery=?,allow_pickup=?,min_order=?,prep_time=?,sort=?,active=? WHERE id=?")->execute($f);
    } else {
      $p->prepare("INSERT INTO branches (name,city,area,phone,whatsapp,address,is_open,hours,allow_delivery,allow_pickup,min_order,prep_time,sort,active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)")->execute($f);
      $id = (int)$p->lastInsertId();
    }
    json_out(['ok' => true, 'id' => $id]);
  }

  case 'branch_delete': {
    $id = (int)($in['id'] ?? 0);
    $p->prepare("DELETE FROM branches WHERE id=?")->execute([$id]);
    json_out(['ok' => true]);
  }

  /* ---------------- التصنيفات ---------------- */
  case 'categories_list': {
    json_out(['ok' => true, 'categories' => $p->query("SELECT * FROM categories ORDER BY sort, id")->fetchAll()]);
  }

  case 'category_save': {
    $d = $in['category'] ?? [];
    $id = (int)($d['id'] ?? 0);
    $f = [$d['name'] ?? '', $d['emoji'] ?? '🍽️', (int)($d['sort'] ?? 0), !empty($d['active']) ? 1 : 0];
    if ($id) { $f[] = $id; $p->prepare("UPDATE categories SET name=?,emoji=?,sort=?,active=? WHERE id=?")->execute($f); }
    else { $p->prepare("INSERT INTO categories (name,emoji,sort,active) VALUES (?,?,?,?)")->execute($f); $id = (int)$p->lastInsertId(); }
    json_out(['ok' => true, 'id' => $id]);
  }

  case 'category_delete': {
    $id = (int)($in['id'] ?? 0);
    $p->prepare("DELETE FROM categories WHERE id=?")->execute([$id]);
    json_out(['ok' => true]);
  }

  /* ---------------- مناطق التوصيل ---------------- */
  case 'zones_list': {
    json_out(['ok' => true, 'zones' => $p->query("SELECT z.*, b.name branch_name FROM delivery_zones z LEFT JOIN branches b ON b.id=z.branch_id ORDER BY z.branch_id, z.id")->fetchAll()]);
  }

  case 'zone_save': {
    $d = $in['zone'] ?? [];
    $id = (int)($d['id'] ?? 0);
    $f = [(int)($d['branch_id'] ?? 0), $d['name'] ?? '', (float)($d['fee'] ?? 0), (float)($d['min_order'] ?? 0),
      ($d['free_over'] === '' || $d['free_over'] === null) ? null : (float)$d['free_over'], !empty($d['active']) ? 1 : 0];
    if ($id) { $f[] = $id; $p->prepare("UPDATE delivery_zones SET branch_id=?,name=?,fee=?,min_order=?,free_over=?,active=? WHERE id=?")->execute($f); }
    else { $p->prepare("INSERT INTO delivery_zones (branch_id,name,fee,min_order,free_over,active) VALUES (?,?,?,?,?,?)")->execute($f); $id = (int)$p->lastInsertId(); }
    json_out(['ok' => true, 'id' => $id]);
  }

  case 'zone_delete': {
    $id = (int)($in['id'] ?? 0);
    $p->prepare("DELETE FROM delivery_zones WHERE id=?")->execute([$id]);
    json_out(['ok' => true]);
  }

  /* ---------------- الإعدادات + مجموعات الخيارات (قراءة) ---------------- */
  case 'meta': {
    $groups = [];
    foreach ($p->query("SELECT * FROM option_groups ORDER BY sort, id") as $g) {
      $groups[] = ['id' => (int)$g['id'], 'name' => $g['name']];
    }
    $settings = [];
    foreach ($p->query("SELECT skey, sval FROM settings") as $r) $settings[$r['skey']] = $r['sval'];
    json_out(['ok' => true, 'optionGroups' => $groups, 'settings' => $settings]);
  }

  case 'settings_save': {
    $s = $in['settings'] ?? [];
    $up = $p->prepare(DB_DRIVER === 'mysql' ? "REPLACE INTO settings (skey,sval) VALUES (?,?)" : "INSERT OR REPLACE INTO settings (skey,sval) VALUES (?,?)");
    foreach ($s as $k => $v) $up->execute([$k, (string)$v]);
    json_out(['ok' => true]);
  }

  case 'change_password': {
    $new = (string)($in['new'] ?? '');
    if (strlen($new) < 6) json_out(['ok' => false, 'error' => 'weak'], 400);
    $p->prepare("UPDATE admins SET password_hash=? WHERE id=?")->execute([password_hash($new, PASSWORD_DEFAULT), $admin['id']]);
    json_out(['ok' => true]);
  }

  default:
    json_out(['ok' => false, 'error' => 'unknown_action', 'action' => $action], 400);
}
