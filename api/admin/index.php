<?php
/**
 * موجّه واجهة الإدارة (Admin API)
 * كل الطلبات POST مع { action: "...", ... }.
 * الجلسة عبر ملف تعريف ارتباط، والتعديلات محمية برمز CSRF.
 */
require_once __DIR__ . '/../helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['ok' => false, 'error' => 'method'], 405);
if (!db_installed()) json_out(['ok' => false, 'error' => 'not_installed'], 503);

ensure_migrations();
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
  $_SESSION['admin'] = [
    'id' => (int)$a['id'], 'username' => $a['username'], 'name' => $a['name'],
    'role' => $a['role'], 'branchId' => $a['branch_id'] !== null ? (int)$a['branch_id'] : null,
  ];
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
$isSuper = ($admin['role'] ?? '') === 'super';
$myBranch = $admin['branchId'] ?? null;

// مدير الفرع يرى طلبات فرعه فقط؛ المدير العام يرى الكل
function require_super_role(bool $isSuper): void {
  if (!$isSuper) json_out(['ok' => false, 'error' => 'forbidden'], 403);
}

/* التعديلات تتطلب CSRF */
$mutations = ['order_status','product_save','product_delete','branch_save','branch_delete',
  'category_save','category_delete','zone_save','zone_delete','settings_save','change_password',
  'user_save','user_delete','request_save','request_update','request_delete',
  'coupon_save','coupon_delete'];
if (in_array($action, $mutations, true)) check_csrf();

/* إجراءات إدارية للمدير العام فقط */
$superOnly = ['product_save','product_delete','branch_save','branch_delete','category_save',
  'category_delete','zone_save','zone_delete','settings_save','users_list','user_save','user_delete','reports','request_update',
  'coupons_list','coupon_save','coupon_delete'];
if (in_array($action, $superOnly, true)) require_super_role($isSuper);

switch ($action) {

  /* ---------------- لوحة الإحصائيات ---------------- */
  case 'dashboard': {
    $today = date('Y-m-d');
    // شرط تخصيص الفرع لمدير الفرع
    $bw = $isSuper ? '' : ' AND branch_id=' . (int)$myBranch;
    $q = fn($sql, $args = []) => (function () use ($p, $sql, $args) { $s = $p->prepare($sql); $s->execute($args); return $s->fetch(); })();
    $notCancelled = "status NOT IN('cancelled','rejected')";
    $todayCount = (int)$q("SELECT COUNT(*) c FROM orders WHERE substr(created_at,1,10)=?$bw", [$today])['c'];
    // مبيعات المنتجات (بدون التوصيل) + التوصيل منفصل
    $todayProductSales = (float)$q("SELECT COALESCE(SUM(subtotal),0) s FROM orders WHERE substr(created_at,1,10)=? AND $notCancelled$bw", [$today])['s'];
    $todayDelivery = (float)$q("SELECT COALESCE(SUM(delivery_fee),0) s FROM orders WHERE substr(created_at,1,10)=? AND $notCancelled$bw", [$today])['s'];
    $byStatus = [];
    $bsSql = "SELECT status, COUNT(*) c FROM orders" . ($isSuper ? '' : ' WHERE branch_id=' . (int)$myBranch) . " GROUP BY status";
    foreach ($p->query($bsSql) as $r) $byStatus[$r['status']] = (int)$r['c'];
    $totalOrders = (int)$p->query("SELECT COUNT(*) c FROM orders" . ($isSuper ? '' : ' WHERE branch_id=' . (int)$myBranch))->fetch()['c'];
    $products = (int)$p->query("SELECT COUNT(*) c FROM products")->fetch()['c'];
    $branches = (int)$p->query("SELECT COUNT(*) c FROM branches")->fetch()['c'];

    // عدد الطلبات لكل فرع (للمدير العام فقط)
    $perBranch = [];
    if ($isSuper) {
      $pb = $p->query("SELECT b.id, b.name, COUNT(o.id) cnt,
        COALESCE(SUM(CASE WHEN o.status NOT IN('cancelled','rejected') THEN o.subtotal ELSE 0 END),0) sales
        FROM branches b LEFT JOIN orders o ON o.branch_id=b.id GROUP BY b.id, b.name ORDER BY b.sort, b.id");
      foreach ($pb as $r) $perBranch[] = ['name' => $r['name'], 'count' => (int)$r['cnt'], 'sales' => (float)$r['sales']];
    }

    json_out(['ok' => true, 'stats' => compact('todayCount','todayProductSales','todayDelivery','byStatus','totalOrders','products','branches','perBranch'), 'isSuper' => $isSuper]);
  }

  /* ---------------- الطلبات ---------------- */
  case 'orders_list': {
    $status = $in['status'] ?? '';
    $sql = "SELECT o.*, b.name branch_name FROM orders o LEFT JOIN branches b ON b.id=o.branch_id WHERE 1=1";
    $args = [];
    if (!$isSuper) { $sql .= " AND o.branch_id=?"; $args[] = (int)$myBranch; }
    if ($status !== '') { $sql .= " AND o.status=?"; $args[] = $status; }
    $sql .= " ORDER BY o.id DESC LIMIT 200";
    $st = $p->prepare($sql); $st->execute($args);
    json_out(['ok' => true, 'orders' => $st->fetchAll(), 'serverNow' => now_str()]);
  }

  case 'orders_ping': {
    $sql = "SELECT COALESCE(MAX(id),0) maxid, COUNT(*) cnt FROM orders WHERE 1=1";
    $args = [];
    if (!$isSuper) { $sql .= " AND branch_id=?"; $args[] = (int)$myBranch; }
    $st = $p->prepare($sql); $st->execute($args);
    $row = $st->fetch();
    json_out(['ok' => true, 'maxId' => (int)$row['maxid'], 'count' => (int)$row['cnt'], 'serverNow' => now_str()]);
  }

  case 'order_get': {
    $id = (int)($in['id'] ?? 0);
    $st = $p->prepare("SELECT o.*, b.name branch_name, z.name zone_name FROM orders o LEFT JOIN branches b ON b.id=o.branch_id LEFT JOIN delivery_zones z ON z.id=o.zone_id WHERE o.id=?");
    $st->execute([$id]);
    $order = $st->fetch();
    if (!$order) json_out(['ok' => false, 'error' => 'not_found'], 404);
    if (!$isSuper && (int)$order['branch_id'] !== (int)$myBranch) json_out(['ok' => false, 'error' => 'forbidden'], 403);
    $it = $p->prepare("SELECT * FROM order_items WHERE order_id=?");
    $it->execute([$id]);
    json_out(['ok' => true, 'order' => $order, 'items' => $it->fetchAll()]);
  }

  case 'order_status': {
    $id = (int)($in['id'] ?? 0);
    $status = $in['status'] ?? '';
    $allowed = ['new','confirmed','preparing','ready','out_for_delivery','delivered','completed','cancelled','rejected'];
    if (!in_array($status, $allowed, true)) json_out(['ok' => false, 'error' => 'bad_status'], 400);
    // مدير الفرع يعدّل طلبات فرعه فقط
    if (!$isSuper) {
      $ord = $p->prepare("SELECT branch_id FROM orders WHERE id=?"); $ord->execute([$id]); $ord = $ord->fetch();
      if (!$ord || (int)$ord['branch_id'] !== (int)$myBranch) json_out(['ok' => false, 'error' => 'forbidden'], 403);
    }
    // ختم وقت التسليم عند أول انتقال إلى "تم التسليم"
    if (in_array($status, ['delivered', 'completed'], true)) {
      $p->prepare("UPDATE orders SET status=?, delivered_at=COALESCE(delivered_at, ?) WHERE id=?")->execute([$status, now_str(), $id]);
    } else {
      $p->prepare("UPDATE orders SET status=? WHERE id=?")->execute([$status, $id]);
    }
    json_out(['ok' => true]);
  }

  /* ---------------- المنتجات ---------------- */
  case 'products_list': {
    $rows = $p->query("SELECT pr.*, c.name cat_name FROM products pr LEFT JOIN categories c ON c.id=pr.category_id ORDER BY pr.sort, pr.id")->fetchAll();
    $avStmt = $p->prepare("SELECT branch_id, price, in_stock FROM product_branch WHERE product_id=?");
    foreach ($rows as &$r) {
      $avStmt->execute([$r['id']]);
      $r['availability'] = $avStmt->fetchAll();
      $r['sizes'] = json_decode($r['sizes_json'] ?? '', true) ?: [];
      $r['extras'] = json_decode($r['extras_json'] ?? '', true) ?: [];
    }
    json_out(['ok' => true, 'products' => $rows]);
  }

  case 'product_save': {
    $d = $in['product'] ?? [];
    $id = (int)($d['id'] ?? 0);

    // تنظيف الأحجام والإضافات (اسم + سعر)
    $sizes = [];
    foreach (($d['sizes'] ?? []) as $s) {
      $nm = trim((string)($s['name'] ?? ''));
      if ($nm !== '') $sizes[] = ['name' => $nm, 'price' => (float)($s['price'] ?? 0)];
    }
    $extras = [];
    foreach (($d['extras'] ?? []) as $e) {
      $nm = trim((string)($e['name'] ?? ''));
      if ($nm !== '') $extras[] = ['name' => $nm, 'price' => (float)($e['price'] ?? 0)];
    }
    $extras = array_slice($extras, 0, 5); // حتى 5 إضافات
    $hasSizes = (!empty($d['has_sizes']) && count($sizes) > 0) ? 1 : 0;

    $fields = [
      $d['name'] ?? '', (int)($d['category_id'] ?? 0), $d['description'] ?? '',
      $d['emoji'] ?? '🍮', trim((string)($d['image'] ?? '')),
      (float)($d['base_price'] ?? 0), ($d['sale_price'] === '' || $d['sale_price'] === null) ? null : (float)$d['sale_price'],
      $hasSizes, $sizes ? json_encode($sizes, JSON_UNESCAPED_UNICODE) : null,
      $extras ? json_encode($extras, JSON_UNESCAPED_UNICODE) : null,
      !empty($d['is_featured']) ? 1 : 0, !empty($d['is_new']) ? 1 : 0, (int)($d['points'] ?? 0),
      (int)($d['sort'] ?? 0), !empty($d['active']) ? 1 : 0,
    ];
    if ($id) {
      $sql = "UPDATE products SET name=?,category_id=?,description=?,emoji=?,image=?,base_price=?,sale_price=?,has_sizes=?,sizes_json=?,extras_json=?,is_featured=?,is_new=?,points=?,sort=?,active=? WHERE id=?";
      $fields[] = $id;
      $p->prepare($sql)->execute($fields);
    } else {
      $sql = "INSERT INTO products (name,category_id,description,emoji,image,base_price,sale_price,has_sizes,sizes_json,extras_json,is_featured,is_new,points,sort,active) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
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
    json_out(['ok' => true, 'id' => $id]);
  }

  case 'product_delete': {
    $id = (int)($in['id'] ?? 0);
    $p->prepare("DELETE FROM product_branch WHERE product_id=?")->execute([$id]);
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
    // تنظيف البيانات المرتبطة بالفرع
    $p->prepare("DELETE FROM product_branch WHERE branch_id=?")->execute([$id]);
    $p->prepare("DELETE FROM delivery_zones WHERE branch_id=?")->execute([$id]);
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
    $f = [$d['name'] ?? '', $d['emoji'] ?? '🍽️', trim((string)($d['image'] ?? '')), (int)($d['sort'] ?? 0), !empty($d['active']) ? 1 : 0];
    if ($id) { $f[] = $id; $p->prepare("UPDATE categories SET name=?,emoji=?,image=?,sort=?,active=? WHERE id=?")->execute($f); }
    else { $p->prepare("INSERT INTO categories (name,emoji,image,sort,active) VALUES (?,?,?,?,?)")->execute($f); $id = (int)$p->lastInsertId(); }
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

  /* ---------------- المستخدمون (المدير العام فقط) ---------------- */
  case 'users_list': {
    $rows = $p->query("SELECT u.id, u.username, u.name, u.role, u.branch_id, u.active, b.name branch_name
      FROM admins u LEFT JOIN branches b ON b.id=u.branch_id ORDER BY u.id")->fetchAll();
    json_out(['ok' => true, 'users' => $rows]);
  }

  case 'user_save': {
    $d = $in['user'] ?? [];
    $id = (int)($d['id'] ?? 0);
    $username = trim((string)($d['username'] ?? ''));
    $name = trim((string)($d['name'] ?? ''));
    $role = ($d['role'] ?? 'branch') === 'super' ? 'super' : 'branch';
    $branchId = $role === 'super' ? null : ((int)($d['branch_id'] ?? 0) ?: null);
    $active = !empty($d['active']) ? 1 : 0;
    $pass = (string)($d['password'] ?? '');
    if ($username === '') json_out(['ok' => false, 'error' => 'missing_username'], 400);
    if ($role === 'branch' && !$branchId) json_out(['ok' => false, 'error' => 'missing_branch'], 400);

    // منع تكرار اسم المستخدم
    $chk = $p->prepare("SELECT id FROM admins WHERE username=? AND id<>?");
    $chk->execute([$username, $id]);
    if ($chk->fetch()) json_out(['ok' => false, 'error' => 'username_taken'], 400);

    if ($id) {
      $p->prepare("UPDATE admins SET username=?, name=?, role=?, branch_id=?, active=? WHERE id=?")
        ->execute([$username, $name, $role, $branchId, $active, $id]);
      if ($pass !== '') {
        if (strlen($pass) < 6) json_out(['ok' => false, 'error' => 'weak'], 400);
        $p->prepare("UPDATE admins SET password_hash=? WHERE id=?")->execute([password_hash($pass, PASSWORD_DEFAULT), $id]);
      }
    } else {
      if (strlen($pass) < 6) json_out(['ok' => false, 'error' => 'weak'], 400);
      $p->prepare("INSERT INTO admins (username, password_hash, name, role, branch_id, active, created_at) VALUES (?,?,?,?,?,?,?)")
        ->execute([$username, password_hash($pass, PASSWORD_DEFAULT), $name, $role, $branchId, $active, now_str()]);
      $id = (int)$p->lastInsertId();
    }
    json_out(['ok' => true, 'id' => $id]);
  }

  case 'user_delete': {
    $id = (int)($in['id'] ?? 0);
    if ($id === (int)$admin['id']) json_out(['ok' => false, 'error' => 'cant_delete_self'], 400);
    $p->prepare("DELETE FROM admins WHERE id=?")->execute([$id]);
    json_out(['ok' => true]);
  }

  /* ---------------- تقارير الفروع (المدير العام فقط) ---------------- */
  case 'reports': {
    // فلترة حسب الفترة الزمنية: from/to بصيغة YYYY-MM-DD (اختياري)
    $from = trim((string)($in['from'] ?? ''));
    $to = trim((string)($in['to'] ?? ''));
    $join = "LEFT JOIN orders o ON o.branch_id=b.id";
    $args = [];
    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
      $join = "LEFT JOIN orders o ON o.branch_id=b.id AND o.created_at >= ? AND o.created_at <= ?";
      $args[] = $from . ' 00:00:00';
      $args[] = $to . ' 23:59:59';
    }
    $st = $p->prepare("SELECT b.id, b.name,
      COUNT(o.id) orders_count,
      COALESCE(SUM(CASE WHEN o.status NOT IN('cancelled','rejected') THEN o.subtotal ELSE 0 END),0) product_sales,
      COALESCE(SUM(CASE WHEN o.status NOT IN('cancelled','rejected') THEN o.delivery_fee ELSE 0 END),0) delivery_total,
      COALESCE(SUM(CASE WHEN o.status NOT IN('cancelled','rejected') THEN o.total ELSE 0 END),0) grand_total,
      SUM(CASE WHEN o.status IN('completed','delivered') THEN 1 ELSE 0 END) completed,
      SUM(CASE WHEN o.status IN('cancelled','rejected') THEN 1 ELSE 0 END) cancelled
      FROM branches b $join
      GROUP BY b.id, b.name ORDER BY b.sort, b.id");
    $st->execute($args);
    json_out(['ok' => true, 'reports' => $st->fetchAll(), 'from' => $from, 'to' => $to]);
  }

  /* ---------------- الطلبات اليومية للفروع ---------------- */
  case 'requests_list': {
    $sql = "SELECT r.*, b.name branch_name, a.name admin_name
            FROM branch_requests r
            LEFT JOIN branches b ON b.id=r.branch_id
            LEFT JOIN admins a ON a.id=r.admin_id WHERE 1=1";
    $args = [];
    if (!$isSuper) { $sql .= " AND r.branch_id=?"; $args[] = (int)$myBranch; }
    $sql .= " ORDER BY r.id DESC LIMIT 200";
    $st = $p->prepare($sql); $st->execute($args);
    json_out(['ok' => true, 'requests' => $st->fetchAll()]);
  }

  case 'request_save': {
    $body = trim((string)($in['body'] ?? ''));
    if ($body === '') json_out(['ok' => false, 'error' => 'empty'], 400);
    $p->prepare("INSERT INTO branch_requests (branch_id,admin_id,body,status,created_at) VALUES (?,?,?, 'open', ?)")
      ->execute([$myBranch !== null ? (int)$myBranch : null, (int)$admin['id'], $body, now_str()]);
    json_out(['ok' => true]);
  }

  case 'request_update': {
    $id = (int)($in['id'] ?? 0);
    $status = ($in['status'] ?? '') === 'done' ? 'done' : 'open';
    $p->prepare("UPDATE branch_requests SET status=? WHERE id=?")->execute([$status, $id]);
    json_out(['ok' => true]);
  }

  case 'request_delete': {
    $id = (int)($in['id'] ?? 0);
    // مدير الفرع يحذف طلبات فرعه فقط
    if (!$isSuper) {
      $rq = $p->prepare("SELECT branch_id FROM branch_requests WHERE id=?"); $rq->execute([$id]); $rq = $rq->fetch();
      if (!$rq || (int)$rq['branch_id'] !== (int)$myBranch) json_out(['ok' => false, 'error' => 'forbidden'], 403);
    }
    $p->prepare("DELETE FROM branch_requests WHERE id=?")->execute([$id]);
    json_out(['ok' => true]);
  }

  /* ---------------- أكواد الخصم (المدير العام فقط) ---------------- */
  case 'coupons_list': {
    // مع تقرير الاستخدام: عدد الطلبات وإجمالي الخصم الفعلي من الطلبات غير الملغاة
    $rows = $p->query("SELECT c.*,
      (SELECT COUNT(*) FROM orders o WHERE UPPER(o.coupon_code)=UPPER(c.code) AND o.status NOT IN('cancelled','rejected')) orders_count,
      (SELECT COALESCE(SUM(o.discount),0) FROM orders o WHERE UPPER(o.coupon_code)=UPPER(c.code) AND o.status NOT IN('cancelled','rejected')) total_discount
      FROM coupons c ORDER BY c.id DESC")->fetchAll();
    json_out(['ok' => true, 'coupons' => $rows]);
  }

  case 'coupon_save': {
    $id = (int)($in['id'] ?? 0);
    $code = strtoupper(trim((string)($in['code'] ?? '')));
    $type = ($in['type'] ?? 'percent') === 'fixed' ? 'fixed' : 'percent';
    $value = max(0, (float)($in['value'] ?? 0));
    $minOrder = max(0, (float)($in['min_order'] ?? 0));
    $maxUses = max(0, (int)($in['max_uses'] ?? 0));
    $expires = trim((string)($in['expires_at'] ?? ''));
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $expires)) $expires = null;
    $active = !empty($in['active']) ? 1 : 0;
    if ($code === '') json_out(['ok' => false, 'error' => 'empty_code'], 400);
    // منع تكرار الكود
    $dup = $p->prepare("SELECT id FROM coupons WHERE UPPER(code)=UPPER(?) AND id<>?");
    $dup->execute([$code, $id]);
    if ($dup->fetch()) json_out(['ok' => false, 'error' => 'duplicate_code'], 400);

    if ($id) {
      $p->prepare("UPDATE coupons SET code=?,type=?,value=?,min_order=?,max_uses=?,expires_at=?,active=? WHERE id=?")
        ->execute([$code, $type, $value, $minOrder, $maxUses, $expires, $active, $id]);
    } else {
      $p->prepare("INSERT INTO coupons (code,type,value,min_order,max_uses,used_count,expires_at,active,created_at) VALUES (?,?,?,?,?,0,?,?,?)")
        ->execute([$code, $type, $value, $minOrder, $maxUses, $expires, $active, now_str()]);
    }
    json_out(['ok' => true]);
  }

  case 'coupon_delete': {
    $id = (int)($in['id'] ?? 0);
    $p->prepare("DELETE FROM coupons WHERE id=?")->execute([$id]);
    json_out(['ok' => true]);
  }

  default:
    json_out(['ok' => false, 'error' => 'unknown_action', 'action' => $action], 400);
}
