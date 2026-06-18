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
  if (raw['Марка'] && String(raw['Марка']).trim()) specs.mark = String(raw['Марка']).trim();

  // упаковка (берём базовую/первую): кол-во в упаковке, вес, габариты, складская группа
  const pack = {};
  const pk = Array.isArray(raw['Упаковки']) ? raw['Упаковки'][0] : null;
  if (pk) {
    if (pk['Числитель'] && Number(pk['Числитель']) > 1) pack.qtyInPack = `${pk['Числитель']} ${pk['ЕдиницаИзмерения'] || 'шт'}`.trim();
    if (pk['Вес'] && Number(pk['Вес']) > 0) pack.weight = `${pk['Вес']} ${pk['ВесЕдиницаИзмерения'] || 'кг'}`.trim();
    if (pk['СкладскаяГруппа']) pack.storageGroup = pk['СкладскаяГруппа'];
    if (pk['Типоразмер']) pack.size = pk['Типоразмер'];
    const dims = [pk['Высота'], pk['Ширина'], pk['Глубина']].filter(x => x && Number(String(x).replace(',', '.')) > 0);
    if (dims.length === 3) pack.dimensions = `${pk['Высота']}×${pk['Ширина']}×${pk['Глубина']} ${pk['ВысотаЕдиницаИзмерения'] || 'м'}`;
  }

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
    pack: Object.keys(pack).length ? pack : undefined,  // данные упаковки (если есть)
    description: null,                          // у КА описаний нет
    updatedAt: now,
    priceGroup: raw['ЦеноваяГруппа'] || null,   // строка для маппинга категории
    productId: null,
    category: null,
    raw,
  };
}
