<?php
/**
 * إنشاء جداول قاعدة البيانات + تعبئة بيانات أولية
 */
require_once __DIR__ . '/db.php';

function install_schema(): void {
  $p = db();
  $PK = pk_type();

  $p->exec("CREATE TABLE IF NOT EXISTS settings (
    skey VARCHAR(191) PRIMARY KEY,
    sval TEXT
  )");

  $p->exec("CREATE TABLE IF NOT EXISTS admins (
    id $PK,
    username VARCHAR(191) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'admin',
    active INTEGER DEFAULT 1,
    created_at TEXT
  )");

  $p->exec("CREATE TABLE IF NOT EXISTS branches (
    id $PK,
    name TEXT NOT NULL,
    city TEXT, area TEXT, phone TEXT, whatsapp TEXT, address TEXT,
    is_open INTEGER DEFAULT 1,
    hours TEXT,
    allow_delivery INTEGER DEFAULT 1,
    allow_pickup INTEGER DEFAULT 1,
    min_order REAL DEFAULT 0,
    prep_time INTEGER DEFAULT 20,
    sort INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1
  )");

  $p->exec("CREATE TABLE IF NOT EXISTS categories (
    id $PK,
    name TEXT NOT NULL,
    emoji TEXT,
    sort INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1
  )");

  $p->exec("CREATE TABLE IF NOT EXISTS products (
    id $PK,
    name TEXT NOT NULL,
    category_id INTEGER,
    description TEXT,
    emoji TEXT,
    base_price REAL DEFAULT 0,
    sale_price REAL,
    is_featured INTEGER DEFAULT 0,
    is_new INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    sort INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1
  )");

  $p->exec("CREATE TABLE IF NOT EXISTS product_branch (
    product_id INTEGER NOT NULL,
    branch_id INTEGER NOT NULL,
    price REAL DEFAULT 0,
    in_stock INTEGER DEFAULT 1,
    PRIMARY KEY (product_id, branch_id)
  )");

  $p->exec("CREATE TABLE IF NOT EXISTS option_groups (
    id $PK,
    name TEXT NOT NULL,
    required INTEGER DEFAULT 0,
    min_sel INTEGER DEFAULT 0,
    max_sel INTEGER DEFAULT 1,
    sort INTEGER DEFAULT 0
  )");

  $p->exec("CREATE TABLE IF NOT EXISTS options (
    id $PK,
    group_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price REAL DEFAULT 0,
    sort INTEGER DEFAULT 0
  )");

  $p->exec("CREATE TABLE IF NOT EXISTS product_option_groups (
    product_id INTEGER NOT NULL,
    group_id INTEGER NOT NULL,
    sort INTEGER DEFAULT 0,
    PRIMARY KEY (product_id, group_id)
  )");

  $p->exec("CREATE TABLE IF NOT EXISTS delivery_zones (
    id $PK,
    branch_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    fee REAL DEFAULT 0,
    min_order REAL DEFAULT 0,
    free_over REAL,
    active INTEGER DEFAULT 1
  )");

  $p->exec("CREATE TABLE IF NOT EXISTS orders (
    id $PK,
    order_no TEXT,
    branch_id INTEGER,
    customer_name TEXT,
    phone TEXT,
    mode TEXT DEFAULT 'delivery',
    zone_id INTEGER,
    address TEXT,
    payment TEXT DEFAULT 'cash',
    note TEXT,
    subtotal REAL DEFAULT 0,
    delivery_fee REAL DEFAULT 0,
    total REAL DEFAULT 0,
    points INTEGER DEFAULT 0,
    status TEXT DEFAULT 'new',
    created_at TEXT
  )");

  $p->exec("CREATE TABLE IF NOT EXISTS order_items (
    id $PK,
    order_id INTEGER NOT NULL,
    product_id INTEGER,
    name TEXT,
    qty INTEGER DEFAULT 1,
    unit_price REAL DEFAULT 0,
    line_total REAL DEFAULT 0,
    options_text TEXT,
    note TEXT
  )");
}

/** تعبئة بيانات أولية (فقط إذا كانت الجداول فارغة) */
function seed_data(): void {
  $p = db();

  // إعدادات عامة
  $set = $p->prepare("INSERT OR REPLACE INTO settings (skey, sval) VALUES (?, ?)");
  $isMysql = DB_DRIVER === 'mysql';
  if ($isMysql) {
    $set = $p->prepare("REPLACE INTO settings (skey, sval) VALUES (?, ?)");
  }
  foreach ([
    'brand_name' => 'قشطوطة بلبن',
    'tagline' => 'أشهى الحلويات بلبن.. من أقرب فرع إليك',
    'whatsapp' => '970599000000',
    'instagram' => 'https://instagram.com/',
    'facebook' => 'https://facebook.com/',
    'tiktok' => 'https://tiktok.com/',
    'points_per_shekel' => '1',
  ] as $k => $v) { $set->execute([$k, $v]); }

  // إذا كانت هناك فروع مسبقًا، لا نعيد التعبئة
  $hasBranches = (int) $p->query("SELECT COUNT(*) c FROM branches")->fetch()['c'];
  if ($hasBranches > 0) return;

  // فروع
  $branches = [
    ['فرع عين سارة','الخليل','عين سارة','022220001','970599000001','عين سارة – الشارع الرئيسي',1,'10:00 ص – 12:00 م',1,1,20,20,1],
    ['فرع رأس الجورة','الخليل','رأس الجورة','022220002','970599000002','رأس الجورة – بالقرب من الدوار',1,'11:00 ص – 11:30 م',1,1,25,25,2],
    ['فرع الحرس','الخليل','الحرس','022220003','970599000003','منطقة الحرس – الشارع العام',0,'10:00 ص – 11:00 م',1,1,20,20,3],
    ['فرع وسط البلد','الخليل','وسط البلد','022220004','970599000004','وسط البلد – السوق التجاري',1,'09:00 ص – 12:00 م',0,1,15,15,4],
  ];
  $bStmt = $p->prepare("INSERT INTO branches (name,city,area,phone,whatsapp,address,is_open,hours,allow_delivery,allow_pickup,min_order,prep_time,sort) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)");
  $bIds = [];
  foreach ($branches as $b) { $bStmt->execute($b); $bIds[] = (int)$p->lastInsertId(); }

  // تصنيفات
  $cats = [['قشطوطة','🍮',1],['بلبن','🥛',2],['أم علي','🍲',3],['كاسات وحلويات','🍨',4],['وافل وكريب','🧇',5],['بوكسات وعائلي','🎁',6],['مشروبات','🥤',7]];
  $cStmt = $p->prepare("INSERT INTO categories (name,emoji,sort) VALUES (?,?,?)");
  $cIds = [];
  foreach ($cats as $c) { $cStmt->execute($c); $cIds[] = (int)$p->lastInsertId(); }

  // مجموعات خيارات
  $groups = [
    ['اختر الحجم',1,1,1, [['صغير',0],['وسط',5],['كبير',10]]],
    ['اختر الصوص',0,0,2, [['شوكولاتة',0],['كراميل',0],['لوتس',3]]],
    ['إضافات اختيارية',0,0,6, [['فستق',5],['أوريو',3],['مكسرات',5],['نوتيلا',6],['آيس كريم',6]]],
  ];
  $gStmt = $p->prepare("INSERT INTO option_groups (name,required,min_sel,max_sel,sort) VALUES (?,?,?,?,?)");
  $oStmt = $p->prepare("INSERT INTO options (group_id,name,price,sort) VALUES (?,?,?,?)");
  $gIds = [];
  $i = 0;
  foreach ($groups as $g) {
    $gStmt->execute([$g[0],$g[1],$g[2],$g[3],++$i]);
    $gid = (int)$p->lastInsertId(); $gIds[] = $gid;
    $j = 0;
    foreach ($g[4] as $opt) { $oStmt->execute([$gid,$opt[0],$opt[1],++$j]); }
  }
  // فهرسة المجموعات: 0=size,1=sauce,2=extras
  $G_SIZE=$gIds[0]; $G_SAUCE=$gIds[1]; $G_EXTRAS=$gIds[2];

  // منتجات: [name, catIndex, desc, emoji, base, sale, feat, new, points, [groupIndexes], [ [branchIndex, price, inStock] ]]
  $products = [
    ['قشطوطة كلاسيك',0,'قشطة طازجة بلبن مع قطر وفستق حلبي.','🍮',20,null,1,0,20,[0,2],[[0,20,1],[1,22,1],[2,20,1],[3,18,1]]],
    ['كاسة بلبن',1,'بلبن غني بطبقات القشطة والمكسرات.','🥛',18,15,1,0,18,[0,1,2],[[0,18,1],[1,18,1],[3,16,1]]],
    ['أم علي بالمكسرات',2,'أم علي ساخنة بالحليب والقشطة والمكسرات المشكلة.','🍲',22,null,0,1,22,[0,2],[[0,22,1],[1,24,1],[2,22,0]]],
    ['كاسة لوتس',3,'طبقات بسكويت لوتس مع كريمة وصوص لوتس.','🍨',20,null,1,1,20,[0,1,2],[[0,20,1],[1,20,1],[3,19,1]]],
    ['وافل بلجيكي',4,'وافل مقرمش مع نوتيلا وموز وآيس كريم.','🧇',25,null,0,0,25,[1,2],[[0,25,1],[1,26,1]]],
    ['بوكس عائلي مشكّل',5,'تشكيلة حلويات لبن تكفي 4-6 أشخاص.','🎁',90,79,1,0,90,[2],[[0,90,1],[1,95,1],[3,85,1]]],
    ['عصير طازج',6,'عصير فواكه طبيعي طازج حسب المتوفر.','🥤',12,null,0,0,12,[0],[[0,12,1],[1,12,1],[2,12,1],[3,10,1]]],
    ['كريب نوتيلا',4,'كريب طري محشو بالنوتيلا والفراولة.','🌯',20,null,0,1,20,[1,2],[[0,20,1],[3,18,1]]],
  ];
  $pStmt = $p->prepare("INSERT INTO products (name,category_id,description,emoji,base_price,sale_price,is_featured,is_new,points,sort) VALUES (?,?,?,?,?,?,?,?,?,?)");
  $pbStmt = $p->prepare("INSERT INTO product_branch (product_id,branch_id,price,in_stock) VALUES (?,?,?,?)");
  $pgStmt = $p->prepare("INSERT INTO product_option_groups (product_id,group_id,sort) VALUES (?,?,?)");
  $groupMap = [$G_SIZE,$G_SAUCE,$G_EXTRAS];
  $sort = 0;
  foreach ($products as $pr) {
    $pStmt->execute([$pr[0],$cIds[$pr[1]],$pr[2],$pr[3],$pr[4],$pr[5],$pr[6],$pr[7],$pr[8],++$sort]);
    $pid = (int)$p->lastInsertId();
    $gs = 0;
    foreach ($pr[9] as $gi) { $pgStmt->execute([$pid,$groupMap[$gi],++$gs]); }
    foreach ($pr[10] as $av) { $pbStmt->execute([$pid,$bIds[$av[0]],$av[1],$av[2]]); }
  }

  // مناطق التوصيل: [branchIndex, name, fee, minOrder, freeOver]
  $zones = [
    [0,'عين سارة',10,20,80],[0,'الحرس',12,25,90],
    [1,'رأس الجورة',12,25,90],[1,'منطقة بعيدة',20,40,120],
    [2,'الحرس',10,20,80],[3,'وسط البلد',8,15,70],
  ];
  $zStmt = $p->prepare("INSERT INTO delivery_zones (branch_id,name,fee,min_order,free_over) VALUES (?,?,?,?,?)");
  foreach ($zones as $z) { $zStmt->execute([$bIds[$z[0]],$z[1],$z[2],$z[3],$z[4]]); }
}

/**
 * ينشئ حساب المدير إن لم يوجد، ويُرجع كلمة المرور العشوائية (مرة واحدة).
 * إن كان موجودًا، يُرجع null.
 */
function ensure_admin(): ?string {
  $p = db();
  $count = (int) $p->query("SELECT COUNT(*) c FROM admins")->fetch()['c'];
  if ($count > 0) return null;
  $pass = substr(bin2hex(random_bytes(6)), 0, 10);
  $p->prepare("INSERT INTO admins (username, password_hash, name, role, active, created_at) VALUES (?,?,?,?,1,?)")
    ->execute([ADMIN_DEFAULT_USER, password_hash($pass, PASSWORD_DEFAULT), 'المدير العام', 'super', now_str()]);
  return $pass;
}
