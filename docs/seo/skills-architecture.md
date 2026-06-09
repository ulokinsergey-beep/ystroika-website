# Архитектура скилов и управления (агентный запуск сайта)

> Закон о том, КТО кем управляет при реализации пакета `docs/seo` 00–18.
> Источник истины для `ystroika-orchestrator`. Принцип: дирижёр управляет,
> `docs/seo` — закон, рабочие скилы делают, quality-gate имеет право вето,
> и только после PASS страница получает статус «готов».

---

## 1. Четыре слоя

```
1. УПРАВЛЯЮЩИЙ (дирижёр)   ystroika-orchestrator · skill-router · agentic-triage
2. ЗНАНИЯ (закон, SSOT)    ystroika-context + docs/seo 00–18 · figma-quality-rules · fact-checking
3. РАБОЧИЙ (специалисты)   catalog-architect · bitrix-data-extractor · copywriter ·
                          astro-component-builder · figma-to-astro · seo-json-ld-agent ·
                          technical-seo-agent · cro-forms-agent · product-catalog-api ·
                          analytics-setup-agent · local-seo-agent ·
                          internal-linking-agent (lite/full) · semantic-core-builder (lite/full)
4. ПРИЁМКА (ОТК, вето)     page-quality-gate (visual/content/seo/functional/perf-a11y/trust-local) ·
                          proof-loop · fact-checking
```

**Правила слоёв:**
- Рабочие скилы **не вызывают друг друга** — порядок задаёт только дирижёр.
- Слой знаний **никто не переопределяет** — скилы его читают.
- **Только `ystroika-orchestrator` меняет статус в `18-implementation-matrix.md`.** Рабочие скилы возвращают результат и отчёт, статус не трогают.
- `page-quality-gate` имеет **право вето**: нет PASS по 6 gate'ам → статус остаётся «готов к проверке», не «готов».

**Правило статусов (единое, только orchestrator проставляет):**
- `план` — ещё не начато.
- `в работе` — конвейер идёт, не все шаги завершены.
- `готов к проверке` — собрано/свёрстано, но `page-quality-gate` ещё не дал PASS.
- `готов` — **только после PASS по всем 6 gate'ам** и проверки ведущим перед показом владельцу.

**Правило неопределённости (для всех рабочих скилов):**
- Если скил не уверен или данных не хватает — он **НЕ додумывает**. Возвращает `warning` (можно продолжить с оговоркой) или `blocker` (нельзя продолжать без решения) в своём `output contract`.
- Примеры блокеров: нет карты 301 со старого URL; нет реальной цены/наличия; нет подтверждения факта (`fact-checking`); расхождение с Figma. Дирижёр решает, что делать с блокером, — скил не закрывает его молча.

---

## 2. Конвейер одной страницы (финальный)

```
orchestrator
→ triage (риск)
→ router (тип страницы)
→ page work-order из 18-implementation-matrix
→ semantic-core-lite          (кластер/intent/H1/title/desc/ключи/стоп-запросы)
→ catalog-architect           (URL, getStaticPaths по 01)
→ bitrix-data-extractor       (контент из IBLOCK)
→ product-catalog-api         (ЕСЛИ страница товарная/листинг — цена/наличие)
→ copywriter                  (тексты по 09 + gate 05; факты — fact-checking)
→ astro-component-builder / figma-to-astro   (вёрстка 1-в-1)
→ seo-json-ld-agent           (schema по 07)
→ technical-seo-agent         (meta/OG/canonical/в sitemap)
→ analytics-setup-agent       (1) event dictionary — словарь событий
→ cro-forms-agent             (формы/CTA/sticky, вызывает события из словаря)
→ analytics-setup-agent       (2) event validation — события реально ловятся
→ internal-linking-lite       (базовые связи для P1)
→ page-quality-gate           (6 gate'ов → PASS/FAIL)
→ orchestrator обновляет статус в 18
```

**Глобальные / разовые** (вне конвейера страницы, запускает дирижёр отдельно):
- `semantic-core-builder-full` — после выгрузки частотностей (Wordstat/Key Collector).
- `technical-seo-agent` (глоб. часть) — sitemap.xml, robots.txt, 301-карта — один раз + дополняется.
- `internal-linking-agent-full` — полный граф ПОСЛЕ появления страниц.
- `local-seo-agent` — гео-страницы `/geo/{gorod}/` + внешние профили.

---

## 3. Порядок создания скилов

### Волна 0 — обязательная инфраструктура (без неё нельзя выкатывать P1)
1. 🔴 `technical-seo-agent` — sitemap/robots/canonical/noindex-фасеты/301/404/OG/пагинация/AI-доступность (`13`).
2. 🔴 `analytics-setup-agent` — словарь событий + цели Метрики + UTM (`12`, `11`).
3. 🔴 `cro-forms-agent` — формы B2C/B2B, sticky, CTA, вызов событий (`11`).
4. 🔴 `page-quality-gate` (вкл. `visual-qa-gate`) — приёмка по 6 gate'ам (`17`, `figma-quality-rules`).

### Волна 1 — коммерческое ядро
5. 🔴 `semantic-core-builder-lite` — кластер/intent/H1/мета/ключи/стоп-запросы по P1-URL из `18`.
6. 🔴 `internal-linking-agent-lite` — базовые связи P1 (`10`).
7. 🔴 `product-catalog-api` — КровАльянс API: цена/наличие (CSR). Fallback при задержке API — «по запросу», без ложного Offer.

### Волна 2 — рост
8. 🔴 `local-seo-agent` — NAP, `/geo/{gorod}/`, Яндекс.Бизнес/2ГИС (`15`, `08`).
9. 🔴 `semantic-core-builder-full` — частотности, расширение ядра, новые кластеры/приоритеты (`06`).
10. 🔴 `internal-linking-agent-full` — полный граф перелинковки (`10`).

### Дополнить (🟡), не создавать
- `astro-component-builder` → шаблоны листинга (фасеты/пагинация), бренда, статьи, гео.
- `seo-json-ld-agent` → привязать к примерам `07`.
- `copywriter` → привязать к `09` + gate `05` + `fact-checking`.
- `catalog-architect` → синхронизировать с `/catalog/...` и матрицей `18`.

---

## 4. lite / full (разделение)

| Скил | lite (волна 1) | full (волна 2) |
|---|---|---|
| `semantic-core-builder` | по P1-URL из `18`: подтвердить кластер, intent, H1/title/description, главные ключи, **какие запросы НЕ использовать** на странице | частотности (Wordstat/Key Collector), расширение ядра, новые кластеры, пересборка приоритетов P1/P2/P3 |
| `internal-linking-agent` | базовые связи: главная→каталог/услуги/отзывы/база; каталог→услуги/база/форма; услуги→кейсы/отзывы/каталог; статья→каталог/услуга/калькулятор | полный граф по всем сущностям, бренд↔категории, гео↔раздел/соседние города, аудит «битых»/сиротских ссылок |

---

## 5. page-quality-gate (6 режимов)

```
page-quality-gate
  ├─ visual-qa-gate        G1 визуал 1-в-1 (375/1280/1920, визуал-дифф)
  ├─ content-qa            G2 контент уникален, факты, без заглушек
  ├─ seo-qa                G3 мета/H1/JSON-LD/ЧПУ/перелинковка
  ├─ functional-qa         G4 формы/калькуляторы/CTA/события
  ├─ performance-a11y-qa   G5 CWV + базовая a11y + мобайл
  └─ trust-local-qa        G6 доверие + Local + юр-минимум
```
PASS = все 6 закрыты. Иначе «готов к проверке». См. `17-quality-control.md`.

---

## 6. Стандарт скила (расширенный)

Каждый скил пишется по `Skill Quality Standard` + ДВА обязательных поля:

- `trigger` — когда включается (по контексту).
- `sequence canon` — строгий порядок шагов.
- `anti-patterns` — что запрещено.
- `gate` — что считается хорошим результатом.
- **`ownership boundary`** — что скил имеет право менять, а что НЕ трогает.
- **`output contract`** — что именно скил обязан вернуть (применимый результат, не текстовый отчёт).

**Примеры:**
```
technical-seo-agent
  ownership: меняет meta, canonical, sitemap, robots, OG, redirects, noindex.
  НЕ трогает: структуру блоков, офферы, цены, факты, тексты.

seo-json-ld-agent
  output contract: список JSON-LD блоков · источник данных каждого поля ·
                   validation checklist · предупреждения, если данных не хватает.
```

---

## 7. КРИТИЧНОЕ правило: владение ценой (анти-конфликт)

Главный риск — пересечение ответственности (кто пишет/размечает/подтверждает цену).
Единое правило, обязательно в `anti-patterns` для `copywriter`, `seo-json-ld-agent`, `product-catalog-api`:

```
Цена появляется на странице ТОЛЬКО из product-catalog-api
или из подтверждённого fact-checking.
Если цены нет:
  copywriter        → «цена рассчитывается по объекту» / «по запросу»;
  seo-json-ld-agent → НЕ ставит ложный Offer/price;
  cro-forms-agent   → CTA «Узнать цену и наличие».
```
Согласовано с `07-schema-org.md` §0 (не выдумывать price/availability) и `fact-checking.md`.

---

## 8. Итог (модель управления)

```
orchestrator   — управляет (единственный, кто меняет статус в 18)
docs/seo       — закон (никто не переопределяет)
рабочие скилы  — делают (не командуют друг другом, возвращают результат+отчёт)
quality-gate   — право вето (нет PASS → не «готов»)
fact-checking  — гейт фактов/цен (сквозной)
```
Это база для агентного запуска сайта без хаоса и без размытия дисциплины приёмки.
