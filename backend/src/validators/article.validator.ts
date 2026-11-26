import { z } from 'zod';
import { paginationSchema } from '../utils/http';

export const articleCategorySchema = z.enum([
  'AIR_CONDITIONER', 'REFRIGERATOR', 'FREEZER', 'MAINTENANCE', 'SAFETY', 'ENERGY_SAVING', 'USAGE_GUIDE',
]);

const stepSchema = z.object({
  id: z.string().trim().min(1).max(50),
  title: z.string().trim().min(1).max(255),
  content: z.string().max(5000).optional(),
});

export const articleCreateSchema = z.object({
  title: z.string().trim().min(3).max(255),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).max(255).optional(),
  category: articleCategorySchema,
  summary: z.string().max(2000).nullish(),
  content: z.string().min(1).max(100000),
  imageUrl: z.string().url().nullish(),
  readingTime: z.number().int().min(1).max(120).optional(),
  tags: z.array(z.string().trim().max(50)).max(30).optional(),
  steps: z.array(stepSchema).max(50).optional(),
  isGuide: z.boolean().optional(),
  isPublished: z.boolean().optional(),
}).strict();

export const articleUpdateSchema = articleCreateSchema.partial().strict()
  .refine((v) => Object.keys(v).length > 0, 'Cần ít nhất một trường để cập nhật');

export const articleQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
  category: articleCategorySchema.optional(),
  guide: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  tag: z.string().trim().max(50).optional(),
});

export const progressSchema = z.object({
  completedSteps: z.array(z.string().trim().min(1).max(50)).max(50),
}).strict();
