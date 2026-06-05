/**
 * Middleware: 301-редиректы для slug-алиасов каталога.
 *
 * Перехватывает URL вида /catalog/{targetCategory}/{targetSubcategory}/
 * и делает 301 на /catalog/{currentCategory}/{currentSubcategory}/
 *
 * Источник маппинга: src/data/catalogSlugMap.ts
 * Документация: docs/catalog-taxonomy-gap.md
 */

import { defineMiddleware } from 'astro:middleware';
import { catalogSlugAliases } from './data/catalogSlugMap';

// Строим lookup-таблицу: "source-path" -> "target-path"
// Только для slug-алиасов (не текущих путей)
const redirectMap = new Map<string, string>();

for (const alias of catalogSlugAliases) {
  // Редирект на уровне категории (без подкатегории)
  if (!alias.targetSubcategory) {
    const from = `/catalog/${alias.targetCategory}/`;
    const to   = `/catalog/${alias.currentCategory}/`;
    if (from !== to) redirectMap.set(from, to);
    continue;
  }

  // Редирект на уровне подкатегории
  const from = `/catalog/${alias.targetCategory}/${alias.targetSubcategory}/`;
  const to   = `/catalog/${alias.currentCategory}/${alias.currentSubcategory}/`;
  if (from !== to) redirectMap.set(from, to);
}

export const onRequest = defineMiddleware(async (context, next) => {
  const url = context.url;

  // Нормализуем путь: убираем query string, добавляем trailing slash если нет
  let pathname = url.pathname;
  if (pathname.startsWith('/catalog/') && !pathname.endsWith('/')) {
    pathname = pathname + '/';
  }

  const destination = redirectMap.get(pathname);
  if (destination) {
    // Сохраняем query string при редиректе
    const qs = url.search;
    return new Response(null, {
      status: 301,
      headers: {
        Location: destination + qs,
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  }

  return next();
});
