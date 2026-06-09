// Скриншоты страниц услуг для визуальной сверки с Figma.
// Запуск: node scripts/shot-uslugi.mjs <slug> [width] [outName] [selector]
//   <slug>     — slug услуги (или 'full-url' если начинается с http)
//   [width]    — 1920 (по умолч.) или 1440
//   [outName]  — имя файла без расширения (по умолч. <slug>-<width>)
//   [selector] — CSS-селектор секции для element.screenshot (опц.)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const slug = process.argv[2] || 'montazh-stropilnoy-sistemy';
const width = parseInt(process.argv[3] || '1920', 10);
const outName = process.argv[4] || `${slug}-${width}`;
const selector = process.argv[5] || null;

mkdirSync('tmp-uslugi-shots', { recursive: true });

const url = slug.startsWith('http') ? slug : `http://localhost:4321/uslugi/${slug}/`;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width, height: 1080 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

try {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 35000 });
  await page.waitForTimeout(1500);
  const path = `tmp-uslugi-shots/${outName}.png`;
  if (selector) {
    const el = await page.$(selector);
    if (!el) { console.log('NO-SELECTOR', selector); }
    else { await el.screenshot({ path }); console.log('ok-section', path); }
  } else {
    await page.screenshot({ path, fullPage: true });
    console.log('ok-full', path);
  }
} catch (e) {
  console.log('FAIL', e.message);
}

await browser.close();
console.log('DONE');
