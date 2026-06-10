/**
 * Ридер снимка каталога/цен (Фаза 2B).
 * Сайт читает ТОЛЬКО снимок (src/data/snapshots/catalog-snapshot-latest.json),
 * сгенерированный scripts/catalog/generate-snapshot.mjs. Никаких живых запросов
 * к API поставщиков из страниц. Нет снимка → пустой список (сайт не падает).
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

export interface SnapshotItem {
  productId: string;
  category: string;          // "krovlya/gibkaya-cherepitsa"
  source: string;            // "docke"
  vendor: string;
  brand: string | null;
  name: string | null;
  collection: string | null;
  color: string | null;
  unit: string | null;       // код ОКЕИ ("796") или текст
  price: number | null;      // публичная цена (РРЦ→округление); null = «по запросу»
  currency: string;
  priceSource: string | null;
  availability: string;      // "unknown" — остатки не тянем
  images: string[];          // локальные пути или URL поставщика
  updatedAt: string;
}

const SNAPSHOT_PATH = resolve('src/data/snapshots/catalog-snapshot-latest.json');

// ОКЕИ → человекочитаемая единица (частые у Döcke)
const OKEI: Record<string, string> = {
  '796': 'шт', '778': 'упак', '006': 'м', '055': 'м²', '113': 'м³',
  '166': 'кг', '018': 'пог.м', '736': 'рул', '625': 'лист', '839': 'компл',
};
export function humanUnit(unit: string | null): string {
  if (!unit) return 'шт';
  return OKEI[unit] ?? unit;
}

let cache: SnapshotItem[] | null = null;
export function loadSnapshot(): SnapshotItem[] {
  if (cache) return cache;
  if (!existsSync(SNAPSHOT_PATH)) return (cache = []);
  try {
    cache = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf-8')) as SnapshotItem[];
  } catch {
    cache = [];
  }
  return cache;
}

/** Товары снимка для листинга категории/подкатегории. */
export function snapshotItemsFor(categorySlug: string, subcategorySlug: string): SnapshotItem[] {
  const key = `${categorySlug}/${subcategorySlug}`;
  return loadSnapshot().filter(i => i.category === key);
}

/** Поиск товара по vendor-коду (для карточки товара). */
export function snapshotItemByVendor(vendor: string): SnapshotItem | undefined {
  return loadSnapshot().find(i => i.vendor === vendor);
}
