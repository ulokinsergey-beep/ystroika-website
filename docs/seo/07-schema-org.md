# Детальная спека: SCHEMA.ORG / JSON-LD (структурированные данные)

> Единый реестр разметки: какой тип на какой странице, обязательные свойства,
> где живёт код, как валидировать. Усиливает rich-сниппеты (Яндекс/Google) и
> AEO/GAIO (машинопонимание сущностей). Обзор — `seo-architecture.md` §8.
> Формат — **JSON-LD** в `<head>` или конце `<body>`. Реализация в Astro —
> переиспользуемые компоненты `src/components/schema/*`.

---

## 0. Принципы
- Разметка описывает **только реально видимый на странице** контент (иначе риск санкций).
- Один источник истины: данные из контент-коллекций/`.md`, не хардкод в JSON.
- Не выдумывать рейтинги/цены/отзывы. `AggregateRating` — только при реальных отзывах.
- Каждая страница: минимум `WebPage` + `BreadcrumbList`; сайт целиком — `Organization` + `WebSite`.

---

## 1. Глобально (на всех страницах, в Layout)

### Organization (или LocalBusiness — см. `15-local-seo.md`)
Обязательно: `name`, `url`, `logo`, `telephone`, `address` (PostalAddress), `sameAs` (соцсети). Доп.: `email`, `openingHours`, `areaServed` (Москва + МО).

### WebSite
`name`, `url`, `potentialAction` → SearchAction (поиск по сайту), `inLanguage: ru`.

### BreadcrumbList
На каждой вложенной странице: `itemListElement` (position, name, item-URL).

---

## 2. Матрица «страница → типы разметки»

| Страница | Обязательные типы | Доп. при наличии данных |
|---|---|---|
| Главная | Organization, WebSite, WebPage | LocalBusiness, AggregateRating |
| Раздел каталога | WebPage, BreadcrumbList, ItemList | — |
| Листинг подкатегории | WebPage, BreadcrumbList, ItemList | Product/Offer (на карточках) |
| Карточка товара | **Product**, **Offer**, BreadcrumbList | Brand, AggregateRating, Review |
| Страница услуги | **Service**, BreadcrumbList | HowTo, Offer, FAQPage, AggregateRating |
| Калькулятор | WebPage, BreadcrumbList | HowTo, SoftwareApplication (опц.) |
| Статья базы знаний | **Article**, BreadcrumbList | HowTo, FAQPage, Person(author) |
| Бренд-страница | WebPage, BreadcrumbList | Brand, Organization(sameAs), FAQPage |
| Гео-страница | WebPage, BreadcrumbList | LocalBusiness, Service, areaServed |
| Контакты | LocalBusiness, BreadcrumbList | OpeningHoursSpecification, GeoCoordinates |
| О компании | Organization, AboutPage, BreadcrumbList | — |
| Отзывы | WebPage, BreadcrumbList | Review[], AggregateRating |
| FAQ-страница | FAQPage, BreadcrumbList | — |

---

## 3. Ключевые типы — обязательные свойства

### Product (карточка товара)
`name`, `image`, `description`, `sku`/`mpn`, `brand` (Brand.name), `offers` (Offer).
**Offer:** `price` (или `priceSpecification`), `priceCurrency: RUB`, `availability` (InStock/PreOrder), `url`, `seller` (Organization).
> Пока цены/наличие из КровАльянс API не подключены — `availability` и `price` подаются как «по запросу»/«от» осторожно; не публиковать ложную цену (см. `seo-architecture.md` A3).

### Service (страница услуги)
`name`, `serviceType`, `provider` (Organization), `areaServed` (Москва+МО), `description`.
Доп.: `offers` (Offer с «от X ₽/м²»), `hasOfferCatalog`.

### Article (статья)
`headline`, `author` (Person + name), `datePublished`, `dateModified`, `image`, `publisher` (Organization+logo), `mainEntityOfPage`.

### HowTo (услуга-шаги / «как рассчитать»)
`name`, `step[]` (HowToStep: name, text, опц. image). Соответствует видимому списку шагов.

### FAQPage (FAQ-блоки)
`mainEntity[]` (Question → acceptedAnswer Answer). Только реальные Q&A со страницы.

### AggregateRating / Review
`ratingValue`, `reviewCount`/`bestRating`. **Только при реальных отзывах** (107 отзывов, IBLOCK 13). Review: `author`, `reviewBody`, `reviewRating`.

### LocalBusiness (контакты/гео)
`name`, `address`, `telephone`, `geo` (GeoCoordinates), `openingHoursSpecification`, `areaServed`, `priceRange`.

---

## 3.1. Примеры JSON-LD (эталоны для разработчика)
> Подставлять реальные данные; не публиковать выдуманные цены/рейтинги.

**LocalBusiness (глобально / контакты):**
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "У-Стройка",
  "url": "https://ystroika.ru/",
  "telephone": "+7-800-333-94-95",
  "image": "https://ystroika.ru/og/logo.png",
  "address": {"@type": "PostalAddress", "addressLocality": "Москва", "addressRegion": "Московская область", "addressCountry": "RU"},
  "areaServed": ["Москва", "Московская область"],
  "openingHoursSpecification": [{"@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday"], "opens": "09:00", "closes": "19:00"}],
  "sameAs": ["https://yandex.ru/maps/org/...", "https://2gis.ru/..."]
}
```

**Service (страница услуги):**
```json
{
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Монтаж кровли под ключ",
  "serviceType": "Кровельные работы",
  "provider": {"@type": "Organization", "name": "У-Стройка"},
  "areaServed": ["Москва", "Московская область"],
  "offers": {"@type": "Offer", "price": "300", "priceCurrency": "RUB", "description": "от 300 ₽/м²"}
}
```

**Product + Offer (карточка товара):**
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Металлочерепица Монтеррей",
  "image": "https://ystroika.ru/img/monterrey.jpg",
  "brand": {"@type": "Brand", "name": "Grand Line"},
  "sku": "MC-MONT-8017",
  "offers": {"@type": "Offer", "priceCurrency": "RUB", "price": "650", "availability": "https://schema.org/InStock", "url": "https://ystroika.ru/catalog/krovlya/metallocherepica/monterrey/", "seller": {"@type": "Organization", "name": "У-Стройка"}}
}
```

**Article + FAQPage (статья базы знаний):**
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Металлочерепица или гибкая черепица: что выбрать",
  "author": {"@type": "Person", "name": "Имя Эксперта"},
  "datePublished": "2026-06-01",
  "dateModified": "2026-06-09",
  "publisher": {"@type": "Organization", "name": "У-Стройка", "logo": {"@type": "ImageObject", "url": "https://ystroika.ru/og/logo.png"}}
}
```
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{"@type": "Question", "name": "Что дешевле — металлочерепица или гибкая?", "acceptedAnswer": {"@type": "Answer", "text": "Прямой ответ 40–60 слов..."}}]
}
```

## 4. Реализация в Astro
- Компоненты-обёртки: `src/components/schema/Organization.astro`, `Breadcrumbs.astro`, `ServiceSchema.astro`, `ArticleSchema.astro`, `FaqSchema.astro`, `ProductSchema.astro`.
- Вход — типизированные props из контент-коллекций; вывод — `<script type="application/ld+json" set:html={JSON.stringify(data)} />`.
- BreadcrumbList генерится из текущего пути централизованно.
- Не дублировать один тип дважды на странице.

---

## 5. Валидация (gate перед публикацией)
1. **Google Rich Results Test** — каждый шаблон страницы (по одному образцу типа).
2. **Schema.org Validator** / **Яндекс.Вебмастер → Проверка микроразметки**.
3. Нет ошибок/критичных предупреждений; все required-свойства заполнены.
4. Разметка соответствует видимому контенту (ручная сверка).

---

## Чек-лист готовности разметки
- [ ] Глобально: Organization + WebSite + BreadcrumbList на всех страницах.
- [ ] Каждый тип страницы покрыт по матрице §2.
- [ ] Product/Offer на карточках; Service на услугах; Article на статьях; FAQPage на FAQ.
- [ ] AggregateRating/Review — только при реальных отзывах.
- [ ] Цены/наличие не выдуманы (согласовано с состоянием API).
- [ ] Все шаблоны прошли Rich Results Test + Яндекс.Вебмастер без ошибок.
- [ ] JSON-LD генерится из данных, не хардкод; нет дублей типов.
