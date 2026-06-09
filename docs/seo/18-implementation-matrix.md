# Матрица реализации (operational registry)

> Один экран для разработчика/агента: что строить, по какому шаблону, с какой
> разметкой, откуда данные, в каком статусе. Сводит `01` (URL), `06` (кластер),
> `03/04/05/16` (шаблоны), `07` (schema), `11` (CTA). При расхождении источник
> истины — профильный документ. Статус обновлять по `17-quality-control.md`.

**Легенда статуса:** `план` · `в работе` · `готов` (= PASS все 6 gate'ов G1–G6).
**Приоритет:** P1 деньги сейчас · P2 прогрев · P3 добивка (волны — `01` §9).

---

## Коммерческое ядро (P1 — волна 1)

| URL | Тип | Шаблон | Кластер (06) | Приор. | CTA (11) | Schema (07) | Источник | Статус |
|---|---|---|---|---|---|---|---|---|
| `/` | Главная | 02 | главная ВЧ | P1 | Получить расчёт | Organization, WebSite, FAQPage | Figma+контент | в работе |
| `/catalog/krovlya/` | Раздел | 04A | кровля (ВЧ) | P1 | Подобрать материал | ItemList, Breadcrumb | каталог | план |
| `/catalog/krovlya/metallocherepica/` | Листинг | 04B | металлочерепица | P1 | Цена и наличие | ItemList, Product/Offer | каталог+API | план |
| `/catalog/krovlya/gibkaya-cherepica/` | Листинг | 04B | гибкая черепица | P1 | Цена и наличие | ItemList, Product/Offer | каталог+API | план |
| `/catalog/krovlya/profnastil/` | Листинг | 04B | профнастил | P1 | Цена и наличие | ItemList, Product/Offer | каталог+API | план |
| `/catalog/fasad/` | Раздел | 04A | фасад (ВЧ) | P1 | Подобрать материал | ItemList, Breadcrumb | каталог | план |
| `/catalog/fasad/sajding-vinilovyj/` | Листинг | 04B | сайдинг виниловый | P1 | Цена и наличие | ItemList, Product/Offer | каталог+API | план |
| `/catalog/vodostok/` | Листинг | 04B | водосток | P1 | Цена и наличие | ItemList, Product/Offer | каталог+API | план |
| `/uslugi/montazh-krovli/` | Услуга | 03 | монтаж кровли | P1 | Получить расчёт работ | Service, HowTo, FAQPage, Offer | IBLOCK 29 | готов* |
| `/uslugi/montazh-fasada/` | Услуга | 03 | монтаж фасада | P1 | Получить расчёт работ | Service, HowTo, FAQPage, Offer | IBLOCK 29 | готов* |
| `/uslugi/montazh-vodostoka/` | Услуга | 03 | монтаж водостока | P1 | Получить расчёт работ | Service, HowTo, FAQPage | IBLOCK 29 | готов* |
| `/kontakty/` | Контакты | — | гео/контакт | P1 | Позвонить/WhatsApp | LocalBusiness | IBLOCK 14 | в работе |

\* услуги свёрстаны по Figma; фото работ для части услуг ещё заменить (см. roadmap).

## Коммерция и сервисы (P2)

| URL | Тип | Шаблон | Кластер | Приор. | CTA | Schema | Источник | Статус |
|---|---|---|---|---|---|---|---|---|
| `/catalog/krovlya/falcevaya/` · `/ondulin/` | Листинг | 04B | фальц/ондулин | P2 | Цена и наличие | ItemList, Product | каталог | план |
| `/catalog/fasad/metallosajding/` · `/fasadnye-paneli/` · `/sofity/` | Листинг | 04B | фасад-подкат. | P2 | Цена и наличие | ItemList, Product | каталог | план |
| `/catalog/dobornye-elementy/` · `/snegozaderzhateli/` · `/izolyaciya/` | Листинг | 04B | доборные/изоляция | P2 | Цена и наличие | ItemList, Product | каталог | план |
| `/uslugi/podshiv-svesov/` · `/montazh-stropilnoj-sistemy/` · `/dostavka/` | Услуга | 03 | услуги-доп | P2 | Расчёт работ | Service | IBLOCK 29 | план |
| `/servisy/raschet-*` (7 калькуляторов) | Калькулятор | — | расчёт-{материал} | P2 | Рассчитать | WebPage, HowTo | calculators.ts | готов |
| `/brands/{slug}/` | Бренд | 16 | {бренд} | P2 | Подбор | Brand, FAQPage, Breadcrumb | IBLOCK 07 | план |
| `/baza-znaniy/` + `/baza-znaniy/{slug}/` | База знаний | 05 | I/S/Q-кластеры | P2 | Расчёт/каталог | Article, FAQPage, HowTo | IBLOCK 11 + новый | в работе |
| `/geo/{gorod}/` | Гео | — (15) | гео-маска | P2 | Доставка в город | LocalBusiness, Service | IBLOCK 14 | план |
| `/spets-usloviya/` | B2B | — | спецусловия | P2 | Заявка подрядчика | WebPage, Offer | контент | план |
| `/spetspredlozheniya/` | Акции | — | акции | P2 | Смотреть акции | WebPage, ItemList | каталог/контент | план |
| `/voprosy-otvety/` | FAQ-хаб | — | вопросные | P2 | Задать вопрос | FAQPage | IBLOCK 12 + новый | план |

## Доверие и служебные (P2–P3)

| URL | Тип | Приор. | Schema | Источник | Статус |
|---|---|---|---|---|---|
| `/proekty/` · `/otzyvy/` · `/o-kompanii/` | Trust | P2 | ItemList / Review+AggregateRating / AboutPage | IBLOCK 10/13/25 | план |
| `/dostavka/` · `/oplata/` · `/garantii/` · `/sertifikaty/` | Trust | P2–P3 | WebPage | контент/документы | план |
| `/komanda/` · `/vakansii/` | Trust | P3 | Person / JobPosting | контент / IBLOCK 09 | план |
| `/politika-konfidencialnosti/` · `/404` · `/poisk/` | Служебные | — | WebPage / — | юр/система | план |

---

## Как пользоваться матрицей
1. Берёте строку → открываете её шаблон (03/04/05/16) + `06` (кластер) + `07` (schema) + `11` (CTA).
2. Верстаете/наполняете 1-в-1 по Figma (`figma-quality-rules.md`), факты — через `fact-checking.md`.
3. Прогоняете 6 gate'ов `17-quality-control.md`, обновляете «Статус».
4. Статус «готов» = PASS по всем gate'ам и проверено ведущим перед показом владельцу.
