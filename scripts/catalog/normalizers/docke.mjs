// Нормализатор Döcke: сырой товар + РРЦ → единый контракт поставщика.
// API поставщика ≠ структура сайта: site-категория/productId назначаются в mapping, не здесь.

/**
 * @param raw   сырой товар Döcke {vendor, nomenclature, brand, collection, color, measure, picture, description, categories[]}
 * @param rrpMap Map(vendor → {measure, price})  (РРЦ)
 * @param now   ISO-время снимка (передаётся снаружи для детерминизма)
 */
export function normalizeDockeProduct(raw, rrpMap, now) {
  const vendor = raw.vendor != null ? String(raw.vendor) : null;
  const rrp = vendor ? rrpMap.get(vendor) : undefined;

  // картинки → всегда массив абсолютных URL (для последующего скачивания на сайт)
  const pics = [];
  const pushPic = (v) => { if (v && typeof v === 'string') pics.push(v); };
  if (Array.isArray(raw.picture)) raw.picture.forEach(pushPic);
  else pushPic(raw.picture);
  const images = pics.map(u => (u.startsWith('http') ? u : `https://b2b.docke.ru${u.startsWith('/') ? '' : '/'}${u}`));

  // характеристики: только заполненные поля поставщика (ничего не выдумываем)
  const SPEC_FIELDS = ['length', 'width', 'thickness', 'area', 'material', 'series',
    'country_of_origin', 'warranty', 'weight', 'piece_amount_in_pack',
    'm2_area_in_pack', 'm2_amount_in_pack', 'packaging_volume', 'shingle_count_in_pack',
    'foundation', 'topping', 'bitumen_type', 'm2_roll_area', 'sold_in_pack'];
  const specs = {};
  for (const f of SPEC_FIELDS) {
    const v = raw[f];
    if (v !== null && v !== undefined && v !== '' && v !== '0') specs[f] = v;
  }

  return {
    source: 'docke',
    supplierSku: vendor,
    vendorCode: vendor,                       // у Döcke ключ товар↔цена = vendor
    brand: raw.brand || null,
    name: raw.nomenclature || null,
    collection: raw.collection || null,
    color: raw.color || null,
    specs,
    unit: rrp?.measure ?? raw.measure ?? null,
    basePrice: rrp ? rrp.price : null,        // РРЦ; нет цены → null (на сайте «по запросу»)
    currency: 'RUB',
    supplierCategories: Array.isArray(raw.categories) ? raw.categories : [],
    images,                                    // абсолютные URL картинок Döcke
    description: raw.description || null,
    updatedAt: now,
    // site productId / category — назначаются в mapping-слое, не здесь
    productId: null,
    category: null,
    raw,                                       // исходник для отладки (на сайт не идёт)
  };
}
