/**
 * Обработчик каталога КровАльянса
 *
 * Читает полный каталог (312 МБ) и разбивает по подкатегориям.
 * Результат: src/data/catalog/ — по одному JSON на подкатегорию.
 *
 * Run: node scripts/process-catalog.mjs
 *
 * Что делает:
 *  1. Строит дерево групп (UID → {name, parentUID, childrenUIDs})
 *  2. Для каждой подкатегории из kroval-category-map.ts находит все товары
 *     рекурсивно вниз по дереву
 *  3. Сохраняет JSON с товарами (без цен — цены подтягиваются через API)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const CATALOG_PATH = resolve(root, 'src/data/kroval-catalog-full.json');
const OUTPUT_DIR = resolve(root, 'src/data/catalog');

// --- Маппинг категорий (дублируем здесь, т.к. TS не импортируется напрямую в .mjs) ---
const CATEGORY_MAP = {
  krovlya: {
    metallocherepitsa:     { uids: ['41e226e8'] },
    'gibkaya-cherepitsa':  { uids: ['41e226d9'] },
    faltsevaya:            { uids: ['2fda46b3', '5da5ac22'] },
    profnastil:            { uids: ['b3880736', 'acbcc34c', '3562bc40'] },
    'kompozitnaya-cherepitsa': { uids: ['41e2290f'] },
    'rulonnye-materialy':  { uids: ['51d3dc95', '06ca8208', '50ada81b'] },
    'cherepitsa-braas':    { uids: ['764560fd', '30a2c1f7'] },
    'komplektuyushchie-krovli': {
      uids: ['549a5e64', '671234b2', '4840f0ab', '212efc17', '5ecd262c', '99d5a4b1', '7f15aea0', '59967032', 'bac63dc0'],
    },
  },
  fasad: {
    'metallicheskiy-sayding':  { uids: ['e2aed800'] },
    'vinilovyy-sayding':       { uids: ['8f7573c7', '86d45227'] },
    'fibrocementnyy-sayding':  { uids: ['102caf82', '5d653fb3'] },
    'fasadnye-paneli':         { uids: ['14315b41'] },
    'fasadnaya-plitka':        { uids: ['a05a8400', 'ea14c171', '263e1f0a', '0162504c'] },
    'termopaнели':             { uids: ['eb88b6c5', 'b04c3210'] },
  },
  vodostok: {
    'metallicheskiy-vodostok': { uids: ['41e22826', '41e226d2', '41e226d6', '3d5570cf'] },
    'plastikovy-vodostok':     { uids: ['41e22702'] },
  },
  ograzhdeniya: {
    zabory:  { uids: ['6798bff2', '43c90082', 'dc30f700', '0af0cd6f', 'e2b90b71'] },
    vorota:  { uids: ['35317349', '68a8d5c2', '947248b0'] },
  },
  komplektuyushchie: {
    krepezh:   { uids: ['549a5e68', '8cb0d418'] },
    plenki:    { uids: ['41e22990', '93240090', '73041d8a'] },
    germetiki: { uids: ['549a5e80', '60bcf7f2'] },
  },
  uteplenie: {
    mineralnaya: { uids: ['e297e1ad', 'ac6027ea'] },
    osb:         { uids: ['3b6d47dc'] },
    fanera:      { uids: ['df9490fb'] },
  },
  ventilyatsiya: {
    aeratory:  { uids: ['1f522b13'] },
    mansardnye: { uids: ['4eab958b', '41e22806', '01c352be'] },
  },
  blagoustrojstvo: {
    terrasa:    { uids: ['c543f719', 'f544a702', '594a9c63', 'fa83a4fb'] },
    ograzhdenie: { uids: ['34541a8a', '44c851d6'] },
  },
};

// ─── Загрузка каталога ───────────────────────────────────────────────────────
console.log('Loading catalog…');
const t0 = Date.now();
const raw = readFileSync(CATALOG_PATH);
const data = JSON.parse(raw);
const items = data['КаталогНоменклатуры'];
const groups = items.filter(x => x.ЭтоГруппа === true);
const products = items.filter(x => x.ЭтоГруппа !== true);
console.log(`Loaded ${groups.length} groups + ${products.length} products in ${Date.now()-t0}ms`);

// ─── Строим UID-дерево групп ─────────────────────────────────────────────────
const groupByUid = new Map();
for (const g of groups) {
  // UID может быть полным или усечённым до 8 символов в маппинге
  groupByUid.set(g.UID, g);
}

// Для маппинга ищем по началу UID (первые 8 символов)
function findGroupsByPrefix(prefix) {
  const results = [];
  for (const [uid, g] of groupByUid) {
    if (uid.startsWith(prefix)) results.push(g);
  }
  return results;
}

// Рекурсивно собираем все UID потомков группы
function getAllDescendantUids(uid, visited = new Set()) {
  if (visited.has(uid)) return visited;
  visited.add(uid);
  for (const g of groups) {
    if (g.UID_Roditel === uid) {
      getAllDescendantUids(g.UID, visited);
    }
  }
  return visited;
}

// ─── Индексируем продукты по UID_Roditel ────────────────────────────────────
console.log('Building product index by parent UID…');
const t1 = Date.now();
const productsByParentUid = new Map();
for (const p of products) {
  const pid = p.UID_Roditel;
  if (!productsByParentUid.has(pid)) productsByParentUid.set(pid, []);
  productsByParentUid.get(pid).push(p);
}
console.log(`Product index built in ${Date.now()-t1}ms`);

// ─── Собираем продукты под набором UID ─────────────────────────────────────
function collectProducts(rootUidPrefixes) {
  const allUids = new Set();
  for (const prefix of rootUidPrefixes) {
    // Найти группы с таким началом UID
    const matchedGroups = findGroupsByPrefix(prefix);
    if (matchedGroups.length === 0) {
      console.warn(`  ! No group found for prefix: ${prefix}`);
      continue;
    }
    for (const g of matchedGroups) {
      getAllDescendantUids(g.UID, allUids);
    }
  }
  // Собираем все продукты под этими группами
  const result = [];
  for (const uid of allUids) {
    const prods = productsByParentUid.get(uid) || [];
    result.push(...prods);
  }
  return result;
}

// ─── Создаём директорию output ───────────────────────────────────────────────
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

// ─── Обрабатываем каждую категорию/подкатегорию ──────────────────────────────
console.log('\nProcessing categories…\n');
const summary = {};
let totalMapped = 0;

for (const [catSlug, subcats] of Object.entries(CATEGORY_MAP)) {
  const catDir = resolve(OUTPUT_DIR, catSlug);
  if (!existsSync(catDir)) mkdirSync(catDir, { recursive: true });

  summary[catSlug] = {};

  for (const [subSlug, { uids }] of Object.entries(subcats)) {
    const t = Date.now();
    const prods = collectProducts(uids);

    // Нормализуем поля (только нужные для листинга и карточки)
    const normalized = prods.map(p => ({
      kod: p.Код,
      uid: p.UID,
      artikul: p.Артикул || '',
      name: p.Наименование,
      unit: p.ЕдиницаИзмерения,
      brand: p.Производитель || '',
      priceGroup: p.ЦеноваяГруппа || '',
      parentKod: p.КодРодителя,
      parentUid: p.UID_Roditel,
      // Размерные поля
      weightEnabled: p.ВесИспользовать === 'Да',
      weightUnit: p.ВесЕдиницаИзмерения || '',
      lengthEnabled: p.ДлинаИспользовать === 'Да',
      areaEnabled: p.ПлощадьИспользовать === 'Да',
    }));

    const outPath = resolve(catDir, `${subSlug}.json`);
    writeFileSync(outPath, JSON.stringify({
      category: catSlug,
      subcategory: subSlug,
      count: normalized.length,
      generatedAt: new Date().toISOString(),
      products: normalized,
    }, null, 0)); // compact JSON

    summary[catSlug][subSlug] = normalized.length;
    totalMapped += normalized.length;
    console.log(`  ✓ ${catSlug}/${subSlug}: ${normalized.length} products (${Date.now()-t}ms)`);
  }
}

// ─── Итог ───────────────────────────────────────────────────────────────────
console.log('\n=== SUMMARY ===');
for (const [cat, subs] of Object.entries(summary)) {
  const total = Object.values(subs).reduce((a,b) => a+b, 0);
  console.log(`${cat}: ${total} products`);
  for (const [sub, cnt] of Object.entries(subs)) {
    if (cnt > 0) console.log(`  ${sub}: ${cnt}`);
  }
}
console.log(`\nTotal mapped: ${totalMapped} / ${products.length}`);
console.log(`Unmapped: ${products.length - totalMapped}`);

// Сохраняем итог
writeFileSync(resolve(OUTPUT_DIR, 'index.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  totalProducts: products.length,
  totalGroups: groups.length,
  mappedProducts: totalMapped,
  categories: summary,
}, null, 2));
console.log('\nDone! Index saved to src/data/catalog/index.json');
