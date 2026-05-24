# PROGRESS.md — У-Стройка Website

> Источник правды о текущем состоянии разработки.
> Обновляется вручную или через `ystroika-orchestrator`.

---

## Последнее обновление: 2026-05-24

---

## Фаза 1 — MVP (в работе)

### Инфраструктура
- [x] Инициализация Astro 5 проекта
- [x] Tailwind CSS 4 via @tailwindcss/vite
- [x] BaseLayout с SEO meta тегами, OG
- [x] `<slot name="head" />` для JSON-LD в BaseLayout ← добавлен 2026-05-24
- [x] Header (навигация, телефон 8-800-333-94-95, mobile menu)
- [x] Footer (контакты, ссылки, бренды)
- [ ] Favicon (нет `favicon.svg` / `favicon.ico`)
- [ ] CI/CD GitHub Actions → Timeweb

### Страницы
- [ ] `index.astro` — Главная страница (есть заготовка, **не из Figma**)
- [ ] `catalog/index.astro` — Каталог (есть заготовка, минимальный)
- [ ] `catalog/[category].astro` — Страница раздела (есть заготовка)
- [ ] `tovar/[slug].astro` — Карточка товара (не начата)

### SEO / JSON-LD
- [ ] JSON-LD Organization + LocalBusiness на `index.astro`
- [ ] JSON-LD BreadcrumbList + ItemList на `catalog/[category].astro`
- [ ] JSON-LD Product + Offer на `tovar/[slug].astro`
- [ ] Sitemap.xml
- [ ] Robots.txt

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
