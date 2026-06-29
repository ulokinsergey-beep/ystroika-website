# /api/ — PHP-прокси для static-деплоя на Timeweb

`prices.php` / `stock.php` — прокси к КровАльянс, прячут auth серверно (для SPA-каталога при static-деплое).

- **Config (`kroval-config.php`) — ВНЕ web-root** (напр. `/home/<acct>/private/kroval-config.php`), НЕ в repo. В этих файлах секретов нет (placeholder-путь).
- CORS только `https://y-stroika.ru` + OPTIONS preflight; timeout 8с; APCu rate-limit (≤30/мин/IP); generic-ошибки без утечки тела upstream; only POST; fixed upstream (нет SSRF).
- На текущем Node/hybrid-хосте PHP **не исполняется** (инертные файлы); активируются на Timeweb (Apache/PHP) **после** static-конверсии (`output:static`).
- Детали: `CATALOG_ARCHITECTURE_DECISION.md`, `PHP_PROXY_SECURITY_PLAN.md`. **Без секретов. Не деплоить без отдельного Go.**
