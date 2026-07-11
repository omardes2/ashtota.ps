<?php
/**
 * تثبيت قاعدة البيانات (يُشغَّل مرة واحدة).
 * افتح: https://موقعك/api/install.php
 * ينشئ الجداول ويعبّئ البيانات الأولية، وينشئ حساب مدير افتراضي.
 */
require_once __DIR__ . '/schema.php';
require_once __DIR__ . '/helpers.php';

header('Content-Type: text/html; charset=utf-8');

$newPass = null;
try {
  install_schema();
  seed_data();
  $newPass = ensure_admin(); // كلمة مرور عشوائية إن أُنشئ الحساب الآن
} catch (Throwable $e) {
  echo '<div style="font-family:sans-serif;color:#b00;direction:rtl">فشل التثبيت: ' . htmlspecialchars($e->getMessage()) . '</div>';
  exit;
}

$driver = DB_DRIVER;
$branches = (int) db()->query("SELECT COUNT(*) c FROM branches")->fetch()['c'];
$products = (int) db()->query("SELECT COUNT(*) c FROM products")->fetch()['c'];
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>تم التثبيت</title>
<style>
  body{font-family:Tahoma,sans-serif;background:#edf6fd;color:#103247;display:grid;place-items:center;min-height:100vh;margin:0}
  .box{background:#fff;padding:30px;border-radius:16px;box-shadow:0 10px 30px rgba(13,92,156,.15);max-width:460px;text-align:center}
  h1{color:#0d5c9c}
  .ok{color:#3f9d6b;font-size:2.4rem}
  a{display:inline-block;margin-top:14px;background:linear-gradient(135deg,#2b9bd8,#83d2f0);color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:800}
  code{background:#eef;padding:2px 6px;border-radius:6px}
  .warn{background:#fff6e5;color:#8a5a00;padding:10px;border-radius:10px;font-size:.9rem;margin-top:14px}
</style></head><body>
<div class="box">
  <div class="ok">✓</div>
  <h1>تم تثبيت قاعدة البيانات</h1>
  <p>المحرك: <code><?= htmlspecialchars($driver) ?></code></p>
  <p>الفروع: <b><?= $branches ?></b> · المنتجات: <b><?= $products ?></b></p>
  <?php if ($newPass): ?>
  <div class="warn">
    اسم المستخدم: <code><?= htmlspecialchars(ADMIN_DEFAULT_USER) ?></code><br>
    كلمة المرور (احفظها الآن — لن تظهر مجددًا): <code style="font-size:1.1rem"><?= htmlspecialchars($newPass) ?></code><br>
    ⚠️ سجّل الدخول، غيّر كلمة المرور من الإعدادات، ثم احذف ملف <code>api/install.php</code>.
  </div>
  <?php else: ?>
  <div class="warn">حساب المدير موجود مسبقًا. استخدم بيانات دخولك الحالية. (لإعادة التعيين احذف قاعدة البيانات وأعد التثبيت.)</div>
  <?php endif; ?>
  <a href="../admin/">الدخول إلى لوحة التحكم ←</a>
</div>
</body></html>
