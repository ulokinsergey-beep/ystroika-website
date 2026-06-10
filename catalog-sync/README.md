# catalog-sync — синхронизация цен (мульти-поставщик)

Переносимый инструмент сборки снимка цен. Реализует ядро из
`docs/catalog-pricing-architecture.md` (Фаза 2A). Чистый Node 20, без сборки и
зависимостей — запускается на текущем сервере и без боли переносится на VPS.

## Поток
```
adapters → normalizers → mapping → pricing → snapshot + report
поставщик(сырьё) → единый контракт → связь с товаром → цена продажи → стабильный снимок
```

## Запуск
```bash
# секреты — из env (см. .env.example). Локально можно через .env (gitignored).
node catalog-sync/build-snapshot.mjs                      # полный прогон
node catalog-sync/build-snapshot.mjs --limit-pages=2      # быстрый тест каталога
node catalog-sync/build-snapshot.mjs --bootstrap=8        # засеять пустой маппинг из реальных данных
```

## Результат (`catalog-sync/snapshots/`)
- `price-snapshot-latest.json` — публичные данные, которые читает сайт.
- `price-snapshot-<ISO>.json` — версии (откат).
- `price-snapshot-report.json` — отчёт: источники, mapped/withPrice, warnings, blockers.

## Безопасность и развёртывание
- **Секреты только в env** (`catalog-sync/.env` или переменные сервера/CI). Не в коде, не в репозитории, не в snapshot, не в логах.
- **Наружу не открываем** никакие админки. Сайту отдаём только готовый `price-snapshot-latest.json`.
- `latest` обновляется **только при отсутствии блокеров** — старый снимок не затирается мусором.
- Сейчас: на текущем сервере / локально. Позже: Directus + n8n на VPS за VPN/IP-allowlist (управляющий слой над этим ядром).
- Остатки не тянем; `availability: "unknown"`.

## Структура
```
adapters/docke.mjs            auth + РРЦ + каталог (сырьё)
normalizers/docke.mjs         сырьё → единый контракт
mapping/product-supplier-map.json   productId ↔ поставщики (курируется)
pricing/pricing-rules.json    цена = РРЦ, округление до 10 ₽
lib/pricing.mjs               движок цены
build-snapshot.mjs            генератор снимка
snapshots/                    результат (gitignored)
```
