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

/** نوع عمود المفتاح الأساسي حسب المحرك */
function pk_type(): string {
  return DB_DRIVER === 'mysql'
    ? 'INT AUTO_INCREMENT PRIMARY KEY'
    : 'INTEGER PRIMARY KEY AUTOINCREMENT';
}
