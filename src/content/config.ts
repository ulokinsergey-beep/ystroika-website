import { defineCollection, z } from 'astro:content';

const reviews = defineCollection({
  type: 'content',
  schema: z.object({
    bitrixId: z.number().optional(),
    name: z.string(),
    city: z.string().optional(),
    rating: z.number().min(1).max(5),
    date: z.coerce.date(),
    category: z.enum(['kompaniya', 'produktsiya', 'obsluzhivanie']).default('obsluzhivanie'),
    avatar: z.string().optional(),
    productSlug: z.string().optional(),
    published: z.boolean().default(true),
  }),
});

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    bitrixId: z.number().optional(),
    title: z.string(),
    slug: z.string().optional(),
    excerpt: z.string().optional().default(''),
    coverImage: z.string().optional(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('У-Стройка'),
    tags: z.array(z.string()).default([]),
    category: z.string().optional(),
    readingTime: z.number().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    // Bitrix file-ids (PREVIEW_PICTURE/DETAIL_PICTURE). Unresolved: the b_file table
    // was not in the parsed dump, so id -> upload/iblock/<hash> mapping is unavailable.
    bitrixImageIds: z.array(z.string()).optional(),
    published: z.boolean().default(true),
  }),
});

const faq = defineCollection({
  type: 'content',
  schema: z.object({
    bitrixId: z.number().optional(),
    question: z.string(),
    order: z.number().default(0),
    category: z.string().optional(),
    published: z.boolean().default(true),
  }),
});

const brands = defineCollection({
  type: 'content',
  schema: z.object({
    bitrixId: z.number().optional(),
    name: z.string(),
    slug: z.string().optional(),
    logo: z.string().optional(),
    description: z.string().optional(),
    website: z.string().url().optional(),
    country: z.string().optional(),
    categories: z.array(z.string()).default([]),
    order: z.number().default(0),
    bitrixImageIds: z.array(z.string()).optional(),
    published: z.boolean().default(true),
  }),
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    bitrixId: z.number().optional(),
    title: z.string(),
    slug: z.string().optional(),
    coverImage: z.string().optional(),
    gallery: z.array(z.string()).default([]),
    location: z.string().optional(),
    area: z.string().optional(),
    completionDate: z.coerce.date().optional(),
    materials: z.array(z.string()).default([]),
    description: z.string().optional(),
    order: z.number().default(0),
    bitrixImageIds: z.array(z.string()).optional(),
    published: z.boolean().default(true),
  }),
});

const vacancies = defineCollection({
  type: 'content',
  schema: z.object({
    bitrixId: z.number().optional(),
    title: z.string(),
    slug: z.string().optional(),
    salary: z.string().optional(),
    location: z.string().default('Москва'),
    employmentType: z.enum(['full-time', 'part-time', 'contract']).default('full-time'),
    requirements: z.array(z.string()).default([]),
    benefits: z.array(z.string()).default([]),
    published: z.boolean().default(true),
  }),
});

// Бейдж в hero-карточке: жирная часть + остаток строки.
const heroBullet = z.object({ bold: z.string().default(''), rest: z.string().default('') });
// Группа таблицы стоимости: подзаголовок + строки работ со СВОЕЙ ценой.
const priceRow = z.object({ name: z.string(), price: z.string() });
const priceGroup = z.object({ head: z.string(), rows: z.array(priceRow).default([]) });
// Сопутствующий товар «вам может понадобиться».
const accessory = z.object({
  name: z.string(),
  price: z.string(),
  old: z.string().default(''),
  stock: z.enum(['in', 'check']).default('check'),
  qty: z.number().default(1),
  img: z.string(),
});

const services = defineCollection({
  type: 'content',
  schema: z.object({
    bitrixId: z.number().optional(),
    title: z.string(),
    slug: z.string().optional(),
    icon: z.string().optional(),
    coverImage: z.string().optional(),
    heroImage: z.string().optional(),
    osnovaTitle: z.string().optional(),
    osnovaImage: z.string().optional(),
    shortDescription: z.string(),
    priceFrom: z.string().optional(),
    unit: z.string().optional(),
    duration: z.string().optional(),
    includes: z.array(z.string()).default([]),
    order: z.number().default(0),
    published: z.boolean().default(true),

    // --- Per-service данные для лендинга (data-driven шаблон [slug].astro) ---
    // Заголовок hero ("... в Москве «под ключ»" собирается в шаблоне, тут можно переопределить целиком).
    heroTitle: z.string().optional(),
    // Подпись над ценой/в форме hero.
    heroFormTitle: z.string().optional(),
    heroFormText: z.string().optional(),
    heroFormButton: z.string().optional(),
    // Буллеты в тёмной карточке hero.
    heroBullets: z.array(heroBullet).optional(),
    // Заголовок секции «Основа» (osnovaTitle) + текст «Что влияет на стоимость».
    osnovaImage2: z.string().optional(), // алиас, основной — osnovaImage
    // Этапы работы.
    steps: z.array(z.string()).optional(),
    // Коллаж «Выполненные работы»: 4 фото.
    workImages: z.array(z.string()).optional(),
    // Стоимость: табы + группы.
    priceTabs: z.array(z.string()).optional(),
    priceGroups: z.array(priceGroup).optional(),
    // «Что влияет на стоимость».
    vliyaetTitle: z.string().optional(),
    vliyaetLead: z.string().optional(),
    vliyaetText: z.string().optional(),
    vliyaetImage: z.string().optional(),
    // Сопутствующие товары.
    accessories: z.array(accessory).optional(),
    // Заголовок секции CTA «Закажите …» и текст кнопки.
    orderCtaButton: z.string().optional(),
  }),
});

const calculators = defineCollection({
  type: 'content',
  schema: z.object({
    bitrixId: z.number().optional(),
    title: z.string(),
    slug: z.string().optional(),
    description: z.string(),
    category: z.enum(['krovlya', 'fasad', 'vodostok', 'drugoe']).default('krovlya'),
    inputs: z.array(z.object({
      name: z.string(),
      label: z.string(),
      type: z.enum(['number', 'select', 'text']),
      unit: z.string().optional(),
      options: z.array(z.string()).optional(),
      required: z.boolean().default(true),
    })).default([]),
    order: z.number().default(0),
    published: z.boolean().default(true),
  }),
});

export const collections = { reviews, articles, faq, brands, projects, vacancies, services, calculators };
