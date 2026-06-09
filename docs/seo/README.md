# Пакет SEO/AEO-спецификаций сайта У-Стройка

> 19 файлов: 18 спецификаций 00–17 + операционная матрица `18-implementation-matrix.md`.
> Каждый — ТЗ для верстки/копирайта/проверки.
> Обзорная карта всего — `../seo-architecture.md`. Стандарт визуала —
> `../figma-quality-rules.md`. Принцип: сайт 100% 1-в-1 по Figma, факты проверены.

## Стратегия и карта
- [00-strategy.md](00-strategy.md) — стратегия и цели.
- [01-sitemap-pages.md](01-sitemap-pages.md) — карта сайта, URL-структура, приоритеты.

## Шаблоны страниц (по блокам)
- [02-homepage.md](02-homepage.md) — главная.
- [03-service-page.md](03-service-page.md) — страница услуги.
- [04-category-listing.md](04-category-listing.md) — раздел каталога + листинг.
- [05-knowledge-base.md](05-knowledge-base.md) — база знаний (хаб + статья).
- [16-brand-pages.md](16-brand-pages.md) — бренд-страницы.

## Семантика и контент
- [06-semantic-core.md](06-semantic-core.md) — рабочее семантическое ядро.
- [09-content-guidelines.md](09-content-guidelines.md) — стандарт копирайта (AEO).
- [14-content-production-plan.md](14-content-production-plan.md) — план производства контента.

## Техника SEO/AEO
- [07-schema-org.md](07-schema-org.md) — JSON-LD разметка по типам страниц.
- [13-technical-seo.md](13-technical-seo.md) — техническое SEO.
- [10-internal-linking.md](10-internal-linking.md) — перелинковка.

## Доверие, локальное, конверсия
- [08-eeat-trust.md](08-eeat-trust.md) — E-E-A-T и доверие.
- [15-local-seo.md](15-local-seo.md) — локальное SEO (Москва + МО).
- [11-conversion-cro.md](11-conversion-cro.md) — конверсия / CRO.

## Измерение и приёмка
- [12-measurement-analytics.md](12-measurement-analytics.md) — аналитика и метрики.
- [17-quality-control.md](17-quality-control.md) — контроль качества, приёмочные gate'ы.

## Операционный реестр и управление
- [18-implementation-matrix.md](18-implementation-matrix.md) — матрица реализации: URL → шаблон → кластер → приоритет → CTA → schema → источник → статус.
- [skills-architecture.md](skills-architecture.md) — архитектура скилов: кто кем управляет, конвейер страницы, порядок создания скилов, правило владения ценой.

---

## Внешние зависимости пакета
Документы 00–18 ссылаются на файлы вне папки `seo/`. Для самодостаточности пакета они должны быть доступны:
- [`../seo-architecture.md`](../seo-architecture.md) — обзорная карта (есть в репо).
- [`../figma-quality-rules.md`](../figma-quality-rules.md) — стандарт «1-в-1 по Figma» (есть в репо).
- [`../fact-checking.md`](../fact-checking.md) — проверка фактов и risky-claims (есть в репо).
- `proof-loop-routing.md` — процесс усиленной проверки. Живёт в правилах Claude Code (`.claude/rules/proof-loop-routing.md`), не в этом репо; для процесса см. также `17-quality-control.md` «Когда нужен proof loop».

---

**Как пользоваться:** берёте страницу в матрице (18) → открываете её шаблон
(02–05, 16) → сверяете с семантикой (06) и копирайт-правилами (09) → добавляете
разметку (07) и перелинковку (10) → проверяете факты (`../fact-checking.md`) →
проходите 6 gate'ов (17) перед «готово».
