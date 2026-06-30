# Cloudflare SSR Blueprint — финальная архитектура каталога У-Стройка

**Статус:** blueprint (НЕ внедрено, без деплоя). Реализация — задача Артёма после Timeweb MVP.
**Дата:** 2026-06-29. Северная звезда: `CATALOG_NORTH_STAR.md`. Этапы: `CLOUDFLARE_SSR_ROADMAP.md`.
**Связанные:** `CATALOG_DATA_MODEL.md` (схема D1), `SEO_URL_MIGRATION_PLAN.md` (URL + 301).

## 0. Цель и принципы

Перевести каталог (≈230k товаров) на **edge-SSR** (Cloudflare Pages + `@astrojs/cloudflare`), сохранив
принципы north-star: **HTML-first**, товары/категории/фильтры/карточки в HTML при первой загрузке,
JS только улучшает интерактив, SEO-срезы по allowlist, query-фильтры `noindex+canonical`,
URL с ID в конце, карточка-справочник.

**Почему SSR, а не static:** пре-рендер 230k HTML непрактичен; SPA на большом JSON нарушает HTML-first.
Edge-SSR рендерит страницу on-demand из D1 — настоящий серверный HTML на каждый URL, мгновенно
индексируемый, без пре-билда.

## 1. Платформа и режим рендеринга

| Слой | Решение |
|---|---|
| Хостинг | Cloudflare Pages (preview на каждую ветку + production) |
| Adapter | `@astrojs/cloudflare` (`output: 'server'`, hybrid) |
| Рендеринг | Маркетинг — `prerender = true` (static на edge); каталог — SSR (`prerender = false`) |
| БД каталога | **D1** (SQLite на edge) — см. `CATALOG_DATA_MODEL.md` |
| Картинки | **R2** (или остаются на Timeweb/внешнем CDN на старте) |
| Кэш | **KV** (горячие товары, цены TTL) + Cloudflare Cache API на листинги |
| Цены/наличие | edge-fetch к КровАльянс (секреты в CF) + KV-кэш (TTL 5–15 мин) |
| Секреты | Cloudflare env/secrets (`wrangler secret put`), НЕ в репозитории/бандле |

`output: 'server'` + per-page `prerender`:
- `prerender = true` → маркетинг (главная, услуги, о-компании, доставка, политики, блог) — static на edge.
- `prerender = false` → весь `/category/*`, `/product/*`, SEO-срезы, sitemap, prices/stock API.

## 2. Целевая структура проекта

```
src/
  pages/
    index.astro                      # prerender=true (маркетинг)
    uslugi/…, dostavka/…, blog/…     # prerender=true
    category/
      [slugId].astro                 # SSR: страница категории/подкатегории
    product/
      [slugId].astro                 # SSR: карточка товара (справочник)
    brand/
      [slugId].astro                 # SSR: страница бренда (allowlist)
    s/                               # SEO-срезы (allowlist)
      [sliceId].astro                # SSR: «металлочерепица + бренд X»
    api/
      prices.ts                      # SSR endpoint: edge-fetch цен + KV
      stock.ts                       # SSR endpoint: наличие
    sitemap-index.xml.ts             # SSR: индекс sitemap из D1
    sitemap/[n].xml.ts               # SSR: чанки sitemap из D1
    robots.txt.ts                    # SSR: robots
  lib/
    db/
      client.ts                      # доступ к D1 binding (Astro.locals.runtime.env.DB)
      categories.ts                  # запросы дерева категорий
      products.ts                    # listing/фильтры/карточка (SQL WHERE/ORDER/LIMIT)
      specs.ts                       # характеристики
      slices.ts                      # SEO-срезы (allowlist)
      slug.ts                        # парс/сборка <slug>-<id>
    pricing/
      kroval.ts                      # edge-fetch цен/наличия + KV-кэш
    seo/
      canonical.ts, sitemap.ts, jsonld.ts
  components/                        # переиспользуются из MVP (ProductCard, breadcrumbs, …)
  data/
    seo-slices.json                  # ALLOWLIST индексируемых SEO-срезов (не автоген)
wrangler.toml                        # bindings (DB/IMAGES/CACHE); секреты отдельно
```

## 3. SSR-роуты (маппинг)

| URL | Файл | Что делает (HTML-first) |
|---|---|---|
| `/category/<slug>-<id>/` | `pages/category/[slugId].astro` | D1: категория по id → подкатегории + сетка товаров (server-side), breadcrumbs, H1, count, SEO-блок, `CollectionPage`+`BreadcrumbList` JSON-LD |
| `/product/<slug>-<id>/` | `pages/product/[slugId].astro` | D1: товар по id → H1, фото, цена/наличие (edge-fetch+KV), артикул, таблица характеристик, breadcrumbs, `Product`(+`Offer` при цене)+`BreadcrumbList` |
| `/brand/<slug>-<id>/` | `pages/brand/[slugId].astro` | D1: товары бренда (allowlist), пагинация SSR |
| `/s/<slug>-<id>/` | `pages/s/[sliceId].astro` | SEO-срез из allowlist (`seo-slices.json`): фикс. фильтр (категория+бренд/параметр), server-HTML, canonical на себя |
| `?brand=&sort=&page=` | (на тех же страницах) | server-side фильтр D1; **`noindex,follow`** + `canonical` на чистый URL без query |
| `/api/prices`, `/api/stock` | `pages/api/*.ts` | POST батч кодов → КровАльянс (секреты CF) + KV; **только** «быстрый» слой, не влияет на индексируемый HTML |
| `/sitemap-index.xml`, `/sitemap/<n>.xml` | SSR | из D1, чанки ≤50k URL, только индексируемое |
| `/robots.txt` | SSR | allow + ссылка на sitemap-index |

## 4. Слой данных (адаптеры)

- Доступ к D1 — через binding: `const db = Astro.locals.runtime.env.DB;` (тип из `wrangler types`).
- Все запросы — параметризованные prepared statements (`db.prepare(sql).bind(...)`), без конкатенации (анти-SQLi).
- Листинг подкатегории: `SELECT … FROM product WHERE category_id=? [AND brand_id=?] ORDER BY ? LIMIT ? OFFSET ?` → реальная серверная пагинация (индексируемо).
- Карточка: `SELECT … FROM product WHERE id=?` (+ join specs); 404 если нет.
- Цены/наличие в HTML рендерятся из «быстрого» слоя: при SSR делаем edge-fetch (или читаем KV-кэш) и вставляем в HTML серверно (товар не «пустая плитка»). Фолбэк — «Цена по запросу» / «Наличие уточняется».

## 5. SEO (canonical / sitemap / robots)

- **canonical** — всегда абсолютный, под `https://y-stroika.ru` (с дефисом), на чистый URL без query.
- **query-фильтры** → `<meta name="robots" content="noindex,follow">` + canonical на подкатегорию.
- **SEO-срезы** — только из `src/data/seo-slices.json` (allowlist); каждый срез = индексируемый URL `/s/<slug>-<id>/` с собственным H1/текстом/canonical.
- **sitemap** — генерится из D1 (SSR), чанки по 50k, включает: категории, товары (индексируемые), allowlist-срезы. **Никогда** не включает query-комбинации.
- **robots.txt** — `Disallow` для технических путей; `Allow` каталога; `Sitemap:` на sitemap-index.

## 6. Кэширование и производительность

- Листинги: `Cache-Control`/Cloudflare Cache API (TTL минуты), инвалидция при обновлении каталога.
- Карточки: edge-кэш HTML (TTL) + короткий TTL на цену (KV).
- Цены: KV-кэш по коду товара (TTL 5–15 мин), чтобы не дёргать КровАльянс на каждый рендер.
- Изображения: R2 + Cloudflare CDN (или внешний CDN поставщика на старте).

## 7. Секреты и конфигурация

- `wrangler.toml`: bindings `DB` (D1), `IMAGES` (R2), `CACHE` (KV) — **без секретов**.
- Секреты КровАльянс (логин/пароль/ключ) → `wrangler secret put` / Pages env vars. Никогда в репозитории, бандле, логах.
- В репозиторий идёт только `wrangler.toml` (bindings) + код; `.dev.vars`/секреты — gitignore.

## 8. Среды и выкладка

- **Preview:** Cloudflare Pages делает preview-деплой на каждую ветку/PR (`*.pages.dev`) — безопасный staging без DNS и без Timeweb.
- **Production:** Pages production branch на `*.pages.dev`, затем (отдельный owner-Go) DNS `y-stroika.ru` → Cloudflare.
- **Сосуществование:** Timeweb MVP остаётся живым до cutover; Cloudflare поднимается рядом на preview-домене. Переключение домена — только после owner approval (см. `SEO_URL_MIGRATION_PLAN.md`, Phase 5).

## 9. Что меняется относительно MVP

| MVP (Timeweb) | Cloudflare SSR (финал) |
|---|---|
| `output: 'static'`, `@astrojs/node` (не используется) | `output: 'server'`, `@astrojs/cloudflare` |
| Каталог из `catalog-demo.json` (120) | Каталог из D1 (≈230k) |
| PHP-прокси `public/api/*.php` для цен | edge API-routes `/api/*` (PHP не нужен) |
| URL `/catalog/<cat>/<sub>/<code>/` | URL `/category/<slug>-<id>/`, `/product/<slug>-<id>/` (+301) |
| sitemap из собранных страниц | sitemap из D1 (чанки) |
| Фильтры на клиенте (или нет) | фильтры server-side (D1), индексируемые срезы по allowlist |

MVP-наработки переиспользуются: компоненты (ProductCard, breadcrumbs, layout), categories-структура, north-star.

## 10. Риски

- **Импорт 230k → D1** (305 МБ источник): батчи `wrangler d1 execute`/`d1 import`; следить за лимитами/таймаутами.
- **Free-tier лимиты** D1 (reads/day), KV, R2 — оценить под трафик; при росте — платный план.
- **DNS-cutover** — необратимость впечатления; делать в окно низкого трафика, после проверки preview + 301-карты.
- **Дубли/каннибализация** при миграции URL — строгий `canonical` + 301 + обновлённый sitemap (см. план миграции).
- **КровАльянс rate-limit** — KV-кэш + батч-запросы.
- **Секреты** — только в CF secrets; код-ревью на отсутствие утечек.

## 11. Что нужно от owner (до старта реализации)

1. Создать Cloudflare аккаунт + Pages-проект + D1/R2/KV (free-tier), выдать Артёму доступ.
2. Подтвердить URL-схему `/category/<slug>-<id>/`, `/product/<slug>-<id>/` (см. план миграции).
3. Утвердить первый allowlist SEO-срезов.
4. Согласовать, где хранить картинки (R2 vs внешний CDN на старте).
5. Approve на DNS-cutover — отдельным шагом, только после preview-проверки.
