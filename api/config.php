<?php
/**
 * إعدادات النظام – قشطوطة بلبن (المرحلة الثانية)
 * ------------------------------------------------------------
 * يمكنك تعديل القيم هنا. لا يحتوي هذا الملف على أي كلمات مرور مكشوفة.
 */

// نوع قاعدة البيانات: 'sqlite' (افتراضي، بدون إعداد) أو 'mysql'
define('DB_DRIVER', getenv('QASHTOOTA_DB') ?: 'sqlite');

/**
 * مجلد تخزين قاعدة بيانات SQLite.
 * افتراضيًا يُوضع خارج مجلد الموقع (public_html) حتى لا يصله أحد من الويب
 * ولا يُحذف عند تحديث الموقع من GitHub.
 */
define('DATA_DIR', dirname(dirname(__DIR__)) . '/qashtoota_data');
define('SQLITE_PATH', DATA_DIR . '/qashtoota.sqlite');

// إعدادات MySQL (تُستخدم فقط إذا كان DB_DRIVER = mysql)
define('MYSQL_HOST', 'localhost');
define('MYSQL_DB',   'qashtoota');
define('MYSQL_USER', 'root');
define('MYSQL_PASS', '');

// المنطقة الزمنية
date_default_timezone_set('Asia/Hebron');

// اسم مستخدم المدير الافتراضي (يُنشأ عند التثبيت بكلمة مرور عشوائية تُعرض مرة واحدة)
define('ADMIN_DEFAULT_USER', 'admin');

// مفتاح الجلسة
define('SESSION_NAME', 'qashtoota_admin');

// العملة
define('CURRENCY', '₪');
