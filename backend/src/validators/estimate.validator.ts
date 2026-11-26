import { z } from 'zod';
import { paginationSchema } from '../utils/http';
import { deviceTypeSchema } from './catalog.validator';

export const serviceTypeSchema = z.enum(['INSTALLATION', 'MAINTENANCE', 'REPAIR']);

const money = z.coerce.number().int().min(0).max(10_000_000_000);

const itemSchema = z.object({
  name: z.string().trim().min(1).max(255),
  quantity: z.coerce.number().int().min(1).max(1000).default(1),
  unitPrice: money,
});

export const estimateCreateSchema = z.object({
  deviceType: deviceTypeSchema,
  serviceType: serviceTypeSchema,
  productId: z.string().uuid().nullish(),
  productName: z.string().trim().max(255).nullish(),
  quantity: z.coerce.number().int().min(1).max(100).default(1),
  unitPrice: money.optional(),       // bỏ trống + có productId → lấy giá sản phẩm
  materialCost: money.default(0),
  laborCost: money.optional(),       // bỏ trống → dùng giá công mặc định theo dịch vụ
  extraCost: money.default(0),
  reservePercent: z.coerce.number().min(0).max(50).default(10),
  budget: money.nullish(),
  note: z.string().max(5000).nullish(),
  items: z.array(itemSchema).max(50).optional(), // vật tư chi tiết (ống đồng, CB, giá đỡ...)
  conversationId: z.string().uuid().nullish(),
}).strict();

export const estimateUpdateSchema = z.object({
  productName: z.string().trim().max(255).nullish(),
  quantity: z.coerce.number().int().min(1).max(100).optional(),
  unitPrice: money.optional(),
  materialCost: money.optional(),
  laborCost: money.optional(),
  extraCost: money.optional(),
  reservePercent: z.coerce.number().min(0).max(50).optional(),
  budget: money.nullish(),
  note: z.string().max(5000).nullish(),
  items: z.array(itemSchema).max(50).optional(),
}).strict().refine((v) => Object.keys(v).length > 0, 'Cần ít nhất một trường để cập nhật');

export const estimateQuerySchema = paginationSchema.extend({
  serviceType: serviceTypeSchema.optional(),
  deviceType: deviceTypeSchema.optional(),
});

export const comparisonCreateSchema = z.object({
  firstProductId: z.string().uuid(),
  secondProductId: z.string().uuid(),
  title: z.string().trim().max(255).optional(),
  userNeeds: z.object({
    roomArea: z.coerce.number().min(1).max(500).optional(),
    budget: z.coerce.number().min(0).optional(),
    priority: z.enum(['price', 'energy', 'warranty', 'balanced']).optional(),
  }).strict().optional(),
  conversationId: z.string().uuid().nullish(),
}).strict().refine((v) => v.firstProductId !== v.secondProductId, 'Hai sản phẩm phải khác nhau');

export const comparisonQuerySchema = paginationSchema;
