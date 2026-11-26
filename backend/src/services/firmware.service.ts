import { prisma } from '../config/database';
import type { Prisma } from '../generated/prisma/client';
import { AppError, parseId, parseInput, type Actor } from '../utils/http';
import { firmwareSchema, rolloutSchema } from '../validators/admin.validator';
import { audit } from './audit.service';

export const firmwareService = {
  async list() {
    const rows = await prisma.firmware.findMany({ orderBy: [{ deviceType: 'asc' }, { createdAt: 'desc' }] });
    const stats = await prisma.firmwareRollout.groupBy({ by: ['firmwareId', 'status'], _count: { _all: true } });
    return rows.map((fw) => {
      const s = { PENDING: 0, SUCCESS: 0, FAILED: 0 };
      for (const row of stats) if (row.firmwareId === fw.id) s[row.status] = row._count._all;
      return { ...fw, rollout: s };
    });
  },

  async create(actor: Actor, body: unknown) {
    const row = await prisma.firmware.create({ data: parseInput(firmwareSchema, body) });
    await audit(actor, 'CREATE', 'firmware', row.id, { version: row.version, deviceType: row.deviceType });
    return row;
  },

  async remove(actor: Actor, rawId: unknown) {
    const row = await prisma.firmware.delete({ where: { id: parseId(rawId) } });
    await audit(actor, 'DELETE', 'firmware', row.id, { version: row.version });
    return { deleted: true };
  },

  async rollouts(rawId: unknown) {
    return prisma.firmwareRollout.findMany({
      where: { firmwareId: parseId(rawId) },
      orderBy: { startedAt: 'desc' },
      take: 200,
      include: { device: { select: { serial: true, name: true, region: true, status: true } } },
    });
  },

  /**
   * Đẩy OTA theo: danh sách thiết bị / khu vực / toàn bộ (cùng loại máy).
   * Đây là MÔ PHỎNG: thiết bị OFFLINE → thất bại, còn lại thành công 90%.
   */
  async rollout(actor: Actor, rawId: unknown, body: unknown) {
    const id = parseId(rawId);
    const data = parseInput(rolloutSchema, body);
    const fw = await prisma.firmware.findUnique({ where: { id } });
    if (!fw) throw new AppError(404, 'Không tìm thấy firmware.');

    const where: Prisma.DeviceWhereInput = {
      product: { deviceType: fw.deviceType },
      firmwareVersion: { not: fw.version },
      ...(data.scope === 'DEVICES' ? { id: { in: data.deviceIds } } : {}),
      ...(data.scope === 'REGION' ? { region: data.region } : {}),
    };
    const devices = await prisma.device.findMany({ where, select: { id: true, status: true, firmwareVersion: true } });
    if (!devices.length) throw new AppError(400, 'Không có thiết bị nào cần cập nhật (cùng loại máy và khác phiên bản).');

    const now = new Date();
    let success = 0;
    let failed = 0;
    for (const d of devices) {
      const ok = d.status !== 'OFFLINE' && Math.random() < 0.9;
      ok ? success++ : failed++;
      await prisma.$transaction([
        prisma.firmwareRollout.create({
          data: { firmwareId: id, deviceId: d.id, status: ok ? 'SUCCESS' : 'FAILED', finishedAt: now, message: ok ? `Cập nhật ${d.firmwareVersion} → ${fw.version}` : d.status === 'OFFLINE' ? 'Thiết bị đang offline' : 'Mất kết nối khi tải gói' },
        }),
        ...(ok
          ? [
              prisma.device.update({ where: { id: d.id }, data: { firmwareVersion: fw.version } }),
              prisma.deviceEvent.create({ data: { deviceId: d.id, type: 'FIRMWARE', detail: { from: d.firmwareVersion, to: fw.version } } }),
            ]
          : []),
      ]);
    }
    await audit(actor, 'OTA_PUSH', 'firmware', id, { version: fw.version, scope: data.scope, region: data.region, total: devices.length, success, failed });
    return { total: devices.length, success, failed };
  },
};
