// Нормализатор КровАльянс: сырой товар + цена → единый контракт поставщика.
// Цена продажи = поле `price` (розница, по решению владельца 2026-06-11). У КА НЕТ фото/описаний.

function ratio(num, den) {
  const n = Number(num), d = Number(den);
  if (!n) return null;
  if (!d || d === 1) return String(n);
  return String(+(n / d).toFixed(3));
}

/**
 * @param raw    сырой товар КА (Код, Артикул, Наименование, Производитель, ЕдиницаИзмерения, ЦеноваяГруппа, Вес*, Длина*, Площадь*, Объём*)
 * @param priceMap Map(Код → {price, discounted_price})
 * @param now    ISO-время снимка
 */
export function normalizeKrovaliansProduct(raw, priceMap, now) {
  const kod = raw['Код'] != null ? String(raw['Код']) : null;
  const pr = kod ? priceMap.get(kod) : undefined;

  // характеристики (только реально используемые поставщиком: *Использовать === "Да")
  const specs = {};
  if (raw['ВесИспользовать'] === 'Да') { const v = ratio(raw['ВесЧислитель'], raw['ВесЗнаменатель']); if (v) specs.weight = `${v} ${raw['ВесЕдиницаИзмерения'] || ''}`.trim(); }
  if (raw['ДлинаИспользовать'] === 'Да') { const v = ratio(raw['ДлинаЧислитель'], raw['ДлинаЗнаменатель']); if (v) specs.length = `${v} ${raw['ДлинаЕдиницаИзмерения'] || ''}`.trim(); }
  if (raw['ПлощадьИспользовать'] === 'Да') { const v = ratio(raw['ПлощадьЧислитель'], raw['ПлощадьЗнаменатель']); if (v) specs.area = `${v} ${raw['ПлощадьЕдиницаИзмерения'] || ''}`.trim(); }
  if (raw['ОбъемИспользовать'] === 'Да') { const v = ratio(raw['ОбъемЧислитель'], raw['ОбъемЗнаменатель']); if (v) specs.volume = `${v} ${raw['ОбъемЕдиницаИзмерения'] || ''}`.trim(); }

  return {
    source: 'krovalians',
    supplierSku: kod,                          // Код КА — ключ цен/остатков
    vendorCode: raw['Артикул'] || kod,
    brand: raw['Производитель'] || null,
    name: raw['Наименование'] || null,
    collection: null,
    color: null,
    unit: raw['ЕдиницаИзмерения'] || null,
    basePrice: pr && pr.price > 0 ? pr.price : null,   // розница (price); нет → «по запросу»
    currency: 'RUB',
    supplierCategories: raw['ЦеноваяГруппа'] ? [raw['ЦеноваяГруппа']] : [],
    images: [],                                 // у КА фото нет
    specs,
    description: null,                          // у КА описаний нет
    updatedAt: now,
    priceGroup: raw['ЦеноваяГруппа'] || null,   // строка для маппинга категории
    productId: null,
    category: null,
    raw,
  };
}
