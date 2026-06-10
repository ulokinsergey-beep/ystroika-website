// Генератор снимка цен (Фаза 2A). docs/catalog-pricing-architecture.md.
// Поток: забор сырья → нормализация → маппинг → цена (РРЦ→округл) → проверки → snapshot + report.
// Наружу отдаётся ТОЛЬКО price-snapshot-latest.json (публичные данные). Секреты — из env.
// Запуск: node catalog-sync/build-snapshot.mjs   (env: DOCKE_LOGIN, DOCKE_PASSWORD)
//   флаги: --limit-pages=N (тест), --bootstrap=N (сколько товаров засеять в пустой маппинг)

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchDockeRaw } from './adapters/docke.mjs';
import { normalizeDocke } from './normalizers/docke.mjs';
import { computeSellingPrice } from './lib/pricing.mjs';
import { downloadImages } from './lib/images.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SNAP_DIR = resolve(ROOT, 'snapshots');
const arg = (k, d) => { const m = process.argv.find(a => a.startsWith(`--${k}=`)); return m ? m.split('=')[1] : d; };
const LIMIT_PAGES = arg('limit-pages') ? Number(arg('limit-pages')) : null;
const BOOTSTRAP_N = Number(arg('bootstrap', '0'));
const IMAGES = process.argv.includes('--images'); // скачивать картинки Döcke на сайт (самохостинг)

const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function loadJson(p, fallback) { try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return fallback; } }

async function main() {
  const now = new Date().toISOString();
  const rules = loadJson(resolve(ROOT, 'pricing/pricing-rules.json'), { rounding: { step: 10, mode: 'up' }, overrides: {} });
  const mapPath = resolve(ROOT, 'mapping/product-supplier-map.json');
  const mapping = loadJson(mapPath, { products: [] });

  const warnings = [], blockers = [];

  // 1. Сырьё + нормализация (Döcke)
  let normalized = [];
  try {
    const raw = await fetchDockeRaw({ limitPages: LIMIT_PAGES, now });
    normalized = normalizeDocke(raw, { now });
    console.log(`[docke] товаров: ${raw.products.length} (страниц ${raw.pageCount}), c РРЦ: ${normalized.filter(n => n.basePrice != null).length}`);
  } catch (e) {
    blockers.push({ source: 'docke', error: String(e.message || e) });
    console.error('[docke] BLOCKER:', e.message);
  }

  // индекс нормализованных по source+supplierSku
  const idx = new Map();
  for (const n of normalized) idx.set(`${n.source}:${n.supplierSku}`, n);

  // 2. Bootstrap маппинга, если пуст и запрошено
  if ((mapping.products?.length ?? 0) === 0 && BOOTSTRAP_N > 0) {
    const seed = normalized.filter(n => n.basePrice != null && n.category).slice(0, BOOTSTRAP_N);
    mapping.products = seed.map(n => ({
      productId: `${n.category}-docke-${slug(n.supplierSku)}`,
      brand: n.brand, category: n.category, name: n.name, bootstrap: true,
      links: [{ source: 'docke', supplierSku: n.supplierSku, priority: 1, active: true }],
    }));
    writeFileSync(mapPath, JSON.stringify(mapping, null, 2), 'utf-8');
    console.log(`[mapping] bootstrap: засеяно ${mapping.products.length} товаров из реальных данных`);
  }

  // 3. Цена + проверки → snapshot
  const items = [];
  const pics = []; // {key: productId, url} для скачивания картинок
  for (const prod of (mapping.products || [])) {
    const link = (prod.links || []).filter(l => l.active).sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))[0];
    if (!link) { warnings.push({ productId: prod.productId, msg: 'нет активного источника' }); continue; }
    const norm = idx.get(`${link.source}:${link.supplierSku}`);
    const basePrice = norm?.basePrice ?? null;
    const sellingPrice = computeSellingPrice({ basePrice, productId: prod.productId }, rules);

    // защита от кривых цен (§6): цена>0, RUB, сопоставлен, источник понятен
    if (sellingPrice == null) {
      warnings.push({ productId: prod.productId, msg: 'нет цены → по запросу', source: link.source });
    } else if (!(sellingPrice > 0)) {
      blockers.push({ productId: prod.productId, msg: 'цена <= 0', value: sellingPrice });
      continue;
    }

    if (norm?.picture) pics.push({ key: prod.productId, url: norm.picture });
    items.push({
      productId: prod.productId,
      brand: prod.brand ?? norm?.brand ?? null,
      category: prod.category ?? norm?.category ?? null,
      name: prod.name ?? norm?.name ?? null,
      price: sellingPrice,                 // null = «по запросу»
      currency: 'RUB',
      priceSource: sellingPrice != null ? link.source : null,
      availability: 'unknown',             // остатки не тянем (§8)
      image: null,                         // локальный путь после скачивания (--images)
      updatedAt: now,
    });
  }

  // 3b. Картинки на сайт (самохостинг). Только при --images.
  let imagesDownloaded = 0;
  if (IMAGES && pics.length) {
    const map = await downloadImages(pics, ROOT, { concurrency: 6 });
    for (const it of items) {
      const web = map.get(it.productId);
      if (web) { it.image = web; imagesDownloaded++; }
    }
    console.log(`[images] скачано на сайт: ${imagesDownloaded}/${pics.length}`);
  }

  // 4. Отчёт
  const report = {
    generatedAt: now,
    sources: {
      docke: {
        products: normalized.length,
        withRrp: normalized.filter(n => n.basePrice != null).length,
        mapped: items.filter(i => i.priceSource === 'docke').length,
      },
    },
    snapshot: { total: items.length, withPrice: items.filter(i => i.price != null).length, byRequest: items.filter(i => i.price == null).length, images: imagesDownloaded, withImage: items.filter(i => i.image).length },
    warnings, blockers,
  };

  // 5. Запись. latest обновляем ТОЛЬКО если нет блокеров (§7).
  mkdirSync(SNAP_DIR, { recursive: true });
  const stamp = now.replace(/[:.]/g, '-');
  const snapshot = { generatedAt: now, currency: 'RUB', items };
  writeFileSync(resolve(SNAP_DIR, `price-snapshot-${stamp}.json`), JSON.stringify(snapshot, null, 2), 'utf-8');
  writeFileSync(resolve(SNAP_DIR, 'price-snapshot-report.json'), JSON.stringify(report, null, 2), 'utf-8');
  if (blockers.length === 0) {
    writeFileSync(resolve(SNAP_DIR, 'price-snapshot-latest.json'), JSON.stringify(snapshot, null, 2), 'utf-8');
    console.log(`[snapshot] latest обновлён: ${items.length} товаров (${report.snapshot.withPrice} с ценой, ${report.snapshot.byRequest} по запросу)`);
  } else {
    console.error(`[snapshot] БЛОКЕРЫ (${blockers.length}) → latest НЕ обновлён, старый сохранён`);
  }
  console.log('[report]', JSON.stringify(report.snapshot), 'warnings:', warnings.length, 'blockers:', blockers.length);
}

main().catch(e => { console.error('FATAL', e); process.exit(1); });
