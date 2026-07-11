<?php
/**
 * API عام: استعلام عن حالة طلب حسب رقم الطلب (للقراءة فقط، بدون مصادقة).
 * يعيد الحالة الحالية للطلب كما هي في لوحة التحكم.
 */
require_once __DIR__ . '/helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  header('Access-Control-Allow-Origin: *');
  header('Access-Control-Allow-Headers: Content-Type');
  header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
  exit;
}
if (!db_installed()) json_out(['ok' => false, 'error' => 'not_installed'], 503);

// يقبل رقم الطلب من ?no= أو من جسم JSON
$orderNo = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $in = json_in();
  $orderNo = trim((string)($in['orderNo'] ?? ''));
} else {
  $orderNo = trim((string)($_GET['no'] ?? ''));
}
if ($orderNo === '') json_out(['ok' => false, 'error' => 'missing_order_no'], 400);

ensure_migrations();
$p = db();

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
