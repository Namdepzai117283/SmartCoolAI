// ==========================================
// DỮ LIỆU MẪU CHO GIAO DIỆN ADMIN
// Nhân viên, kỹ thuật viên, khách hàng, mã lỗi, thiết bị IoT (mô phỏng),
// telemetry 14 ngày, firmware/OTA, phiếu dịch vụ 6 tháng, nhắc bảo trì, thông báo.
// Các bản ghi mẫu có serial "SCD-..." và mã phiếu "SC-DEMO-..." để seed lại không bị nhân đôi.
// ==========================================
import { prisma } from '../src/config/database';
import { hashPassword } from '../src/utils/password';

type DeviceType = 'AIR_CONDITIONER' | 'REFRIGERATOR' | 'FREEZER';
type Role = 'USER' | 'ADMIN' | 'WAREHOUSE' | 'SUPPORT' | 'TECHNICIAN';

// Sinh số ngẫu nhiên có hạt giống → lần seed nào cũng ra cùng dữ liệu
let seed = 20261126;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!;
const between = (min: number, max: number) => Math.round((min + rand() * (max - min)) * 10) / 10;
const daysAgo = (n: number, hour = 9) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(hour, Math.floor(rand() * 60), 0, 0); return d; };

const REGIONS = ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Bình Dương'] as const;

const STAFF: Array<{ email: string; name: string; role: Role; phone: string; region?: string; skills?: string[] }> = [
  { email: 'kho@smartcool.vn', name: 'Trần Quản Kho', role: 'WAREHOUSE', phone: '0900000010' },
  { email: 'cskh@smartcool.vn', name: 'Lê Chăm Sóc', role: 'SUPPORT', phone: '0900000011' },
  { email: 'ktv.hung@smartcool.vn', name: 'Nguyễn Văn Hùng', role: 'TECHNICIAN', phone: '0911000001', region: 'TP. Hồ Chí Minh', skills: ['Máy lạnh', 'Nạp gas'] },
  { email: 'ktv.minh@smartcool.vn', name: 'Phạm Minh', role: 'TECHNICIAN', phone: '0911000002', region: 'Hà Nội', skills: ['Tủ lạnh', 'Tủ đông'] },
  { email: 'ktv.tuan@smartcool.vn', name: 'Võ Anh Tuấn', role: 'TECHNICIAN', phone: '0911000003', region: 'Đà Nẵng', skills: ['Máy lạnh', 'Bo mạch'] },
  { email: 'ktv.long@smartcool.vn', name: 'Đỗ Long', role: 'TECHNICIAN', phone: '0911000004', region: 'TP. Hồ Chí Minh', skills: ['Tủ lạnh', 'Máy lạnh'] },
];

const CUSTOMERS = [
  { email: 'an.nguyen@gmail.com', name: 'Nguyễn Thị An', phone: '0987000001' },
  { email: 'binh.tran@gmail.com', name: 'Trần Văn Bình', phone: '0987000002' },
  { email: 'cuong.le@gmail.com', name: 'Lê Quốc Cường', phone: '0987000003' },
  { email: 'dung.pham@gmail.com', name: 'Phạm Thùy Dung', phone: '0987000004' },
  { email: 'em.hoang@gmail.com', name: 'Hoàng Gia Em', phone: '0987000005' },
  { email: 'giang.vo@gmail.com', name: 'Võ Hương Giang', phone: '0987000006' },
  { email: 'hai.dang@gmail.com', name: 'Đặng Thanh Hải', phone: '0987000007' },
];

const ERROR_CODES: Array<{ code: string; deviceType: DeviceType; brand?: string; title: string; severity: 'INFO' | 'WARNING' | 'CRITICAL'; causes: string[]; solution: string }> = [
  { code: 'GAS-LOW', deviceType: 'AIR_CONDITIONER', title: 'Áp suất gas thấp – nghi rò gas', severity: 'CRITICAL', causes: ['Rò rỉ tại rắc co, mối hàn', 'Ống đồng bị thủng'], solution: 'Tắt máy, mở cửa thông gió. Kỹ thuật viên dò rò, hàn lại và nạp gas đúng định lượng.' },
  { code: 'OVERHEAT', deviceType: 'AIR_CONDITIONER', title: 'Quá nhiệt dàn nóng / máy nén', severity: 'CRITICAL', causes: ['Dàn nóng bám bẩn', 'Quạt dàn nóng hỏng', 'Đặt dàn nóng nơi bí gió'], solution: 'Ngắt điện 30 phút, vệ sinh dàn nóng, kiểm tra quạt và tụ quạt.' },
  { code: 'POWER-HIGH', deviceType: 'AIR_CONDITIONER', title: 'Điện năng tiêu thụ bất thường', severity: 'WARNING', causes: ['Thiếu gas làm máy chạy liên tục', 'Lưới lọc tắc'], solution: 'Vệ sinh lưới lọc, kiểm tra áp suất gas.' },
  { code: 'E1', deviceType: 'AIR_CONDITIONER', title: 'Lỗi cảm biến nhiệt độ phòng', severity: 'WARNING', causes: ['Cảm biến đứt hoặc lỏng giắc'], solution: 'Kiểm tra giắc cảm biến, đo điện trở, thay cảm biến nếu hỏng.' },
  { code: 'E4', deviceType: 'AIR_CONDITIONER', title: 'Lỗi cảm biến dàn lạnh / thiếu gas', severity: 'WARNING', causes: ['Thiếu gas', 'Cảm biến dàn lạnh hỏng'], solution: 'Đo áp suất gas, kiểm tra cảm biến dàn lạnh.' },
  { code: 'E5', deviceType: 'AIR_CONDITIONER', title: 'Bảo vệ quá tải máy nén', severity: 'CRITICAL', causes: ['Điện áp yếu', 'Máy nén kẹt cơ'], solution: 'Ngắt điện, kiểm tra điện áp nguồn và dòng máy nén. Không bật lại liên tục.' },
  { code: 'U4', deviceType: 'AIR_CONDITIONER', brand: 'Daikin', title: 'Lỗi giao tiếp dàn nóng – dàn lạnh', severity: 'WARNING', causes: ['Dây tín hiệu lỏng', 'Bo mạch dàn nóng lỗi'], solution: 'Kiểm tra dây tín hiệu giữa 2 dàn, reset nguồn, kiểm tra bo.' },
  { code: 'H6', deviceType: 'AIR_CONDITIONER', brand: 'Panasonic', title: 'Lỗi quạt dàn lạnh', severity: 'WARNING', causes: ['Motor quạt hỏng', 'Cánh quạt kẹt'], solution: 'Vệ sinh lồng sóc, kiểm tra motor quạt.' },
  { code: 'CH05', deviceType: 'AIR_CONDITIONER', brand: 'LG', title: 'Lỗi giao tiếp (LG)', severity: 'WARNING', causes: ['Dây tín hiệu'], solution: 'Kiểm tra đấu nối dây tín hiệu.' },
  { code: 'FILTER', deviceType: 'AIR_CONDITIONER', title: 'Nhắc vệ sinh lưới lọc', severity: 'INFO', causes: ['Đã chạy quá 300 giờ'], solution: 'Tháo lưới lọc rửa nước sạch, phơi khô rồi lắp lại.' },
  { code: 'OVERHEAT', deviceType: 'REFRIGERATOR', title: 'Ngăn mát quá nhiệt', severity: 'CRITICAL', causes: ['Hỏng quạt dàn lạnh', 'Hỏng máy nén', 'Cửa không kín'], solution: 'Kiểm tra gioăng cửa, quạt dàn lạnh và máy nén.' },
  { code: 'DEFROST', deviceType: 'REFRIGERATOR', title: 'Lỗi hệ thống xả đá', severity: 'WARNING', causes: ['Hỏng sò nóng / điện trở xả đá'], solution: 'Xả đá thủ công, kiểm tra timer, sò và điện trở xả đá.' },
  { code: 'DOOR', deviceType: 'REFRIGERATOR', title: 'Cửa tủ mở quá lâu', severity: 'INFO', causes: ['Cửa chưa đóng kín'], solution: 'Đóng kín cửa tủ.' },
  { code: 'OVERHEAT', deviceType: 'FREEZER', title: 'Tủ đông không đạt nhiệt độ', severity: 'CRITICAL', causes: ['Thiếu gas', 'Máy nén yếu'], solution: 'Chuyển thực phẩm sang tủ khác, gọi kỹ thuật kiểm tra gas và máy nén.' },
  { code: 'POWER-HIGH', deviceType: 'FREEZER', title: 'Tiêu thụ điện cao', severity: 'WARNING', causes: ['Gioăng hở', 'Đóng tuyết dày'], solution: 'Xả đá, kiểm tra gioăng.' },
];

async function upsertUser(email: string, fullName: string, role: Role, phone: string, extra: { region?: string; skills?: string[]; address?: string } = {}) {
  const passwordHash = await hashPassword(role === 'USER' ? 'Khach@123456' : 'Staff@123456');
  return prisma.user.upsert({
    where: { email },
    update: { role, status: 'ACTIVE' },
    create: { email, passwordHash, role, profile: { create: { fullName, phone, address: extra.address ?? null, region: extra.region ?? null, skills: extra.skills ?? [] } } },
  });
}

export async function seedAdmin(adminId: string, demoUserId: string) {
  // ---------- Nhân viên & khách hàng ----------
  const staff: Record<string, string> = {};
  for (const s of STAFF) staff[s.email] = (await upsertUser(s.email, s.name, s.role, s.phone, { region: s.region, skills: s.skills })).id;
  const technicians = STAFF.filter((s) => s.role === 'TECHNICIAN').map((s) => ({ id: staff[s.email]!, region: s.region! }));
  await prisma.userProfile.update({ where: { userId: staff['ktv.long@smartcool.vn']! }, data: { isAvailable: false } });

  const customers: string[] = [demoUserId];
  for (const c of CUSTOMERS) customers.push((await upsertUser(c.email, c.name, 'USER', c.phone, { address: `${Math.floor(rand() * 300) + 1} Lê Lợi` })).id);

  // ---------- Mã lỗi ----------
  for (const e of ERROR_CODES) {
    const data = { ...e, brand: e.brand ?? '' };
    await prisma.errorCode.upsert({ where: { code_deviceType_brand: { code: e.code, deviceType: e.deviceType, brand: data.brand } }, update: data, create: data });
  }

  // ---------- Quy tắc bảo trì & firmware ----------
  const rules: Array<[DeviceType, number, string]> = [
    ['AIR_CONDITIONER', 6, 'Máy lạnh của bạn đã đến hạn vệ sinh định kỳ (6 tháng/lần). Đặt lịch ngay để máy mát hơn và tiết kiệm điện.'],
    ['REFRIGERATOR', 12, 'Tủ lạnh đã đến hạn bảo dưỡng định kỳ (12 tháng/lần): vệ sinh dàn ngưng, kiểm tra gioăng.'],
    ['FREEZER', 6, 'Tủ đông đến hạn bảo dưỡng (6 tháng/lần): xả đá, vệ sinh dàn, kiểm tra gas.'],
  ];
  for (const [deviceType, intervalMonths, message] of rules) {
    await prisma.maintenanceRule.upsert({ where: { deviceType }, update: { intervalMonths, message }, create: { deviceType, intervalMonths, message } });
  }
  const firmwareList: Array<[string, DeviceType, string]> = [
    ['1.0.0', 'AIR_CONDITIONER', 'Bản phát hành đầu tiên'],
    ['1.2.0', 'AIR_CONDITIONER', 'Tối ưu chế độ ECO, sửa lỗi hẹn giờ'],
    ['1.3.0', 'AIR_CONDITIONER', 'Thêm cảnh báo rò gas sớm, cải thiện kết nối Wi-Fi'],
    ['2.0.0', 'REFRIGERATOR', 'Bản đầu tiên cho tủ lạnh thông minh'],
    ['2.1.0', 'REFRIGERATOR', 'Cảnh báo cửa mở, tối ưu xả đá'],
    ['3.0.0', 'FREEZER', 'Bản đầu tiên cho tủ đông'],
  ];
  const fw: Record<string, string> = {};
  for (const [version, deviceType, notes] of firmwareList) {
    fw[`${deviceType}@${version}`] = (await prisma.firmware.upsert({ where: { version_deviceType: { version, deviceType } }, update: { notes }, create: { version, deviceType, notes } })).id;
  }

  // ---------- Xóa dữ liệu thiết bị/phiếu mẫu cũ ----------
  await prisma.serviceTicket.deleteMany({ where: { code: { startsWith: 'SC-DEMO-' } } });
  await prisma.device.deleteMany({ where: { serial: { startsWith: 'SCD-' } } }); // telemetry/events/rollouts xóa theo (Cascade)

  // ---------- Thiết bị ----------
  const products = await prisma.product.findMany({ where: { isActive: true }, include: { brand: true } });
  const errorCodes = await prisma.errorCode.findMany();
  const devices: Array<{ id: string; deviceType: DeviceType; ownerId: string; region: string; brand: string; status: string; lastErrorCode: string | null }> = [];

  for (let i = 1; i <= 32; i++) {
    const product = i <= 20 ? pick(products.filter((p) => p.deviceType === 'AIR_CONDITIONER')) : i <= 28 ? pick(products.filter((p) => p.deviceType === 'REFRIGERATOR')) : pick(products.filter((p) => p.deviceType === 'FREEZER'));
    const deviceType = product.deviceType as DeviceType;
    const ownerId = customers[i % customers.length]!;
    const region = REGIONS[i % REGIONS.length]!;
    const r = rand();
    const status = r < 0.62 ? 'ONLINE' : r < 0.78 ? 'OFFLINE' : 'ERROR';
    const codesForType = errorCodes.filter((e) => e.deviceType === deviceType && (e.brand === '' || e.brand === product.brand.name) && e.severity !== 'INFO');
    const lastErrorCode = status === 'ERROR' ? pick(codesForType).code : null;
    const installedAt = daysAgo(Math.floor(between(120, 900)));
    const versions = firmwareList.filter((f) => f[1] === deviceType).map((f) => f[0]);
    const prefix = deviceType === 'AIR_CONDITIONER' ? 'AC' : deviceType === 'REFRIGERATOR' ? 'RF' : 'FZ';
    const hex = () => Math.floor(rand() * 256).toString(16).padStart(2, '0').toUpperCase();
    const warrantyUntil = new Date(installedAt); warrantyUntil.setMonth(warrantyUntil.getMonth() + 24);

    const device = await prisma.device.create({
      data: {
        serial: `SCD-${prefix}-${String(1000 + i)}`,
        macAddress: `AC:1F:${hex()}:${hex()}:${hex()}:${String(i).padStart(2, '0')}`,
        productId: product.id, ownerId, region,
        name: deviceType === 'AIR_CONDITIONER' ? pick(['Máy lạnh phòng khách', 'Máy lạnh phòng ngủ', 'Máy lạnh văn phòng']) : deviceType === 'REFRIGERATOR' ? 'Tủ lạnh nhà bếp' : 'Tủ đông cửa hàng',
        address: `${Math.floor(rand() * 300) + 1} Nguyễn Huệ, ${region}`,
        status: status as 'ONLINE' | 'OFFLINE' | 'ERROR',
        firmwareVersion: versions[Math.floor(rand() * Math.max(1, versions.length - 1))] ?? '1.0.0',
        lastSeenAt: status === 'OFFLINE' ? daysAgo(Math.floor(between(1, 6))) : new Date(Date.now() - Math.floor(rand() * 600000)),
        powerOn: status !== 'OFFLINE',
        mode: deviceType === 'AIR_CONDITIONER' ? pick(['COOL', 'DRY', 'ECO', 'AUTO']) : 'NORMAL',
        targetTemp: deviceType === 'AIR_CONDITIONER' ? pick([24, 25, 26]) : deviceType === 'REFRIGERATOR' ? 4 : -18,
        currentTemp: deviceType === 'AIR_CONDITIONER' ? between(24, 29) : deviceType === 'REFRIGERATOR' ? between(3, 6) : between(-20, -15),
        lastErrorCode, installedAt, warrantyUntil,
        lastServiceAt: rand() < 0.6 ? daysAgo(Math.floor(between(20, 300))) : null,
      },
    });
    devices.push({ id: device.id, deviceType, ownerId, region, brand: product.brand.name, status, lastErrorCode });

    // Telemetry 14 ngày, 4 lần/ngày
    const readings = [];
    for (let d = 13; d >= 0; d--) {
      for (const hour of [6, 12, 18, 23]) {
        const ac = deviceType === 'AIR_CONDITIONER';
        const hot = hour === 12 || hour === 18;
        const isFault = status === 'ERROR' && d === 0 && hour === 6;
        readings.push({
          deviceId: device.id,
          temperature: ac ? between(hot ? 25 : 23, hot ? 30 : 27) : deviceType === 'REFRIGERATOR' ? between(2.5, 6) : between(-21, -15),
          humidity: between(45, 75),
          powerKw: ac ? between(hot ? 0.9 : 0.4, hot ? 1.8 : 1.0) : between(0.1, 0.35),
          pressure: ac ? (isFault && lastErrorCode === 'GAS-LOW' ? between(35, 55) : between(110, 140)) : null,
          errorCode: isFault ? lastErrorCode : null,
          recordedAt: daysAgo(d, hour),
        });
      }
    }
    if (status === 'OFFLINE') readings.splice(-6);
    await prisma.deviceTelemetry.createMany({ data: readings });

    // Sự kiện: bật/tắt + lỗi rải rác trong 14 ngày
    const events = [];
    for (let d = 13; d >= 0; d -= 2) {
      events.push({ deviceId: device.id, type: 'POWER_ON', createdAt: daysAgo(d, 7) });
      events.push({ deviceId: device.id, type: 'POWER_OFF', createdAt: daysAgo(d, 22) });
    }
    const errorEvents = Math.floor(rand() * 3) + (status === 'ERROR' ? 1 : 0);
    for (let k = 0; k < errorEvents; k++) {
      const code = k === 0 && lastErrorCode ? lastErrorCode : pick(codesForType).code;
      events.push({ deviceId: device.id, type: 'ERROR', detail: { code }, createdAt: k === 0 && lastErrorCode ? daysAgo(0, 6) : daysAgo(Math.floor(between(1, 13)), 14) });
    }
    await prisma.deviceEvent.createMany({ data: events });
  }

  // OTA mẫu: đẩy AC 1.2.0 cho khu vực TP.HCM
  for (const d of devices.filter((x) => x.deviceType === 'AIR_CONDITIONER' && x.region === 'TP. Hồ Chí Minh')) {
    const ok = d.status !== 'OFFLINE';
    await prisma.firmwareRollout.create({ data: { firmwareId: fw['AIR_CONDITIONER@1.2.0']!, deviceId: d.id, status: ok ? 'SUCCESS' : 'FAILED', message: ok ? 'Cập nhật thành công' : 'Thiết bị đang offline', startedAt: daysAgo(5), finishedAt: daysAgo(5) } });
    if (ok) await prisma.device.update({ where: { id: d.id }, data: { firmwareVersion: '1.2.0' } });
  }

  // ---------- Phiếu dịch vụ 6 tháng ----------
  const types = ['REPAIR', 'MAINTENANCE', 'WARRANTY', 'INSTALLATION'] as const;
  const titles: Record<(typeof types)[number], string[]> = {
    REPAIR: ['Máy lạnh không mát', 'Máy lạnh chảy nước', 'Tủ lạnh không đông đá', 'Máy kêu to bất thường'],
    MAINTENANCE: ['Vệ sinh máy lạnh định kỳ', 'Bảo dưỡng tủ lạnh', 'Vệ sinh dàn nóng'],
    WARRANTY: ['Kích hoạt bảo hành điện tử', 'Bảo hành bo mạch', 'Bảo hành máy nén'],
    INSTALLATION: ['Lắp đặt máy lạnh mới', 'Di dời máy lạnh'],
  };
  const parts = [{ name: 'Gas R32 (kg)', price: 350000 }, { name: 'Tụ quạt', price: 180000 }, { name: 'Cảm biến nhiệt', price: 150000 }, { name: 'Ống thoát nước (m)', price: 30000 }, { name: 'Sò nóng xả đá', price: 220000 }];

  for (let i = 1; i <= 36; i++) {
    const device = devices[i % devices.length]!;
    const type = i % 7 === 0 ? 'INSTALLATION' : i % 5 === 0 ? 'WARRANTY' : i % 3 === 0 ? 'MAINTENANCE' : 'REPAIR';
    const age = Math.floor(between(0, 175));
    const status = age > 20 ? (rand() < 0.9 ? 'DONE' : 'CANCELLED') : pick(['NEW', 'ASSIGNED', 'IN_PROGRESS', 'DONE'] as const);
    const tech = technicians.find((t) => t.region === device.region) ?? pick(technicians);
    const used = status === 'DONE' && type !== 'MAINTENANCE' ? [{ ...pick(parts), quantity: 1 }] : [];
    const partsCost = used.reduce((s, p) => s + p.price * p.quantity, 0);
    const laborCost = type === 'INSTALLATION' ? 500000 : type === 'MAINTENANCE' ? 200000 : type === 'WARRANTY' ? 0 : 300000;
    const createdAt = daysAgo(age, 8);
    await prisma.serviceTicket.create({
      data: {
        code: `SC-DEMO-${String(i).padStart(3, '0')}`,
        customerId: device.ownerId, deviceId: device.id, type, status,
        priority: status === 'NEW' && i % 4 === 0 ? 'URGENT' : pick(['LOW', 'NORMAL', 'NORMAL', 'HIGH'] as const),
        title: pick(titles[type]), region: device.region,
        technicianId: status === 'NEW' ? null : tech.id,
        errorCode: type === 'REPAIR' ? device.lastErrorCode : null,
        scheduledAt: new Date(createdAt.getTime() + 24 * 3600 * 1000),
        startedAt: ['IN_PROGRESS', 'DONE'].includes(status) ? new Date(createdAt.getTime() + 26 * 3600 * 1000) : null,
        completedAt: status === 'DONE' ? new Date(createdAt.getTime() + 30 * 3600 * 1000) : null,
        partsUsed: used, partsCost, laborCost: status === 'DONE' ? laborCost : 0, totalCost: status === 'DONE' ? partsCost + laborCost : 0,
        resolution: status === 'DONE' ? 'Đã xử lý xong, máy hoạt động bình thường.' : null,
        rating: status === 'DONE' ? pick([4, 5, 5]) : null,
        createdAt,
      },
    });
  }
  // Thiết bị đang lỗi CRITICAL mà chưa có phiếu → 1 phiếu khẩn mới
  const critical = devices.find((d) => d.status === 'ERROR');
  if (critical) {
    await prisma.serviceTicket.create({ data: { code: 'SC-DEMO-900', customerId: critical.ownerId, deviceId: critical.id, type: 'REPAIR', priority: 'URGENT', status: 'NEW', title: `[Tự động] Lỗi ${critical.lastErrorCode}`, errorCode: critical.lastErrorCode, region: critical.region } });
  }

  // ---------- Thông báo mẫu ----------
  const notices = [
    { title: 'Bảo trì hệ thống 02:00 – 03:00 Chủ nhật', body: 'Hệ thống SmartCool sẽ tạm ngưng để nâng cấp máy chủ.', type: 'SYSTEM' as const },
    { title: 'Giảm 20% vệ sinh máy lạnh tháng 12', body: 'Đặt lịch vệ sinh qua app để nhận ưu đãi.', type: 'PROMOTION' as const },
    { title: 'Nắng nóng 38°C tại TP.HCM', body: 'Nên đặt máy lạnh 26°C, bật quạt kèm để tiết kiệm điện.', type: 'WEATHER' as const },
  ];
  await prisma.notification.deleteMany({ where: { title: { in: notices.map((n) => n.title) } } });
  for (const [i, n] of notices.entries()) {
    await prisma.notification.create({ data: { ...n, target: 'ALL', senderId: adminId, sentAt: daysAgo(i * 3) } });
  }

  // ---------- Nhật ký mẫu ----------
  if (!(await prisma.auditLog.count())) {
    await prisma.auditLog.createMany({ data: [
      { actorId: adminId, action: 'OTA_PUSH', entity: 'firmware', entityId: fw['AIR_CONDITIONER@1.2.0'], detail: { version: '1.2.0', scope: 'REGION', region: 'TP. Hồ Chí Minh' }, createdAt: daysAgo(5) },
      { actorId: adminId, action: 'UPDATE', entity: 'setting', detail: { 'alert.maxTemperature': { from: 40, to: 35 } }, createdAt: daysAgo(4) },
      { actorId: staff['cskh@smartcool.vn'], action: 'ASSIGN', entity: 'ticket', entityId: 'SC-DEMO-002', detail: { technician: 'ktv.hung@smartcool.vn' }, createdAt: daysAgo(2) },
    ] });
  }

  return { staff: STAFF.length, customers: customers.length, devices: devices.length, errorCodes: ERROR_CODES.length };
}
