import { prisma } from '../config/database';
import type { Prisma } from '../generated/prisma/client';
import { hasPermission, type AuthRole } from '../config/permissions';
import { AppError, mapPrismaError, pageResult, paginate, parseId, parseInput, type Actor } from '../utils/http';
import { ticketCreateSchema, ticketQuerySchema, ticketUpdateSchema } from '../validators/admin.validator';
import { audit } from './audit.service';

type TicketType = 'REPAIR' | 'MAINTENANCE' | 'WARRANTY' | 'INSTALLATION';
type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

const include = {
  customer: { select: { id: true, email: true, profile: { select: { fullName: true, phone: true } } } },
  technician: { select: { id: true, email: true, profile: { select: { fullName: true, phone: true, region: true } } } },
  device: { select: { id: true, serial: true, name: true, warrantyUntil: true, product: { select: { name: true, deviceType: true } } } },
} as const;

function serialize<T extends { laborCost: unknown; partsCost: unknown; totalCost: unknown }>(t: T) {
  return { ...t, laborCost: Number(t.laborCost), partsCost: Number(t.partsCost), totalCost: Number(t.totalCost) };
}

function newCode() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `SC-${ymd}-${Math.floor(1000 + Math.random() * 9000)}`;
}

// Dùng chung cho admin, khách hàng và cảnh báo tự động
export async function createTicketInternal(data: {
  customerId: string; deviceId?: string | null; type: TicketType; priority?: Priority; title: string;
  description?: string | null; errorCode?: string | null; address?: string | null; region?: string | null; scheduledAt?: Date | null;
}) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return serialize(await prisma.serviceTicket.create({ data: { ...data, code: newCode() }, include }));
    } catch (error) {
      if (mapPrismaError(error)?.statusCode !== 409) throw error; // trùng mã → thử lại
    }
  }
  throw new AppError(500, 'Không tạo được mã phiếu.');
}

export const ticketService = {
  // Kỹ thuật viên chỉ thấy phiếu được gán cho mình
  async list(actor: Actor, rawQuery: unknown) {
    const q = parseInput(ticketQuerySchema, rawQuery);
    const onlyMine = !hasPermission(actor.role as AuthRole, 'tickets:write');
    const where: Prisma.ServiceTicketWhereInput = {
      ...(onlyMine ? { technicianId: actor.userId } : q.technicianId ? { technicianId: q.technicianId } : {}),
      ...(q.status ? { status: q.status } : {}),
      ...(q.priority ? { priority: q.priority } : {}),
      ...(q.type ? { type: q.type } : {}),
      ...(q.deviceId ? { deviceId: q.deviceId } : {}),
      ...(q.q ? { OR: [
        { code: { contains: q.q, mode: 'insensitive' } },
        { title: { contains: q.q, mode: 'insensitive' } },
        { customer: { email: { contains: q.q, mode: 'insensitive' } } },
        { device: { serial: { contains: q.q, mode: 'insensitive' } } },
      ] } : {}),
    };
    const [items, total] = await prisma.$transaction([
      prisma.serviceTicket.findMany({ where, orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }], include, ...paginate(q.page, q.limit) }),
      prisma.serviceTicket.count({ where }),
    ]);
    return pageResult(items.map(serialize), total, q.page, q.limit);
  },

  async get(actor: Actor, rawId: unknown) {
    const t = await prisma.serviceTicket.findUnique({ where: { id: parseId(rawId) }, include });
    if (!t) throw new AppError(404, 'Không tìm thấy phiếu.');
    if (!hasPermission(actor.role as AuthRole, 'tickets:write') && t.technicianId !== actor.userId) throw new AppError(404, 'Không tìm thấy phiếu.');
    return serialize(t);
  },

  async create(actor: Actor, body: unknown) {
    const data = parseInput(ticketCreateSchema, body);
    if (!data.customerId) throw new AppError(400, 'Cần chọn khách hàng (customerId).');
    const t = await createTicketInternal({ ...data, customerId: data.customerId });
    await audit(actor, 'CREATE', 'ticket', t.id, { code: t.code });
    return t;
  },

  /**
   * Cập nhật / điều phối phiếu.
   * - Gán kỹ thuật viên → status ASSIGNED (nếu đang NEW)
   * - DONE → ghi completedAt, cập nhật ngày bảo trì cuối của thiết bị
   * - Tổng tiền = công + Σ linh kiện (server tự tính)
   * - Kỹ thuật viên chỉ sửa được phiếu của mình, không đổi người được gán
   */
  async update(actor: Actor, rawId: unknown, body: unknown) {
    const id = parseId(rawId);
    const data = parseInput(ticketUpdateSchema, body);
    const current = await prisma.serviceTicket.findUnique({ where: { id } });
    if (!current) throw new AppError(404, 'Không tìm thấy phiếu.');

    const canManage = hasPermission(actor.role as AuthRole, 'tickets:write');
    if (!canManage) {
      if (current.technicianId !== actor.userId) throw new AppError(404, 'Không tìm thấy phiếu.');
      if (data.technicianId !== undefined || data.priority !== undefined) throw new AppError(403, 'Kỹ thuật viên không được đổi người nhận hoặc độ ưu tiên.');
    }

    if (data.technicianId) {
      const tech = await prisma.user.findUnique({ where: { id: data.technicianId } });
      if (!tech || tech.role !== 'TECHNICIAN') throw new AppError(400, 'Người được gán không phải kỹ thuật viên.');
    }

    const parts = data.partsUsed ?? (Array.isArray(current.partsUsed) ? (current.partsUsed as Array<{ quantity: number; price: number }>) : []);
    const partsCost = parts.reduce((s, p) => s + p.quantity * p.price, 0);
    const laborCost = data.laborCost ?? Number(current.laborCost);

    let status = data.status ?? current.status;
    if (data.technicianId && current.status === 'NEW' && !data.status) status = 'ASSIGNED';
    const now = new Date();

    const t = await prisma.serviceTicket.update({
      where: { id },
      data: {
        ...data,
        status,
        ...(data.partsUsed ? { partsUsed: data.partsUsed as Prisma.InputJsonValue } : {}),
        partsCost, laborCost, totalCost: partsCost + laborCost,
        ...(status === 'IN_PROGRESS' && !current.startedAt ? { startedAt: now } : {}),
        ...(status === 'DONE' && current.status !== 'DONE' ? { completedAt: now } : {}),
      },
      include,
    });

    if (status === 'DONE' && current.status !== 'DONE' && t.deviceId) {
      await prisma.device.update({ where: { id: t.deviceId }, data: { lastServiceAt: now, ...(current.errorCode ? { status: 'ONLINE', lastErrorCode: null } : {}) } });
    }
    if (status !== current.status) {
      await prisma.notification.create({ data: { title: `Phiếu ${t.code}: ${status}`, body: `Phiếu "${t.title}" đã chuyển sang trạng thái ${status}.`, type: 'SYSTEM', target: 'USER', recipientId: t.customerId, sentAt: now } });
    }
    await audit(actor, data.technicianId ? 'ASSIGN' : 'UPDATE', 'ticket', id, data);
    return serialize(t);
  },

  async remove(actor: Actor, rawId: unknown) {
    const row = await prisma.serviceTicket.delete({ where: { id: parseId(rawId) } });
    await audit(actor, 'DELETE', 'ticket', row.id, { code: row.code });
    return { deleted: true };
  },

  // ===== KHÁCH HÀNG =====
  async createByCustomer(userId: string, body: unknown) {
    const data = parseInput(ticketCreateSchema, body);
    if (data.deviceId) {
      const own = await prisma.device.count({ where: { id: data.deviceId, ownerId: userId } });
      if (!own) throw new AppError(400, 'Thiết bị không thuộc tài khoản của bạn.');
    }
    const { customerId: _ignored, priority: _p, ...rest } = data;
    return createTicketInternal({ ...rest, customerId: userId, priority: 'NORMAL' });
  },

  async listMine(userId: string) {
    const rows = await prisma.serviceTicket.findMany({ where: { customerId: userId }, orderBy: { createdAt: 'desc' }, include });
    return rows.map(serialize);
  },
};
