import { z } from 'zod';
import { paginationSchema } from '../utils/http';
import { deviceTypeSchema } from './catalog.validator';

export const riskLevelSchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'DANGER']);

const textList = z.array(z.string().trim().min(1).max(500)).max(30);

export const diagnosisCreateSchema = z.object({
  deviceType: deviceTypeSchema,
  brand: z.string().trim().max(100).nullish(),
  model: z.string().trim().max(150).nullish(),
  errorCode: z.string().trim().max(20).nullish(),
  description: z.string().trim().max(5000).nullish(),
  symptoms: textList.optional(),
  conversationId: z.string().uuid().nullish(),
  // Có thể gửi kèm kết quả tự điền; không gửi thì server tự phân tích.
  possibleCauses: textList.optional(),
  recommendedActions: textList.optional(),
  safetyWarnings: textList.optional(),
  riskLevel: riskLevelSchema.optional(),
  requiresTechnician: z.boolean().optional(),
  estimatedMinCost: z.coerce.number().int().min(0).nullish(),
  estimatedMaxCost: z.coerce.number().int().min(0).nullish(),
  imageUrls: z.array(z.string().url()).max(10).optional(),
}).strict().refine(
  (v) => Boolean(v.description?.trim() || v.errorCode?.trim() || v.symptoms?.length),
  'Cần mô tả, mã lỗi hoặc ít nhất một triệu chứng',
);

export const diagnosisUpdateSchema = z.object({
  brand: z.string().trim().max(100).nullish(),
  model: z.string().trim().max(150).nullish(),
  errorCode: z.string().trim().max(20).nullish(),
  description: z.string().trim().max(5000).nullish(),
  symptoms: textList.optional(),
  possibleCauses: textList.optional(),
  recommendedActions: textList.optional(),
  safetyWarnings: textList.optional(),
  riskLevel: riskLevelSchema.optional(),
  requiresTechnician: z.boolean().optional(),
  estimatedMinCost: z.coerce.number().int().min(0).nullish(),
  estimatedMaxCost: z.coerce.number().int().min(0).nullish(),
  reanalyze: z.boolean().optional(), // true → chạy lại bộ luật chẩn đoán
}).strict().refine((v) => Object.keys(v).length > 0, 'Cần ít nhất một trường để cập nhật');

export const diagnosisQuerySchema = paginationSchema.extend({
  deviceType: deviceTypeSchema.optional(),
  riskLevel: riskLevelSchema.optional(),
});
