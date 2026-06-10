// Скачивание картинок поставщика на сайт (самохостинг, не хотлинк).
// Картинки Döcke публичные. Идемпотентно: уже скачанные не качаем повторно.
// docs/catalog-pricing-architecture.md (требование: забрать все картинки Döcke на сайт).

import { existsSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { resolve, basename } from 'node:path';

const PUBLIC_DIR = (root) => resolve(root, '../public/images/catalog/docke');
const WEB_PREFIX = '/images/catalog/docke';

/** Имя файла из URL (basename), без query. */
function fileNameFromUrl(url) {
  try { return basename(new URL(url).pathname); } catch { return null; }
}

/**
 * Скачать одну картинку в public/images/catalog/docke/. Возвращает web-путь или null.
 * @param {string} url исходный URL картинки поставщика
 * @param {string} root корень catalog-sync (import.meta dir)
 */
export async function downloadImage(url, root) {
  if (!url) return null;
  const name = fileNameFromUrl(url);
  if (!name) return null;
  const dir = PUBLIC_DIR(root);
  mkdirSync(dir, { recursive: true });
  const dest = resolve(dir, name);
  const webPath = `${WEB_PREFIX}/${name}`;
  // идемпотентность: непустой файл уже есть → пропускаем
  if (existsSync(dest) && statSync(dest).size > 0) return webPath;
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) return null;
    writeFileSync(dest, buf);
    return webPath;
  } catch {
    return null;
  }
}

/** Скачать пачку картинок с ограничением параллелизма. items: [{url, key}]. */
export async function downloadImages(items, root, { concurrency = 6 } = {}) {
  const result = new Map(); // key -> webPath|null
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const cur = items[i++];
      result.set(cur.key, await downloadImage(cur.url, root));
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return result;
}
