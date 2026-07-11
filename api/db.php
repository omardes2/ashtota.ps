<?php
/**
 * طبقة الاتصال بقاعدة البيانات (PDO) – تدعم SQLite و MySQL
 */
require_once __DIR__ . '/config.php';

function db(): PDO {
  static $pdo = null;
  if ($pdo !== null) return $pdo;

  try {
    if (DB_DRIVER === 'mysql') {
      $dsn = 'mysql:host=' . MYSQL_HOST . ';dbname=' . MYSQL_DB . ';charset=utf8mb4';
      $pdo = new PDO($dsn, MYSQL_USER, MYSQL_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      ]);
    } else {
      $dir = resolve_data_dir();
      $pdo = new PDO('sqlite:' . $dir . '/qashtoota.sqlite', null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      ]);
      $pdo->exec('PRAGMA foreign_keys = ON');
      $pdo->exec('PRAGMA journal_mode = WAL');
    }
  } catch (Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => 'DB connection failed', 'detail' => $e->getMessage()], JSON_UNESCAPED_UNICODE);
    exit;
  }
  return $pdo;
}

/**
 * يحدد مجلدًا قابلًا للكتابة لتخزين قاعدة SQLite:
 * 1) خارج مجلد الموقع (الأفضل) إن أمكن.
 * 2) وإلا: api/data داخل الموقع مع حمايته من الوصول عبر الويب.
 */
function resolve_data_dir(): string {
  $preferred = DATA_DIR;
  if (@is_dir($preferred) || @mkdir($preferred, 0775, true)) {
    if (is_writable($preferred)) return $preferred;
  }
  // بديل داخلي محمي
  $fallback = __DIR__ . '/data';
  if (!is_dir($fallback)) @mkdir($fallback, 0775, true);
  // حماية المجلد من الوصول المباشر
  $ht = $fallback . '/.htaccess';
  if (!file_exists($ht)) @file_put_contents($ht, "Require all denied\nDeny from all\n");
  return $fallback;
}

/** هل قاعدة البيانات مُثبّتة (الجداول موجودة)؟ */
function db_installed(): bool {
  try {
    db()->query('SELECT 1 FROM settings LIMIT 1');
    return true;
  } catch (Throwable $e) {
    return false;
  }
}

/** الوقت الحالي كنص */
function now_str(): string { return date('Y-m-d H:i:s'); }

/**
 * ترحيل تلقائي لقاعدة البيانات (يعمل مرة واحدة عند الحاجة).
 * v3: إضافة أعمدة الصورة والأحجام والإضافات، وتحويل الأحجام/الإضافات
 * القديمة (من مجموعات الخيارات) إلى JSON لكل منتج.
 */
function ensure_migrations(): void {
  static $done = false;
  if ($done) return;
  $done = true;

  $p = db();
  try {
    $row = $p->query("SELECT sval FROM settings WHERE skey='schema_version'")->fetch();
  } catch (Throwable $e) {
    return; // النظام غير مثبّت بعد
  }
  $ver = (int)($row['sval'] ?? 0);
  if ($ver >= 7) return;

  // v3: أعمدة الأحجام/الإضافات/الصورة للمنتجات + تحويل مجموعات الخيارات
  if ($ver < 3) {
    foreach ([
      "ALTER TABLE products ADD COLUMN image TEXT",
      "ALTER TABLE products ADD COLUMN has_sizes INTEGER DEFAULT 0",
      "ALTER TABLE products ADD COLUMN sizes_json TEXT",
      "ALTER TABLE products ADD COLUMN extras_json TEXT",
    ] as $sql) {
      try { $p->exec($sql); } catch (Throwable $e) { /* العمود موجود */ }
    }
    try { migrate_options_to_json($p); } catch (Throwable $e) { /* تجاهل */ }
  }

  // v4: صورة لكل تصنيف
  if ($ver < 4) {
    try { $p->exec("ALTER TABLE categories ADD COLUMN image TEXT"); } catch (Throwable $e) { /* موجود */ }
  }

  // v5: تخصيص المستخدم لفرع (لمدراء الفروع)
  if ($ver < 5) {
    try { $p->exec("ALTER TABLE admins ADD COLUMN branch_id INTEGER"); } catch (Throwable $e) { /* موجود */ }
  }

  // v6: جدول الطلبات/الملاحظات اليومية للفروع
  if ($ver < 6) {
    $PK = pk_type();
    try {
      $p->exec("CREATE TABLE IF NOT EXISTS branch_requests (
        id $PK,
        branch_id INTEGER,
        admin_id INTEGER,
        body TEXT,
        status TEXT DEFAULT 'open',
        created_at TEXT
      )");
    } catch (Throwable $e) { /* موجود */ }
  }

  // v7: وقت تسليم الطلب (لحساب مدة الطلب)
  if ($ver < 7) {
    try { $p->exec("ALTER TABLE orders ADD COLUMN delivered_at TEXT"); } catch (Throwable $e) { /* موجود */ }
  }

  $up = $p->prepare(DB_DRIVER === 'mysql'
    ? "REPLACE INTO settings (skey,sval) VALUES ('schema_version','7')"
    : "INSERT OR REPLACE INTO settings (skey,sval) VALUES ('schema_version','7')");
  $up->execute();
}

/** تحويل الأحجام/الإضافات من مجموعات الخيارات إلى JSON لكل منتج */
function migrate_options_to_json(PDO $p): void {
  $products = $p->query("SELECT id, base_price FROM products")->fetchAll();
  $grpStmt = $p->prepare(
    "SELECT g.id, g.required, g.max_sel FROM product_option_groups pog
     JOIN option_groups g ON g.id = pog.group_id WHERE pog.product_id = ? ORDER BY pog.sort, g.id"
  );
  $optStmt = $p->prepare("SELECT name, price FROM options WHERE group_id = ? ORDER BY sort, id");
  $upd = $p->prepare("UPDATE products SET has_sizes=?, sizes_json=?, extras_json=? WHERE id=?");

  foreach ($products as $pr) {
    $pid = (int)$pr['id'];
    $base = (float)$pr['base_price'];
    $grpStmt->execute([$pid]);
    $groups = $grpStmt->fetchAll();
    if (!$groups) continue;
    $sizes = [];
    $extras = [];
    foreach ($groups as $g) {
      $optStmt->execute([(int)$g['id']]);
      $isSize = ((int)$g['required'] === 1 && (int)$g['max_sel'] === 1);
      foreach ($optStmt->fetchAll() as $o) {
        if ($isSize) {
          $sizes[] = ['name' => $o['name'], 'price' => $base + (float)$o['price']];
        } elseif (trim((string)$o['name']) !== 'بدون إضافة') {
          $extras[] = ['name' => $o['name'], 'price' => (float)$o['price']];
        }
      }
    }
    $upd->execute([
      $sizes ? 1 : 0,
      $sizes ? json_encode($sizes, JSON_UNESCAPED_UNICODE) : null,
      $extras ? json_encode($extras, JSON_UNESCAPED_UNICODE) : null,
      $pid,
    ]);
  }
}

/** نوع عمود المفتاح الأساسي حسب المحرك */
function pk_type(): string {
  return DB_DRIVER === 'mysql'
    ? 'INT AUTO_INCREMENT PRIMARY KEY'
    : 'INTEGER PRIMARY KEY AUTOINCREMENT';
}
