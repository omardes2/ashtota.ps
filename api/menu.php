<?php
/**
 * API عام: إرجاع بيانات المنيو (فروع، تصنيفات، منتجات، إضافات، مناطق توصيل)
 * بنفس شكل STORE المستخدم في الواجهة.
 */
require_once __DIR__ . '/helpers.php';

if (!db_installed()) {
  json_out(['ok' => false, 'error' => 'not_installed', 'hint' => 'شغّل api/install.php أولًا'], 503);
}

$p = db();

// الإعدادات
$settings = [];
foreach ($p->query("SELECT skey, sval FROM settings") as $r) $settings[$r['skey']] = $r['sval'];

$brand = [
  'name' => $settings['brand_name'] ?? 'قشطوطة بلبن',
  'tagline' => $settings['tagline'] ?? '',
  'currency' => CURRENCY,
  'whatsapp' => $settings['whatsapp'] ?? '',
  'instagram' => $settings['instagram'] ?? '',
  'facebook' => $settings['facebook'] ?? '',
  'tiktok' => $settings['tiktok'] ?? '',
];

// الفروع
$branches = [];
foreach ($p->query("SELECT * FROM branches WHERE active=1 ORDER BY sort, id") as $b) {
  $branches[] = [
    'id' => (int)$b['id'], 'name' => $b['name'], 'city' => $b['city'], 'area' => $b['area'],
    'phone' => $b['phone'], 'whatsapp' => $b['whatsapp'], 'address' => $b['address'],
    'isOpen' => (bool)$b['is_open'], 'hours' => $b['hours'],
    'allowDelivery' => (bool)$b['allow_delivery'], 'allowPickup' => (bool)$b['allow_pickup'],
    'minOrder' => (float)$b['min_order'], 'prepTime' => (int)$b['prep_time'],
  ];
}

// التصنيفات
$categories = [];
foreach ($p->query("SELECT * FROM categories WHERE active=1 ORDER BY sort, id") as $c) {
  $categories[] = ['id' => (int)$c['id'], 'name' => $c['name'], 'emoji' => $c['emoji'], 'order' => (int)$c['sort']];
}

// مجموعات الخيارات + خياراتها
$optionGroups = [];
foreach ($p->query("SELECT * FROM option_groups ORDER BY sort, id") as $g) {
  $gid = (int)$g['id'];
  $opts = [];
  $st = $p->prepare("SELECT * FROM options WHERE group_id=? ORDER BY sort, id");
  $st->execute([$gid]);
  foreach ($st as $o) $opts[] = ['id' => (int)$o['id'], 'name' => $o['name'], 'price' => (float)$o['price']];
  $optionGroups[(string)$gid] = [
    'id' => $gid, 'name' => $g['name'], 'required' => (bool)$g['required'],
    'min' => (int)$g['min_sel'], 'max' => (int)$g['max_sel'], 'options' => $opts,
  ];
}

// المنتجات + توفرها + مجموعاتها
$products = [];
$avStmt = $p->prepare("SELECT * FROM product_branch WHERE product_id=?");
$pgStmt = $p->prepare("SELECT group_id FROM product_option_groups WHERE product_id=? ORDER BY sort, group_id");
foreach ($p->query("SELECT * FROM products WHERE active=1 ORDER BY sort, id") as $pr) {
  $pid = (int)$pr['id'];
  $avStmt->execute([$pid]);
  $availability = [];
  foreach ($avStmt as $a) {
    $availability[] = ['branchId' => (int)$a['branch_id'], 'price' => (float)$a['price'], 'inStock' => (bool)$a['in_stock']];
  }
  $pgStmt->execute([$pid]);
  $ogs = [];
  foreach ($pgStmt as $g) $ogs[] = (int)$g['group_id'];
  $products[] = [
    'id' => $pid, 'name' => $pr['name'], 'categoryId' => (int)$pr['category_id'],
    'desc' => $pr['description'], 'emoji' => $pr['emoji'],
    'basePrice' => (float)$pr['base_price'],
    'salePrice' => $pr['sale_price'] !== null ? (float)$pr['sale_price'] : null,
    'isFeatured' => (bool)$pr['is_featured'], 'isNew' => (bool)$pr['is_new'],
    'points' => (int)$pr['points'], 'optionGroups' => $ogs, 'availability' => $availability,
  ];
}

// مناطق التوصيل
$zones = [];
foreach ($p->query("SELECT * FROM delivery_zones WHERE active=1 ORDER BY id") as $z) {
  $zones[] = [
    'id' => (int)$z['id'], 'branchId' => (int)$z['branch_id'], 'name' => $z['name'],
    'fee' => (float)$z['fee'], 'minOrder' => (float)$z['min_order'],
    'freeOver' => $z['free_over'] !== null ? (float)$z['free_over'] : null,
  ];
}

json_out([
  'ok' => true,
  'brand' => $brand,
  'branches' => $branches,
  'categories' => $categories,
  'optionGroups' => $optionGroups,
  'products' => $products,
  'deliveryZones' => $zones,
]);
