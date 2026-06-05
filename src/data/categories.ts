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
  image?: string;   // путь к фото для hero-блока подкатегории
}

export const categories: Category[] = [
  {
    slug: 'krovlya',
    title: 'Кровля',
    description: 'Металлочерепица, гибкая черепица, фальцевая кровля, профнастил и комплектующие',
    icon: '🏠',
    subcategories: [
      { slug: 'metallocherepitsa', title: 'Металлочерепица', description: 'Металлочерепица — универсальное покрытие для скатных крыш с имитацией натуральной черепицы. Широкий выбор профилей, цветов и покрытий от ведущих производителей. Лёгкость монтажа, долговечность и эстетичный внешний вид при любых условиях эксплуатации.', brands: ['GrandLine', 'Stynergy', 'Металл Профиль'], image: '/images/categories/metallocherepitsa.jpg' },
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
    description: 'Заборы, секции, ворота и калитки из металла и профнастила',
    icon: '🔩',
    subcategories: [
      { slug: 'zabory', title: 'Заборы', description: 'Заборы и секции из профнастила, металлического штакетника и сетки-рабицы. Надёжная защита участка с широким выбором покрытий и высот.', brands: ['GrandLine', 'Металл Профиль'] },
      { slug: 'vorota', title: 'Ворота', description: 'Распашные и откатные ворота из профнастила и металлического штакетника. Стандартные и нестандартные размеры под любой проём.', brands: ['GrandLine'] },
    ]
  },
  {
    slug: 'komplektuyushchie',
    title: 'Комплектующие',
    description: 'Крепёж, плёнки, мембраны и герметики для кровли и фасада',
    icon: '⚙️',
    subcategories: [
      { slug: 'krepezh', title: 'Крепёж', description: 'Саморезы, кровельные гвозди, анкеры и метизы для монтажа кровельных и фасадных материалов. Оцинкованные и нержавеющие варианты.', brands: [] },
      { slug: 'plenki', title: 'Плёнки и мембраны', description: 'Подкладочные ковры, паро- и гидроизоляционные плёнки, диффузионные мембраны для кровли и стен. Защита от влаги и конденсата.', brands: ['ТЕХНОНИКОЛЬ'] },
      { slug: 'germetiki', title: 'Герметики', description: 'Кровельные и фасадные герметики для гидроизоляции швов, примыканий и проходок. Силиконовые, полиуретановые и битумные составы.', brands: [] },
    ]
  },
  {
    slug: 'blagoustrojstvo',
    title: 'Благоустройство',
    description: 'Ограждения участка, террасные доски и материалы для благоустройства',
    icon: '🌿',
    subcategories: [
      { slug: 'ograzhdenie', title: 'Ограждение участка', description: 'Металлический штакетник, сетка-рабица и панельные ограждения для садового участка. Лёгкий монтаж, долгий срок службы.', brands: ['GrandLine'] },
      { slug: 'terrasa', title: 'Терраса', description: 'Террасная доска из ДПК (древесно-полимерного композита) и аксессуары для монтажа: лаги, заклёпки, торцевые планки.', brands: [] },
    ]
  },
  {
    slug: 'uteplenie',
    title: 'Утепление',
    description: 'Минеральная вата, OSB-плиты, фанера и изоляционные материалы',
    icon: '🌡️',
    subcategories: [
      { slug: 'mineralnaya', title: 'Минеральная вата', description: 'Базальтовая и стекловолоконная минеральная вата для утепления кровли, стен и перекрытий. Высокая тепло- и звукоизоляция, пожаробезопасность.', brands: ['ТЕХНОНИКОЛЬ'] },
      { slug: 'osb', title: 'ОСБ-плиты', description: 'Ориентированно-стружечные плиты (OSB) для сплошной обрешётки кровли, чернового пола и стен. Влагостойкие варианты для наружного применения.', brands: [] },
      { slug: 'fanera', title: 'Фанера', description: 'Берёзовая и хвойная строительная фанера для обрешётки, опалубки и отделки. Ламинированная фанера для многоразового применения.', brands: [] },
    ]
  },
  {
    slug: 'ventilyatsiya',
    title: 'Вентиляция',
    description: 'Коньковые аэраторы, мансардные окна и вентиляционные проходки',
    icon: '💨',
    subcategories: [
      { slug: 'aeratory', title: 'Аэраторы', description: 'Коньковые и точечные аэраторы для вентиляции подкровельного пространства. Предотвращают образование конденсата и продлевают срок службы кровли.', brands: ['GrandLine', 'ТЕХНОНИКОЛЬ'] },
      { slug: 'mansardnye', title: 'Мансардные окна', description: 'Мансардные окна для скатных кровель: стандартные, панорамные и с дистанционным управлением. Монтажные комплекты и карнизные элементы.', brands: [] },
    ]
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find(c => c.slug === slug);
}
