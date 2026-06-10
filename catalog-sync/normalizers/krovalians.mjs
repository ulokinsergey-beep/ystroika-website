// Нормализатор КровАльянс: цена по kod → единый контракт.
// Метаданные (бренд/имя/категория/картинка) берутся из маппинга (курируется),
// КровАльянс-адаптер даёт только цену. retailField: какое поле — розница.
// price = прайс поставщика (по умолчанию розница), discounted_price = закупка.

export function normalizeKrovalians({ kod, priceEntry, meta }, { now, retailField = 'price' }) {
  const v = priceEntry ? Number(priceEntry[retailField]) : null;
  return {
    source: 'krovalians',
    supplierSku: kod,
    vendorCode: kod,
    brand: meta?.brand ?? null,
    name: meta?.name ?? null,
    category: meta?.category ?? null,
    basePrice: v && v > 0 ? v : null,   // розница по retailField (price/discounted_price)
    currency: 'RUB',
    unit: null,
    picture: meta?.image ?? null,
    updatedAt: now,
    raw: priceEntry || null,
  };
}
