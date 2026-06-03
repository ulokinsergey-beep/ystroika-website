/**
 * Маппинг наших URL-категорий → UID групп КровАльянса
 * Составлен: 2026-06-03 на основе анализа каталога (222k товаров, 7722 групп)
 *
 * Структура:
 *   categorySlug/subcategorySlug → массив UID корневых групп из API
 *   Одна подкатегория может агрегировать несколько групп поставщика.
 */

export interface KrovalGroupMapping {
  /** Массив UID групп КровАльянса (ЭтоГруппа: true) */
  krovalUids: string[];
  /** Наименование группы для справки */
  krovalNames: string[];
}

export type CategoryMap = Record<string, Record<string, KrovalGroupMapping>>;

export const KROVAL_CATEGORY_MAP: CategoryMap = {

  // ─────────────────────────────────────────────────────────────────
  // КРОВЛЯ
  // ─────────────────────────────────────────────────────────────────
  krovlya: {
    metallocherepitsa: {
      krovalUids: ['41e226e8'],
      krovalNames: ['Металлочерепица'],
    },
    'gibkaya-cherepitsa': {
      krovalUids: ['41e226d9'],
      krovalNames: ['Гибкая черепица'],
    },
    faltsevaya: {
      krovalUids: ['2fda46b3', '5da5ac22'],
      krovalNames: ['Фальцевая кровля', 'Медная кровля'],
    },
    profnastil: {
      krovalUids: ['b3880736', 'acbcc34c', '3562bc40'],
      krovalNames: [
        'ГРАНДЛАЙН (Профнастил, штакетник, профиль волновой)',
        'МЕТАЛЛПРОФИЛЬ (Профнастил, Штакетник, Профиль декоративный)',
        'Stynergy (профнастил/штакетник)',
      ],
    },
    'kompozitnaya-cherepitsa': {
      krovalUids: ['41e2290f'],
      krovalNames: ['Композитная черепица'],
    },
    'rulonnye-materialy': {
      krovalUids: ['51d3dc95', '06ca8208', '50ada81b'],
      krovalNames: ['Наплавляемая кровля', 'Руфлекс', 'Руфсистем'],
    },
    'cherepitsa-braas': {
      krovalUids: ['764560fd', '30a2c1f7'],
      krovalNames: ['Braas', 'BRAAS'],
    },
    'komplektuyushchie-krovli': {
      krovalUids: [
        '549a5e64', // Еврошифер / Ондулин
        '671234b2', // Кровельные проходы Master Flash
        '4840f0ab', // Элементы безопасности кровли
        '212efc17', // ТехноНиколь Кровельная вентиляция
        '5ecd262c', // Vilpe вентиляция
        '99d5a4b1', // Eurovent Кровельная вентиляция
        '7f15aea0', // Krovent Кровельная вентиляция
        '59967032', // Gervent
        'bac63dc0', // Герметизирующие ленты для примыканий
      ],
      krovalNames: ['Еврошифер', 'Кровельные проходы', 'Элементы безопасности', 'Вентиляция (разные бренды)'],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // ФАСАД
  // ─────────────────────────────────────────────────────────────────
  fasad: {
    'metallicheskiy-sayding': {
      krovalUids: ['e2aed800'],
      krovalNames: ['Металлический Сайдинг и Софиты'],
    },
    'vinilovyy-sayding': {
      krovalUids: ['8f7573c7', '86d45227'],
      krovalNames: ['Виниловый сайдинг', 'Софит (BRYZA, Gamrat, Gentek, ОЗЛК)'],
    },
    'fibrocementnyy-sayding': {
      krovalUids: ['102caf82', '5d653fb3'],
      krovalNames: ['Фиброцементный сайдинг', 'КАНЬОН фиброцементный фасад'],
    },
    'fasadnye-paneli': {
      krovalUids: ['14315b41'],
      krovalNames: ['Фасадные панели'],
    },
    'fasadnaya-plitka': {
      krovalUids: ['a05a8400', 'ea14c171', '263e1f0a', '0162504c'],
      krovalNames: ['Фасадная плитка HAUBERK (Технониколь)', 'Фасадная плитка Docke', 'EcoStone', 'White Hills'],
    },
    'termopaнели': {
      krovalUids: ['eb88b6c5', 'b04c3210'],
      krovalNames: ['Фасадные термопанели Аляска', 'Фасадные термопанели Мосстрой-31'],
    },
    podsistema: {
      krovalUids: [],
      krovalNames: [],
    },
    'dobornye-elementy': {
      krovalUids: [],
      krovalNames: [],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // ВОДОСТОК
  // ─────────────────────────────────────────────────────────────────
  vodostok: {
    'metallicheskiy-vodostok': {
      krovalUids: [
        '41e22826', // Стальная водосточная система
        '41e226d2', // Медная водосточная система
        '41e226d6', // Оцинкованная водосточная система
        '3d5570cf', // Galeco Qstalyo (сталь+ПВХ)
      ],
      krovalNames: ['Стальная водосточная система', 'Медная водосточная система', 'Оцинкованная водосточная система'],
    },
    'plastikovy-vodostok': {
      krovalUids: ['41e22702'],
      krovalNames: ['Пластиковая водосточная система'],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // ОГРАЖДЕНИЯ
  // ─────────────────────────────────────────────────────────────────
  ograzhdeniya: {
    zabory: {
      krovalUids: [
        '6798bff2', // Ограждения GL
        '43c90082', // Заборы жалюзи GL
        'dc30f700', // Заборы жалюзи МП
        '0af0cd6f', // Панельные ограждения GL
        'e2b90b71', // GL Ограждение
      ],
      krovalNames: ['Ограждения GL', 'Заборы жалюзи GL', 'Заборы жалюзи МП', 'Панельные ограждения'],
    },
    vorota: {
      krovalUids: [
        '35317349', // Ворота Alutech (через папку для втс)
        '68a8d5c2', // Откатные ворота GL
        '947248b0', // Распашные ворота GL
      ],
      krovalNames: ['Ворота Alutech', 'Откатные ворота GL', 'Распашные ворота GL'],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // КОМПЛЕКТУЮЩИЕ
  // ─────────────────────────────────────────────────────────────────
  komplektuyushchie: {
    krepezh: {
      krovalUids: ['549a5e68', '8cb0d418'],
      krovalNames: ['Крепеж, Саморезы', 'Tech-krep'],
    },
    plenki: {
      krovalUids: ['41e22990', '93240090', '73041d8a'],
      krovalNames: ['Монтажные ленты и аксессуары для пленок', 'Ондутис', 'Изоспан'],
    },
    germetiki: {
      krovalUids: ['549a5e80', '60bcf7f2'],
      krovalNames: ['Герметики', 'Краска/Корректоры'],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // УТЕПЛЕНИЕ
  // ─────────────────────────────────────────────────────────────────
  uteplenie: {
    mineralnaya: {
      krovalUids: ['e297e1ad', 'ac6027ea'],
      krovalNames: ['Утеплители все производители', 'Роквул'],
    },
    osb: {
      krovalUids: ['3b6d47dc'],
      krovalNames: ['ОСП все производители'],
    },
    fanera: {
      krovalUids: ['df9490fb'],
      krovalNames: ['Фанера'],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // ВЕНТИЛЯЦИЯ (только продуктовая, без кровельной)
  // ─────────────────────────────────────────────────────────────────
  ventilyatsiya: {
    aeratory: {
      krovalUids: ['1f522b13'],
      krovalNames: ['Аналог Vilpe'],
    },
    mansardnye: {
      krovalUids: ['4eab958b', '41e22806', '01c352be'],
      krovalNames: ['Мансардные окна Velux', 'Мансардные окна Fakro', 'Мансардные окна Roto'],
    },
  },

  // ─────────────────────────────────────────────────────────────────
  // БЛАГОУСТРОЙСТВО
  // ─────────────────────────────────────────────────────────────────
  blagoustrojstvo: {
    terrasa: {
      krovalUids: [
        'c543f719', // Террасная доска Grand Line
        'f544a702', // Террасная доска Terrapol
        '594a9c63', // Террасная доска Decking
        'fa83a4fb', // Террасная доска ВЕЧНОЕ ДЕРЕВО
      ],
      krovalNames: ['Террасная доска (разные)'],
    },
    ograzhdenie: {
      krovalUids: ['34541a8a', '44c851d6'],
      krovalNames: ['Ограждения из ДПК', 'Ограждения ART-Deco'],
    },
  },
};

/** Получить список UID групп КровАльянса для данной категории/подкатегории */
export function getKrovalUids(categorySlug: string, subcategorySlug?: string): string[] {
  const cat = KROVAL_CATEGORY_MAP[categorySlug];
  if (!cat) return [];
  if (!subcategorySlug) {
    return Object.values(cat).flatMap(s => s.krovalUids);
  }
  return cat[subcategorySlug]?.krovalUids ?? [];
}
