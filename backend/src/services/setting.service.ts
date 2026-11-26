import { prisma } from '../config/database';
import type { Prisma } from '../generated/prisma/client';
import { parseInput, type Actor } from '../utils/http';
import { settingsSchema } from '../validators/admin.validator';
import { audit } from './audit.service';

// Giá trị mặc định khi DB chưa có. Admin sửa ở trang "Cấu hình".
export const DEFAULT_SETTINGS: Record<string, { value: unknown; description: string }> = {
  'alert.maxTemperature': { value: 35, description: 'Nhiệt độ dàn (°C) vượt ngưỡng → cảnh báo quá nhiệt' },
  'alert.minPressure': { value: 60, description: 'Áp suất gas (psi) dưới ngưỡng → nghi rò gas' },
  'alert.maxPowerKw': { value: 2.5, description: 'Công suất tiêu thụ (kW) vượt ngưỡng → cảnh báo' },
  'alert.offlineMinutes': { value: 30, description: 'Không gửi dữ liệu quá N phút → OFFLINE' },
  'alert.autoNotifyCritical': { value: true, description: 'Tự gửi thông báo cho chủ máy khi có lỗi CRITICAL' },
  'alert.autoCreateTicket': { value: true, description: 'Tự tạo phiếu sửa chữa khẩn khi có lỗi CRITICAL' },
  'warranty.AIR_CONDITIONER': { value: 24, description: 'Thời hạn bảo hành máy lạnh (tháng)' },
  'warranty.REFRIGERATOR': { value: 24, description: 'Thời hạn bảo hành tủ lạnh (tháng)' },
  'warranty.FREEZER': { value: 24, description: 'Thời hạn bảo hành tủ đông (tháng)' },
};

export async function getSettings(): Promise<Record<string, unknown>> {
  const rows = await prisma.systemSetting.findMany();
  const result: Record<string, unknown> = {};
  for (const [key, def] of Object.entries(DEFAULT_SETTINGS)) result[key] = def.value;
  for (const row of rows) result[row.key] = row.value;
  return result;
}

export async function getSetting<T>(key: string): Promise<T> {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  return (row ? row.value : DEFAULT_SETTINGS[key]?.value) as T;
}

export const settingService = {
  async list() {
    const values = await getSettings();
    return Object.entries(values).map(([key, value]) => ({ key, value, description: DEFAULT_SETTINGS[key]?.description ?? null }));
  },

  async update(actor: Actor, body: unknown) {
    const data = parseInput(settingsSchema, body);
    const before = await getSettings();
    await prisma.$transaction(
      Object.entries(data).map(([key, value]) =>
        prisma.systemSetting.upsert({
          where: { key },
          create: { key, value: value as Prisma.InputJsonValue, description: DEFAULT_SETTINGS[key]?.description ?? null },
          update: { value: value as Prisma.InputJsonValue },
        }),
      ),
    );
    const changes = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, { from: before[k] ?? null, to: v }]));
    await audit(actor, 'UPDATE', 'setting', null, changes);
    return this.list();
  },
};
