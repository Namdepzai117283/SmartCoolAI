import { prisma } from '../config/database';
import { parseId, parseInput, type Actor } from '../utils/http';
import { maintenanceRuleSchema } from '../validators/admin.validator';
import { audit } from './audit.service';

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export const maintenanceService = {
  async listRules() {
    return prisma.maintenanceRule.findMany({ orderBy: { deviceType: 'asc' } });
  },

  async upsertRule(actor: Actor, body: unknown) {
    const data = parseInput(maintenanceRuleSchema, body);
    const rule = await prisma.maintenanceRule.upsert({ where: { deviceType: data.deviceType }, create: data, update: data });
    await audit(actor, 'UPDATE', 'maintenance_rule', rule.id, data);
    return rule;
  },

  async removeRule(actor: Actor, rawId: unknown) {
    const rule = await prisma.maintenanceRule.delete({ where: { id: parseId(rawId) } });
    await audit(actor, 'DELETE', 'maintenance_rule', rule.id, { deviceType: rule.deviceType });
    return { deleted: true };
  },

  // Thiết bị đến hạn: (lần bảo trì cuối hoặc ngày lắp) + chu kỳ <= hôm nay
  async dueDevices() {
    const rules = await prisma.maintenanceRule.findMany({ where: { isActive: true } });
    const now = new Date();
    const result = [];
    for (const rule of rules) {
      const devices = await prisma.device.findMany({
        where: { product: { deviceType: rule.deviceType }, ownerId: { not: null } },
        select: { id: true, serial: true, name: true, region: true, ownerId: true, lastServiceAt: true, installedAt: true, createdAt: true, owner: { select: { email: true } } },
      });
      for (const d of devices) {
        const last = d.lastServiceAt ?? d.installedAt ?? d.createdAt;
        const dueAt = addMonths(last, rule.intervalMonths);
        if (dueAt <= now) result.push({ ...d, deviceType: rule.deviceType, dueAt, message: rule.message });
      }
    }
    return result.sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
  },

  // Gửi nhắc bảo trì cho chủ máy đến hạn (bỏ qua nếu đã nhắc trong 7 ngày)
  async run(actor: Actor) {
    const due = await this.dueDevices();
    const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    let sent = 0;
    for (const d of due) {
      const title = `Đến hạn bảo trì: ${d.name ?? d.serial}`;
      const recent = await prisma.notification.count({ where: { recipientId: d.ownerId!, title, createdAt: { gte: weekAgo } } });
      if (recent) continue;
      await prisma.notification.create({ data: { title, body: d.message, type: 'MAINTENANCE', target: 'USER', recipientId: d.ownerId!, sentAt: new Date() } });
      sent++;
    }
    await prisma.maintenanceRule.updateMany({ where: { isActive: true }, data: { lastRunAt: new Date() } });
    await audit(actor, 'RUN', 'maintenance_rule', null, { due: due.length, sent });
    return { due: due.length, sent };
  },
};
