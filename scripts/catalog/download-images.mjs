// Загрузчик картинок Döcke на сайт (самохостинг, не хотлинк).
// Источник — публичный снимок (catalog-snapshot-latest.json): качаем только то,
// что реально на сайте (~5,8 тыс. товаров), без API-запросов (URL уже в снимке).
// Идемпотентно: существующие файлы пропускаются; URL в снимке заменяются на
// локальные пути; манифест vendor→[пути] обновляется.
// Запуск (проба):  node --env-file=.env scripts/catalog/download-images.mjs --limit 12
// Полная загрузка: node --env-file=.env scripts/catalog/download-images.mjs
import { mkdirSync, existsSync, writeFileSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const LIMIT = (() => { const i = process.argv.indexOf('--limit'); return i > -1 ? parseInt(process.argv[i + 1]) : Infinity; })();
const OUT_DIR = resolve('public/images/catalog/docke');
const MANIFEST = resolve('src/data/catalog-images-manifest.json');
const SNAPSHOT = resolve('src/data/snapshots/catalog-snapshot-latest.json');
mkdirSync(OUT_DIR, { recursive: true });

if (!existsSync(SNAPSHOT)) {
  console.error('Нет снимка — сначала: node --env-file=.env scripts/catalog/generate-snapshot.mjs');
  process.exit(1);
}
const snapshot = JSON.parse(readFileSync(SNAPSHOT, 'utf-8'));
const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf-8')) : {};

function extOf(url) { const m = url.split('?')[0].match(/\.(png|jpe?g|webp|gif)$/i); return m ? m[1].toLowerCase() : 'png'; }
function safe(vendor) { return String(vendor).replace(/[^A-Za-z0-9_-]/g, '_'); }

async function downloadOne(url, dest) {
  if (existsSync(dest) && statSync(dest).size > 0) return 'skip';
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0) throw new Error('empty');
  writeFileSync(dest, buf);
  return 'ok';
}

let downloaded = 0, skipped = 0, failed = 0, processed = 0, patched = 0;
const failures = [];

for (const item of snapshot) {
  if (processed >= LIMIT) break;
  const remote = (item.images || []).filter(u => typeof u === 'string' && u.startsWith('http'));
  const alreadyLocal = (item.images || []).filter(u => typeof u === 'string' && u.startsWith('/images/'));
  if (remote.length === 0) { if (alreadyLocal.length) skipped += alreadyLocal.length; continue; }
  processed++;
  const localPaths = [...alreadyLocal];
  for (let i = 0; i < remote.length; i++) {
    const ext = extOf(remote[i]);
    const fname = `${safe(item.vendor)}-${i}.${ext}`;
    const dest = resolve(OUT_DIR, fname);
    try {
      const r = await downloadOne(remote[i], dest);
      r === 'ok' ? downloaded++ : skipped++;
      localPaths.push(`/images/catalog/docke/${fname}`);
    } catch (e) {
      failed++;
      if (failures.length < 10) failures.push({ vendor: item.vendor, url: remote[i], err: String(e.message || e) });
    }
  }
  if (localPaths.length) {
    manifest[item.vendor] = localPaths;
    item.images = localPaths;   // патчим снимок: теперь локальные пути
    patched++;
  }
  if (processed % 500 === 0) console.log(`  …${processed} товаров, скачано ${downloaded}, пропущено ${skipped}, ошибок ${failed}`);
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 0));
writeFileSync(SNAPSHOT, JSON.stringify(snapshot));
console.log(`\nГотово: товаров с remote-картинками обработано ${processed}, скачано файлов ${downloaded}, пропущено ${skipped}, ошибок ${failed}, снимок пропатчен у ${patched}`);
if (failures.length) console.log('Примеры ошибок:', JSON.stringify(failures, null, 1));
console.log('DONE-IMAGES');
