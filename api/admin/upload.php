<?php
/**
 * رفع صورة (للبنر أو المنتجات) — محمي بجلسة المدير + CSRF.
 * يحفظ الصورة في public_html/uploads ويُرجع رابطها.
 */
require_once __DIR__ . '/../helpers.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['ok' => false, 'error' => 'method'], 405);
require_admin();
check_csrf();

if (empty($_FILES['file'])) json_out(['ok' => false, 'error' => 'no_file'], 400);
$f = $_FILES['file'];
if ($f['error'] !== UPLOAD_ERR_OK) json_out(['ok' => false, 'error' => 'upload_error'], 400);
if ($f['size'] > 5 * 1024 * 1024) json_out(['ok' => false, 'error' => 'too_large'], 400); // 5MB

$ext = strtolower(pathinfo($f['name'], PATHINFO_EXTENSION));
$allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
if (!in_array($ext, $allowed, true)) json_out(['ok' => false, 'error' => 'bad_type'], 400);

// التأكد أنه صورة فعلية
$info = @getimagesize($f['tmp_name']);
if (!$info) json_out(['ok' => false, 'error' => 'not_image'], 400);

// مجلد الرفع داخل public_html/uploads
$dir = dirname(dirname(__DIR__)) . '/uploads';
if (!is_dir($dir) && !@mkdir($dir, 0775, true)) {
  json_out(['ok' => false, 'error' => 'mkdir_failed'], 500);
}

$name = 'img_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
if (!move_uploaded_file($f['tmp_name'], $dir . '/' . $name)) {
  json_out(['ok' => false, 'error' => 'save_failed'], 500);
}

json_out(['ok' => true, 'url' => '/uploads/' . $name]);
