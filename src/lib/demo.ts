/**
 * Demo-набор каталога для Timeweb MVP (статический сайт).
 *
 * Источник: src/data/catalog-demo.json — маленький курируемый файл (коммитится),
 * сгенерированный scripts/catalog/build-demo-dataset.mjs из снимка каталога.
 * Полный снимок (20 МБ / 31 799 позиций) и сырьё 230k НЕ попадают ни в репозиторий,
 * ни в браузер. Полный каталог — позже на Cloudflare SSR (docs/CLOUDFLARE_SSR_ROADMAP.md).
 *
 * Импортируется ТОЛЬКО во frontmatter страниц (build-time), не в клиентский бандл.
 */
import demoRaw from '../data/catalog-demo.json';
import type { SnapshotItem } from './snapshot';
import { humanUnit } from './snapshot';

export const demoItems: SnapshotItem[] = demoRaw as unknown as SnapshotItem[];

/** Карточка для ProductCard (серверная цена из demo-набора). */
export function toCard(i: SnapshotItem) {
  return {
    kod: i.vendor,
    name: i.name ?? i.vendor,
    artikul: i.vendor,
    unit: humanUnit(i.unit),
    brand: i.brand ?? '',
    image: i.images?.[0] ?? null,
    price: i.price,            // null = «по запросу»
    serverPriced: true,
  };
}

/** Товары demo-набора для подкатегории. */
export function demoItemsFor(categorySlug: string, subcategorySlug: string): SnapshotItem[] {
  const key = `${categorySlug}/${subcategorySlug}`;
  return demoItems.filter(i => i.category === key);
}

/** Один товар demo по паре+коду. */
export function demoItemByVendor(categorySlug: string, subcategorySlug: string, vendor: string): SnapshotItem | undefined {
  const key = `${categorySlug}/${subcategorySlug}`;
  return demoItems.find(i => i.category === key && i.vendor === vendor);
}

/** Топ-товары для витрины (с фото и ценой). */
export function demoTop(n = 8): SnapshotItem[] {
  return demoItems
    .filter(i => (i.images?.length ?? 0) > 0 && typeof i.price === 'number' && (i.price as number) > 0)
    .slice(0, n);
}

/** Все пути карточек для getStaticPaths: {category, subcategory, code}. */
export function demoCodeParams(): { category: string; subcategory: string; code: string }[] {
  const out: { category: string; subcategory: string; code: string }[] = [];
  for (const i of demoItems) {
    const parts = (i.category || '').split('/');
    if (parts.length !== 2) continue;
    if (!i.vendor) continue;
    out.push({ category: parts[0], subcategory: parts[1], code: i.vendor });
  }
  return out;
}
