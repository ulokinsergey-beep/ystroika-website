// Генератор снимка каталога/цен (Döcke). Фаза 2A → данные для сайта (2B).
// auth → каталог + РРЦ → нормализация → productId + категория + цена → проверки →
// snapshots/catalog-snapshot-latest.json (+ версия) + catalog-report-latest.json.
// Запуск (проба):  node --env-file=.env scripts/catalog/generate-snapshot.mjs --pages 3
// Полный:          node --env-file=.env scripts/catalog/generate-snapshot.mjs
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { authDocke, fetchRrpPrices, fetchCatalogPage } from './adapters/docke.mjs';
import { normalizeDockeProduct } from './normalizers/docke.mjs';
import { makeProductId, resolveCategoryByTree, inferCategory, applyPrice } from './lib.mjs';

const PAGES = (() => { const i = process.argv.indexOf('--pages'); return i > -1 ? parseInt(process.argv[i + 1]) : Infinity; })();
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
const imgManifestPath = resolve('src/data/catalog-images-manifest.json');
const imgManifest = existsSync(imgManifestPath) ? JSON.parse(readFileSync(imgManifestPath, 'utf-8')) : {};

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
    updatedAt: now,
  });
}

const report = {
  generatedAt: now,
  pagesProcessed: totalPages, pagesTotal: first.pagecount,
  sources: { docke: { rawProducts: rawProducts.length, rrpPositions: rrp.size, normalized, mapped, unmapped, withPrice, noPrice } },
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
