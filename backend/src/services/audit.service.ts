import { z } from 'zod';
import { prisma } from '../config/database';
import type { Prisma } from '../generated/prisma/client';
import { actorOf, pageResult, paginate, paginationSchema, parseInput, type Action, type Actor } from '../utils/http';

// Ghi lại ai đã làm gì – gọi sau mỗi thao tác ghi quan trọng.
export async function audit(actor: Actor, action: string, entity: string, entityId?: string | null, detail?: unknown) {
  await prisma.auditLog.create({
    data: {
      actorId: actor.userId,
      action,
      entity,
      entityId: entityId ?? null,
      ip: actor.ip?.slice(0, 64) ?? null,
      ...(detail !== undefined ? { detail: detail as Prisma.InputJsonValue } : {}),
    },
  });
}

const querySchema = paginationSchema.extend({
  entity: z.string().max(50).optional(),
  action: z.string().max(50).optional(),
  actorId: z.string().uuid().optional(),
});

export const auditService = {
  async list(rawQuery: unknown) {
    const q = parseInput(querySchema, rawQuery);
    const where: Prisma.AuditLogWhereInput = {
      ...(q.entity ? { entity: q.entity } : {}),
      ...(q.action ? { action: q.action } : {}),
      ...(q.actorId ? { actorId: q.actorId } : {}),
    };
    const [items, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { actor: { select: { email: true, role: true, profile: { select: { fullName: true } } } } },
        ...paginate(q.page, q.limit),
      }),
      prisma.auditLog.count({ where }),
    ]);
    return pageResult(items, total, q.page, q.limit);
  },
};

// Bọc controller ghi dữ liệu để tự ghi Audit Log sau khi thành công
export function audited(entity: string, action: string, fn: Action): Action {
  return async (req) => {
    const result = await fn(req);
    const id = (result && typeof result === 'object' && 'id' in result ? String((result as { id: unknown }).id) : String(req.params.id ?? '')) || null;
    await audit(actorOf(req), action, entity, id, req.method === 'DELETE' ? undefined : req.body);
    return result;
  };
}
