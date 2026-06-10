// Движок цены. Цена продажи = РРЦ → округление (priceMode 'rrp'); либо ручной override.
// docs/catalog-pricing-architecture.md §5, §14.

export function roundPrice(value, rounding) {
  const step = rounding?.step || 1;
  if (step <= 1) return Math.round(value);
  return rounding?.mode === 'up' ? Math.ceil(value / step) * step : Math.round(value / step) * step;
}

/** @returns {number|null} цена продажи или null (нет цены → «по запросу»). */
export function computeSellingPrice({ basePrice, productId }, rules) {
  const ov = rules.overrides?.[productId];
  if (ov && ov.mode === 'manual' && ov.price != null) return roundPrice(Number(ov.price), rules.rounding);
  if (basePrice == null || !(Number(basePrice) > 0)) return null;
  // priceMode 'rrp': basePrice уже РРЦ → только округление
  return roundPrice(Number(basePrice), rules.rounding);
}
