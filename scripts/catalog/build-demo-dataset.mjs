/**
 * build-demo-dataset.mjs — Timeweb MVP.
 *
 * Otbiraet nebolshoy kuriruemyy demo-nabor tovarov iz snimka kataloga
 * i pishet ego v src/data/catalog-demo.json (kommititsya v repozitoriy).
 *
 * Zachem: Timeweb MVP — staticheskiy sayt. Polnyy snimok (20 MB / 31 799 pozitsiy)
 * NE kladem ni v repozitoriy, ni v brauzer. Vitrina/listingi/kartochki MVP
 * renderyatsya iz etogo malenkogo demo-fayla (do 5 pozitsiy na podkategoriyu).
 * Polnyy katalog 230k — pozzhe na Cloudflare SSR (sm. docs/CLOUDFLARE_SSR_ROADMAP.md).
 *
 * Zapusk:
 *   node scripts/catalog/build-demo-dataset.mjs
 *   SNAPSHOT=/path/to/catalog-snapshot-latest.json node scripts/catalog/build-demo-dataset.mjs
 *
 * Istochnik snimka (gitignored) po umolchaniyu: src/data/snapshots/catalog-snapshot-latest.json
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const PER_SUBCATEGORY = 5;
const GLOBAL_CAP = 150;

// Valid category/subcategory pairs (keep in sync with src/data/categories.ts).
const VALID_PAIRS = new Set([
  'krovlya/metallocherepitsa','krovlya/gibkaya-cherepitsa','krovlya/faltsevaya',
  'krovlya/profnastil','krovlya/kompozitnaya-cherepitsa','krovlya/rulonnye-materialy',
  'krovlya/cherepitsa-braas','krovlya/komplektuyushchie-krovli',
  'fasad/metallicheskiy-sayding','fasad/vinilovyy-sayding','fasad/fibrocementnyy-sayding',
  'fasad/fasadnye-paneli','fasad/fasadnaya-plitka','fasad/termopaнeli',
  'fasad/podsistema','fasad/dobornye-elementy',
  'vodostok/metallicheskiy-vodostok','vodostok/plastikovy-vodostok',
  'ograzhdeniya/zabory','ograzhdeniya/vorota',
  'komplektuyushchie/krepezh','komplektuyushchie/plenki','komplektuyushchie/germetiki',
  'blagoustrojstvo/ograzhdenie','blagoustrojstvo/terrasa',
  'uteplenie/mineralnaya','uteplenie/osb','uteplenie/fanera',
  'ventilyatsiya/aeratory','ventilyatsiya/mansardnye',
]);

const SNAPSHOT = process.env.SNAPSHOT || resolve('src/data/snapshots/catalog-snapshot-latest.json');
const OUT = process.env.OUT || resolve('src/data/catalog-demo.json');

if (!existsSync(SNAPSHOT)) {
  console.error('NO SNAPSHOT at: ' + SNAPSHOT);
  process.exit(2);
}

const all = JSON.parse(readFileSync(SNAPSHOT, 'utf-8'));
const cleanVendor = (v) => typeof v === 'string' && /^[A-Za-z0-9._\-]+$/.test(v);
// reject names with control chars, the Unicode replacement char, or stray low surrogates
const BAD = /[\u0000-\u001f\uFFFD\uDC00-\uDFFF]/;
const cleanName = (n) => typeof n === 'string'
  && n.trim().length >= 3 && n.trim().length <= 140 && !BAD.test(n);

function score(it) {
  let s = 0;
  if (typeof it.price === 'number' && it.price > 0) s += 2;
  if (Array.isArray(it.images) && it.images.length > 0) s += 2;
  if (it.specs && Object.keys(it.specs).length > 0) s += 1;
  if (it.brand && String(it.brand).trim()) s += 1;
  if (it.description && String(it.description).trim()) s += 1;
  return s;
}

const byPair = new Map();
for (const it of all) {
  if (!it || typeof it.category !== 'string') continue;
  if (!VALID_PAIRS.has(it.category)) continue;
  if (!cleanVendor(it.vendor)) continue;
  if (!cleanName(it.name)) continue;
  if (!byPair.has(it.category)) byPair.set(it.category, []);
  byPair.get(it.category).push(it);
}

const selected = [];
const summary = [];
const pairs = [...byPair.keys()].sort();
for (const pair of pairs) {
  const items = byPair.get(pair)
    .sort((a, b) => score(b) - score(a) || String(a.vendor).localeCompare(String(b.vendor)));
  const seen = new Set();
  const picked = [];
  for (const it of items) {
    if (seen.has(it.vendor)) continue;
    seen.add(it.vendor);
    picked.push(it);
    if (picked.length >= PER_SUBCATEGORY) break;
  }
  for (const it of picked) selected.push(it);
  summary.push({ pair, available: items.length, picked: picked.length });
}

selected.sort((a, b) => score(b) - score(a));
const final = selected.slice(0, GLOBAL_CAP);

final.sort((a, b) => String(a.category).localeCompare(String(b.category))
  || String(a.vendor).localeCompare(String(b.vendor)));

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(final, null, 0), 'utf-8');

const withImg = final.filter(i => Array.isArray(i.images) && i.images.length).length;
const withPrice = final.filter(i => typeof i.price === 'number' && i.price > 0).length;
console.log('=== DEMO DATASET BUILT ===');
console.log('source items:', all.length);
console.log('written:', OUT);
console.log('total selected:', final.length, '| with image:', withImg, '| with price:', withPrice);
console.log('subcategories with items:', summary.filter(s => s.picked > 0).length, '/', VALID_PAIRS.size);
console.log('--- per subcategory (picked) ---');
for (const s of summary.filter(s => s.picked > 0)) {
  console.log('  ' + s.pair + ': ' + s.picked + ' (of ' + s.available + ')');
}
