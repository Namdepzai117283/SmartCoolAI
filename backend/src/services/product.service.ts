import { prisma } from '../config/database';
import type { Prisma } from '../generated/prisma/client';
import { AppError, pageResult, paginate, parseId, parseInput } from '../utils/http';
import { productCreateSchema, productQuerySchema, productUpdateSchema } from '../validators/catalog.validator';

const brandSelect = { select: { id: true, name: true, slug: true, country: true } } as const;

// Decimal (Prisma) → number để client dễ dùng.
export function serializeProduct<T extends { price: unknown; installationCost?: unknown }>(product: T) {
  return {
    ...product,
    price: Number(product.price),
    installationCost: product.installationCost == null ? null : Number(product.installationCost),
  };
}

export const productService = {
  // READ: tìm kiếm + lọc + sắp xếp + phân trang
  async list(rawQuery: unknown, includeInactive: boolean) {
    const query = parseInput(productQuerySchema, rawQuery);

    const where: Prisma.ProductWhereInput = {
      ...(includeInactive ? {} : { isActive: true }),
      ...(query.deviceType ? { deviceType: query.deviceType } : {}),
      ...(query.brand ? { brand: { slug: query.brand } } : {}),
      ...(query.inverter !== undefined ? { inverter: query.inverter } : {}),
      ...(query.minPrice !== undefined || query.maxPrice !== undefined
        ? { price: { ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}), ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}) } }
        : {}),
      ...(query.q
        ? { OR: [
            { name: { contains: query.q, mode: 'insensitive' } },
            { model: { contains: query.q, mode: 'insensitive' } },
            { brand: { name: { contains: query.q, mode: 'insensitive' } } },
          ] }
        : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      query.sort === 'price_asc' ? { price: 'asc' }
      : query.sort === 'price_desc' ? { price: 'desc' }
      : query.sort === 'name' ? { name: 'asc' }
      : { createdAt: 'desc' };

    const [items, total] = await prisma.$transaction([
      prisma.product.findMany({ where, orderBy, include: { brand: brandSelect }, ...paginate(query.page, query.limit) }),
      prisma.product.count({ where }),
    ]);

    return pageResult(items.map(serializeProduct), total, query.page, query.limit);
  },

  async get(rawId: unknown, includeInactive: boolean) {
    const product = await prisma.product.findUnique({ where: { id: parseId(rawId) }, include: { brand: brandSelect } });
    if (!product || (!product.isActive && !includeInactive)) throw new AppError(404, 'Không tìm thấy sản phẩm.');
    return serializeProduct(product);
  },

  // CREATE (ADMIN)
  async create(body: unknown) {
    const data = parseInput(productCreateSchema, body);
    const brand = await prisma.brand.findUnique({ where: { id: data.brandId } });
    if (!brand) throw new AppError(400, 'brandId không tồn tại.');
    const product = await prisma.product.create({ data: { ...data, isDemo: false }, include: { brand: brandSelect } });
    return serializeProduct(product);
  },

  // UPDATE (ADMIN)
  async update(rawId: unknown, body: unknown) {
    const id = parseId(rawId);
    const data = parseInput(productUpdateSchema, body);
    const product = await prisma.product.update({ where: { id }, data, include: { brand: brandSelect } });
    return serializeProduct(product);
  },

  // DELETE (ADMIN): xóa mềm (isActive = false) để không mất lịch sử so sánh / dự toán.
  // ?hard=true → xóa hẳn khỏi DB nếu sản phẩm chưa được dùng ở đâu.
  async remove(rawId: unknown, hard: boolean) {
    const id = parseId(rawId);
    if (hard) {
      await prisma.product.delete({ where: { id } });
      return { deleted: true, mode: 'hard' };
    }
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    return { deleted: true, mode: 'soft' };
  },
};
