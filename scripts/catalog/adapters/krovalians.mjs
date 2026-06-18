// Адаптер КровАльянс API (offline, Node ESM). Строго по инструкции 1.4 (см. docs/krovalians-api-rules.md).
// Каталог (/katalog), цены (/price: nomenclatures+soglashenie, ≤150). Остатки НЕ тянем.
// Запуск окружения: node --env-file=.env ...  (process.env.KROVAL_*)
// Legacy TLS обязателен (порт 8080).
import { Agent, fetch as undiciFetch } from 'undici';

const E = process.env;
const BASE = E.KROVAL_BASE_URL || 'https://b2b.krovalians.ru:8080/kroval/hs/api';
// Legacy TLS renegotiation + без проверки серта (как в src/lib/kroval.ts).
// Каталог ~200МБ → отключаем body/headers timeout; connect-таймаут больше (сервер КА бывает медленный).
const agent = new Agent({ connect: { rejectUnauthorized: false, timeout: 60000 }, bodyTimeout: 0, headersTimeout: 0 });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
/** Запрос с ретраями (сервер КА под нагрузкой даёт connect/timeout). */
async function postRetry(path, body, tries = 4) {
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await undiciFetch(`${BASE}${path}`, { method: 'POST', headers: headers(), body, dispatcher: agent });
      if (r.status === 401) throw new Error(`КровАльянс ${path}: 401 (логин/пароль/API_Key/регистр)`);
      if (!r.ok) throw new Error(`КровАльянс ${path}: HTTP ${r.status}`);
      return r;
    } catch (e) {
      lastErr = e;
      if (String(e.message).includes('401')) throw e;        // авторизацию не ретраим
      await sleep(1500 * (i + 1));                            // backoff 1.5/3/4.5с
    }
  }
  throw lastErr;
}

function headers() {
  if (!E.KROVAL_USER || !E.KROVAL_PASSWORD || !E.KROVAL_API_KEY) throw new Error('КровАльянс: нет KROVAL_USER/PASSWORD/API_KEY в .env');
  const auth = 'Basic ' + Buffer.from(`${E.KROVAL_USER}:${E.KROVAL_PASSWORD}`, 'utf-8').toString('base64');
  // ВНИМАНИЕ: имя заголовка строго API_Key (регистр!)
  return { 'Content-Type': 'application/json; charset=UTF-8', API_Key: E.KROVAL_API_KEY, API_Version: E.KROVAL_API_VERSION || '1.1', Authorization: auth };
}

/** Полный каталог номенклатуры → массив сырых товаров (ЭтоГруппа:false). Большой (~200МБ). */
export async function fetchKatalog() {
  const r = await postRetry('/katalog', '{"katalog":"full"}', 3);
  const data = await r.json();
  return data['КаталогНоменклатуры'] || [];
}

/** Выборка живых товаров без полной загрузки: стримом собирает N объектов ВНУТРИ массива
 *  "КаталогНоменклатуры". Для проверок (не для прода — прод читает fetchKatalog целиком). */
export async function fetchKatalogSample(maxItems = 200) {
  const r = await undiciFetch(`${BASE}/katalog`, { method: 'POST', headers: headers(), body: '{"katalog":"full"}', dispatcher: agent });
  if (!r.ok) throw new Error(`КровАльянс /katalog: HTTP ${r.status}`);
  const items = []; let buf = ''; let started = false;
  const reader = r.body.getReader(); const dec = new TextDecoder('utf-8');
  outer: while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    // пропускаем корневой объект-обёртку: ждём начало массива
    if (!started) {
      const a = buf.indexOf('[');
      if (a < 0) { buf = buf.slice(-50); continue; }
      buf = buf.slice(a + 1); started = true;
    }
    // собираем сбалансированные объекты {…} один за другим
    while (true) {
      const start = buf.indexOf('{');
      if (start < 0) { buf = ''; break; }
      let depth = 0, end = -1, inStr = false, esc = false;
      for (let j = start; j < buf.length; j++) {
        const ch = buf[j];
        if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; }
        else { if (ch === '"') inStr = true; else if (ch === '{') depth++; else if (ch === '}') { depth--; if (depth === 0) { end = j; break; } } }
      }
      if (end < 0) { buf = buf.slice(start); break; } // объект не дочитан — ждём chunk
      const objStr = buf.slice(start, end + 1);
      buf = buf.slice(end + 1);
      try { const o = JSON.parse(objStr); if (o['Код'] && o['ЭтоГруппа'] === false) { items.push(o); if (items.length >= maxItems) break outer; } } catch {}
    }
  }
  try { await reader.cancel(); } catch {}
  return items;
}

/** Цены по кодам (батч ≤150) → Map(kod → {price, discounted_price}). soglashenie обязателен.
 *  Устойчиво к сбоям: пачка с ошибкой после ретраев пропускается (эти коды → «по запросу»),
 *  весь прогон не валится. Возвращает {map, failedBatches}. */
export async function fetchPrices(kods) {
  const sogl = E.KROVAL_SOGLASHENIE;
  if (!sogl) throw new Error('КровАльянс /price: нет KROVAL_SOGLASHENIE в .env');
  const out = new Map();
  let failedBatches = 0;
  for (let i = 0; i < kods.length; i += 150) {
    const batch = kods.slice(i, i + 150);
    try {
      const r = await postRetry('/price', JSON.stringify({ nomenclatures: batch, soglashenie: sogl }));
      const d = await r.json();
      for (const p of (d.prices || [])) {
        if (p.kod != null) out.set(String(p.kod), { price: Number(p.price) || 0, discounted_price: Number(p.discounted_price) || 0 });
      }
    } catch (e) {
      if (String(e.message).includes('401')) throw e;
      failedBatches++;                                       // пропускаем пачку, не валим прогон
    }
    await sleep(150);                                        // пауза, чтобы не перегружать сервер КА
  }
  out.failedBatches = failedBatches;
  return out;
}
