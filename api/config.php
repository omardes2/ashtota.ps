<?php
/**
 * إعدادات النظام – قشطوطة بلبن
 * ------------------------------------------------------------
 * لا تضع كلمات مرور هنا (هذا الملف عام على GitHub).
 * لإعدادات سرية (مثل بيانات MySQL) أنشئ الملف: api/config.local.php
 * وهو غير مرفوع على GitHub. مثال في: api/config.local.sample.php
 */

// تحميل الإعدادات المحلية السرية إن وُجدت (تُعرّف الثوابت قبل القيم الافتراضية)
@include __DIR__ . '/config.local.php';

// نوع قاعدة البيانات: 'sqlite' (افتراضي) أو 'mysql'
if (!defined('DB_DRIVER')) define('DB_DRIVER', getenv('QASHTOOTA_DB') ?: 'sqlite');

/**
 * مجلد تخزين قاعدة SQLite (خارج مجلد الموقع). يُستخدم فقط مع sqlite.
 */
if (!defined('DATA_DIR')) define('DATA_DIR', dirname(dirname(__DIR__)) . '/qashtoota_data');
if (!defined('SQLITE_PATH')) define('SQLITE_PATH', DATA_DIR . '/qashtoota.sqlite');

// إعدادات MySQL (تُضبط في config.local.php)
if (!defined('MYSQL_HOST')) define('MYSQL_HOST', 'localhost');
if (!defined('MYSQL_DB'))   define('MYSQL_DB', 'qashtoota');
if (!defined('MYSQL_USER')) define('MYSQL_USER', 'root');
if (!defined('MYSQL_PASS')) define('MYSQL_PASS', '');

// المنطقة الزمنية
date_default_timezone_set('Asia/Hebron');

// اسم مستخدم المدير الافتراضي (كلمة مروره تُولَّد عشوائيًا عند التثبيت)
if (!defined('ADMIN_DEFAULT_USER')) define('ADMIN_DEFAULT_USER', 'admin');

// مفتاح الجلسة والعملة
if (!defined('SESSION_NAME')) define('SESSION_NAME', 'qashtoota_admin');
if (!defined('CURRENCY')) define('CURRENCY', '₪');
