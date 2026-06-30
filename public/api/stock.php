<?php
// /public_html/api/stock.php — SKELETON (без секретов). Прокси КровАльянс /stock (наличие).
declare(strict_types=1);
$ORIGIN = 'https://y-stroika.ru';

header("Access-Control-Allow-Origin: $ORIGIN");
header('Vary: Origin');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Max-Age: 86400');
    http_response_code(204);
    exit;
}
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo '{"error":"method"}'; exit; }

if (function_exists('apcu_fetch')) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'x';
    $k = 'rl_stock_' . md5($ip);
    $n = (int) apcu_fetch($k);
    if ($n >= 30) { http_response_code(429); echo '{"error":"rate_limited","stock":{}}'; exit; }
    apcu_store($k, $n + 1, 60);
}

$cfgPath = __DIR__ . '/../../private/kroval-config.php';
if (!is_file($cfgPath)) { http_response_code(500); echo '{"error":"not_configured","stock":{}}'; exit; }
$cfg = require $cfgPath;

$body = json_decode(file_get_contents('php://input') ?: '', true);
$kods = (is_array($body['kods'] ?? null)) ? array_slice($body['kods'], 0, 150) : [];
if (!$kods) { echo '{"stock":{}}'; exit; }

$ch = curl_init(rtrim($cfg['base'], '/') . '/stock');
curl_setopt_array($ch, [
    CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Authorization: ' . $cfg['auth']],
    CURLOPT_POSTFIELDS => json_encode(['kods' => $kods]),
]);
$resp = curl_exec($ch);
$code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($resp === false || $code !== 200) { error_log("[stock] upstream $code"); http_response_code(502); echo '{"error":"upstream_unavailable","stock":{}}'; exit; }
$data = json_decode($resp, true);
if (!is_array($data)) { http_response_code(502); echo '{"error":"bad_upstream","stock":{}}'; exit; }
echo json_encode(['stock' => $data['stock'] ?? $data], JSON_UNESCAPED_UNICODE);
