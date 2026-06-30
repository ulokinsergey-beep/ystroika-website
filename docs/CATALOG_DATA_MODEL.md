# Catalog Data Model — D1-схема каталога У-Стройка

**Статус:** проект схемы (НЕ внедрено). Для Cloudflare SSR (`CLOUDFLARE_SSR_BLUEPRINT.md`).
**Дата:** 2026-06-29. Северная звезда: `CATALOG_NORTH_STAR.md`.

Цель: нормализованная модель каталога (≈230k товаров) в **D1 (SQLite)** для server-side
фильтров/сортировки/пагинации/поиска и SEO-чистых URL с ID.

## 1. Сущности

| Сущность | Назначение |
|---|---|
| `supplier` | источник данных/поставщик (Döcke, GrandLine, КровАльянс…) |
| `brand` | производитель (для фильтров и страниц бренда) |
| `category` | дерево разделов/подразделов (self-reference через `parent_id`) |
| `product` | товар (карточка-справочник) |
| `specification` | тип характеристики (ключ + подпись + единица) |
| `specification_value` | значение характеристики у товара |
| `price` | текущая публичная цена (снимок; «живой» слой — KV/edge-fetch) |
| `stock` | наличие (статус/кол-во; не выдумываем — может быть `unknown`) |
| `product_image` | изображения товара |
| `seo_slice` | индексируемый SEO-срез (allowlist) |

## 2. Схема (D1 / SQLite DDL)

```sql
-- Поставщик/источник
CREATE TABLE supplier (
  id            INTEGER PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,        -- 'docke' | 'grandline' | 'kroval'
  title         TEXT NOT NULL
);

-- Бренд
CREATE TABLE brand (
  id            INTEGER PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,        -- транслит, для /brand/<slug>-<id>/
  title         TEXT NOT NULL
);

-- Категория (дерево: категория -> подкатегория через parent_id)
CREATE TABLE category (
  id            INTEGER PRIMARY KEY,
  slug          TEXT NOT NULL,               -- 'metallocherepitsa'
  parent_id     INTEGER REFERENCES category(id),
  title         TEXT NOT NULL,
  description   TEXT,
  image         TEXT,
  sort          INTEGER DEFAULT 0,
  UNIQUE(parent_id, slug)
);

-- Товар
CREATE TABLE product (
  id            INTEGER PRIMARY KEY,
  slug          TEXT NOT NULL,               -- транслит названия, для /product/<slug>-<id>/
  category_id   INTEGER NOT NULL REFERENCES category(id),
  brand_id      INTEGER REFERENCES brand(id),
  supplier_id   INTEGER NOT NULL REFERENCES supplier(id),
  vendor_code   TEXT NOT NULL,               -- код поставщика (бывший vendor); стабильный SKU
  name          TEXT NOT NULL,
  collection    TEXT,
  color         TEXT,
  unit          TEXT,                        -- человекочитаемая ('шт','м²',…)
  description   TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  UNIQUE(supplier_id, vendor_code)
);

-- Характеристика (тип)
CREATE TABLE specification (
  id            INTEGER PRIMARY KEY,
  key           TEXT NOT NULL UNIQUE,        -- 'thickness','length','warranty'…
  label         TEXT NOT NULL,               -- 'Толщина'
  unit          TEXT                         -- 'мм','лет',…
);

-- Значение характеристики у товара
CREATE TABLE specification_value (
  product_id        INTEGER NOT NULL REFERENCES product(id),
  specification_id  INTEGER NOT NULL REFERENCES specification(id),
  value             TEXT NOT NULL,
  PRIMARY KEY (product_id, specification_id)
);

-- Цена (текущий снимок публичной цены; null = «по запросу»)
CREATE TABLE price (
  product_id    INTEGER PRIMARY KEY REFERENCES product(id),
  value         REAL,
  currency      TEXT NOT NULL DEFAULT 'RUB',
  source        TEXT,                        -- 'rrc' | 'kroval' | …
  updated_at    TEXT NOT NULL
);

-- Наличие (НЕ выдумываем: 'unknown' допустимо)
CREATE TABLE stock (
  product_id    INTEGER PRIMARY KEY REFERENCES product(id),
  status        TEXT NOT NULL DEFAULT 'unknown',  -- 'in_stock'|'on_order'|'unknown'
  qty           INTEGER,
  updated_at    TEXT NOT NULL
);

-- Изображения
CREATE TABLE product_image (
  id            INTEGER PRIMARY KEY,
  product_id    INTEGER NOT NULL REFERENCES product(id),
  url           TEXT NOT NULL,               -- R2-путь или внешний CDN
  sort          INTEGER DEFAULT 0
);

-- SEO-срез (ALLOWLIST; только осознанно индексируемые)
CREATE TABLE seo_slice (
  id            INTEGER PRIMARY KEY,
  slug          TEXT NOT NULL UNIQUE,        -- 'metallocherepitsa-grandline'
  type          TEXT NOT NULL,               -- 'category_brand' | 'category_spec'
  category_id   INTEGER NOT NULL REFERENCES category(id),
  brand_id      INTEGER REFERENCES brand(id),
  filter_json   TEXT,                        -- доп. фильтр (напр. {"thickness":"0,5"})
  h1            TEXT NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  indexable     INTEGER NOT NULL DEFAULT 1
);
```

## 3. Индексы

```sql
CREATE INDEX idx_product_category   ON product(category_id);
CREATE INDEX idx_product_brand      ON product(brand_id);
CREATE INDEX idx_product_supplier   ON product(supplier_id);
CREATE INDEX idx_product_name       ON product(name);          -- LIKE/поиск (или FTS5)
CREATE INDEX idx_category_parent    ON category(parent_id);
CREATE INDEX idx_specval_product    ON specification_value(product_id);
CREATE INDEX idx_specval_spec       ON specification_value(specification_id);
CREATE INDEX idx_image_product      ON product_image(product_id);
CREATE INDEX idx_slice_category     ON seo_slice(category_id);
-- Поиск: при необходимости FTS5 виртуальная таблица product_fts(name, brand, collection)
```

## 4. ETL — импорт из текущего источника

**Источник:** `src/data/kroval-catalog-full.json` (305 МБ, ≈229 909 позиций, gitignored) и/или
`catalog-snapshot-latest.json` (20 МБ, 31 799). Маппинг полей снимка → таблицы:

| Поле снимка (`SnapshotItem`) | Куда |
|---|---|
| `vendor` | `product.vendor_code` |
| `name` | `product.name` (+ генерация `product.slug`) |
| `category` (`"cat/sub"`) | резолв в `category.id` (по дереву из `categories.ts`) |
| `brand` | резолв/insert `brand` → `product.brand_id` |
| `source` | резолв/insert `supplier` → `product.supplier_id` |
| `collection`, `color`, `unit`, `description` | `product.*` |
| `price`, `currency`, `priceSource` | `price.value/currency/source` |
| `availability` | `stock.status` (маппинг; `unknown` по умолчанию) |
| `images[]` | строки `product_image` (sort по порядку) |
| `specs{}` (key→value) | `specification` (insert по key/label/unit) + `specification_value` |
| `updatedAt` | `product.updated_at`, `price.updated_at` |

**Процедура (build/CI-скрипт, локально у Артёма; НЕ в этом репо-Go):**
1. Нормализовать категории из `src/data/categories.ts` → таблица `category` (8 категорий + 30 подкатегорий, дерево).
2. Пройти источник, dedupe по `(supplier, vendor_code)`, заполнить `brand`/`supplier`/`product`.
3. Залить `specification`/`specification_value`, `price`, `stock`, `product_image`.
4. Импорт в D1 батчами: `wrangler d1 execute <db> --file=batch_N.sql` или `wrangler d1 import` (CSV).
5. Проверить counts и выборочные карточки.

**Цены/наличие:** в D1 кладём только последний публичный снимок (для HTML-фолбэка); «живые» цены —
edge-fetch к КровАльянс + KV-кэш (см. blueprint §6). Stock не выдумываем (north-star).

## 5. Slug / ID правила

- `id` — стабильный INTEGER (PK), источник истины адресации. Переименование товара НЕ меняет URL.
- `slug` — транслитерация `name`/`title` (ru→lat, нижний регистр, `-` вместо пробелов, без спецсимволов).
- URL: `/<entity>/<slug>-<id>/` (см. `SEO_URL_MIGRATION_PLAN.md`). Парс: `id` = число после последнего `-`.
- При несовпадении `slug` в URL и в БД (товар переименован) → 301 на актуальный `slug` при том же `id`.

## 6. Замечания

- D1 как **основной store каталога** (230k << лимитов). Картинки — R2 или внешний CDN.
- Все запросы — prepared statements с bind-параметрами (анти-SQLi).
- Поиск: на старте `LIKE` по `idx_product_name`; при росте — FTS5.
- Текущий MVP `catalog-demo.json` (120) — НЕ источник для D1; используется только для Timeweb MVP.
