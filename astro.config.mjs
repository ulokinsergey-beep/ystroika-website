// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  site: 'https://y-stroika.ru',
  // output: 'static' (default) + adapter даёт hybrid-режим автоматически
  // Страницы с export const prerender = false → SSR, остальные → SSG
  adapter: node({ mode: 'standalone' }),
  integrations: [
    sitemap(),
  ],
  server: {
    host: true,  // слушать на 0.0.0.0 (все интерфейсы, включая IPv4)
    port: 4321,
  },
  vite: {
    plugins: [tailwindcss()]
  }
});