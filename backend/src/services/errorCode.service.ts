import { prisma } from '../config/database';
import type { Prisma } from '../generated/prisma/client';
import { pageResult, paginate, parseId, parseInput, type Actor } from '../utils/http';
import { errorCodeQuerySchema, errorCodeSchema, errorCodeUpdateSchema } from '../validators/admin.validator';
import { audit } from './audit.service';

export const errorCodeService = {
  async list(rawQuery: unknown) {
    const q = parseInput(errorCodeQuerySchema, rawQuery);
    const where: Prisma.ErrorCodeWhereInput = {
      ...(q.deviceType ? { deviceType: q.deviceType } : {}),
      ...(q.severity ? { severity: q.severity } : {}),
      ...(q.q ? { OR: [{ code: { contains: q.q, mode: 'insensitive' } }, { title: { contains: q.q, mode: 'insensitive' } }] } : {}),
    };
    const [items, total] = await prisma.$transaction([
      prisma.errorCode.findMany({ where, orderBy: [{ severity: 'desc' }, { code: 'asc' }], ...paginate(q.page, q.limit) }),
      prisma.errorCode.count({ where }),
    ]);
    return pageResult(items, total, q.page, q.limit);
  },

  async create(actor: Actor, body: unknown) {
    const row = await prisma.errorCode.create({ data: parseInput(errorCodeSchema, body) });
    await audit(actor, 'CREATE', 'error_code', row.id, { code: row.code });
    return row;
  },

  async update(actor: Actor, rawId: unknown, body: unknown) {
    const row = await prisma.errorCode.update({ where: { id: parseId(rawId) }, data: parseInput(errorCodeUpdateSchema, body) });
    await audit(actor, 'UPDATE', 'error_code', row.id, { code: row.code });
    return row;
  },

  async remove(actor: Actor, rawId: unknown) {
    const row = await prisma.errorCode.delete({ where: { id: parseId(rawId) } });
    await audit(actor, 'DELETE', 'error_code', row.id, { code: row.code });
    return { deleted: true };
  },

  // Tra mã lỗi: ưu tiên đúng hãng, sau đó mã dùng chung
  async lookup(code: string, deviceType: 'AIR_CONDITIONER' | 'REFRIGERATOR' | 'FREEZER', brand?: string) {
    const rows = await prisma.errorCode.findMany({ where: { code: code.toUpperCase(), deviceType, brand: { in: [brand ?? '', ''] } } });
    return rows.find((r) => r.brand && r.brand === brand) ?? rows[0] ?? null;
  },
};
