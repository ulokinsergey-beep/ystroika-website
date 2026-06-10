// Адаптер Döcke B2B API. Достаёт СЫРЬЁ (auth + РРЦ + каталог).
// Секреты — ТОЛЬКО из env (process.env), не в коде. См. docs/catalog-pricing-architecture.md §10.
// Портативно: чистый Node 20 (global fetch), без зависимостей.

const BASE = process.env.DOCKE_BASE_URL || 'https://b2b.docke.ru';

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`[docke] нет env-переменной ${name} (секреты из env, не из кода)`);
  return v;
}

async function postJson(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`[docke] ${path} → HTTP ${res.status}`);
  const json = await res.json();
  if (json.status === 'error') throw new Error(`[docke] ${path} → ${JSON.stringify(json.messages)}`);
  return json;
}

/** Авторизация → { token, agreeUuid, factoryUuid }. */
export async function authenticate() {
  const login = requireEnv('DOCKE_LOGIN');
  const password = requireEnv('DOCKE_PASSWORD');
  const r = await postJson('/api/client/auth', { login, password });
  const data = r.data || {};
  const token = data.token;
  const agreeUuid = data.agrees?.[0]?.uuid;
  // «Оба завода» если есть, иначе первый завод
  const both = (data.factories || []).find(f => /оба/i.test(f.name || ''));
  const factoryUuid = (both || data.factories?.[0])?.uuid;
  if (!token || !agreeUuid) throw new Error('[docke] auth: нет token/agree_uuid');
  return { token, agreeUuid, factoryUuid };
}

/** РРЦ (рекомендованная розничная цена) → Map<vendor, {price, measure}>. Это цена продажи. */
export async function fetchRrpPrices({ token, agreeUuid, factoryUuid }) {
  const r = await postJson('/api/client/prices/rrp/get', { agree_uuid: agreeUuid, factory_uuid: factoryUuid }, token);
  const list = r.prices || r.data?.prices || [];
  const map = new Map();
  for (const x of list) {
    // плоский формат {vendor, measure, price}; на всякий — вложенный {vendor, prices:[{measure,price}]}
    if (x.price != null) map.set(x.vendor, { price: Number(x.price), measure: x.measure });
    else if (Array.isArray(x.prices) && x.prices[0]) map.set(x.vendor, { price: Number(x.prices[0].price), measure: x.prices[0].measure });
  }
  return map;
}

/** Каталог (номенклатура). limitPages — ограничение для теста; null = все страницы. */
export async function fetchCatalog({ token, agreeUuid }, { perPage = 200, limitPages = null } = {}) {
  const all = [];
  let page = 1, pageCount = 1;
  do {
    const r = await postJson('/api/client/product/get', { agree_uuid: agreeUuid, offset: perPage, page }, token);
    const products = r.products || r.data?.products || [];
    pageCount = Number(r.pagecount || r.data?.pagecount || 1);
    all.push(...products);
    page += 1;
    if (limitPages && page > limitPages) break;
  } while (page <= pageCount);
  return { products: all, pageCount };
}

/** Полный забор сырья Döcke: каталог + РРЦ. */
export async function fetchDockeRaw(opts = {}) {
  const session = await authenticate();
  const [{ products, pageCount }, rrp] = await Promise.all([
    fetchCatalog(session, opts),
    fetchRrpPrices(session),
  ]);
  return { products, pageCount, rrp, fetchedAt: opts.now || null };
}
