/**
 * KrovAlians B2B API SDK
 *
 * Документация: docx-инструкция «КровАльянс Api 1.4»
 * Хост: https://b2b.krovalians.ru:8080 (HTTPS, порт 8080, legacy TLS renegotiation)
 * Endpoints:
 *   POST /katalog   — полный справочник номенклатуры (~222k товаров, ~312 МБ)
 *   POST /exchange  — остатки товаров (method: remaining_goods)
 *   POST /price     — цены (до 150 кодов за запрос, обязателен soglashenie)
 *
 * Креды хранятся в .env (НЕ коммитить).
 * Проверено: 2026-06-03 — API работает, 222187 товаров, 7722 групп.
 */

import { Agent } from 'undici';

const env = (import.meta as any).env;

// КровАльянс nginx требует TLS renegotiation — встроенный Node fetch падает без agent.
// Хост b2b.krovalians.ru:8080 — HTTPS (не HTTP, несмотря на нестандартный порт).
const krovalAgent = new Agent({
  connect: {
    rejectUnauthorized: false,
    secureOptions: 0x00040000, // SSL_OP_LEGACY_SERVER_CONNECT — разрешает legacy renegotiation
  },
  keepAliveTimeout: 60_000,
  keepAliveMaxTimeout: 300_000,
});

export const KROVAL = {
  // Реальный API хост — b2b.krovalians.ru:8080 (HTTPS)
  // b2b.krovalians.ru:443 — SPA фронтенд, 1c.krovalians.ru — 503 upstream
  baseUrl: env.KROVAL_BASE_URL || 'https://b2b.krovalians.ru:8080/kroval/hs/api',
  user: env.KROVAL_USER as string,
  password: env.KROVAL_PASSWORD as string,
  apiKey: env.KROVAL_API_KEY as string,
  soglashenie: env.KROVAL_SOGLASHENIE as string,
  apiVersion: env.KROVAL_API_VERSION || '1.1',
};

function authHeader(): string {
  const raw = `${KROVAL.user}:${KROVAL.password}`;
  // Node + browser compatible base64 of UTF-8 string
  // ВАЖНО: username кириллический — нужен именно UTF-8 base64
  const b64 =
    typeof Buffer !== 'undefined'
      ? Buffer.from(raw, 'utf-8').toString('base64')
      : btoa(unescape(encodeURIComponent(raw)));
  return `Basic ${b64}`;
}

function headers(): Record<string, string> {
  return {
    'Content-Type': 'application/json; charset=UTF-8',
    API_Key: KROVAL.apiKey,
    API_Version: KROVAL.apiVersion,
    Authorization: authHeader(),
  };
}

export interface CatalogItem {
  // Основные поля
  UID: string;
  UID_Roditel: string;
  Артикул: string;
  Наименование: string;
  ЕдиницаИзмерения: string;
  ЭтоГруппа: boolean;
  Код: string;
  КодРодителя: string;
  // Дополнительные поля (реальный ответ API)
  Производитель?: string;
  ЦеноваяГруппа?: string;
  Марка?: string;
  ВесИспользовать?: string;
  ВесЕдиницаИзмерения?: string;
  ВесЗнаменатель?: string;
  ДлинаИспользовать?: string;
  ДлинаЕдиницаИзмерения?: string;
  ДлинаЧислитель?: string;
  ДлинаЗнаменатель?: string;
  ОбъемИспользовать?: string;
  ПлощадьИспользовать?: string;
  Упаковки?: any[];
}

export interface PriceItem {
  kod: string;
  price: number;
  discounted_price: number;
}

/** POST /katalog — полный справочник номенклатуры (~222k товаров, ~312 МБ, ~150 сек) */
export async function fetchCatalog(): Promise<CatalogItem[]> {
  const url = `${KROVAL.baseUrl}/katalog`;
  const res = await fetch(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ katalog: 'full' }),
    // @ts-expect-error undici dispatcher
    dispatcher: krovalAgent,
    signal: AbortSignal.timeout(300_000), // 5 минут — каталог большой
  });
  if (res.status === 401) throw new Error('KrovAlians: 401 Unauthorized — проверь user/password/API_Key');
  if (!res.ok) throw new Error(`KrovAlians /katalog: HTTP ${res.status} — ${await res.text()}`);
  const data: any = await res.json();
  const items = data['КаталогНоменклатуры'];
  if (!Array.isArray(items)) throw new Error('KrovAlians /katalog: КаталогНоменклатуры is not array');
  return items as CatalogItem[];
}

/** POST /exchange — остатки по списку кодов */
export async function fetchStock(nomenclatures: string[]): Promise<Record<string, number>> {
  const url = `${KROVAL.baseUrl}/exchange`;
  const res = await fetch(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ nomenclatures }),
    // @ts-expect-error undici dispatcher
    dispatcher: krovalAgent,
  });
  if (res.status === 401) throw new Error('KrovAlians: 401 Unauthorized');
  if (!res.ok) throw new Error(`KrovAlians /exchange: HTTP ${res.status} — ${await res.text()}`);
  const data: any = await res.json();
  const codes = data['КодыИОстатки'] || {};
  return codes as Record<string, number>;
}

/** POST /price — цены по списку кодов (макс 150 кодов за запрос) */
export async function fetchPrices(nomenclatures: string[]): Promise<PriceItem[]> {
  if (nomenclatures.length > 150) {
    throw new Error(`KrovAlians /price: limit 150 codes per request, got ${nomenclatures.length}`);
  }
  const url = `${KROVAL.baseUrl}/price`;
  const res = await fetch(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      nomenclatures,
      soglashenie: KROVAL.soglashenie,
    }),
    // @ts-expect-error undici dispatcher
    dispatcher: krovalAgent,
  });
  if (res.status === 401) throw new Error('KrovAlians: 401 Unauthorized');
  if (!res.ok) throw new Error(`KrovAlians /price: HTTP ${res.status} — ${await res.text()}`);
  const data: any = await res.json();
  const prices = data['prices'];
  if (!Array.isArray(prices)) throw new Error('KrovAlians /price: prices is not array');
  return prices as PriceItem[];
}

/** Auto-batch helper: получить цены для произвольного списка кодов, разбивая на batches по 150 */
export async function fetchPricesBatched(codes: string[]): Promise<PriceItem[]> {
  const out: PriceItem[] = [];
  for (let i = 0; i < codes.length; i += 150) {
    const batch = codes.slice(i, i + 150);
    const part = await fetchPrices(batch);
    out.push(...part);
  }
  return out;
}
