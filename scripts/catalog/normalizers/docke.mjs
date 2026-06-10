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

  return {
    source: 'docke',
    supplierSku: vendor,
    vendorCode: vendor,                       // у Döcke ключ товар↔цена = vendor
    brand: raw.brand || null,
    name: raw.nomenclature || null,
    collection: raw.collection || null,
    color: raw.color || null,
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
