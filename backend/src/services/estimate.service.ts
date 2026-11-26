import { prisma } from '../config/database';
import type { Prisma } from '../generated/prisma/client';
import { AppError, pageResult, paginate, parseId, parseInput } from '../utils/http';
import { estimateCreateSchema, estimateQuerySchema, estimateUpdateSchema } from '../validators/estimate.validator';

type ServiceType = 'INSTALLATION' | 'MAINTENANCE' | 'REPAIR';

// Giá công mặc định / 1 thiết bị (VNĐ) – dữ liệu tham khảo.
export const DEFAULT_LABOR: Record<ServiceType, number> = {
  INSTALLATION: 400_000,
  MAINTENANCE: 200_000,
  REPAIR: 350_000,
};

interface CostInput {
  quantity: number;
  unitPrice: number;
  materialCost: number;
  laborCost: number;
  extraCost: number;
  reservePercent: number;
  items?: Array<{ quantity: number; unitPrice: number }>;
}

/**
 * Công thức dự toán (tính ở server, client không tự tính được sai):
 *   itemsCost   = Σ(item.quantity × item.unitPrice)
 *   subtotal    = quantity × unitPrice + materialCost + itemsCost + laborCost × quantity + extraCost
 *   reserveCost = subtotal × reservePercent / 100   (chi phí dự phòng)
 *   totalCost   = subtotal + reserveCost
 */
export function calculateCost(input: CostInput) {
  const itemsCost = (input.items ?? []).reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const subtotal =
    input.quantity * input.unitPrice + input.materialCost + itemsCost + input.laborCost * input.quantity + input.extraCost;
  const reserveCost = Math.round((subtotal * input.reservePercent) / 100);
  return { itemsCost, subtotal, reserveCost, totalCost: subtotal + reserveCost };
}

function serialize<T extends Record<string, unknown>>(row: T) {
  const out: Record<string, unknown> = { ...row };
  for (const key of ['unitPrice', 'materialCost', 'laborCost', 'extraCost', 'reservePercent', 'reserveCost', 'subtotal', 'totalCost', 'budget']) {
    if (out[key] != null) out[key] = Number(out[key]);
  }
  const total = out.totalCost as number;
  const budget = out.budget as number | null | undefined;
  out.budgetStatus = budget == null ? null : total <= budget ? 'WITHIN_BUDGET' : 'OVER_BUDGET';
  return out;
}

async function findOwn(userId: string, rawId: unknown) {
  const row = await prisma.costEstimate.findFirst({ where: { id: parseId(rawId), userId } });
  if (!row) throw new AppError(404, 'Không tìm thấy bản dự toán.');
  return row;
}

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export const estimateService = {
  async list(userId: string, rawQuery: unknown) {
    const query = parseInput(estimateQuerySchema, rawQuery);
    const where: Prisma.CostEstimateWhereInput = {
      userId,
      ...(query.serviceType ? { serviceType: query.serviceType } : {}),
      ...(query.deviceType ? { deviceType: query.deviceType } : {}),
    };
    const [items, total] = await prisma.$transaction([
      prisma.costEstimate.findMany({ where, orderBy: { createdAt: 'desc' }, ...paginate(query.page, query.limit) }),
      prisma.costEstimate.count({ where }),
    ]);
    return pageResult(items.map(serialize), total, query.page, query.limit);
  },

  async get(userId: string, rawId: unknown) {
    return serialize(await findOwn(userId, rawId));
  },

  async create(userId: string, body: unknown) {
    const data = parseInput(estimateCreateSchema, body);

    let unitPrice = data.unitPrice;
    let productName = data.productName ?? null;
    let laborCost = data.laborCost;

    if (data.productId) {
      const product = await prisma.product.findFirst({ where: { id: data.productId, isActive: true }, include: { brand: true } });
      if (!product) throw new AppError(400, 'productId không tồn tại.');
      if (product.deviceType !== data.deviceType) throw new AppError(400, 'Loại thiết bị không khớp với sản phẩm.');
      // Chỉ tính tiền mua máy khi lắp đặt mới.
      unitPrice ??= data.serviceType === 'INSTALLATION' ? Number(product.price) : 0;
      productName ??= product.name;
      if (laborCost === undefined && data.serviceType === 'INSTALLATION' && product.installationCost != null) {
        laborCost = Number(product.installationCost);
      }
    }

    unitPrice ??= 0;
    laborCost ??= DEFAULT_LABOR[data.serviceType];

    const cost = calculateCost({ ...data, unitPrice, laborCost });
    const assumptions = [
      `Giá công ${laborCost.toLocaleString('vi-VN')}đ/thiết bị`,
      `Dự phòng ${data.reservePercent}% cho phát sinh`,
      'Giá tham khảo, có thể thay đổi theo khu vực và thời điểm',
    ];

    const row = await prisma.costEstimate.create({
      data: {
        userId,
        conversationId: data.conversationId ?? null,
        productId: data.productId ?? null,
        deviceType: data.deviceType,
        serviceType: data.serviceType,
        productName,
        quantity: data.quantity,
        unitPrice,
        materialCost: data.materialCost + cost.itemsCost,
        laborCost,
        extraCost: data.extraCost,
        reservePercent: data.reservePercent,
        reserveCost: cost.reserveCost,
        subtotal: cost.subtotal,
        totalCost: cost.totalCost,
        budget: data.budget ?? null,
        note: data.note ?? null,
        assumptions,
        ...(data.items ? { items: asJson(data.items) } : {}),
        isDemo: false,
      },
    });
    return serialize(row);
  },

  // UPDATE: sửa số liệu → server tính lại toàn bộ tổng tiền
  async update(userId: string, rawId: unknown, body: unknown) {
    const current = await findOwn(userId, rawId);
    const data = parseInput(estimateUpdateSchema, body);

    const oldItems = Array.isArray(current.items) ? (current.items as Array<{ quantity: number; unitPrice: number }>) : [];
    const oldItemsCost = oldItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const items = data.items ?? oldItems;
    // materialCost trong DB đã gộp itemsCost → tách ra trước khi tính lại.
    const baseMaterial = data.materialCost ?? Number(current.materialCost) - oldItemsCost;

    const input = {
      quantity: data.quantity ?? current.quantity,
      unitPrice: data.unitPrice ?? Number(current.unitPrice),
      materialCost: baseMaterial,
      laborCost: data.laborCost ?? Number(current.laborCost),
      extraCost: data.extraCost ?? Number(current.extraCost),
      reservePercent: data.reservePercent ?? Number(current.reservePercent),
      items,
    };
    const cost = calculateCost(input);

    const row = await prisma.costEstimate.update({
      where: { id: current.id },
      data: {
        ...(data.productName !== undefined ? { productName: data.productName } : {}),
        ...(data.budget !== undefined ? { budget: data.budget } : {}),
        ...(data.note !== undefined ? { note: data.note } : {}),
        ...(data.items ? { items: asJson(data.items) } : {}),
        quantity: input.quantity,
        unitPrice: input.unitPrice,
        materialCost: input.materialCost + cost.itemsCost,
        laborCost: input.laborCost,
        extraCost: input.extraCost,
        reservePercent: input.reservePercent,
        reserveCost: cost.reserveCost,
        subtotal: cost.subtotal,
        totalCost: cost.totalCost,
      },
    });
    return serialize(row);
  },

  async remove(userId: string, rawId: unknown) {
    const row = await findOwn(userId, rawId);
    await prisma.costEstimate.delete({ where: { id: row.id } });
    return { deleted: true };
  },
};
