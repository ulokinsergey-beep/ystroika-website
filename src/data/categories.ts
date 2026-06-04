export interface Category {
  slug: string;
  title: string;
  description: string;
  icon: string;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  slug: string;
  title: string;
  description?: string;
  brands?: string[];
}

export const categories: Category[] = [
  {
    slug: 'krovlya',
    title: 'Кровля',
    description: 'Металлочерепица, гибкая черепица, фальцевая кровля, профнастил и комплектующие',
    icon: '🏠',
    subcategories: [
      { slug: 'metallocherepitsa', title: 'Металлочерепица', description: 'Металлочерепица — универсальное покрытие для скатных крыш с имитацией натуральной черепицы. Широкий выбор профилей, цветов и покрытий от ведущих производителей. Лёгкость монтажа, долговечность и эстетичный внешний вид при любых условиях эксплуатации.', brands: ['GrandLine', 'Stynergy', 'Металл Профиль'] },
      { slug: 'gibkaya-cherepitsa', title: 'Гибкая черепица', description: 'Гибкая черепица — современный кровельный материал на основе стеклохолста с битумной пропиткой. Подходит для кровель любой формы и сложности, отличается высокими тепло- и звукоизоляционными свойствами.', brands: ['DÖCKE', 'ТЕХНОНИКОЛЬ', 'Katepal', 'Tegola', 'CertainTeed', 'Ikopal'] },
      { slug: 'faltsevaya', title: 'Фальцевая кровля', description: 'Фальцевая кровля — классическое металлическое покрытие с соединением листов в замок (фальц). Обеспечивает надёжную герметизацию без использования крепёжных элементов, допускает температурные деформации.', brands: ['GrandLine'] },
      { slug: 'profnastil', title: 'Профнастил', description: 'Профнастил — профилированные листы из оцинкованной или окрашенной стали. Применяется для кровли, ограждений, заборов. Высокая несущая способность при небольшом весе.', brands: ['GrandLine', 'Stynergy', 'Металл Профиль'] },
      { slug: 'kompozitnaya-cherepitsa', title: 'Композитная черепица', description: 'Композитная черепица сочетает прочность металла и эстетику натуральных материалов. Лёгкая, долговечная, устойчива к перепадам температур и механическим воздействиям.', brands: ['Metrotile', 'Luxard', 'Aerodek', 'GrandLine'] },
      { slug: 'rulonnye-materialy', title: 'Рулонные материалы', description: 'Рулонные кровельные и гидроизоляционные материалы для плоских и малоуклонных крыш. Битумные и полимерные мембраны, подкладочные ковры и пароизоляция.', brands: ['ТЕХНОНИКОЛЬ'] },
      { slug: 'cherepitsa-braas', title: 'Черепица Braas', description: 'Натуральная цементно-песчаная черепица Braas — немецкое качество и многообразие форм. Долговечность 100+ лет, широкая цветовая гамма, экологически чистый материал.', brands: ['Braas'] },
      { slug: 'komplektuyushchie-krovli', title: 'Комплектующие для кровли', description: 'Всё необходимое для монтажа кровли: коньковые элементы, ендовы, карнизные планки, снегозадержатели, мансардные окна, проходки и вентиляционные элементы.', brands: [] },
    ]
  },
  {
    slug: 'fasad',
    title: 'Фасад',
    description: 'Сайдинг, фасадные панели, подсистемы и доборные элементы',
    icon: '🧱',
    subcategories: [
      { slug: 'metallicheskiy-sayding', title: 'Металлический сайдинг', brands: ['GrandLine', 'Stynergy', 'Металл Профиль'] },
      { slug: 'vinilovyy-sayding', title: 'Виниловый сайдинг', brands: ['DÖCKE', 'АльтаПрофиль', 'GrandLine'] },
      { slug: 'fibrocementnyy-sayding', title: 'Фиброцементный сайдинг', brands: ['GrandLine'] },
      { slug: 'fasadnye-paneli', title: 'Фасадные панели', brands: ['DÖCKE', 'GrandLine'] },
      { slug: 'fasadnaya-plitka', title: 'Фасадная плитка Hayberg', brands: ['GrandLine'] },
      { slug: 'termopaнeli', title: 'Термопанели', brands: [] },
      { slug: 'podsistema', title: 'Подсистема фасадная', brands: ['GrandLine'] },
      { slug: 'dobornye-elementy', title: 'Доборные элементы', brands: ['GrandLine'] },
    ]
  },
  {
    slug: 'vodostok',
    title: 'Водосток',
    description: 'Водосточные системы металлические и пластиковые',
    icon: '🌧️',
    subcategories: [
      { slug: 'metallicheskiy-vodostok', title: 'Металлический водосток', brands: ['GrandLine', 'DÖCKE'] },
      { slug: 'plastikovy-vodostok', title: 'Пластиковый водосток', brands: ['GrandLine', 'DÖCKE'] },
    ]
  },
  {
    slug: 'ograzhdeniya',
    title: 'Ограждения',
    description: 'Заборы, секции, ворота и калитки',
    icon: '🔩',
    subcategories: []
  },
  {
    slug: 'komplektuyushchie',
    title: 'Комплектующие',
    description: 'Крепёж, утеплители, плёнки, мембраны',
    icon: '⚙️',
    subcategories: []
  },
  {
    slug: 'blagoustrojstvo',
    title: 'Благоустройство',
    description: 'Тротуарная плитка, бордюры, материалы для участка',
    icon: '🌿',
    subcategories: []
  },
  {
    slug: 'uteplenie',
    title: 'Утепление',
    description: 'Минеральная вата, пенополистирол, изоляционные материалы',
    icon: '🌡️',
    subcategories: []
  },
  {
    slug: 'ventilyatsiya',
    title: 'Вентиляция',
    description: 'Коньковые аэраторы, проходки, вентиляционные элементы',
    icon: '💨',
    subcategories: []
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find(c => c.slug === slug);
}
