// Нормализатор Döcke: сырьё API → единый контракт (docs/catalog-pricing-architecture.md §3.1).
// Цена продажи Döcke = РРЦ. Категорию определяем по названию (точный маппинг — при курировании).

// Грубое определение категории сайта по названию (best-effort до ручного маппинга).
function detectCategory(name = '') {
  const n = name.toLowerCase();
  if (n.includes('гибк') || n.includes('черепиц')) return 'gibkaya-cherepitsa';
  if (n.includes('сайдинг') && n.includes('винил')) return 'vinilovyy-sayding';
  if (n.includes('сайдинг')) return 'vinilovyy-sayding';
  if (n.includes('фасадн') || n.includes('панел')) return 'fasadnye-paneli';
  if (n.includes('водосток') || n.includes('желоб') || n.includes('труба') || n.includes('воронк')) return 'metallicheskiy-vodostok';
  if (n.includes('софит')) return 'sofity';
  return null; // неопознано → останется без категории, маппинг решит
}

/**
 * @returns массив нормализованных позиций {source, supplierSku, vendorCode, brand, name,
 *          category, basePrice, currency, unit, picture, updatedAt, raw}
 * Только позиции, у которых ЕСТЬ РРЦ (basePrice). Остальное — кандидаты без цены.
 */
export function normalizeDocke({ products, rrp }, { now }) {
  const out = [];
  for (const p of products) {
    const vendor = p.vendor;
    if (!vendor) continue;
    const rrpEntry = rrp.get(vendor);
    out.push({
      source: 'docke',
      supplierSku: vendor,
      vendorCode: vendor,
      brand: p.brand || null,
      name: p.nomenclature || null,
      category: detectCategory(p.nomenclature),
      basePrice: rrpEntry ? rrpEntry.price : null, // РРЦ = цена продажи (до округления)
      currency: 'RUB',
      unit: rrpEntry?.measure || p.measure || null,
      picture: p.picture || null,
      updatedAt: now,
      raw: { categories: p.categories, collection: p.collection, color: p.color },
    });
  }
  return out;
}
