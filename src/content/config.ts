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

const services = defineCollection({
  type: 'content',
  schema: z.object({
    bitrixId: z.number().optional(),
    title: z.string(),
    slug: z.string().optional(),
    icon: z.string().optional(),
    coverImage: z.string().optional(),
    shortDescription: z.string(),
    priceFrom: z.string().optional(),
    unit: z.string().optional(),
    duration: z.string().optional(),
    includes: z.array(z.string()).default([]),
    order: z.number().default(0),
    published: z.boolean().default(true),
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
