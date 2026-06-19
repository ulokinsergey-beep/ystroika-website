// Генератор снимка каталога/цен (Döcke). Фаза 2A → данные для сайта (2B).
// auth → каталог + РРЦ → нормализация → productId + категория + цена → проверки →
// snapshots/catalog-snapshot-latest.json (+ версия) + catalog-report-latest.json.
// Запуск (проба):  node --env-file=.env scripts/catalog/generate-snapshot.mjs --pages 3
// Полный:          node --env-file=.env scripts/catalog/generate-snapshot.mjs
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { authDocke, fetchRrpPrices, fetchCatalogPage } from './adapters/docke.mjs';
import { normalizeDockeProduct } from './normalizers/docke.mjs';
import { fetchKatalog as kaKatalog, fetchPrices as kaPrices } from './adapters/krovalians.mjs';
import { normalizeKrovaliansProduct } from './normalizers/krovalians.mjs';
import { makeProductId, resolveCategoryByTree, inferCategory, applyPrice } from './lib.mjs';

const PAGES = (() => { const i = process.argv.indexOf('--pages'); return i > -1 ? parseInt(process.argv[i + 1]) : Infinity; })();
// КровАльянс включаем только в полном прогоне (не в --pages пробе) и если не --docke-only
const WITH_KROVAL = PAGES === Infinity && !process.argv.includes('--docke-only');

// КА-категория по мастер-структуре Excel: самое длинное совпадение префикса priceGroup.
function kaCategory(priceGroup, pgMap) {
  const pg = (priceGroup || '').trim();
  if (!pg) return null;
  let best = null, bestLen = -1;
  for (const prefix in pgMap) {
    if (pg === prefix || pg.startsWith(prefix + '/') || pg.startsWith(prefix)) {
      if (prefix.length > bestLen) { best = pgMap[prefix]; bestLen = prefix.length; }
    }
  }
  return best;
}
const OUT = resolve('src/data/snapshots');
mkdirSync(OUT, { recursive: true });

const rules = JSON.parse(readFileSync(resolve('scripts/catalog/pricing/pricing-rules.json'), 'utf-8'));
// Дерево категорий Döcke + карта веток → категория сайта (надёжный маппинг по UUID)
const catTree = JSON.parse(readFileSync(resolve('scripts/catalog/mapping/docke-categories.json'), 'utf-8'));
const byUuid = new Map(catTree.map(c => [c.uuid, c]));
const rootUuid = (catTree.find(c => !c.parent_uuid) || {}).uuid;
const branchMap = JSON.parse(readFileSync(resolve('scripts/catalog/mapping/docke-branch-map.json'), 'utf-8')).branches;
// keyword-fallback для товаров, чья ветка не резолвится по дереву (новые/битые uuid)
const catRules = JSON.parse(readFileSync(resolve('scripts/catalog/mapping/docke-category-rules.json'), 'utf-8')).rules;
const kaPgMap = JSON.parse(readFileSync(resolve('scripts/catalog/mapping/krovalians-pricegroup-map.json'), 'utf-8')).map;
const imgManifestPath = resolve('src/data/catalog-images-manifest.json');
const imgManifest = existsSync(imgManifestPath) ? JSON.parse(readFileSync(imgManifestPath, 'utf-8')) : {};

// Прошлый снимок: какие КА-товары уже опубликованы. ПРАВИЛО САЙТА: товар КА, уже бывший
// на сайте и потерявший цену при обновлении, НЕ удаляем — оставляем как «по запросу»
// (сохраняем URL/индексацию). Новый КА-товар без цены — не публикуем. См. docs/site-rules.md.
const prevSnapPath = resolve('src/data/snapshots/catalog-snapshot-latest.json');
const prevKaPublished = new Set();
if (existsSync(prevSnapPath)) {
  try {
    for (const it of JSON.parse(readFileSync(prevSnapPath, 'utf-8'))) {
      if (it.source === 'krovalians' && it.productId) prevKaPublished.add(it.productId);
    }
  } catch {}
}

const now = new Date().toISOString();
const stamp = now.replace(/[:.]/g, '-');

console.log('auth + РРЦ…');
const ctx = await authDocke();
const rrp = await fetchRrpPrices(ctx);

console.log('каталог…');
const first = await fetchCatalogPage(ctx, 1);
const totalPages = Math.min(first.pagecount, PAGES);
let rawProducts = [...first.products];
for (let p = 2; p <= totalPages; p++) rawProducts.push(...(await fetchCatalogPage(ctx, p)).products);
console.log(`  страниц обработано: ${totalPages}/${first.pagecount} | товаров: ${rawProducts.length}`);

const publicItems = [];
const byCategory = {};
let normalized = 0, mapped = 0, withPrice = 0, noPrice = 0, unmapped = 0;
const unmappedSample = [];

for (const raw of rawProducts) {
  const n = normalizeDockeProduct(raw, rrp, now);
  if (!n.supplierSku) continue;
  normalized++;
  const productId = makeProductId(n);
  const category = resolveCategoryByTree(n.supplierCategories, byUuid, rootUuid, branchMap) || inferCategory(n, catRules);
  if (!category) {
    unmapped++;
    if (unmappedSample.length < 15) unmappedSample.push({ vendor: n.supplierSku, name: n.name });
    continue; // не сопоставлен → не в публичный снимок
  }
  mapped++;
  byCategory[category] = (byCategory[category] || 0) + 1;
  const price = applyPrice({ ...n, category }, rules, productId);
  if (price && price > 0) withPrice++; else noPrice++;

  const localImgs = imgManifest[n.supplierSku];
  publicItems.push({
    productId, category, source: 'docke',
    vendor: n.supplierSku, brand: n.brand, name: n.name,
    collection: n.collection, color: n.color, unit: n.unit,
    price: price ?? null, currency: 'RUB',
    priceSource: price ? 'docke-rrp' : null,
    availability: 'unknown',
    images: (localImgs && localImgs.length) ? localImgs : n.images,
    specs: n.specs ?? {},
    description: n.description ?? null,
    updatedAt: now,
  });
}

// ─── ИСТОЧНИК 2: КровАльянс (полный прогон) ─────────────────────────────────
let ka = { raw: 0, normalized: 0, mapped: 0, unmapped: 0, withPrice: 0, noPrice: 0 };
if (WITH_KROVAL) {
  // Источник нормализованных КА-товаров: кэш на диске (быстро) или живой API.
  const cachePath = resolve('src/data/catalog/kroval-normalized-cache.json');
  let kaItems;
  if (existsSync(cachePath)) {
    kaItems = JSON.parse(readFileSync(cachePath, 'utf-8')).items || [];
    console.log(`КровАльянс: из кэша ${kaItems.length} товаров (kroval-normalized-cache.json).`);
  } else {
    console.log('КровАльянс: каталог (≈200МБ, минуты)…');
    const kaRawAll = await kaKatalog();
    const kaLeaf = kaRawAll.filter(p => p && p['Код'] && p['ЭтоГруппа'] === false);
    const kaPriceMap = await kaPrices(kaLeaf.map(p => String(p['Код'])));
    kaItems = kaLeaf.map(p => { const n = normalizeKrovaliansProduct(p, kaPriceMap, now); const { raw, ...c } = n; return c; });
    console.log(`  товаров ${kaItems.length}, цен ${kaPriceMap.size}. Маппинг…`);
  }
  ka.raw = kaItems.length;
  for (const n of kaItems) {
    if (!n.supplierSku) continue;
    ka.normalized++;
    const productId = makeProductId(n);
    const category = kaCategory(n.priceGroup, kaPgMap);
    if (!category) { ka.unmapped++; continue; }
    ka.mapped++;
    byCategory[category] = (byCategory[category] || 0) + 1;
    const price = applyPrice({ ...n, category }, rules, productId);
    const retained = (!price || price <= 0) && prevKaPublished.has(productId);
    // КА без цены: новый товар — НЕ публикуем (тонкая карточка, у КА нет фото/описаний);
    // но если товар УЖЕ был на сайте — оставляем как «по запросу» (не теряем URL/SEO).
    if ((!price || price <= 0) && !retained) { ka.noPrice++; continue; }
    if (retained) ka.retained = (ka.retained || 0) + 1; else ka.withPrice++;
    publicItems.push({
      productId, category, source: 'krovalians',
      vendor: n.supplierSku, brand: n.brand, name: n.name,
      collection: null, color: null, unit: n.unit,
      price: price && price > 0 ? price : null, currency: 'RUB',
      priceSource: price && price > 0 ? 'krovalians' : null,
      availability: 'unknown',
      images: [],
      specs: { ...(n.specs || {}), ...(n.pack || {}) },
      description: null,
      updatedAt: now,
    });
  }
  console.log(`  КА: сопоставлено ${ka.mapped}, с ценой ${ka.withPrice}, без категории ${ka.unmapped}${ka.retained ? `, сохранено без цены ${ka.retained}` : ''}`);
}

const report = {
  generatedAt: now,
  pagesProcessed: totalPages, pagesTotal: first.pagecount,
  sources: {
    docke: { rawProducts: rawProducts.length, rrpPositions: rrp.size, normalized, mapped, unmapped, withPrice, noPrice },
    ...(WITH_KROVAL ? { krovalians: ka } : {}),
  },
  byCategory,
  unmappedSample,
  warnings: [
    ...(unmapped > 0 ? [`${unmapped} товаров без категории — не попали в публичный снимок (см. unmappedSample)`] : []),
    ...(noPrice > 0 ? [`${noPrice} сопоставленных товаров без РРЦ — на сайте «по запросу»`] : []),
  ],
  blockers: [],
};

// версия + latest (latest пишем только без blocker'ов)
writeFileSync(resolve(OUT, `catalog-snapshot-${stamp}.json`), JSON.stringify(publicItems));
writeFileSync(resolve(OUT, 'catalog-report-latest.json'), JSON.stringify(report, null, 2));
if (report.blockers.length === 0) {
  writeFileSync(resolve(OUT, 'catalog-snapshot-latest.json'), JSON.stringify(publicItems));
}

console.log('\n=== ОТЧЁТ ===');
console.log(`нормализовано: ${normalized} | сопоставлено: ${mapped} | без категории: ${unmapped}`);
console.log(`с ценой: ${withPrice} | без цены («по запросу»): ${noPrice}`);
console.log('по категориям:', JSON.stringify(byCategory));
console.log(`публичных товаров в снимке: ${publicItems.length}`);
console.log(`снимок: src/data/snapshots/catalog-snapshot-latest.json`);
console.log('DONE-SNAPSHOT');
