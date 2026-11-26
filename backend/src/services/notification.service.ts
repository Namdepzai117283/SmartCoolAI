import { z } from 'zod';
import { prisma } from '../config/database';
import type { Prisma } from '../generated/prisma/client';
import { AppError, pageResult, paginate, paginationSchema, parseId, parseInput, type Actor } from '../utils/http';
import { notificationSchema } from '../validators/admin.validator';
import { audit } from './audit.service';

const querySchema = paginationSchema.extend({ type: z.enum(['SYSTEM', 'PROMOTION', 'WEATHER', 'DEVICE_ALERT', 'MAINTENANCE']).optional() });

export const notificationService = {
  async list(rawQuery: unknown) {
    const q = parseInput(querySchema, rawQuery);
    const where: Prisma.NotificationWhereInput = q.type ? { type: q.type } : {};
    const [items, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where, orderBy: { createdAt: 'desc' }, ...paginate(q.page, q.limit),
        include: { recipient: { select: { email: true } }, sender: { select: { email: true } } },
      }),
      prisma.notification.count({ where }),
    ]);
    return pageResult(items, total, q.page, q.limit);
  },

  // Gửi ngay, hoặc hẹn giờ (scheduledAt ở tương lai → sentAt = null, gửi khi đến giờ)
  async create(actor: Actor, body: unknown) {
    const data = parseInput(notificationSchema, body);
    if (data.recipientId) {
      const exists = await prisma.user.count({ where: { id: data.recipientId } });
      if (!exists) throw new AppError(400, 'Người nhận không tồn tại.');
    }
    const scheduled = data.scheduledAt && data.scheduledAt > new Date();
    const row = await prisma.notification.create({ data: { ...data, senderId: actor.userId, sentAt: scheduled ? null : new Date() } });
    await audit(actor, 'SEND', 'notification', row.id, { title: row.title, target: row.target, targetValue: row.targetValue });
    return row;
  },

  async remove(actor: Actor, rawId: unknown) {
    const row = await prisma.notification.delete({ where: { id: parseId(rawId) } });
    await audit(actor, 'DELETE', 'notification', row.id, { title: row.title });
    return { deleted: true };
  },

  // Đẩy các thông báo hẹn giờ đã đến hạn (gọi mỗi khi có người mở hộp thư)
  async releaseScheduled() {
    await prisma.notification.updateMany({ where: { sentAt: null, scheduledAt: { lte: new Date() } }, data: { sentAt: new Date() } });
  },

  // Hộp thư của người dùng: gửi cho tất cả + cho vai trò của tôi + riêng tôi
  async inbox(userId: string, role: string) {
    await this.releaseScheduled();
    return prisma.notification.findMany({
      where: {
        sentAt: { not: null },
        OR: [{ target: 'ALL' }, { target: 'ROLE', targetValue: role }, { target: 'USER', recipientId: userId }],
      },
      orderBy: { sentAt: 'desc' },
      take: 50,
    });
  },

  async markRead(userId: string, rawId: unknown) {
    await prisma.notification.updateMany({ where: { id: parseId(rawId), recipientId: userId }, data: { readAt: new Date() } });
    return { read: true };
  },
};
