// Адаптер Döcke B2B API (offline, Node ESM).
// Достаёт СЫРЬЁ из API: auth → РРЦ-прайс + каталог. Без нормализации/маппинга.
// Запуск окружения: node --env-file=.env ...  (читает process.env.DOCKE_*)
// Проверено вживую 2026-06-10. Остатки НЕ тянем (по решению владельца).

const BASE = process.env.DOCKE_BASE_URL || 'https://b2b.docke.ru';
const LOGIN = process.env.DOCKE_LOGIN;
const PASSWORD = process.env.DOCKE_PASSWORD;

async function post(path, body, token, retries = 3) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(BASE + path, { method: 'POST', headers, body: JSON.stringify(body) });
      if (res.status === 401) throw Object.assign(new Error(`Döcke ${path}: 401 Unauthorized — проверь DOCKE_LOGIN/PASSWORD в .env`), { noRetry: true });
      if (!res.ok) throw new Error(`Döcke ${path}: HTTP ${res.status} — ${(await res.text()).slice(0, 200)}`);
      return await res.json();
    } catch (e) {
      // сетевые обрывы (fetch failed/timeout) ретраим; 401 — нет
      if (e.noRetry || attempt > retries) throw e;
      await new Promise(r => setTimeout(r, 1500 * attempt));
    }
  }
}

/** Авторизация → { token, agreeUuid, factoryUuid, raw } */
export async function authDocke() {
  if (!LOGIN || !PASSWORD) throw new Error('Döcke: нет DOCKE_LOGIN/DOCKE_PASSWORD в .env');
  const r = await post('/api/client/auth', { login: LOGIN, password: PASSWORD });
  const d = r.data || r;
  const token = d.token;
  if (!token) throw new Error('Döcke auth: нет токена в ответе');
  const agrees = d.agrees || [];
  const factories = d.factories || [];
  const agreeUuid = agrees[0]?.uuid;
  // Предпочитаем фабрику «Оба завода» (полный охват), иначе первую
  const both = factories.find(f => /оба|both/i.test(f.name || ''));
  const factoryUuid = (both || factories[factories.length - 1] || factories[0])?.uuid;
  if (!agreeUuid || !factoryUuid) throw new Error('Döcke auth: нет agree_uuid/factory_uuid');
  return { token, agreeUuid, factoryUuid, agrees, factories };
}

/** РРЦ-прайс → Map(vendor → { measure, price }) */
export async function fetchRrpPrices({ token, agreeUuid, factoryUuid }) {
  const r = await post('/api/client/prices/rrp/get', { agree_uuid: agreeUuid, factory_uuid: factoryUuid }, token);
  const list = r.prices || [];
  const map = new Map();
  for (const p of list) {
    // плоская структура {vendor, measure, price}
    if (p.vendor != null && p.price != null) map.set(String(p.vendor), { measure: p.measure, price: Number(p.price) });
  }
  return map;
}

// ВНИМАНИЕ: у Döcke `offset` в product/get = РАЗМЕР СТРАНИЦЫ (не смещение!),
// `page` = номер страницы. offset:200, page:1 → 200 товаров, pagecount=94.
const PAGE_SIZE = 200;

/** Вызов с авто-reauth: JWT живёт недолго — при 401 в длинном прогоне переавторизуемся и повторяем. */
async function postWithReauth(ctx, path, body) {
  try {
    return await post(path, body, ctx.token);
  } catch (e) {
    if (!/401/.test(e.message || '')) throw e;
    const fresh = await authDocke();
    ctx.token = fresh.token; // обновляем токен в общем контексте прогона
    return await post(path, body, ctx.token);
  }
}

/** Одна страница каталога → { products[], pagecount } */
export async function fetchCatalogPage(ctx, page = 1, pageSize = PAGE_SIZE) {
  const r = await postWithReauth(ctx, '/api/client/product/get', { agree_uuid: ctx.agreeUuid, offset: pageSize, page });
  return { products: r.products || [], pagecount: r.pagecount || 1 };
}

/** Весь каталог (с пагинацией). limitPages — для тестов. */
export async function fetchAllCatalog(ctx, limitPages = Infinity) {
  const first = await fetchCatalogPage(ctx, 1);
  const total = Math.min(first.pagecount, limitPages);
  let all = [...first.products];
  for (let p = 2; p <= total; p++) {
    const { products } = await fetchCatalogPage(ctx, p);
    all.push(...products);
  }
  return all;
}
