export interface CatalogSlugAlias {
  targetCategory: string;
  targetSubcategory?: string;
  currentCategory: string;
  currentSubcategory?: string;
  reason: string;
}

export const catalogSlugAliases: CatalogSlugAlias[] = [
  {
    targetCategory: 'krovlya',
    targetSubcategory: 'metallocherepica',
    currentCategory: 'krovlya',
    currentSubcategory: 'metallocherepitsa',
    reason: 'Different transliteration standard.',
  },
  {
    targetCategory: 'krovlya',
    targetSubcategory: 'falcevaya-krovlya',
    currentCategory: 'krovlya',
    currentSubcategory: 'faltsevaya',
    reason: 'Current project uses shorter slug.',
  },
  {
    targetCategory: 'krovlya',
    targetSubcategory: 'rulonnye-krovelnye-materialy',
    currentCategory: 'krovlya',
    currentSubcategory: 'rulonnye-materialy',
    reason: 'Current project uses shorter slug.',
  },
  {
    targetCategory: 'vodostok',
    targetSubcategory: 'metallicheskie-vodostochnye-sistemy',
    currentCategory: 'vodostok',
    currentSubcategory: 'metallicheskiy-vodostok',
    reason: 'Current project uses product-short slug.',
  },
  {
    targetCategory: 'vodostok',
    targetSubcategory: 'plastikovye-vodostochnye-sistemy',
    currentCategory: 'vodostok',
    currentSubcategory: 'plastikovy-vodostok',
    reason: 'Current project uses product-short slug.',
  },
  {
    targetCategory: 'fasad',
    targetSubcategory: 'sayding-metallicheskiy',
    currentCategory: 'fasad',
    currentSubcategory: 'metallicheskiy-sayding',
    reason: 'Word order differs between target taxonomy and current site.',
  },
  {
    targetCategory: 'fasad',
    targetSubcategory: 'sayding-vinilovyy',
    currentCategory: 'fasad',
    currentSubcategory: 'vinilovyy-sayding',
    reason: 'Word order differs between target taxonomy and current site.',
  },
  {
    targetCategory: 'fasad',
    targetSubcategory: 'sayding-fibrocementyy',
    currentCategory: 'fasad',
    currentSubcategory: 'fibrocementnyy-sayding',
    reason: 'Word order and transliteration differ.',
  },
  {
    targetCategory: 'fasad',
    targetSubcategory: 'fasadnye-termopaneli',
    currentCategory: 'fasad',
    currentSubcategory: 'termopaнели',
    reason: 'Current data file uses legacy mixed slug; needs later normalization.',
  },
  {
    targetCategory: 'komplektuyuschie',
    currentCategory: 'komplektuyushchie',
    reason: 'Category transliteration differs.',
  },
  {
    targetCategory: 'blagoustroystvo-uchastka',
    currentCategory: 'blagoustrojstvo',
    reason: 'Current project uses shorter category slug.',
  },
  {
    targetCategory: 'uteplenie-i-izolyaciya',
    currentCategory: 'uteplenie',
    reason: 'Current project uses shorter category slug.',
  },
  {
    targetCategory: 'ventilyaciya',
    currentCategory: 'ventilyatsiya',
    reason: 'Transliteration differs.',
  },
];

export function resolveCurrentCatalogPath(category: string, subcategory?: string) {
  const alias = catalogSlugAliases.find(item =>
    item.targetCategory === category &&
    (item.targetSubcategory ?? '') === (subcategory ?? '')
  );

  if (!alias) {
    return { category, subcategory };
  }

  return {
    category: alias.currentCategory,
    subcategory: alias.currentSubcategory ?? subcategory,
  };
}

export function resolveTargetCatalogPath(category: string, subcategory?: string) {
  const alias = catalogSlugAliases.find(item =>
    item.currentCategory === category &&
    (item.currentSubcategory ?? '') === (subcategory ?? '')
  );

  if (!alias) {
    return { category, subcategory };
  }

  return {
    category: alias.targetCategory,
    subcategory: alias.targetSubcategory ?? subcategory,
  };
}
