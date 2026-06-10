// Загрузчик картинок Döcke на сайт (самохостинг, не хотлинк).
// Качает в public/images/catalog/docke/<vendor>-<i>.<ext>, идемпотентно (skip существующих),
// пишет манифест src/data/catalog-images-manifest.json { vendor: ["/images/catalog/docke/..."] }.
// Папка с картинками — в .gitignore (регенерируется); в git идёт только манифест.
// Запуск (проба):  node --env-file=.env scripts/catalog/download-images.mjs --limit 12
// Полная загрузка:  node --env-file=.env scripts/catalog/download-images.mjs
import { mkdirSync, existsSync, writeFileSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { authDocke, fetchCatalogPage } from './adapters/docke.mjs';
import { normalizeDockeProduct } from './normalizers/docke.mjs';

const LIMIT = (() => { const i = process.argv.indexOf('--limit'); return i > -1 ? parseInt(process.argv[i + 1]) : Infinity; })();
const OUT_DIR = resolve('public/images/catalog/docke');
const MANIFEST = resolve('src/data/catalog-images-manifest.json');
mkdirSync(OUT_DIR, { recursive: true });

const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf-8')) : {};
const now = new Date().toISOString();

function extOf(url) { const m = url.split('?')[0].match(/\.(png|jpe?g|webp|gif)$/i); return m ? m[1].toLowerCase() : 'png'; }
function safe(vendor) { return String(vendor).replace(/[^A-Za-z0-9_-]/g, '_'); }

async function downloadOne(url, dest) {
  if (existsSync(dest) && statSync(dest).size > 0) return 'skip';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0) throw new Error('empty');
  writeFileSync(dest, buf);
  return 'ok';
}

console.log('auth…');
const ctx = await authDocke();
let downloaded = 0, skipped = 0, failed = 0, seen = 0;

const first = await fetchCatalogPage(ctx, 1);
const totalPages = first.pagecount;
for (let page = 1; page <= totalPages; page++) {
  const { products } = page === 1 ? first : await fetchCatalogPage(ctx, page);
  for (const raw of products) {
    if (seen >= LIMIT) break;
    const n = normalizeDockeProduct(raw, new Map(), now);
    if (!n.supplierSku || n.images.length === 0) continue;
    seen++;
    const localPaths = [];
    for (let i = 0; i < n.images.length; i++) {
      const ext = extOf(n.images[i]);
      const fname = `${safe(n.supplierSku)}-${i}.${ext}`;
      const dest = resolve(OUT_DIR, fname);
      try {
        const r = await downloadOne(n.images[i], dest);
        r === 'ok' ? downloaded++ : skipped++;
        localPaths.push(`/images/catalog/docke/${fname}`);
      } catch (e) { failed++; }
    }
    if (localPaths.length) manifest[n.supplierSku] = localPaths;
  }
  if (seen >= LIMIT) break;
  if (page % 10 === 0) console.log(`  …страница ${page}/${totalPages}, скачано ${downloaded}, пропущено ${skipped}`);
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 0));
console.log(`\nГотово: обработано товаров ${seen}, скачано ${downloaded}, пропущено(уже есть) ${skipped}, ошибок ${failed}`);
console.log(`Манифест: ${MANIFEST} (записей: ${Object.keys(manifest).length})`);
