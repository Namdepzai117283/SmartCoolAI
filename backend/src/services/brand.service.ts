import { prisma } from '../config/database';
import { AppError, parseId, parseInput } from '../utils/http';
import { brandCreateSchema, brandUpdateSchema } from '../validators/catalog.validator';

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

export const brandService = {
  // READ: danh sách thương hiệu (kèm số sản phẩm)
  async list(includeInactive: boolean) {
    return prisma.brand.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    });
  },

  async get(rawId: unknown) {
    const brand = await prisma.brand.findUnique({ where: { id: parseId(rawId) } });
    if (!brand) throw new AppError(404, 'Không tìm thấy thương hiệu.');
    return brand;
  },

  // CREATE
  async create(body: unknown) {
    const data = parseInput(brandCreateSchema, body);
    return prisma.brand.create({ data: { ...data, slug: data.slug ?? slugify(data.name) } });
  },

  // UPDATE
  async update(rawId: unknown, body: unknown) {
    const id = parseId(rawId);
    const data = parseInput(brandUpdateSchema, body);
    return prisma.brand.update({ where: { id }, data });
  },

  // DELETE: chỉ xóa được khi thương hiệu chưa có sản phẩm (onDelete: Restrict)
  async remove(rawId: unknown) {
    const id = parseId(rawId);
    const count = await prisma.product.count({ where: { brandId: id } });
    if (count > 0) throw new AppError(409, `Thương hiệu còn ${count} sản phẩm, hãy xóa hoặc chuyển sản phẩm trước.`);
    await prisma.brand.delete({ where: { id } });
    return { deleted: true };
  },
};
