import { z } from 'zod';
import { prisma } from '../config/database';
import { AppError, pageResult, paginate, paginationSchema, parseId, parseInput } from '../utils/http';

const userQuerySchema = paginationSchema.extend({
  q: z.string().trim().max(100).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']).optional(),
});
const statusSchema = z.object({ status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']) }).strict();

export const adminService = {
  // Thống kê nhanh cho trang quản trị
  async stats() {
    const [users, products, articles, conversations, messages, diagnoses, estimates, comparisons, dangerDiagnoses] =
      await prisma.$transaction([
        prisma.user.count(),
        prisma.product.count({ where: { isActive: true } }),
        prisma.knowledgeArticle.count({ where: { isPublished: true } }),
        prisma.conversation.count(),
        prisma.message.count(),
        prisma.diagnosis.count(),
        prisma.costEstimate.count(),
        prisma.comparison.count(),
        prisma.diagnosis.count({ where: { riskLevel: 'DANGER' } }),
      ]);
    return { users, products, articles, conversations, messages, diagnoses, estimates, comparisons, dangerDiagnoses };
  },

  async listUsers(rawQuery: unknown) {
    const query = parseInput(userQuerySchema, rawQuery);
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.q ? { OR: [
        { email: { contains: query.q, mode: 'insensitive' as const } },
        { profile: { fullName: { contains: query.q, mode: 'insensitive' as const } } },
      ] } : {}),
    };
    const [items, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        omit: { passwordHash: true },
        include: { profile: { select: { fullName: true, phone: true } }, _count: { select: { conversations: true, diagnoses: true } } },
        ...paginate(query.page, query.limit),
      }),
      prisma.user.count({ where }),
    ]);
    return pageResult(items, total, query.page, query.limit);
  },

  // Khóa / mở khóa tài khoản. Khóa → thu hồi luôn refresh token.
  async setUserStatus(adminId: string, rawId: unknown, body: unknown) {
    const id = parseId(rawId);
    if (id === adminId) throw new AppError(400, 'Không thể tự đổi trạng thái tài khoản của chính mình.');
    const { status } = parseInput(statusSchema, body);
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.update({ where: { id }, data: { status }, omit: { passwordHash: true } });
      if (status !== 'ACTIVE') {
        await tx.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
      }
      return user;
    });
  },
};
