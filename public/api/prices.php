<?php
// /public_html/api/prices.php — SKELETON (без секретов). Прокси КровАльянс /price.
// Config (kroval-config.php) кладётся ВНЕ web-root; в repo секретов нет.
declare(strict_types=1);
$ORIGIN = 'https://y-stroika.ru';

// CORS + preflight
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

// Rate-limit (APCu по IP, окно 60с, ≤30 req) — fail-open если APCu нет
if (function_exists('apcu_fetch')) {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'x';
    $k = 'rl_prices_' . md5($ip);
    $n = (int) apcu_fetch($k);
    if ($n >= 30) { http_response_code(429); echo '{"error":"rate_limited","prices":{}}'; exit; }
    apcu_store($k, $n + 1, 60);
}

// Config ВНЕ web-root (owner создаёт): ['base'=>..., 'auth'=>...]. Секреты НЕ в repo.
$cfgPath = __DIR__ . '/../../private/kroval-config.php';
if (!is_file($cfgPath)) { http_response_code(500); echo '{"error":"not_configured","prices":{}}'; exit; }
$cfg = require $cfgPath;

$body = json_decode(file_get_contents('php://input') ?: '', true);
$kods = (is_array($body['kods'] ?? null)) ? array_slice($body['kods'], 0, 150) : [];
if (!$kods) { echo '{"prices":{}}'; exit; }

$ch = curl_init(rtrim($cfg['base'], '/') . '/price');
curl_setopt_array($ch, [
    CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Authorization: ' . $cfg['auth']],
    CURLOPT_POSTFIELDS => json_encode(['kods' => $kods]),
]);
$resp = curl_exec($ch);
$code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Нормализация: любой не-200 или невалидный JSON → generic (без тела upstream, без утечки)
if ($resp === false || $code !== 200) { error_log("[prices] upstream $code"); http_response_code(502); echo '{"error":"upstream_unavailable","prices":{}}'; exit; }
$data = json_decode($resp, true);
if (!is_array($data)) { http_response_code(502); echo '{"error":"bad_upstream","prices":{}}'; exit; }
echo json_encode(['prices' => $data['prices'] ?? $data], JSON_UNESCAPED_UNICODE);
