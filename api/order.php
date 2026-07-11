<?php
/**
 * API عام: إنشاء طلب جديد وحفظه في قاعدة البيانات.
 * يتحقق من الأسعار من قاعدة البيانات (لا يثق بالأسعار القادمة من المتصفح).
 */
require_once __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  header('Access-Control-Allow-Origin: *');
  header('Access-Control-Allow-Headers: Content-Type');
  header('Access-Control-Allow-Methods: POST, OPTIONS');
  exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['ok' => false, 'error' => 'method'], 405);
if (!db_installed()) json_out(['ok' => false, 'error' => 'not_installed'], 503);

$in = json_in();
$p = db();

$branchId = (int)($in['branchId'] ?? 0);
$name = trim($in['name'] ?? '');
$phone = trim($in['phone'] ?? '');
$mode = ($in['mode'] ?? 'delivery') === 'pickup' ? 'pickup' : 'delivery';
$zoneId = isset($in['zoneId']) ? (int)$in['zoneId'] : null;
$address = trim($in['address'] ?? '');
$note = trim($in['note'] ?? '');
$items = $in['items'] ?? [];

// تحقق أساسي
$branch = $p->query("SELECT * FROM branches WHERE id=" . $branchId)->fetch();
if (!$branch) json_out(['ok' => false, 'error' => 'invalid_branch'], 400);
if ($name === '' || $phone === '') json_out(['ok' => false, 'error' => 'missing_contact'], 400);
if (!is_array($items) || count($items) === 0) json_out(['ok' => false, 'error' => 'empty_cart'], 400);

// خرائط الأسعار من قاعدة البيانات
$priceStmt = $p->prepare("SELECT price, in_stock FROM product_branch WHERE product_id=? AND branch_id=?");
$prodStmt = $p->prepare("SELECT * FROM products WHERE id=?");
$optStmt = $p->prepare("SELECT name, price FROM options WHERE id=?");

$subtotal = 0;
$lineRows = [];
foreach ($items as $it) {
  $pid = (int)($it['productId'] ?? 0);
  $qty = max(1, (int)($it['qty'] ?? 1));
  $prodStmt->execute([$pid]);
  $prod = $prodStmt->fetch();
  if (!$prod) json_out(['ok' => false, 'error' => 'invalid_product', 'pid' => $pid], 400);

  $priceStmt->execute([$pid, $branchId]);
  $pb = $priceStmt->fetch();
  if (!$pb || !(int)$pb['in_stock']) json_out(['ok' => false, 'error' => 'unavailable', 'pid' => $pid], 400);

  $unit = (float)$pb['price'];
  $optNames = [];
  foreach (($it['options'] ?? []) as $opt) {
    $oid = (int)($opt['id'] ?? 0);
    $optStmt->execute([$oid]);
    $o = $optStmt->fetch();
    if ($o) { $unit += (float)$o['price']; $optNames[] = $o['name']; }
  }
  $lineTotal = $unit * $qty;
  $subtotal += $lineTotal;
  $lineRows[] = [
    'product_id' => $pid, 'name' => $prod['name'], 'qty' => $qty,
    'unit_price' => $unit, 'line_total' => $lineTotal,
    'options_text' => implode('، ', $optNames), 'note' => trim($it['note'] ?? ''),
  ];
}

// التوصيل
$fee = 0;
$zone = null;
if ($mode === 'delivery') {
  if (!$zoneId) json_out(['ok' => false, 'error' => 'missing_zone'], 400);
  $zone = $p->query("SELECT * FROM delivery_zones WHERE id=" . $zoneId)->fetch();
  if (!$zone || (int)$zone['branch_id'] !== $branchId) json_out(['ok' => false, 'error' => 'invalid_zone'], 400);
  if ($address === '') json_out(['ok' => false, 'error' => 'missing_address'], 400);
  if ($subtotal < (float)$zone['min_order']) json_out(['ok' => false, 'error' => 'below_min', 'min' => (float)$zone['min_order']], 400);
  $fee = ($zone['free_over'] !== null && $subtotal >= (float)$zone['free_over']) ? 0 : (float)$zone['fee'];
}

$total = $subtotal + $fee;
$pps = (float)(db_setting('points_per_shekel') ?? 1);
$points = (int)round($subtotal * $pps);
$orderNo = 'Q' . substr((string)time(), -6) . random_int(10, 99);

// حفظ الطلب
$p->prepare("INSERT INTO orders (order_no,branch_id,customer_name,phone,mode,zone_id,address,payment,note,subtotal,delivery_fee,total,points,status,created_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?, 'new', ?)")
  ->execute([$orderNo, $branchId, $name, $phone, $mode, $zoneId, $address, 'cash', $note, $subtotal, $fee, $total, $points, now_str()]);
$orderId = (int)$p->lastInsertId();

$itStmt = $p->prepare("INSERT INTO order_items (order_id,product_id,name,qty,unit_price,line_total,options_text,note) VALUES (?,?,?,?,?,?,?,?)");
foreach ($lineRows as $r) {
  $itStmt->execute([$orderId, $r['product_id'], $r['name'], $r['qty'], $r['unit_price'], $r['line_total'], $r['options_text'], $r['note']]);
}

json_out([
  'ok' => true,
  'orderId' => $orderId, 'orderNo' => $orderNo,
  'subtotal' => $subtotal, 'deliveryFee' => $fee, 'total' => $total, 'points' => $points,
  'branchWhatsapp' => $branch['whatsapp'],
]);

function db_setting(string $k) {
  $s = db()->prepare("SELECT sval FROM settings WHERE skey=?");
  $s->execute([$k]);
  $r = $s->fetch();
  return $r ? $r['sval'] : null;
}
