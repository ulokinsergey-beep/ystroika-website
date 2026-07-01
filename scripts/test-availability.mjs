// Юнит-тест единой логики наличия. Запуск: node scripts/test-availability.mjs
// Без внешних зависимостей (node:assert). Exit 1 при провале.
import assert from 'node:assert/strict';
import { resolveAvailability, getAvailabilityLabel } from '../src/lib/availability.mjs';

const cases = [
  // [вход, ожидаемый state, ожидаемый label]
  [undefined, 'unknown', 'Наличие уточняется'],
  [null, 'unknown', 'Наличие уточняется'],
  ['check', 'unknown', 'Наличие уточняется'],
  ['', 'unknown', 'Наличие уточняется'],
  ['whatever', 'unknown', 'Наличие уточняется'],
  ['in', 'in', 'В наличии'],
  [true, 'in', 'В наличии'],
  [5, 'in', 'В наличии'],
  [0, 'out', 'Под заказ'],
  [false, 'out', 'Под заказ'],
  ['out', 'out', 'Под заказ'],
];

let ok = 0;
for (const [input, state, label] of cases) {
  const r = resolveAvailability(input);
  assert.equal(r.state, state, `state для ${JSON.stringify(input)}: ${r.state} !== ${state}`);
  assert.equal(r.label, label, `label для ${JSON.stringify(input)}: ${r.label} !== ${label}`);
  ok++;
}

// Ключевой инвариант: неизвестное НИКОГДА не «В наличии».
for (const unknownish of [undefined, null, 'check', '', 'foo', {}, []]) {
  assert.notEqual(getAvailabilityLabel(unknownish), 'В наличии',
    `Ложное «В наличии» для неизвестного входа ${JSON.stringify(unknownish)}`);
}

console.log(`OK: ${ok}/${cases.length} кейсов + инвариант «неизвестное ≠ В наличии» пройдены.`);
