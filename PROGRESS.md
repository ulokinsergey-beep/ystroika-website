# PROGRESS.md — У-Стройка Website

> Источник правды о текущем состоянии разработки.
> Обновляется вручную или через `ystroika-orchestrator`.

---

## Последнее обновление: 2026-05-24 (сессия 2)

---

## Фаза 1 — MVP (в работе)

### Инфраструктура
- [x] Инициализация Astro 5 проекта
- [x] Tailwind CSS 4 via @tailwindcss/vite
- [x] BaseLayout с SEO meta тегами, OG
- [x] `<slot name="head" />` для JSON-LD в BaseLayout ← добавлен 2026-05-24
- [x] Header (навигация, телефон 8-800-333-94-95, mobile menu)
- [x] Footer (контакты, ссылки, бренды)
- [x] `favicon.svg` — базовая иконка с буквой «У» в orange-500 ← добавлен 2026-05-24
- [x] `robots.txt` — базовый с ссылкой на sitemap ← добавлен 2026-05-24
- [x] `@astrojs/sitemap` → `sitemap-index.xml` + `sitemap-0.xml` генерируются автоматически ← добавлен 2026-05-24
- [x] `.gitattributes` — нормализация LF ← добавлен 2026-05-24
- [ ] CI/CD GitHub Actions → Timeweb

### Страницы
- [x] `index.astro` — 8 секций (Hero, Trust, Каталог, Как работаем, Преимущества, Бренды, Отзывы, CTA) ← **нужна сверка с Figma**
- [x] `catalog/index.astro` — Каталог с BreadcrumbList и CTA-блоком ← **нужна сверка с Figma**
- [x] `catalog/[category].astro` — Страница раздела ← **нужна сверка с Figma**
- [ ] `tovar/[slug].astro` — Карточка товара (не начата)

### SEO / JSON-LD
- [x] JSON-LD Organization + LocalBusiness + WebSite на `index.astro` ← добавлен 2026-05-24
- [x] JSON-LD CollectionPage + BreadcrumbList на `catalog/index.astro` ← добавлен 2026-05-24
- [x] JSON-LD CollectionPage + BreadcrumbList на `catalog/[category].astro` ← добавлен 2026-05-24
- [ ] JSON-LD Product + Offer на `tovar/[slug].astro`
- [x] Sitemap.xml ← @astrojs/sitemap, 2026-05-24
- [x] Robots.txt ← 2026-05-24

### Данные
- [x] `src/data/categories.ts` — 8 разделов каталога
- [ ] KrovAlians API интеграция (цены/наличие)

---

## Фаза 2 — Контент и конверсия

- [ ] Страницы услуг (7 услуг из Bitrix IBLOCK 29)
- [ ] Блог/Статьи (92 из IBLOCK 11)
- [ ] Отзывы (107 из IBLOCK 13)
- [ ] FAQ (6 из IBLOCK 12)
- [ ] Форма обратной связи + WhatsApp кнопка

---

## Фаза 3 — SEO и фильтры

- [ ] Фильтрация товаров (цвет, покрытие, бренд)
- [ ] Акции, Бренды, Сравнение товаров

---

## Известные проблемы

| Проблема | Приоритет | Статус |
|---------|-----------|--------|
| `index.astro` не соответствует Figma-макету | 🔥 Высокий | В работе |
| Нет JSON-LD ни на одной странице | 🔥 Высокий | Не начато |
| Нет favicon | Средний | Не начато |
| Нет CI/CD пайплайна | Средний | Не начато |
| `CategoryCard` использует emoji-иконки, не SVG | Низкий | Не начато |

---

## Ссылки

- **Репо:** https://github.com/ulokinsergey-beep/ystroika-website
- **Figma:** https://www.figma.com/design/fpkm2jePqLSf1oKAmGmyA3/Дизайн-У-Стройка
- **Bitrix аудит:** `C:\Users\User\.claude\projects\ystroika-website\bitrix-backup-audit.md`
- **Контекст проекта:** `C:\Users\User\.claude\skills\ystroika-context\SKILL.md`
