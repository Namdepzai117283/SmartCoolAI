import { prisma } from '../config/database';
import type { Prisma } from '../generated/prisma/client';
import { AppError, pageResult, paginate, parseId, parseInput, type Actor } from '../utils/http';
import { deviceCreateSchema, deviceQuerySchema, deviceUpdateSchema } from '../validators/admin.validator';
import { audit } from './audit.service';
import { errorCodeService } from './errorCode.service';
import { getSetting } from './setting.service';
import { createTicketInternal } from './ticket.service';

const listInclude = {
  product: { select: { id: true, name: true, model: true, deviceType: true, brand: { select: { name: true } } } },
  owner: { select: { id: true, email: true, profile: { select: { fullName: true, phone: true } } } },
} as const;

type DeviceType = 'AIR_CONDITIONER' | 'REFRIGERATOR' | 'FREEZER';

export const deviceService = {
  // Tra cứu theo Serial / MAC / tên / email chủ máy
  async list(rawQuery: unknown) {
    const q = parseInput(deviceQuerySchema, rawQuery);
    const where: Prisma.DeviceWhereInput = {
      ...(q.status ? { status: q.status } : {}),
      ...(q.region ? { region: q.region } : {}),
      ...(q.firmware ? { firmwareVersion: q.firmware } : {}),
      ...(q.deviceType ? { product: { deviceType: q.deviceType } } : {}),
      ...(q.q
        ? { OR: [
            { serial: { contains: q.q, mode: 'insensitive' } },
            { macAddress: { contains: q.q, mode: 'insensitive' } },
            { name: { contains: q.q, mode: 'insensitive' } },
            { owner: { email: { contains: q.q, mode: 'insensitive' } } },
          ] }
        : {}),
    };
    const [items, total] = await prisma.$transaction([
      prisma.device.findMany({ where, orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }], include: listInclude, ...paginate(q.page, q.limit) }),
      prisma.device.count({ where }),
    ]);
    return pageResult(items, total, q.page, q.limit);
  },

  // Chi tiết + lịch sử vận hành, sự kiện, OTA, phiếu dịch vụ
  async get(rawId: unknown) {
    const id = parseId(rawId);
    const device = await prisma.device.findUnique({
      where: { id },
      include: {
        ...listInclude,
        telemetry: { orderBy: { recordedAt: 'desc' }, take: 48 },
        events: { orderBy: { createdAt: 'desc' }, take: 30 },
        rollouts: { orderBy: { startedAt: 'desc' }, take: 10, include: { firmware: { select: { version: true } } } },
        tickets: { orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, code: true, type: true, status: true, title: true, totalCost: true, completedAt: true, createdAt: true, partsUsed: true, errorCode: true } },
      },
    });
    if (!device) throw new AppError(404, 'Không tìm thấy thiết bị.');
    const errorInfo = device.lastErrorCode
      ? await errorCodeService.lookup(device.lastErrorCode, device.product.deviceType, device.product.brand.name)
      : null;
    return { ...device, telemetry: device.telemetry.reverse(), errorInfo };
  },

  async create(actor: Actor, body: unknown) {
    const data = parseInput(deviceCreateSchema, body);
    const product = await prisma.product.findUnique({ where: { id: data.productId } });
    if (!product) throw new AppError(400, 'productId không tồn tại.');
    // Không nhập hạn bảo hành → tính theo cấu hình hệ thống
    let warrantyUntil = data.warrantyUntil ?? null;
    if (!warrantyUntil && data.installedAt) {
      const months = await getSetting<number>(`warranty.${product.deviceType}`);
      warrantyUntil = new Date(data.installedAt);
      warrantyUntil.setMonth(warrantyUntil.getMonth() + Number(months || 24));
    }
    const device = await prisma.device.create({ data: { ...data, warrantyUntil }, include: listInclude });
    await audit(actor, 'CREATE', 'device', device.id, { serial: device.serial });
    return device;
  },

  async update(actor: Actor, rawId: unknown, body: unknown) {
    const id = parseId(rawId);
    const data = parseInput(deviceUpdateSchema, body);
    const before = await prisma.device.findUnique({ where: { id } });
    if (!before) throw new AppError(404, 'Không tìm thấy thiết bị.');
    const device = await prisma.device.update({ where: { id }, data, include: listInclude });
    if (data.powerOn !== undefined && data.powerOn !== before.powerOn) {
      await prisma.deviceEvent.create({ data: { deviceId: id, type: data.powerOn ? 'POWER_ON' : 'POWER_OFF', detail: { by: 'admin' } } });
    }
    if (data.mode && data.mode !== before.mode) {
      await prisma.deviceEvent.create({ data: { deviceId: id, type: 'MODE', detail: { from: before.mode, to: data.mode } } });
    }
    await audit(actor, 'UPDATE', 'device', id, data);
    return device;
  },

  async remove(actor: Actor, rawId: unknown) {
    const row = await prisma.device.delete({ where: { id: parseId(rawId) } });
    await audit(actor, 'DELETE', 'device', row.id, { serial: row.serial });
    return { deleted: true };
  },

  /**
   * Nhận 1 bản ghi thông số (giả lập thiết bị IoT gửi lên).
   * So với ngưỡng trong Cấu hình → nếu vượt hoặc có mã lỗi CRITICAL:
   * đổi trạng thái ERROR, ghi sự kiện, báo chủ máy, tự tạo phiếu khẩn.
   */
  async ingest(rawId: unknown, reading: { temperature?: number; humidity?: number; powerKw?: number; pressure?: number; errorCode?: string | null }) {
    const id = parseId(rawId);
    const device = await prisma.device.findUnique({ where: { id }, include: { product: { include: { brand: true } } } });
    if (!device) throw new AppError(404, 'Không tìm thấy thiết bị.');

    const [maxTemp, minPressure, maxPower, autoNotify, autoTicket] = await Promise.all([
      getSetting<number>('alert.maxTemperature'),
      getSetting<number>('alert.minPressure'),
      getSetting<number>('alert.maxPowerKw'),
      getSetting<boolean>('alert.autoNotifyCritical'),
      getSetting<boolean>('alert.autoCreateTicket'),
    ]);

    let errorCode = reading.errorCode?.toUpperCase() ?? null;
    if (!errorCode && reading.pressure != null && reading.pressure < Number(minPressure)) errorCode = 'GAS-LOW';
    if (!errorCode && reading.temperature != null && reading.temperature > Number(maxTemp)) errorCode = 'OVERHEAT';
    if (!errorCode && reading.powerKw != null && reading.powerKw > Number(maxPower)) errorCode = 'POWER-HIGH';

    await prisma.deviceTelemetry.create({ data: { deviceId: id, ...reading, errorCode } });

    const info = errorCode ? await errorCodeService.lookup(errorCode, device.product.deviceType as DeviceType, device.product.brand.name) : null;
    const critical = info?.severity === 'CRITICAL';

    await prisma.device.update({
      where: { id },
      data: {
        lastSeenAt: new Date(),
        status: errorCode ? 'ERROR' : 'ONLINE',
        lastErrorCode: errorCode,
        ...(reading.temperature != null ? { currentTemp: reading.temperature } : {}),
      },
    });

    let ticket = null;
    if (errorCode) {
      await prisma.deviceEvent.create({ data: { deviceId: id, type: 'ERROR', detail: { code: errorCode, severity: info?.severity ?? 'WARNING', title: info?.title ?? null } } });
      if (critical && device.ownerId && autoNotify) {
        await prisma.notification.create({
          data: {
            title: `Cảnh báo: ${info?.title ?? errorCode}`,
            body: `Thiết bị ${device.name ?? device.serial} báo lỗi ${errorCode}. ${info?.solution ?? 'Vui lòng ngắt điện và chờ kỹ thuật viên.'}`,
            type: 'DEVICE_ALERT', target: 'USER', recipientId: device.ownerId, sentAt: new Date(),
          },
        });
      }
      if (critical && device.ownerId && autoTicket) {
        const open = await prisma.serviceTicket.count({ where: { deviceId: id, status: { in: ['NEW', 'ASSIGNED', 'IN_PROGRESS'] } } });
        if (!open) {
          ticket = await createTicketInternal({
            customerId: device.ownerId, deviceId: id, type: 'REPAIR', priority: 'URGENT',
            title: `[Tự động] ${info?.title ?? errorCode}`, errorCode, region: device.region, address: device.address,
            description: 'Phiếu tạo tự động từ cảnh báo thiết bị.',
          });
        }
      }
    }
    return { errorCode, severity: info?.severity ?? null, ticket };
  },

  // Nút "Giả lập dữ liệu" trên trang Admin
  async simulate(rawId: unknown, scenario: string | undefined) {
    const r = (min: number, max: number) => Math.round((min + Math.random() * (max - min)) * 10) / 10;
    const base = { temperature: r(18, 28), humidity: r(45, 70), powerKw: r(0.4, 1.4), pressure: r(110, 140) };
    const readings: Record<string, typeof base & { errorCode?: string }> = {
      normal: base,
      gas: { ...base, pressure: r(30, 55) },
      overheat: { ...base, temperature: r(38, 45), errorCode: 'E5' },
      sensor: { ...base, errorCode: 'E1' },
    };
    return this.ingest(rawId, readings[scenario ?? 'normal'] ?? base);
  },

  // Khách hàng: thiết bị của tôi
  async listMine(userId: string) {
    return prisma.device.findMany({ where: { ownerId: userId }, include: { product: { select: { name: true, model: true, deviceType: true } } }, orderBy: { createdAt: 'desc' } });
  },
};
