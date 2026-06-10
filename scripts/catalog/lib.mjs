// Общие helpers конвейера каталога/цен.

const TRANSLIT = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya' };

export function slugify(s) {
  return String(s || '').toLowerCase()
    .split('').map(c => TRANSLIT[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

/** Стабильный productId: docke-<vendor>. vendor уникален у Döcke. */
export function makeProductId(item) {
  const base = slugify(item.vendorCode || item.supplierSku || item.name);
  return `${item.source}-${base}`;
}

/** Категория сайта по правилам (name+collection, первое совпадение) → slug | null. */
export function inferCategory(item, rules) {
  const hay = `${item.name || ''} ${item.collection || ''}`.toLowerCase();
  for (const r of rules) {
    if (r.match.some(kw => hay.includes(kw.toLowerCase()))) return r.category;
  }
  return null;
}

/** Поднять category-uuid до верхней ветки (прямой потомок корня) → uuid ветки | null. */
export function topBranchOf(uuid, byUuid, rootUuid) {
  let cur = byUuid.get(uuid);
  let guard = 0;
  while (cur && cur.parent_uuid && cur.parent_uuid !== rootUuid && guard++ < 60) {
    const parent = byUuid.get(cur.parent_uuid);
    if (!parent) break;
    cur = parent;
  }
  return cur && cur.parent_uuid === rootUuid ? cur.uuid : null;
}

/** Категория сайта по дереву Döcke: первый category-uuid товара, чья ветка замаплена в непустую категорию. */
export function resolveCategoryByTree(categoryUuids, byUuid, rootUuid, branchMap) {
  for (const u of categoryUuids || []) {
    const branch = topBranchOf(u, byUuid, rootUuid);
    if (branch && branchMap[branch]) return branchMap[branch];
  }
  return null;
}

export function roundTo(value, step = 10, mode = 'up') {
  if (!value || value <= 0) return value;
  const f = mode === 'down' ? Math.floor : mode === 'nearest' ? Math.round : Math.ceil;
  return f(value / step) * step;
}

/** Публичная цена: РРЦ → округление; override имеет приоритет. null если нет цены. */
export function applyPrice(item, rules, productId) {
  const ov = rules.overrides?.[productId];
  if (ov && ov.mode === 'manual' && ov.price > 0) return roundTo(ov.price, rules.rounding.step, rules.rounding.mode);
  if (rules.priceMode === 'rrp') {
    if (!item.basePrice || item.basePrice <= 0) return null;
    let p = roundTo(item.basePrice, rules.rounding.step, rules.rounding.mode);
    // каркас наценки (сейчас выключен)
    if (rules.markup?.enabled) {
      const pct = rules.markup.byCategory?.[item.category] ?? rules.markup.byBrand?.[item.brand] ?? rules.markup.defaultPercent ?? 0;
      p = roundTo(item.basePrice * (1 + pct / 100), rules.rounding.step, rules.rounding.mode);
    }
    return p;
  }
  return null;
}
