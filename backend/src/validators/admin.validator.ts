import { z } from 'zod';
import { paginationSchema } from '../utils/http';
import { deviceTypeSchema } from './catalog.validator';
import { ROLES } from '../config/permissions';

const text = (max: number) => z.string().trim().max(max);

// ===== MÃ LỖI =====
export const errorCodeSchema = z.object({
  code: text(20).min(1).transform((v) => v.toUpperCase()),
  deviceType: deviceTypeSchema,
  brand: text(100).default(''),
  title: text(255).min(1),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).default('WARNING'),
  causes: z.array(text(300)).max(20).default([]),
  solution: z.string().trim().min(1).max(5000),
}).strict();
export const errorCodeUpdateSchema = errorCodeSchema.partial().strict();
export const errorCodeQuerySchema = paginationSchema.extend({
  q: text(50).optional(),
  deviceType: deviceTypeSchema.optional(),
  severity: z.enum(['INFO', 'WARNING', 'CRITICAL']).optional(),
});

// ===== THIẾT BỊ =====
export const deviceStatusSchema = z.enum(['ONLINE', 'OFFLINE', 'ERROR']);
export const deviceCreateSchema = z.object({
  serial: text(50).min(3),
  macAddress: z.string().trim().regex(/^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/, 'MAC dạng AA:BB:CC:DD:EE:FF').nullish(),
  productId: z.string().uuid(),
  ownerId: z.string().uuid().nullish(),
  name: text(150).nullish(),
  region: text(100).optional(),
  address: text(500).nullish(),
  firmwareVersion: text(20).optional(),
  installedAt: z.coerce.date().nullish(),
  warrantyUntil: z.coerce.date().nullish(),
}).strict();
export const deviceUpdateSchema = deviceCreateSchema.partial().extend({
  status: deviceStatusSchema.optional(),
  powerOn: z.boolean().optional(),
  mode: text(30).nullish(),
  targetTemp: z.number().min(-30).max(40).nullish(),
}).strict();
export const deviceQuerySchema = paginationSchema.extend({
  q: text(100).optional(),             // serial / MAC / tên / email chủ
  status: deviceStatusSchema.optional(),
  region: text(100).optional(),
  deviceType: deviceTypeSchema.optional(),
  firmware: text(20).optional(),
});

// ===== FIRMWARE / OTA =====
export const firmwareSchema = z.object({
  version: z.string().trim().regex(/^\d+\.\d+\.\d+$/, 'dạng 1.2.3'),
  deviceType: deviceTypeSchema,
  notes: z.string().max(5000).nullish(),
  fileUrl: z.string().url().nullish(),
  isStable: z.boolean().optional(),
}).strict();
export const rolloutSchema = z.object({
  scope: z.enum(['DEVICES', 'REGION', 'ALL']),
  deviceIds: z.array(z.string().uuid()).max(500).optional(),
  region: text(100).optional(),
}).strict().refine((v) => v.scope !== 'DEVICES' || v.deviceIds?.length, 'Chọn ít nhất 1 thiết bị')
  .refine((v) => v.scope !== 'REGION' || v.region, 'Cần chọn khu vực');

// ===== NGƯỜI DÙNG / NHÂN VIÊN =====
export const roleSchema = z.object({ role: z.enum(ROLES) }).strict();
export const staffProfileSchema = z.object({
  region: text(100).nullish(),
  skills: z.array(text(50)).max(20).optional(),
  isAvailable: z.boolean().optional(),
  phone: text(20).nullish(),
}).strict();

// ===== PHIẾU DỊCH VỤ =====
export const ticketTypeSchema = z.enum(['REPAIR', 'MAINTENANCE', 'WARRANTY', 'INSTALLATION']);
export const ticketStatusSchema = z.enum(['NEW', 'ASSIGNED', 'IN_PROGRESS', 'DONE', 'CANCELLED']);
export const ticketPrioritySchema = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']);
const partSchema = z.object({ name: text(255).min(1), quantity: z.coerce.number().int().min(1).max(100), price: z.coerce.number().int().min(0) });

export const ticketCreateSchema = z.object({
  customerId: z.string().uuid().optional(),   // admin tạo hộ khách; khách tự tạo thì bỏ trống
  deviceId: z.string().uuid().nullish(),
  type: ticketTypeSchema,
  priority: ticketPrioritySchema.optional(),
  title: text(255).min(3),
  description: z.string().max(5000).nullish(),
  errorCode: text(20).nullish(),
  address: text(500).nullish(),
  region: text(100).nullish(),
  scheduledAt: z.coerce.date().nullish(),
}).strict();
export const ticketUpdateSchema = z.object({
  technicianId: z.string().uuid().nullish(),
  status: ticketStatusSchema.optional(),
  priority: ticketPrioritySchema.optional(),
  title: text(255).optional(),
  description: z.string().max(5000).nullish(),
  scheduledAt: z.coerce.date().nullish(),
  partsUsed: z.array(partSchema).max(50).optional(),
  laborCost: z.coerce.number().int().min(0).optional(),
  resolution: z.string().max(5000).nullish(),
}).strict().refine((v) => Object.keys(v).length > 0, 'Cần ít nhất một trường');
export const ticketQuerySchema = paginationSchema.extend({
  q: text(100).optional(),
  status: ticketStatusSchema.optional(),
  priority: ticketPrioritySchema.optional(),
  type: ticketTypeSchema.optional(),
  technicianId: z.string().uuid().optional(),
  deviceId: z.string().uuid().optional(),
});

// ===== BẢO TRÌ ĐỊNH KỲ =====
export const maintenanceRuleSchema = z.object({
  deviceType: deviceTypeSchema,
  intervalMonths: z.coerce.number().int().min(1).max(36),
  message: z.string().trim().min(5).max(2000),
  isActive: z.boolean().optional(),
}).strict();

// ===== THÔNG BÁO =====
export const notificationSchema = z.object({
  title: text(255).min(3),
  body: z.string().trim().min(1).max(5000),
  type: z.enum(['SYSTEM', 'PROMOTION', 'WEATHER', 'DEVICE_ALERT', 'MAINTENANCE']).default('SYSTEM'),
  target: z.enum(['ALL', 'ROLE', 'USER']).default('ALL'),
  targetValue: z.enum(ROLES).nullish(),
  recipientId: z.string().uuid().nullish(),
  scheduledAt: z.coerce.date().nullish(),
}).strict().refine((v) => v.target !== 'ROLE' || v.targetValue, 'Chọn vai trò nhận')
  .refine((v) => v.target !== 'USER' || v.recipientId, 'Chọn người nhận');

// ===== CẤU HÌNH =====
export const settingsSchema = z.record(z.string().regex(/^[a-z][a-zA-Z0-9_.]{1,99}$/), z.unknown());
