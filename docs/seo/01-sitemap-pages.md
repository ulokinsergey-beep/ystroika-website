# Детальная спека: КАРТА САЙТА И URL-СТРУКТУРА

> Полный реестр страниц: URL, тип шаблона, приоритет, источник данных, разметка.
> Единый источник для sitemap.xml, навигации и getStaticPaths. Обзор —
> `seo-architecture.md` §1. Типы шаблонов детально — файлы 02–08, 16.
> Принципы ЧПУ/индексации — `13-technical-seo.md`.

---

## 0. Правила URL (ЧПУ)
- Латиница, транслит, нижний регистр, дефисы; без подчёркиваний, параметров, дат.
- Слеш в конце — единообразно по сайту (выбрать один вариант + редирект).
- Иерархия = вложенность: `/catalog/{razdel}/{podkat}/{tovar}/`.
- Один кластер = один URL (`06-semantic-core.md`); не плодить дубли.

---

## 1. Верхний уровень

| URL | Тип шаблона | Приор. | Источник | Разметка |
|---|---|---|---|---|
| `/` | Главная (`02`) | P1 | Figma + контент | Organization, WebSite, WebPage |
| `/catalog/` | Корень каталога | P1 | каталог (Excel/API) | ItemList, Breadcrumb |
| `/uslugi/` | Хаб услуг | P1 | IBLOCK 29 / контент | ItemList, Breadcrumb |
| `/servisy/` | Хаб калькуляторов | P2 | контент | ItemList, Breadcrumb |
| `/baza-znaniy/` | Хаб базы знаний (`05`) | P2 | IBLOCK 11/12 + новый | ItemList, Breadcrumb |
| `/brands/` | Хаб брендов (`16`) | P2 | IBLOCK 07 | ItemList, Breadcrumb |
| `/proekty/` | Кейсы/портфолио | P2 | IBLOCK 10 | ItemList, Breadcrumb |
| `/otzyvy/` | Отзывы | P2 | IBLOCK 13 | Review, AggregateRating |
| `/o-kompanii/` | О компании | P2 | IBLOCK 25 | AboutPage, Organization |
| `/kontakty/` | Контакты | P1 | IBLOCK 14 | LocalBusiness |
| `/dostavka/` | Доставка | P2 | контент | WebPage |
| `/oplata/` | Оплата | P3 | контент | WebPage |
| `/garantii/` | Гарантии | P2 | контент | WebPage |
| `/sertifikaty/` | Сертификаты | P3 | документы | WebPage |
| `/komanda/` | Команда | P3 | контент | Person[] |
| `/vakansii/` | Вакансии | P3 | IBLOCK 09 | JobPosting |
| `/spets-usloviya/` | Спецусловия для подрядчиков (B2B) | P2 | контент | WebPage, Offer(B2B) |
| `/spetspredlozheniya/` | Акции и спецпредложения | P2 | контент/каталог | WebPage, ItemList |
| `/voprosy-otvety/` | FAQ-хаб (вопросы и ответы) | P2 | IBLOCK 12 + новый | FAQPage, Breadcrumb |
| `/politika-konfidencialnosti/` | Политика ПД | — | юр-текст | WebPage (noindex опц.) |

> `/spets-usloviya/`, `/spetspredlozheniya/`, `/voprosy-otvety/` — целевые URL для CTA с главной (`02-homepage.md` блоки 2, 8, 9). Должны существовать, иначе 404.

---

## 2. Каталог (`/catalog/...`)

```
/catalog/
  /catalog/krovlya/                         ← раздел (хаб подкат.)        P1
    /catalog/krovlya/metallocherepica/      ← листинг подкатегории       P1
    /catalog/krovlya/gibkaya-cherepica/                                  P1
    /catalog/krovlya/profnastil/                                         P1
    /catalog/krovlya/falcevaya/                                          P2
    /catalog/krovlya/ondulin/                                           P2
    /catalog/krovlya/kompozitnaya-cherepica/                            P3
      .../{tovar}/                          ← карточка товара (из API)   P1
  /catalog/fasad/                                                        P1
    /catalog/fasad/sajding-vinilovyj/                                    P1
    /catalog/fasad/metallosajding/                                       P2
    /catalog/fasad/fasadnye-paneli/                                      P2
    /catalog/fasad/sofity/                                               P2
  /catalog/vodostok/                        ← раздел/листинг             P1
  /catalog/dobornye-elementy/                                            P2
  /catalog/snegozaderzhateli/                                            P2
  /catalog/izolyaciya/        (гидро/паро/утеплитель)                    P2
  /catalog/krepezh/                                                     P3
  /catalog/mansardnye-okna/                                            P3
```
> Финальный список подкатегорий и товаров — по реальному каталогу (Excel 1762 строк) и КровАльянс API. Тонкие/пустые категории не публиковать.

**Шаблоны:** раздел и листинг — `04-category-listing.md`; карточка товара — отдельный шаблон (Product/Offer).

---

## 3. Услуги (`/uslugi/...`) — шаблон `03`

```
/uslugi/montazh-krovli/          P1
/uslugi/montazh-fasada/          P1
/uslugi/montazh-vodostoka/       P1
/uslugi/podshiv-svesov/          P2
/uslugi/montazh-stropilnoj-sistemy/  P2
/uslugi/dostavka/                P2
```
(6 услуг — уже сверстаны по Figma; шаблон data-driven `src/content/services/*.md`.)

---

## 4. Сервисы-калькуляторы (`/servisy/...`)

```
/servisy/raschet-krovli/
/servisy/raschet-metallocherepicy/
/servisy/raschet-profnastila/
/servisy/raschet-sajdinga/
/servisy/raschet-vodostoka/
/servisy/raschet-uteplitelya/
/servisy/raschet-dobornyh/
```
(7 калькуляторов — `src/data/calculators.ts`, шаблон `servisy/[slug].astro`.) Разметка: WebPage + HowTo. Каждый → перелинковка в листинг + услугу.

---

## 5. Бренды (`/brands/...`) — шаблон `16`
`/brands/{slug}/` по дилерским брендам в наличии (Grand Line, Döcke, Технониколь, Металл Профиль…). Источник — IBLOCK 07. Приор. P2.

---

## 6. База знаний (`/baza-znaniy/...`) — шаблон `05`
`/baza-znaniy/{slug}/` — статьи/гайды/сравнения по сем-ядру (`06`). Источник: IBLOCK 11 (реальные статьи) + новый контент. Lorem-черновики НЕ публиковать. Приор. P2–P3.

---

## 7. Гео-страницы (Local SEO) — см. `15-local-seo.md`
**Единый паттерн: `/geo/{gorod}/`** (один на город). Материалы/услуги — блоками ВНУТРИ гео-страницы, чтобы не плодить тонкие дубли вида `/{material}-{gorod}/`. По маске сем-ядра §7. Только уникальные. Приор. P2.

---

## 8. Служебные / тех-страницы
- `/sitemap.xml`, `/robots.txt` — генерируются (`13-technical-seo.md`).
- `/404` — кастомная страница 404.
- `/poisk/` — результаты поиска (noindex).

---

## 9. Приоритеты публикации (волнами)
1. **Волна 1 (P1):** главная, услуги (готовы), разделы кровля/фасад/водосток + топ-листинги (металлочерепица, гибкая, профнастил, сайдинг), контакты.
2. **Волна 2 (P2):** остальные листинги, калькуляторы, бренды, проекты, отзывы, база знаний (сравнения/гайды), гео.
3. **Волна 3 (P3):** доборные/крепёж/окна, trust-страницы добивка, НЧ-статьи.

---

## Чек-лист готовности карты сайта
- [ ] Все URL по правилам ЧПУ; единый трейлинг-слеш.
- [ ] Каждый URL привязан к шаблону, приоритету, источнику, разметке.
- [ ] Нет дублей кластеров (свер. с `06-semantic-core.md`).
- [ ] sitemap.xml включает индексируемые страницы, исключает noindex.
- [ ] Тонкие/пустые категории и lorem-черновики не опубликованы.
- [ ] Навигация (меню/футер/крошки) соответствует карте.
