// Скриншоты страниц сайта для визуального анализа (Playwright Chromium).
// Запуск: node scripts/shot.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

mkdirSync('tmp-figma-audit/site', { recursive: true });

const PAGES = [
  ['home',     'http://localhost:4321/'],
  ['listing',  'http://localhost:4321/catalog/krovlya/metallocherepitsa'],
  ['card',     'http://localhost:4321/catalog/krovlya/metallocherepitsa/00-00134456'],
  ['about',    'http://localhost:4321/o-kompanii'],
  ['contacts', 'http://localhost:4321/kontakty'],
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();

for (const [name, url] of PAGES) {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 35000 });
    await page.waitForTimeout(2500); // дать клиентскому JS (цены, квиз) дорисоваться
    await page.screenshot({ path: `tmp-figma-audit/site/${name}.png`, fullPage: true });
    console.log('ok', name);
  } catch (e) {
    console.log('FAIL', name, e.message);
  }
}

await browser.close();
console.log('DONE-SHOTS');
