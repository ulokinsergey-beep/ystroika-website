// Единая логика статуса наличия для всего сайта У-Стройка.
//
// Продуктовый принцип (North Star): НЕЛЬЗЯ показывать «В наличии», если наличие
// НЕ подтверждено данными. Если остаток/наличие неизвестны — «Наличие уточняется».
//
// Вся логика наличия должна проходить ТОЛЬКО через эту функцию — не размазывать
// условия и подписи по компонентам, не оставлять hardcoded «В наличии».

/** @typedef {'in' | 'out' | 'unknown'} AvailabilityState */
/** @typedef {{ state: AvailabilityState, label: string }} Availability */

/**
 * Приводит произвольный вход к безопасному статусу наличия.
 *
 * Правила:
 *  - явно в наличии (`'in'` | `true` | число остатка > 0) → «В наличии»;
 *  - явно нет (`'out'` | `false` | ровно `0`, если такое поле реально приходит) → «Под заказ»;
 *  - неизвестно (`'check'` | `null` | `undefined` | нет поля | любое иное) → «Наличие уточняется».
 *
 * По умолчанию — самый безопасный вариант «Наличие уточняется»: наличие не выдумываем.
 *
 * @param {unknown} [stock] строка (`'in'`/`'check'`/…), boolean, число (остаток) или null/undefined
 * @returns {Availability}
 */
export function resolveAvailability(stock) {
  // Явное подтверждение наличия.
  if (stock === 'in' || stock === true || (typeof stock === 'number' && stock > 0)) {
    return { state: 'in', label: 'В наличии' };
  }
  // Явное отсутствие (в текущих данных проекта не встречается, но обрабатываем честно).
  if (stock === 'out' || stock === false || stock === 0) {
    return { state: 'out', label: 'Под заказ' };
  }
  // Наличие неизвестно — безопасный нейтральный статус.
  return { state: 'unknown', label: 'Наличие уточняется' };
}

/**
 * Шорткат: только подпись статуса наличия.
 * @param {unknown} [stock]
 * @returns {string}
 */
export function getAvailabilityLabel(stock) {
  return resolveAvailability(stock).label;
}
