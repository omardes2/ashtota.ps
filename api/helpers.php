<?php
/**
 * دوال مساعدة عامة: استجابات JSON، الجلسة، الحماية
 */
require_once __DIR__ . '/db.php';

function json_out($data, int $code = 200): void {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  header('Access-Control-Allow-Origin: *');
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

function json_in(): array {
  $raw = file_get_contents('php://input');
  $d = json_decode($raw, true);
  return is_array($d) ? $d : [];
}

function start_admin_session(): void {
  if (session_status() === PHP_SESSION_NONE) {
    session_name(SESSION_NAME);
    session_start();
  }
}

function current_admin(): ?array {
  start_admin_session();
  return $_SESSION['admin'] ?? null;
}

function require_admin(): array {
  $a = current_admin();
  if (!$a) json_out(['ok' => false, 'error' => 'unauthorized'], 401);
  return $a;
}

/** حماية CSRF بسيطة عبر رمز في الجلسة */
function csrf_token(): string {
  start_admin_session();
  if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(16));
  return $_SESSION['csrf'];
}

function check_csrf(): void {
  start_admin_session();
  $sent = $_SERVER['HTTP_X_CSRF'] ?? ($_POST['csrf'] ?? '');
  if (empty($_SESSION['csrf']) || !hash_equals($_SESSION['csrf'], (string)$sent)) {
    json_out(['ok' => false, 'error' => 'bad_csrf'], 403);
  }
}

function money($n): string { return number_format((float)$n, ($n == (int)$n ? 0 : 2)) . ' ' . CURRENCY; }
