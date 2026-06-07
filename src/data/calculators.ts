// Калькуляторы расчёта (/servisy/*). Ветки вопросов — позже из Google-таблицы.
export interface Calculator {
  slug: string;
  title: string;
  short: string;
  unit: string;
  kind: 'krovlya' | 'fasad' | 'vodostok';
}

export const calculators: Calculator[] = [
  { slug: 'metallocherepitsa',  title: 'Расчёт кровли из металлочерепицы', short: 'Рассчитаем количество листов металлочерепицы и доборных элементов под вашу кровлю.', unit: 'м²',   kind: 'krovlya' },
  { slug: 'profnastil',         title: 'Расчёт кровли из профнастила',      short: 'Подберём профнастил и комплектующие по площади и геометрии кровли.',                unit: 'м²',   kind: 'krovlya' },
  { slug: 'faltsevaya-krovlya', title: 'Расчёт фальцевой кровли',           short: 'Расчёт фальцевых картин и доборных элементов под ваш объект.',                       unit: 'м²',   kind: 'krovlya' },
  { slug: 'gibkaya-cherepitsa', title: 'Калькулятор гибкой черепицы',       short: 'Рассчитаем гибкую черепицу, подкладочный ковёр и ОSB под кровлю.',                   unit: 'м²',   kind: 'krovlya' },
  { slug: 'vinilovyy-sayding',  title: 'Расчёт винилового сайдинга',        short: 'Подберём виниловый сайдинг и аксессуары по площади фасада.',                          unit: 'м²',   kind: 'fasad' },
  { slug: 'fasadnye-paneli',    title: 'Расчёт фасадных панелей',           short: 'Расчёт фасадных панелей и подсистемы под облицовку здания.',                          unit: 'м²',   kind: 'fasad' },
  { slug: 'vodostok',           title: 'Расчёт водостока',                  short: 'Рассчитаем водосточную систему по периметру и количеству скатов.',                    unit: 'м.п.', kind: 'vodostok' },
];
