<?php
/**
 * API عام: إرجاع بيانات المنيو (فروع، تصنيفات، منتجات، إضافات، مناطق توصيل)
 * بنفس شكل STORE المستخدم في الواجهة.
 */
require_once __DIR__ . '/helpers.php';

if (!db_installed()) {
  json_out(['ok' => false, 'error' => 'not_installed', 'hint' => 'شغّل api/install.php أولًا'], 503);
}

ensure_migrations();
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
  // بيانات البنر الرئيسي (تُدار من لوحة التحكم)
  'heroTitle' => $settings['hero_title'] ?? '',
  'heroSubtitle' => $settings['hero_subtitle'] ?? '',
  'heroImage' => $settings['hero_image'] ?? '',
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

// المنتجات + الأحجام والإضافات لكل منتج
$products = [];
$avStmt = $p->prepare("SELECT * FROM product_branch WHERE product_id=?");
foreach ($p->query("SELECT * FROM products WHERE active=1 ORDER BY sort, id") as $pr) {
  $pid = (int)$pr['id'];
  $avStmt->execute([$pid]);
  $availability = [];
  foreach ($avStmt as $a) {
    $availability[] = ['branchId' => (int)$a['branch_id'], 'price' => (float)$a['price'], 'inStock' => (bool)$a['in_stock']];
  }

  // الأحجام (بمعرّفات s0, s1 ...) بأسعار مطلقة
  $sizes = [];
  $sizeArr = json_decode($pr['sizes_json'] ?? '', true) ?: [];
  foreach ($sizeArr as $i => $s) {
    $sizes[] = ['id' => 's' . $i, 'name' => $s['name'] ?? '', 'price' => (float)($s['price'] ?? 0)];
  }
  // الإضافات (بمعرّفات e0, e1 ...)
  $extras = [];
  $extraArr = json_decode($pr['extras_json'] ?? '', true) ?: [];
  foreach ($extraArr as $i => $e) {
    $extras[] = ['id' => 'e' . $i, 'name' => $e['name'] ?? '', 'price' => (float)($e['price'] ?? 0)];
  }

  $products[] = [
    'id' => $pid, 'name' => $pr['name'], 'categoryId' => (int)$pr['category_id'],
    'desc' => $pr['description'], 'emoji' => $pr['emoji'], 'image' => $pr['image'] ?? '',
    'basePrice' => (float)$pr['base_price'],
    'salePrice' => $pr['sale_price'] !== null ? (float)$pr['sale_price'] : null,
    'hasSizes' => !empty($pr['has_sizes']) && count($sizes) > 0,
    'sizes' => $sizes, 'extras' => $extras,
    'isFeatured' => (bool)$pr['is_featured'], 'isNew' => (bool)$pr['is_new'],
    'points' => (int)$pr['points'], 'availability' => $availability,
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
  'products' => $products,
  'deliveryZones' => $zones,
]);
