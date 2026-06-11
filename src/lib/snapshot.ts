/**
 * Ридер снимка каталога/цен (Фаза 2B).
 * Сайт читает ТОЛЬКО снимок (src/data/snapshots/catalog-snapshot-latest.json),
 * сгенерированный scripts/catalog/generate-snapshot.mjs. Никаких живых запросов
 * к API поставщиков из страниц. Нет снимка → пустой список (сайт не падает).
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
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
  specs?: Record<string, string>;  // характеристики поставщика (только заполненные)
  description?: string | null;
  updatedAt: string;
}

/** Подписи и единицы характеристик Döcke для карточки (только уверенные единицы). */
export const SPEC_LABELS: Record<string, { label: string; unit?: string }> = {
  length: { label: 'Длина', unit: 'мм' },
  width: { label: 'Ширина', unit: 'мм' },
  thickness: { label: 'Толщина', unit: 'мм' },
  area: { label: 'Рабочая площадь', unit: 'м²' },
  material: { label: 'Состав' },
  series: { label: 'Серия' },
  country_of_origin: { label: 'Страна производства' },
  warranty: { label: 'Гарантия' },
  foundation: { label: 'Основа' },
  topping: { label: 'Посыпка' },
  bitumen_type: { label: 'Тип битума' },
  m2_roll_area: { label: 'Площадь рулона', unit: 'м²' },
};

/** Подписи блока «Информация об упаковке». */
export const PACK_LABELS: Record<string, { label: string; unit?: string }> = {
  piece_amount_in_pack: { label: 'Кол-во в упаковке', unit: 'шт' },
  shingle_count_in_pack: { label: 'Гонтов в упаковке', unit: 'шт' },
  m2_area_in_pack: { label: 'Площадь в упаковке', unit: 'м²' },
  m2_amount_in_pack: { label: 'Площадь одной панели', unit: 'м²' },
  weight: { label: 'Вес', unit: 'кг' },
  packaging_volume: { label: 'Объём упаковки', unit: 'м³' },
  sold_in_pack: { label: 'Продаётся упаковкой' },
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

// Кэш с инвалидацией по mtime: обновлённый по cron/n8n снимок подхватывается
// без рестарта процесса (важно для прода).
let cache: SnapshotItem[] | null = null;
let cacheMtime = 0;
export function loadSnapshot(): SnapshotItem[] {
  if (!existsSync(SNAPSHOT_PATH)) return [];
  const mtime = statSync(SNAPSHOT_PATH).mtimeMs;
  if (cache && mtime === cacheMtime) return cache;
  try {
    cache = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf-8')) as SnapshotItem[];
    cacheMtime = mtime;
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
