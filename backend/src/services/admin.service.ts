import { z } from 'zod';
import { prisma } from '../config/database';
import type { Prisma } from '../generated/prisma/client';
import { ROLES, ROLE_LABELS, permissionsOf, type AuthRole } from '../config/permissions';
import { AppError, pageResult, paginate, paginationSchema, parseId, parseInput, type Actor } from '../utils/http';
import { roleSchema, staffProfileSchema } from '../validators/admin.validator';
import { audit } from './audit.service';

const userQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']).optional(),
  role: z.enum(ROLES).optional(),
  staff: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
});
const statusSchema = z.object({ status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']) }).strict();

export const adminService = {
  // Thông tin quyền của người đang đăng nhập (giao diện Admin dùng để ẩn/hiện menu)
  async me(actor: Actor) {
    const user = await prisma.user.findUnique({ where: { id: actor.userId }, select: { id: true, email: true, role: true, authProvider: true, profile: { select: { fullName: true, avatarUrl: true } } } });
    if (!user) throw new AppError(404, 'Không tìm thấy tài khoản.');
    return { ...user, roleLabel: ROLE_LABELS[user.role as AuthRole], permissions: permissionsOf(user.role as AuthRole), roles: ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] })) };
  },

  async stats() {
    const [users, products, articles, conversations, messages, diagnoses, estimates, comparisons, dangerDiagnoses, devices, tickets] =
      await prisma.$transaction([
        prisma.user.count(), prisma.product.count({ where: { isActive: true } }), prisma.knowledgeArticle.count({ where: { isPublished: true } }),
        prisma.conversation.count(), prisma.message.count(), prisma.diagnosis.count(), prisma.costEstimate.count(), prisma.comparison.count(),
        prisma.diagnosis.count({ where: { riskLevel: 'DANGER' } }), prisma.device.count(), prisma.serviceTicket.count(),
      ]);
    return { users, products, articles, conversations, messages, diagnoses, estimates, comparisons, dangerDiagnoses, devices, tickets };
  },

  async listUsers(rawQuery: unknown) {
    const q = parseInput(userQuerySchema, rawQuery);
    const where: Prisma.UserWhereInput = {
      ...(q.status ? { status: q.status } : {}),
      ...(q.role ? { role: q.role } : q.staff === true ? { role: { not: 'USER' } } : q.staff === false ? { role: 'USER' } : {}),
      ...(q.q ? { OR: [
        { email: { contains: q.q, mode: 'insensitive' } },
        { profile: { fullName: { contains: q.q, mode: 'insensitive' } } },
        { profile: { phone: { contains: q.q } } },
      ] } : {}),
    };
    const [items, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        omit: { passwordHash: true },
        include: {
          profile: { select: { fullName: true, phone: true, region: true, isAvailable: true, avatarUrl: true } },
          _count: { select: { devices: true, customerTickets: true, assignedTickets: true } },
        },
        ...paginate(q.page, q.limit),
      }),
      prisma.user.count({ where }),
    ]);
    return pageResult(items, total, q.page, q.limit);
  },

  // Chi tiết khách hàng: thiết bị đã đăng ký (bảo hành), lịch sử yêu cầu hỗ trợ
  async getUser(rawId: unknown) {
    const user = await prisma.user.findUnique({
      where: { id: parseId(rawId) },
      omit: { passwordHash: true },
      include: {
        profile: true,
        devices: { include: { product: { select: { name: true, deviceType: true } } }, orderBy: { createdAt: 'desc' } },
        customerTickets: { orderBy: { createdAt: 'desc' }, take: 30, select: { id: true, code: true, type: true, status: true, title: true, createdAt: true } },
        assignedTickets: { orderBy: { createdAt: 'desc' }, take: 30, select: { id: true, code: true, type: true, status: true, title: true, createdAt: true } },
      },
    });
    if (!user) throw new AppError(404, 'Không tìm thấy người dùng.');
    return user;
  },

  // Danh sách kỹ thuật viên + số việc đang nhận
  async technicians() {
    const techs = await prisma.user.findMany({
      where: { role: 'TECHNICIAN' },
      select: { id: true, email: true, status: true, profile: { select: { fullName: true, phone: true, region: true, skills: true, isAvailable: true } } },
      orderBy: { createdAt: 'asc' },
    });
    const load = await prisma.serviceTicket.groupBy({
      by: ['technicianId'],
      where: { technicianId: { in: techs.map((t) => t.id) }, status: { in: ['ASSIGNED', 'IN_PROGRESS'] } },
      _count: { _all: true },
    });
    const done = await prisma.serviceTicket.groupBy({
      by: ['technicianId'],
      where: { technicianId: { in: techs.map((t) => t.id) }, status: 'DONE' },
      _count: { _all: true },
    });
    return techs.map((t) => ({
      ...t,
      openTickets: load.find((l) => l.technicianId === t.id)?._count._all ?? 0,
      doneTickets: done.find((l) => l.technicianId === t.id)?._count._all ?? 0,
    }));
  },

  async setUserStatus(actor: Actor, rawId: unknown, body: unknown) {
    const id = parseId(rawId);
    if (id === actor.userId) throw new AppError(400, 'Không thể tự đổi trạng thái tài khoản của chính mình.');
    const { status } = parseInput(statusSchema, body);
    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({ where: { id }, data: { status }, omit: { passwordHash: true } });
      if (status !== 'ACTIVE') await tx.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      return u;
    });
    await audit(actor, 'UPDATE_STATUS', 'user', id, { status });
    return user;
  },

  // Chỉ Super Admin đổi vai trò. Đổi vai trò → thu hồi phiên để đăng nhập lại với quyền mới.
  async setRole(actor: Actor, rawId: unknown, body: unknown) {
    const id = parseId(rawId);
    if (id === actor.userId) throw new AppError(400, 'Không thể tự đổi vai trò của chính mình.');
    const { role } = parseInput(roleSchema, body);
    const before = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!before) throw new AppError(404, 'Không tìm thấy người dùng.');
    const user = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({ where: { id }, data: { role }, omit: { passwordHash: true } });
      await tx.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      return u;
    });
    await audit(actor, 'UPDATE_ROLE', 'user', id, { from: before.role, to: role });
    return user;
  },

  async updateStaffProfile(actor: Actor, rawId: unknown, body: unknown) {
    const id = parseId(rawId);
    const data = parseInput(staffProfileSchema, body);
    const user = await prisma.user.findUnique({ where: { id }, include: { profile: true } });
    if (!user) throw new AppError(404, 'Không tìm thấy người dùng.');
    const profile = await prisma.userProfile.upsert({
      where: { userId: id },
      create: { userId: id, fullName: user.email.split('@')[0] ?? 'Nhân viên', ...data },
      update: data,
    });
    await audit(actor, 'UPDATE', 'staff_profile', id, data);
    return profile;
  },
};
