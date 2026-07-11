<?php
/**
 * API عام: التحقق من كود الخصم قبل إتمام الطلب (للعرض فقط، لا يزيد عدّاد الاستخدام).
 * POST { code, subtotal } → { ok, code, type, value, discount } أو { ok:false, error }
 */
require_once __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  header('Access-Control-Allow-Origin: *');
  header('Access-Control-Allow-Headers: Content-Type');
  header('Access-Control-Allow-Methods: POST, OPTIONS');
  exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['ok' => false, 'error' => 'method'], 405);
if (!db_installed()) json_out(['ok' => false, 'error' => 'not_installed'], 503);

$in = json_in();
ensure_migrations();

$code = trim((string)($in['code'] ?? ''));
$subtotal = (float)($in['subtotal'] ?? 0);

$r = validate_coupon($code, $subtotal);
if (!$r['ok']) json_out(['ok' => false, 'error' => $r['error'], 'min' => $r['min'] ?? null]);

$c = $r['coupon'];
json_out([
  'ok' => true,
  'code' => $c['code'],
  'type' => $c['type'],
  'value' => (float)$c['value'],
  'discount' => $r['discount'],
]);
