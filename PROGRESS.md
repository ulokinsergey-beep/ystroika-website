# PROGRESS.md — У-Стройка Website

> Источник правды о текущем состоянии разработки.

---

## Последнее обновление: 2026-06-07 (сессия 4)

### Сессия 4 — Figma-аудит главной + рабочий квиз
- **Подключение к Figma решено навсегда:** читаем десктоп Dev Mode MCP напрямо через `scripts/figma_read.py` (без перезапусков Claude). Метод в `docs/figma-desktop-handoff.md`.
- **Аудит главной завершён** → `docs/figma-audit.md` (все 13 экранов + футер, с приоритетами).
- **Квиз пересобран** как интерактивный компонент `src/components/Quiz.astro` (9 вопросов 1-в-1 Figma, навигация, прогресс, пазл, попап-благодарность; отправка — заглушка, как у др. форм). Ждут правки пользователя.
- **Правки главной:** A1 (порядок карточек экрана 4), A5 (баннер «о компании» зеркально по Figma), S1 (токены success/danger в global.css). Коммит `e7611cc`.
- **Осталось:** S3 — заменить фото-заглушки реальными из Figma (экраны 7,8,10,11,12); A8 — детальная сверка футера; аудит страниц каталог/товар/о-компании/контакты.

---

## Фаза 1 — MVP (в работе)

### Инфраструктура
- [x] Astro 5 + Tailwind CSS 4 (@tailwindcss/vite)
- [x] BaseLayout: SEO, OG, `<slot name="head" />` для JSON-LD
- [x] FormSuccessToast — глобальный компонент для форм (показывает успех)
- [x] Header: top bar + строка поиска + logo + "Получить счёт" + мобильное меню ← обновлён 2026-05-24
- [x] Footer: каталог, информация, бренды, телефон
- [x] `favicon.svg` — иконка с «У» в brand-цвете
- [x] `robots.txt` + `sitemap-index.xml` (через @astrojs/sitemap)
- [x] `.gitattributes` — LF нормализация
- [x] `.github/workflows/deploy.yml` — CI/CD → Timeweb FTP
- [ ] GitHub Secrets для CI/CD (настраивает Сергей вручную)

### Дизайн-токены
- [x] `global.css` — `@theme` с `--color-brand: #FFAE01` (из Figma)
- [x] Все `orange-*` заменены на `brand`/`brand-hover` во всех файлах
- [x] Figma file ID исправлен в SKILL.md: `oDJHXHAXqP0DDMM988Dian`
- [x] Node IDs всех экранов сохранены в `figma-tokens.json`

### Страницы (текущее состояние: 33 страницы)
- [x] `/` — Hero 2-колонки + форма-калькулятор + Trust + Каталог + Как работаем + Преимущества + Бренды + Отзывы + CTA ← обновлён 2026-05-24
- [x] `/catalog/` — Каталог с BreadcrumbList, JSON-LD CollectionPage
- [x] `/catalog/[category]/` — 8 страниц разделов
- [x] `/catalog/[category]/[subcategory]/` — 18 страниц подразделов ← создан 2026-05-24
- [x] `/raschet/` — Форма получения счёта ← создан 2026-05-24
- [x] `/kontakty/` — Контакты + форма обратной связи ← создан 2026-05-24
- [x] `/o-kompanii/` — О компании + статистика + бренды ← создан 2026-05-24
- [x] `/404` — Страница 404 ← создан 2026-05-24
- [x] `/politika-konfidentsialnosti/` — Политика конфиденциальности ← создан 2026-05-24
- [ ] `/tovar/[slug]/` — Карточка товара (нужна API интеграция)
- [ ] `/otzyvy/` — Страница отзывов (нужна выгрузка из Bitrix)
- [ ] `/montazh/` — Страница монтажа
- [ ] `/spetspredlozheniya/` — Спецпредложения

### Компоненты
- [x] `CategoryCard` — SVG-иконки по категориям, без emoji ← обновлён 2026-05-24
- [x] `Header` — поиск, лого с подписью, "Получить счёт", nav-bar ← обновлён 2026-05-24
- [x] `FormSuccessToast` — toast при успешной отправке формы ← создан 2026-05-24

### SEO / JSON-LD
- [x] JSON-LD Organization + LocalBusiness + WebSite → `index.astro`
- [x] JSON-LD CollectionPage + BreadcrumbList → `catalog/index.astro`
- [x] JSON-LD CollectionPage + BreadcrumbList → `catalog/[category].astro`
- [x] JSON-LD CollectionPage + BreadcrumbList → `catalog/[category]/[subcategory].astro`
- [ ] JSON-LD Product + Offer → `tovar/[slug].astro`

---

## Фаза 2 — Контент и данные

### KrovAlians API
- [ ] Восстановить пароль (nuziL681) — проверить доступ
- [ ] Загрузить каталог (POST /katalog?katalog=full)
- [ ] Загрузить цены (POST /price)
- [ ] Показывать цены на карточке товара

### Bitrix данные
- [ ] Экспортировать услуги (7 из IBLOCK 29) → страницы /uslugi/
- [ ] Экспортировать статьи (92 из IBLOCK 11) → блог /blog/
- [ ] Экспортировать отзывы (107 из IBLOCK 13) → /otzyvy/
- [ ] Экспортировать FAQ (6 из IBLOCK 12) → /faq/

---

## Фаза 3 — SEO и фильтры

- [ ] Карточка товара /tovar/[slug]/ с ценой из API
- [ ] Фильтрация товаров (цвет, покрытие, бренд)
- [ ] Акции, Бренды, Сравнение товаров

---

## GitHub Secrets (нужно настроить вручную)

Добавить в репозиторий → Settings → Secrets → Actions:
- `TIMEWEB_FTP_SERVER` — адрес FTP сервера Timeweb
- `TIMEWEB_FTP_USER` — FTP логин
- `TIMEWEB_FTP_PASSWORD` — FTP пароль

---

## Ссылки

- **Репо:** https://github.com/ulokinsergey-beep/ystroika-website
- **Figma (рабочий):** https://www.figma.com/design/oDJHXHAXqP0DDMM988Dian/Дизайн-У-Стройка-(Оригинал)
- **Figma node IDs:** `C:\Users\User\.claude\projects\ystroika-website\figma-tokens.json`
- **Bitrix аудит:** `C:\Users\User\.claude\projects\ystroika-website\bitrix-backup-audit.md`
