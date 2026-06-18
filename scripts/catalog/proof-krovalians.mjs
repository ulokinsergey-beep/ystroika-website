import { fetchKatalogSample, fetchPrices } from './adapters/krovalians.mjs';
import { normalizeKrovaliansProduct } from './normalizers/krovalians.mjs';
const now = new Date().toISOString();
console.log('1) выборка живого каталога (стрим, до 200 товаров)…');
const raw = await fetchKatalogSample(200);
console.log('   получено товаров:', raw.length, '| пример:', raw[0]?.['Наименование']?.slice(0,45));
console.log('2) цены по их кодам…');
const kods = raw.map(p => p['Код']).filter(Boolean);
const prices = await fetchPrices(kods);
console.log('   кодов:', kods.length, '| с ценой:', prices.size);
console.log('3) нормализация…');
const norm = raw.map(p => normalizeKrovaliansProduct(p, prices, now));
const withPrice = norm.filter(n => n.basePrice && n.basePrice > 0).length;
const withSpecs = norm.filter(n => Object.keys(n.specs).length).length;
const brands = new Set(norm.map(n => n.brand).filter(Boolean));
console.log(`   с ценой: ${withPrice}/${norm.length} | с габаритами: ${withSpecs} | брендов: ${brands.size}`);
console.log('\nОбразец (3 с ценой):');
for (const n of norm.filter(n => n.basePrice).slice(0,3)) {
  const { raw:_, ...c } = n; console.log(JSON.stringify(c, null, 1));
}
console.log('DONE-KA-PROOF');
