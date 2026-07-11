<?php
/**
 * نموذج إعدادات محلية سرية.
 * -------------------------------------------------------------------
 * للتحويل إلى MySQL:
 * 1) انسخ هذا الملف باسم: api/config.local.php  (بدون sample)
 * 2) ضع بيانات قاعدة MySQL التي أنشأتها في هوستنجر.
 * 3) افتح مرة واحدة: https://موقعك/api/install.php
 *
 * هذا الملف (config.local.php) غير مرفوع على GitHub، فكلمات المرور آمنة.
 */

define('DB_DRIVER', 'mysql');

define('MYSQL_HOST', 'localhost');       // غالبًا localhost في هوستنجر
define('MYSQL_DB',   'uXXXXXXX_qashtoota'); // اسم قاعدة البيانات من hPanel
define('MYSQL_USER', 'uXXXXXXX_qashtoota'); // اسم المستخدم من hPanel
define('MYSQL_PASS', 'ضع-كلمة-المرور-هنا');  // كلمة المرور من hPanel
