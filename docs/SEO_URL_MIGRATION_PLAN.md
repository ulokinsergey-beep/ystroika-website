# SEO URL & Migration Plan — У-Стройка (Timeweb MVP → Cloudflare SSR)

**Статус:** план (НЕ внедрено, без деплоя/DNS). Для финальной архитектуры (`CLOUDFLARE_SSR_BLUEPRINT.md`).
**Дата:** 2026-06-29. Северная звезда: `CATALOG_NORTH_STAR.md`. Модель: `CATALOG_DATA_MODEL.md`.

## 1. Целевая URL-схема (SEO-чистые URL с ID в конце)

| Тип | URL | Источник |
|---|---|---|
| Категория/подкатегория | `/category/<slug>-<id>/` | `category.id` |
| Карточка товара | `/product/<slug>-<id>/` | `product.id` |
| Бренд (allowlist) | `/brand/<slug>-<id>/` | `brand.id` |
| SEO-срез (allowlist) | `/s/<slug>-<id>/` | `seo_slice.id` |

Принцип: `slug` читаемый (транслит названия), `id` в конце — стабильная адресация (переименование не ломает URL).
Парс: `id` = число после последнего `-`. Если `slug` в URL ≠ актуальному при том же `id` → **301** на канон.

## 2. SEO-срезы — только по allowlist

- Индексируемые срезы создаются **осознанно** в `src/data/seo-slices.json` / таблице `seo_slice`
  (например «металлочерепица + GrandLine», «гибкая черепица + Döcke»).
- **Запрещена автогенерация** всех комбинаций фильтров как индексируемых страниц.
- Каждый allowlist-срез = `/s/<slug>-<id>/` с собственным `H1`, title, описанием, `canonical` на себя,
  попадает в sitemap. Срез вне allowlist не существует как индексируемый URL.

## 3. Query-фильтры — noindex + canonical

Любые фильтры через query (`?brand=&sort=&page=&price_min=`):
- отдаются server-side (D1), пользователю работают;
- в `<head>`: `<meta name="robots" content="noindex,follow">`;
- `canonical` → на **чистый** URL подкатегории (без query);
- НЕ попадают в sitemap.

Так бот не индексирует хаотичные комбинации, но ходит по ссылкам (`follow`) и видит товары.

## 4. Карта 301-редиректов (старые → новые)

Старые URL MVP **не финальные**; на каждый — 301 на новый:

| Старый (MVP) | Новый (CF) |
|---|---|
| `/catalog/` | `/catalog/` (оставить как индекс каталога) ИЛИ 301 на корневую категорию-навигацию |
| `/catalog/<cat>/` | `/category/<cat-slug>-<id>/` |
| `/catalog/<cat>/<sub>/` | `/category/<sub-slug>-<id>/` |
| `/catalog/<cat>/<sub>/<code>/` | `/product/<product-slug>-<id>/` (резолв по `vendor_code`→`product.id`) |

**Реализация 301:**
- **Cloudflare:** правила в `_redirects` (статические) или Pages Function (динамический резолв `code → id` через D1) для товарных URL.
- **Timeweb (на время сосуществования):** `.htaccess` 301 со старых на новые (или на CF preview/прод).
- Карту строит ETL: при импорте сохранить соответствие `старый путь → product.id/category.id`.

**Правила:** только 301 (постоянный), один хоп (без цепочек редиректов), сохранять `https://y-stroika.ru`.

## 5. canonical / sitemap / robots

- **canonical:** абсолютный, `https://y-stroika.ru` (с дефисом), на чистый URL без query. На каждой SSR-странице.
- **sitemap:** генерится из D1 (SSR `/sitemap-index.xml` + чанки `/sitemap/<n>.xml` по ≤50k URL). Включает:
  категории, индексируемые товары, allowlist-срезы, бренды (allowlist). **Не включает** query-комбинации и noindex-страницы.
- **robots.txt:** `Allow` каталога; `Disallow` технических/query-путей при необходимости; `Sitemap:` → sitemap-index.
- **Старый sitemap** (MVP) после миграции заменяется новым; старые URL остаются только как 301.

## 6. Фазы миграции

| Phase | Что | Прод/DNS |
|---|---|---|
| **1. Timeweb MVP** | текущий static MVP живёт (категории+витрина+120 demo) | без изменений |
| **2. CF SSR рядом** | поднять Cloudflare Pages + D1 + SSR-роуты на preview-домене (`*.pages.dev`); собрать blueprint в код | **не трогать** прод/DNS |
| **3. Реальные данные** | импорт 230k → D1; включить server-side фильтры, цены/наличие (edge+KV); сгенерировать allowlist-срезы | preview |
| **4. SEO/скорость/индексация** | проверить canonical/sitemap/robots/301-карту, Core Web Vitals, HTML-first (товары в HTML без JS), отсутствие дублей | preview (Search Console на preview по возможности) |
| **5. Cutover** | DNS `y-stroika.ru` → Cloudflare; включить 301 со старых URL; снять Timeweb-редирект; мониторинг индексации/трафика | **только после owner approval** |

Откат на каждой фазе: до Phase 5 прод не затронут (всё на preview); на Phase 5 — возможность вернуть DNS на Timeweb.

## 7. Риски и контрмеры

| Риск | Контрмера |
|---|---|
| Потеря link equity при смене URL | строгие 301 (один хоп), обновлённый sitemap, не менять URL дважды |
| Дубли/каннибализация | `canonical` на чистый URL, `noindex` для query, allowlist для срезов |
| Падение индексации после cutover | сделать в окно низкого трафика, держать 301 долго, мониторить Search Console |
| Crawl budget на 230k | sitemap-чанки, приоритеты, noindex мусорных фильтров |
| Несоответствие slug↔id | 301 на канон при том же id |
| DNS-cutover необратимость впечатления | предварительная полная проверка на preview (Phase 4) |

## 8. Что нужно owner approve

1. URL-схема `/category/<slug>-<id>/`, `/product/<slug>-<id>/` (и `/brand/`, `/s/`).
2. Первый allowlist SEO-срезов (какие комбинации индексируем).
3. Стратегия 301 (резолв `code→id` через Function vs статический `_redirects`).
4. Финальный **cutover DNS** (Phase 5) — отдельным Go, после preview-проверки.
