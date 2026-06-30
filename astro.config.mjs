// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Timeweb MVP — статический сайт (output: 'static'), без Node-адаптера.
// Каталог рендерится из маленького demo-набора (src/data/catalog-demo.json).
// Полный каталог 230k со SSR — позже на Cloudflare (docs/CLOUDFLARE_SSR_ROADMAP.md).
//
// STAGING=1 → сборка под подпапку /new-site/ (staging на Timeweb).
//   Ассеты (/_astro/) Astro префиксует base автоматически.
//   ВНИМАНИЕ: внутренние ссылки в разметке абсолютные (href="/catalog/..."),
//   они НЕ получают префикс base — для полноценного staging под /new-site/
//   предпочтительнее отдельный поддомен. Прод (base:'/') этим не затронут.
const STAGING = process.env.STAGING === '1';

// https://astro.build/config
export default defineConfig({
  site: 'https://y-stroika.ru',
  base: STAGING ? '/new-site/' : '/',
  output: 'static',
  integrations: [
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});
