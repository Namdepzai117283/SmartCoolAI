import { z } from 'zod';
import { paginationSchema } from '../utils/http';

// ==========================================
// THƯƠNG HIỆU (brands)
// ==========================================

export const brandCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/, 'chỉ gồm a-z, 0-9, dấu -').max(100).optional(),
  country: z.string().trim().max(100).nullish(),
  logoUrl: z.string().url().nullish(),
  description: z.string().max(5000).nullish(),
  isActive: z.boolean().optional(),
}).strict();

export const brandUpdateSchema = brandCreateSchema.partial().strict()
  .refine((v) => Object.keys(v).length > 0, 'Cần ít nhất một trường để cập nhật');

// ==========================================
// SẢN PHẨM (products)
// ==========================================

export const deviceTypeSchema = z.enum(['AIR_CONDITIONER', 'REFRIGERATOR', 'FREEZER']);

const money = z.coerce.number().int().min(0).max(10_000_000_000);

export const productCreateSchema = z.object({
  brandId: z.string().uuid(),
  name: z.string().trim().min(1).max(255),
  model: z.string().trim().min(1).max(150),
  deviceType: deviceTypeSchema,
  price: money,
  capacity: z.string().trim().min(1).max(100),
  inverter: z.boolean().optional(),
  description: z.string().max(10000).nullish(),
  imageUrl: z.string().url().nullish(),
  coolingCapacity: z.number().int().min(0).nullish(),
  powerConsumption: z.number().min(0).nullish(),
  energyRating: z.string().max(20).nullish(),
  warrantyMonths: z.number().int().min(0).max(240).nullish(),
  origin: z.string().max(100).nullish(),
  suitableRoomArea: z.string().max(100).nullish(),
  features: z.array(z.string().max(300)).max(50).optional(),
  advantages: z.array(z.string().max(300)).max(50).optional(),
  disadvantages: z.array(z.string().max(300)).max(50).optional(),
  installationCost: money.nullish(),
  isActive: z.boolean().optional(),
}).strict();

export const productUpdateSchema = productCreateSchema.partial().strict()
  .refine((v) => Object.keys(v).length > 0, 'Cần ít nhất một trường để cập nhật');

export const productQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
  deviceType: deviceTypeSchema.optional(),
  brand: z.string().trim().max(100).optional(), // slug thương hiệu
  inverter: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(['price_asc', 'price_desc', 'newest', 'name']).default('newest'),
});
