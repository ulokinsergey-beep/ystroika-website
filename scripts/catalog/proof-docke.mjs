// Proof Фазы 2A (Döcke): auth → РРЦ → каталог(1 стр) → нормализация → образец + покрытие цен.
// Запуск: node --env-file=.env scripts/catalog/proof-docke.mjs
import { authDocke, fetchRrpPrices, fetchCatalogPage } from './adapters/docke.mjs';
import { normalizeDockeProduct } from './normalizers/docke.mjs';

const now = new Date().toISOString();
console.log('1) auth…');
const ctx = await authDocke();
console.log('   token: ok | agree: ok | factory: ok | договоров:', ctx.agrees.length, '| заводов:', ctx.factories.length);

console.log('2) РРЦ-прайс…');
const rrp = await fetchRrpPrices(ctx);
console.log('   позиций РРЦ:', rrp.size);

console.log('3) каталог (страница 1)…');
const { products, pagecount } = await fetchCatalogPage(ctx, 1);
console.log('   товаров на стр:', products.length, '| всего страниц:', pagecount, '≈', products.length * pagecount, 'товаров');

console.log('4) нормализация + покрытие цен по странице 1…');
const norm = products.map(p => normalizeDockeProduct(p, rrp, now));
const withPrice = norm.filter(n => n.basePrice && n.basePrice > 0).length;
const withImg = norm.filter(n => n.images.length > 0).length;
console.log(`   с РРЦ-ценой: ${withPrice}/${norm.length} | с картинкой: ${withImg}/${norm.length}`);

console.log('\n5) Образец (3 нормализованных товара, без raw):');
for (const n of norm.slice(0, 3)) {
  const { raw, ...clean } = n;
  console.log(JSON.stringify({ ...clean, images: clean.images.slice(0, 1) }, null, 1));
}
console.log('\nDONE-PROOF');
