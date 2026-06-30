# Cloudflare SSR Roadmap — финальная архитектура каталога У-Стройка (для Артёма)

**Дата:** 2026-06-29 · **Статус:** roadmap (НЕ внедрено). Это задача разработки для Артёма после MVP-запуска на Timeweb.
**Решение owner:** Timeweb — для быстрого запуска сайта (маркетинг + минимальный каталог: категории/топ/демо). **Полный каталог 230k со SSR — на Cloudflare**, отдельным этапом.

## 0. Почему Cloudflare SSR (а не Timeweb для каталога)
- Каталог: сырьё **~229 909 товаров (305МБ)**; рантайм-снимок 31 799. Pure-static (pre-render 31.8k–230k HTML) непрактичен; SPA на 20МБ снимок — костыль.
- **Cloudflare Pages + `@astrojs/cloudflare`** = нативный **edge-SSR**: карточки/листинги рендерятся on-demand (без пре-билда), данные из **D1** (SQLite на edge), цены/наличие — edge-функции к КровАльянс. Бесплатный tier щедрый. Лучший SEO (настоящий server-HTML на карточку).
- Минимум переписывания: проект уже hybrid (`@astrojs/node`); меняется адаптер + слой данных (node:fs → D1/binding).

## 1. Что меняется в Astro
1. `npm rm @astrojs/node && npm i @astrojs/cloudflare`.
2. `astro.config.mjs`: `import cloudflare from '@astrojs/cloudflare'; adapter: cloudflare(), output: 'server'` (или гибрид: статич. маркетинг `prerender=true`, каталог SSR).
3. Убрать `node:fs readFileSync(snapshot)` (на edge нет fs) → данные из **D1** через `Astro.locals.runtime.env.DB` (binding) или из R2/KV.
4. `src/pages/api/catalog/{prices,stock}.ts` → оставить как **edge API-routes** (SSR, работают на Cloudflare нативно) ИЛИ Pages Functions; PHP-прокси (PR#4) на Cloudflare НЕ нужен.
5. `[subcategory].astro` фильтры (`Astro.url.searchParams`) → **server-side D1-запрос** (WHERE/ORDER/LIMIT) — настоящая пагинация, индексируемо.
6. `[code].astro` карточка → SSR: D1 по `code` + live цена/наличие (edge-fetch КровАльянс). Без `getStaticPaths`.
7. canonical/sitemap/robots под `y-stroika.ru` (✅ уже в master).

## 2. Где хранить 230k товаров (data store)
| Вариант | Для чего | Лимиты (free) | Рекомендация |
|---|---|---|---|
| **D1** (SQLite edge) | каталог: фильтр/сортировка/пагинация/поиск SQL | 5 GB / 5M reads-day | ✅ **основной store каталога** (230k строк << лимита) |
| **R2** (object storage) | изображения товаров, крупные blob | 10 GB / no egress fee | ✅ для картинок (или оставить на Timeweb/CDN) |
| **KV** (key-value) | горячий кэш (товар по code, цены TTL) | 1 GB / 100k reads-day | опц. кэш цен (TTL 5 мин) |
| live КровАльянс API | цены/наличие (не в D1) | — | edge-fetch на запрос + KV-кэш |

**Импорт 230k → D1 (build/CI скрипт):** `kroval-catalog-full.json` (305МБ, gitignored) → нормализовать → `wrangler d1 execute` батчами (INSERT) ИЛИ `d1 import` (CSV). Схема: `products(code PK, category, subcategory, brand, name, unit, image, specs_json, ...)` + индексы по `category/subcategory/brand`. Цены/наличие в D1 НЕ кладём (живут в КровАльянс).

## 3. SSR карточек / листингов
- Листинг подкатегории: `SELECT ... WHERE subcategory=? AND brand=? ORDER BY ? LIMIT ? OFFSET ?` → server-HTML (индексируемо, реальная пагинация).
- Карточка `[code]`: `SELECT * FROM products WHERE code=?` (404 если нет) → SSR + клиентский/edge-fetch цены наличия (KV-кэш). Каждая карточка = индексируемый URL.
- Кэш: `Cache-Control`/Cloudflare Cache API на листинги (TTL), цены — короткий TTL.

## 4. Sitemap / фильтры / SEO
- **Sitemap:** генерить из D1 (build-time `wrangler d1` экспорт → sitemap-index с чанками по 50k URL) ИЛИ динамический `/sitemap-[n].xml.ts` (SSR из D1). Включать категории + индексируемые карточки (можно топ/все — D1 позволяет).
- **Фильтры:** server-side (URL `?brand=&sort=&page=` → D1) — индексируемые; canonical на подкатегорию без параметров для фильтр-комбинаций (избежать дублей).
- **Поиск:** D1 `LIKE`/FTS5 (full-text) edge-функция.

## 5. Preview / Prod / секреты
- **Preview:** Cloudflare Pages создаёт preview-деплой на каждую ветку/PR (`*.pages.dev`) — безопасный staging без затрагивания прод (и без Timeweb-редиректа).
- **Prod:** Pages production branch; DNS на Cloudflare (cutover — отдельный owner-Go, меняет DNS y-stroika.ru).
- **Секреты:** КровАльянс auth → **Cloudflare env/secrets** (`wrangler secret put` / Pages env vars), НЕ в repo, НЕ в bundle. D1/R2/KV — через bindings в `wrangler.toml` (без секретов).
- `wrangler.toml`: bindings (DB=D1, IMAGES=R2, CACHE=KV); secrets отдельно.

## 6. Этапы работ (для Артёма)
1. **Setup:** Cloudflare аккаунт + Pages проект + D1/R2/KV (owner создаёт аккаунт/биллинг-free; даёт Артёму доступ). `wrangler` локально.
2. **Адаптер:** swap `@astrojs/node`→`@astrojs/cloudflare`, `output:server`, локальный `wrangler pages dev` (build PASS).
3. **D1 схема + импорт:** схема products, скрипт импорта 230k из `kroval-catalog-full.json` → D1; индексы.
4. **Каталог на D1:** `[subcategory]`/`[code]` → D1-запросы (убрать node:fs); фильтры server-side.
5. **Цены/наличие:** edge API-routes prices/stock (КровАльянс auth из CF secrets) + KV-кэш.
6. **Sitemap/SEO:** из D1; canonical; robots.
7. **Preview:** Pages preview-деплой ветки → проверка (без DNS/Timeweb).
8. **Prod cutover (owner-Go):** DNS y-stroika.ru → Cloudflare; отключить Timeweb-редирект; мониторинг.

## 7. Что НЕ нужно при Cloudflare-пути
- PHP-прокси (PR#4) — заменяется edge API-routes (но PR#4 полезен для Timeweb-MVP сейчас).
- Чанкинг 20МБ снимка / SPA — не нужен (D1 server-side).
- Timeweb FTP/static-конверсия — только для MVP-запуска, не для финального каталога.

Связано: `CATALOG_ARCHITECTURE_DECISION.md`, `STATIC_DEPLOY_FOUNDATION_PLAN.md` (Timeweb MVP), `PHP_PROXY_SECURITY_PLAN.md`.
