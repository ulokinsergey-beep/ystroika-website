// Адаптер КровАльянс: цены по списку кодов (батчи по 150). Секреты из env (.env).
// Критично: КровАльянс nginx требует legacy TLS renegotiation → undici Agent
// (native fetch падает). Формат повторяет рабочий src/lib/kroval.ts.
// Поля цены: kod, price (прайс/база), discounted_price (закупка со скидкой дилера).

import { Agent, fetch as uFetch } from 'undici';

const agent = new Agent({
  connect: { rejectUnauthorized: false, secureOptions: 0x00040000 }, // SSL_OP_LEGACY_SERVER_CONNECT
  keepAliveTimeout: 60_000, keepAliveMaxTimeout: 300_000,
});

function cfg() {
  const c = {
    baseUrl: process.env.KROVAL_BASE_URL || 'https://b2b.krovalians.ru:8080/kroval/hs/api',
    user: process.env.KROVAL_USER,
    password: process.env.KROVAL_PASSWORD,
    apiKey: process.env.KROVAL_API_KEY,
    soglashenie: process.env.KROVAL_SOGLASHENIE,
    apiVersion: process.env.KROVAL_API_VERSION || '1.1',
  };
  for (const k of ['user', 'password', 'apiKey', 'soglashenie']) {
    if (!c[k]) throw new Error(`[krovalians] нет env KROVAL_${k.toUpperCase()} (секреты из .env, не из кода)`);
  }
  return c;
}

function headers(c) {
  const b64 = Buffer.from(`${c.user}:${c.password}`, 'utf-8').toString('base64');
  return {
    'Content-Type': 'application/json; charset=UTF-8',
    API_Key: c.apiKey,
    API_Version: c.apiVersion,
    Authorization: `Basic ${b64}`,
  };
}

/** Цены по ≤150 кодам. @returns массив {kod, price, discounted_price}. */
async function fetchPricesChunk(kods, c) {
  const res = await uFetch(`${c.baseUrl}/price`, {
    method: 'POST',
    headers: headers(c),
    body: JSON.stringify({ nomenclatures: kods, soglashenie: c.soglashenie }),
    dispatcher: agent,
  });
  if (!res.ok) throw new Error(`[krovalians] /price HTTP ${res.status}`);
  const data = await res.json();
  const prices = data.prices;
  if (!Array.isArray(prices)) throw new Error('[krovalians] /price: prices не массив');
  return prices;
}

/** Цены для произвольного списка кодов (батчи по 150) → Map<kod, {price, discounted_price}>. */
export async function fetchKrovalPrices(kods) {
  const c = cfg();
  const map = new Map();
  for (let i = 0; i < kods.length; i += 150) {
    const chunk = kods.slice(i, i + 150);
    const prices = await fetchPricesChunk(chunk, c);
    for (const p of prices) map.set(p.kod, { price: Number(p.price), discounted_price: Number(p.discounted_price) });
  }
  return map;
}
