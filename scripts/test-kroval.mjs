/**
 * Smoke-test KrovAlians API.
 * Loads .env, calls /exchange (fast), /price (fast), /katalog (slow ~150s).
 *
 * Run: node scripts/test-kroval.mjs
 * Run (skip katalog): SKIP_KATALOG=1 node scripts/test-kroval.mjs
 *
 * Verified: 2026-06-03
 * Host: https://b2b.krovalians.ru:8080 (HTTPS, legacy TLS renegotiation via undici)
 * Catalog: 222187 products, 7722 groups, ~312 MB, ~150 sec download
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Agent } from 'undici';

// КровАльянс nginx требует TLS renegotiation — Node fetch штатно не поддерживает.
// b2b.krovalians.ru:8080 — HTTPS (несмотря на нестандартный порт).
const krovalAgent = new Agent({
  connect: {
    rejectUnauthorized: false,
    secureOptions: 0x00040000, // SSL_OP_LEGACY_SERVER_CONNECT
  },
  keepAliveTimeout: 60_000,
  keepAliveMaxTimeout: 300_000,
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Manual .env loader (no dependency on dotenv)
const envText = readFileSync(resolve(root, '.env'), 'utf-8');
const env = Object.fromEntries(
  envText
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const [k, ...rest] = l.split('=');
      return [k.trim(), rest.join('=').trim()];
    })
);

const KROVAL = {
  baseUrl: env.KROVAL_BASE_URL || 'https://b2b.krovalians.ru:8080/kroval/hs/api',
  user: env.KROVAL_USER,
  password: env.KROVAL_PASSWORD,
  apiKey: env.KROVAL_API_KEY,
  soglashenie: env.KROVAL_SOGLASHENIE,
  apiVersion: env.KROVAL_API_VERSION || '1.1',
};

function headers() {
  // ВАЖНО: username кириллический — нужен UTF-8 base64
  const b64 = Buffer.from(`${KROVAL.user}:${KROVAL.password}`, 'utf-8').toString('base64');
  return {
    'Content-Type': 'application/json; charset=UTF-8',
    API_Key: KROVAL.apiKey,
    API_Version: KROVAL.apiVersion,
    Authorization: `Basic ${b64}`,
  };
}

function mask(s) {
  if (!s) return '<empty>';
  if (s.length <= 8) return '***';
  return `${s.slice(0, 4)}...${s.slice(-4)}`;
}

console.log('=== KrovAlians smoke test ===');
console.log('base:', KROVAL.baseUrl);
console.log('user:', KROVAL.user);
console.log('password:', mask(KROVAL.password));
console.log('apiKey:', mask(KROVAL.apiKey));
console.log('soglashenie:', mask(KROVAL.soglashenie));
console.log();

async function step(name, fn) {
  const t0 = Date.now();
  try {
    const r = await fn();
    console.log(`✓ ${name} (${Date.now() - t0}ms)`);
    return r;
  } catch (e) {
    console.error(`✗ ${name} FAILED (${Date.now() - t0}ms):`, e.message);
    throw e;
  }
}

const dataDir = resolve(root, 'src', 'data');
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

try {
  // STEP 1: /exchange — быстрая проверка авторизации и связи
  const stocks = await step('POST /exchange (auth check)', async () => {
    const r = await fetch(`${KROVAL.baseUrl}/exchange`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ nomenclatures: ['Ф0001087010'] }),
      dispatcher: krovalAgent,
    });
    if (r.status === 401) throw new Error(`HTTP 401 — неверный логин/пароль/API_Key`);
    if (!r.ok) throw new Error(`HTTP ${r.status} — ${(await r.text()).slice(0, 200)}`);
    return await r.json();
  });
  console.log('  stocks:', JSON.stringify(stocks['КодыИОстатки'] || {}));

  // STEP 2: /price — проверка soglashenie
  const prices = await step('POST /price (soglashenie check)', async () => {
    const r = await fetch(`${KROVAL.baseUrl}/price`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        nomenclatures: ['Ф0001087010', 'Ф0001075884', 'Ф0001075874'],
        soglashenie: KROVAL.soglashenie,
      }),
      dispatcher: krovalAgent,
    });
    if (r.status === 401) throw new Error(`HTTP 401`);
    if (!r.ok) throw new Error(`HTTP ${r.status} — ${(await r.text()).slice(0, 200)}`);
    return await r.json();
  });
  console.log(`  prices returned: ${(prices.prices || []).length}`);
  if ((prices.prices || []).length > 0) {
    console.log('  sample:', JSON.stringify(prices.prices[0]));
  }

  // STEP 3: /katalog — полный каталог (~312 МБ, ~150 секунд)
  if (process.env.SKIP_KATALOG === '1') {
    console.log('\n[SKIP_KATALOG=1] Пропускаем /katalog');
  } else {
    console.log('\nЗапускаем /katalog (~150 сек, ~312 МБ)...');
    const catalog = await step('POST /katalog (full, ~150s)', async () => {
      const r = await fetch(`${KROVAL.baseUrl}/katalog`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ katalog: 'full' }),
        dispatcher: krovalAgent,
        signal: AbortSignal.timeout(300_000),
      });
      if (r.status === 401) throw new Error(`HTTP 401`);
      if (!r.ok) throw new Error(`HTTP ${r.status} — ${(await r.text()).slice(0, 200)}`);
      return await r.json();
    });

    const items = catalog['КаталогНоменклатуры'] || [];
    const groups = items.filter((x) => x['ЭтоГруппа'] === true || x['ЭтоГруппа'] === 'true');
    const leaves = items.filter((x) => x['ЭтоГруппа'] !== true && x['ЭтоГруппа'] !== 'true');
    console.log(`  total items: ${items.length}`);
    console.log(`  groups: ${groups.length}, products: ${leaves.length}`);
    if (items.length > 0) {
      console.log('  sample first:', JSON.stringify(items[0], null, 2).slice(0, 400));
    }

    // Сохраняем метаданные (не весь каталог — он 312 МБ)
    const metaPath = resolve(dataDir, 'krovalians-catalog-meta.json');
    const meta = {
      fetchedAt: new Date().toISOString(),
      host: KROVAL.baseUrl,
      stats: {
        totalItems: items.length,
        products: leaves.length,
        groups: groups.length,
      },
      sampleItems: items.slice(0, 3),
    };
    writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    console.log(`  saved metadata: ${metaPath}`);
  }

  console.log('\nALL OK ✓');
} catch (e) {
  console.error('\nFAILED:', e.message);
  process.exit(1);
}
