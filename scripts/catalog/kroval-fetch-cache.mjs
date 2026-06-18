// Кэш КровАльянс: один раз тянет каталог (~200МБ) + цены, нормализует, сохраняет на диск.
// Дальше generate-snapshot читает кэш (быстро) → можно итерировать правила категорий без перекачки.
// Кэш в gitignore (большой, регенерируется). Запуск: node --env-file=.env scripts/catalog/kroval-fetch-cache.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fetchKatalog, fetchPrices } from './adapters/krovalians.mjs';
import { normalizeKrovaliansProduct } from './normalizers/krovalians.mjs';

const OUT = resolve('src/data/catalog/kroval-normalized-cache.json');
mkdirSync(resolve('src/data/catalog'), { recursive: true });
const now = new Date().toISOString();

console.log('КА: каталог (~200МБ, минуты)…');
const all = await fetchKatalog();
const leaf = all.filter(p => p && p['Код'] && p['ЭтоГруппа'] === false);
console.log(`  товаров (не групп): ${leaf.length}. Цены пачками по 150…`);
const prices = await fetchPrices(leaf.map(p => String(p['Код'])));
console.log(`  цен получено: ${prices.size}${prices.failedBatches ? ` (пропущено пачек: ${prices.failedBatches})` : ''}. Нормализация…`);

const items = leaf.map(p => { const n = normalizeKrovaliansProduct(p, prices, now); const { raw, ...clean } = n; return clean; });
writeFileSync(OUT, JSON.stringify({ generatedAt: now, count: items.length, items }));
const withPrice = items.filter(i => i.basePrice && i.basePrice > 0).length;
console.log(`Готово: ${items.length} товаров в кэше, с ценой ${withPrice}. Файл: ${OUT}`);
console.log('DONE-KA-CACHE');
