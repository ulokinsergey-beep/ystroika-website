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
| `/uslugi/montazh-krovli/` | Услуга | 03 | монтаж кровли | P1 | Получить расчёт работ | Service, HowTo, FAQPage, Offer | IBLOCK 29 | готов к проверке |
| `/uslugi/montazh-fasada/` | Услуга | 03 | монтаж фасада | P1 | Получить расчёт работ | Service, HowTo, FAQPage, Offer | IBLOCK 29 | готов к проверке |
| `/uslugi/montazh-vodostoka/` | Услуга | 03 | монтаж водостока | P1 | Получить расчёт работ | Service, HowTo, FAQPage | IBLOCK 29 | готов к проверке |
| `/kontakty/` | Контакты | — | гео/контакт | P1 | Позвонить/WhatsApp | LocalBusiness | IBLOCK 14 | в работе |

> «готов к проверке» = свёрстано (услуги/калькуляторы по Figma, владельцем визуально одобрено),
> но формальную приёмку по `17-quality-control.md` ещё НЕ прошло (визуал-дифф 375/1280/1920,
> JSON-LD, CWV, a11y; для части услуг ещё заменить фото работ — см. roadmap). Перевести в «готов»
> только после PASS по всем 6 gate'ам.

## Коммерция и сервисы (P2)

| URL | Тип | Шаблон | Кластер | Приор. | CTA | Schema | Источник | Статус |
|---|---|---|---|---|---|---|---|---|
| `/catalog/krovlya/falcevaya/` | Листинг | 04B | фальцевая | P2 | Цена и наличие | ItemList, Product | каталог | план |
| `/catalog/krovlya/ondulin/` | Листинг | 04B | ондулин | P2 | Цена и наличие | ItemList, Product | каталог | план |
| `/catalog/krovlya/kompozitnaya-cherepica/` | Листинг | 04B | композитная | P3 | Цена и наличие | ItemList, Product | каталог | план |
| `/catalog/fasad/metallosajding/` | Листинг | 04B | металлосайдинг | P2 | Цена и наличие | ItemList, Product | каталог | план |
| `/catalog/fasad/fasadnye-paneli/` | Листинг | 04B | фасадные панели | P2 | Цена и наличие | ItemList, Product | каталог | план |
| `/catalog/fasad/sofity/` | Листинг | 04B | софиты | P2 | Цена и наличие | ItemList, Product | каталог | план |
| `/catalog/dobornye-elementy/` | Листинг | 04B | доборные | P2 | Цена и наличие | ItemList, Product | каталог | план |
| `/catalog/snegozaderzhateli/` | Листинг | 04B | снегозадержатели | P2 | Цена и наличие | ItemList, Product | каталог | план |
| `/catalog/izolyaciya/` | Листинг | 04B | гидро/паро/утеплитель | P2 | Цена и наличие | ItemList, Product | каталог | план |
| `/uslugi/podshiv-svesov/` | Услуга | 03 | подшив свесов | P2 | Расчёт работ | Service | IBLOCK 29 | план |
| `/uslugi/montazh-stropilnoj-sistemy/` | Услуга | 03 | стропильная система | P2 | Расчёт работ | Service | IBLOCK 29 | план |
| `/uslugi/dostavka/` | Услуга | 03 | доставка | P2 | Заказать доставку | Service | IBLOCK 29 | план |
| `/servisy/raschet-krovli/` | Калькулятор | — | расчёт кровли | P2 | Рассчитать | WebPage, HowTo | calculators.ts | готов к проверке |
| `/servisy/raschet-metallocherepicy/` | Калькулятор | — | расчёт металлочерепицы | P2 | Рассчитать | WebPage, HowTo | calculators.ts | готов к проверке |
| `/servisy/raschet-profnastila/` | Калькулятор | — | расчёт профнастила | P2 | Рассчитать | WebPage, HowTo | calculators.ts | готов к проверке |
| `/servisy/raschet-sajdinga/` | Калькулятор | — | расчёт сайдинга | P2 | Рассчитать | WebPage, HowTo | calculators.ts | готов к проверке |
| `/servisy/raschet-vodostoka/` | Калькулятор | — | расчёт водостока | P2 | Рассчитать | WebPage, HowTo | calculators.ts | готов к проверке |
| `/servisy/raschet-uteplitelya/` | Калькулятор | — | расчёт утеплителя | P2 | Рассчитать | WebPage, HowTo | calculators.ts | готов к проверке |
| `/servisy/raschet-dobornyh/` | Калькулятор | — | расчёт доборных | P2 | Рассчитать | WebPage, HowTo | calculators.ts | готов к проверке |
| `/brands/{slug}/` | Бренд | 16 | {бренд} | P2 | Подбор | Brand, FAQPage, Breadcrumb | IBLOCK 07 | план |
| `/baza-znaniy/` | Хаб базы знаний | 05A | информационный хаб | P2 | Расчёт/каталог | ItemList, Breadcrumb | IBLOCK 11 + новый | в работе |
| `/baza-znaniy/{slug}/` | Статья | 05B | I/S/Q-кластеры | P2 | Расчёт/каталог | Article, FAQPage, HowTo | IBLOCK 11 + новый | в работе |
| `/geo/{gorod}/` | Гео | — (15) | гео-маска | P2 | Доставка в город | LocalBusiness, Service | IBLOCK 14 | план |
| `/spets-usloviya/` | B2B | — | спецусловия | P2 | Заявка подрядчика | WebPage, Offer | контент | план |
| `/spetspredlozheniya/` | Акции | — | акции | P2 | Смотреть акции | WebPage, ItemList | каталог/контент | план |
| `/voprosy-otvety/` | FAQ-хаб | — | вопросные | P2 | Задать вопрос | FAQPage | IBLOCK 12 + новый | план |

## Доверие и служебные (P2–P3)

| URL | Тип | Приор. | Schema | Источник | Статус |
|---|---|---|---|---|---|
| `/proekty/` | Trust | P2 | ItemList, Breadcrumb | IBLOCK 10 | план |
| `/otzyvy/` | Trust | P2 | Review, AggregateRating | IBLOCK 13 | план |
| `/o-kompanii/` | Trust | P2 | AboutPage, Organization | IBLOCK 25 | план |
| `/dostavka/` | Trust | P2 | WebPage | контент | план |
| `/oplata/` | Trust | P3 | WebPage | контент | план |
| `/garantii/` | Trust | P2 | WebPage | контент/документы | план |
| `/sertifikaty/` | Trust | P3 | WebPage, ImageObject | документы | план |
| `/komanda/` | Trust | P3 | Person | контент | план |
| `/vakansii/` | Trust | P3 | JobPosting | IBLOCK 09 | план |
| `/politika-konfidencialnosti/` | Служебная | — | WebPage | юр-текст | план |
| `/404` | Служебная | — | — | система | план |
| `/poisk/` | Служебная | — | — (noindex) | система | план |

---

## Как пользоваться матрицей
1. Берёте строку → открываете её шаблон (03/04/05/16) + `06` (кластер) + `07` (schema) + `11` (CTA).
2. Верстаете/наполняете 1-в-1 по Figma (`figma-quality-rules.md`), факты — через `fact-checking.md`.
3. Прогоняете 6 gate'ов `17-quality-control.md`, обновляете «Статус».
4. Статус «готов» = PASS по всем gate'ам и проверено ведущим перед показом владельцу.
