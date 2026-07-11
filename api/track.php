<?php
/**
 * API عام: تتبع الطلب حسب رقمه (بدون مصادقة).
 *  - GET  ?no=رقم_الطلب            → إرجاع حالة الطلب الحالية
 *  - POST {orderNo, action:"deliver"} → يسمح للزبون بتأكيد استلام الطلب
 *    (فقط إذا كان الطلب في حالة "قيد التوصيل")
 */
require_once __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  header('Access-Control-Allow-Origin: *');
  header('Access-Control-Allow-Headers: Content-Type');
  header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
  exit;
}
if (!db_installed()) json_out(['ok' => false, 'error' => 'not_installed'], 503);

ensure_migrations();
$p = db();

// تأكيد الاستلام من الزبون
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $in = json_in();
  $orderNo = trim((string)($in['orderNo'] ?? ''));
  $act = (string)($in['action'] ?? '');
  if ($orderNo === '') json_out(['ok' => false, 'error' => 'missing_order_no'], 400);
  if ($act !== 'deliver') json_out(['ok' => false, 'error' => 'bad_action'], 400);

  $st = $p->prepare("SELECT id, status FROM orders WHERE order_no=? LIMIT 1");
  $st->execute([$orderNo]);
  $row = $st->fetch();
  if (!$row) json_out(['ok' => false, 'error' => 'not_found'], 404);
  // يُسمح بتأكيد الاستلام فقط عندما يكون الطلب قيد التوصيل
  if ($row['status'] !== 'out_for_delivery') {
    json_out(['ok' => false, 'error' => 'not_allowed', 'status' => $row['status']], 409);
  }
  $p->prepare("UPDATE orders SET status='delivered' WHERE id=?")->execute([(int)$row['id']]);
  json_out(['ok' => true, 'status' => 'delivered']);
}

// استعلام عن الحالة
$orderNo = trim((string)($_GET['no'] ?? ''));
if ($orderNo === '') json_out(['ok' => false, 'error' => 'missing_order_no'], 400);

$stmt = $p->prepare(
  "SELECT o.order_no, o.status, o.mode, o.total, o.created_at, b.name AS branch_name
   FROM orders o LEFT JOIN branches b ON b.id = o.branch_id
   WHERE o.order_no = ? LIMIT 1"
);
$stmt->execute([$orderNo]);
$row = $stmt->fetch();
if (!$row) json_out(['ok' => false, 'error' => 'not_found'], 404);

json_out([
  'ok' => true,
  'orderNo' => $row['order_no'],
  'status' => $row['status'],
  'mode' => $row['mode'],
  'total' => (float)$row['total'],
  'branchName' => $row['branch_name'],
  'createdAt' => $row['created_at'],
]);
