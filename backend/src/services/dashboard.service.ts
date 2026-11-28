import { prisma } from '../config/database';

type DeviceType = 'AIR_CONDITIONER' | 'REFRIGERATOR' | 'FREEZER';

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const dashboardService = {
  async overview() {
    const today = startOfToday();
    const since14 = new Date(Date.now() - 13 * 24 * 3600 * 1000);
    since14.setHours(0, 0, 0, 0);
    const since6m = new Date();
    since6m.setMonth(since6m.getMonth() - 5, 1);
    since6m.setHours(0, 0, 0, 0);

    // ===== KPI =====
    const [statusGroups, alertsToday, openTickets, urgentTickets, customers, technicians, availableTechs] = await Promise.all([
      prisma.device.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.deviceEvent.count({ where: { type: 'ERROR', createdAt: { gte: today } } }),
      prisma.serviceTicket.count({ where: { status: { in: ['NEW', 'ASSIGNED', 'IN_PROGRESS'] } } }),
      prisma.serviceTicket.count({ where: { status: { in: ['NEW', 'ASSIGNED', 'IN_PROGRESS'] }, priority: 'URGENT' } }),
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.count({ where: { role: 'TECHNICIAN' } }),
      prisma.user.count({ where: { role: 'TECHNICIAN', status: 'ACTIVE', profile: { isAvailable: true } } }),
    ]);
    const byStatus = { ONLINE: 0, OFFLINE: 0, ERROR: 0 };
    for (const g of statusGroups) byStatus[g.status] = g._count._all;

    // ===== BIỂU ĐỒ =====
    const devices = await prisma.device.findMany({ select: { region: true, product: { select: { deviceType: true, brand: { select: { name: true } } } } } });
    const count = (keys: string[]) => keys.reduce<Record<string, number>>((acc, k) => ((acc[k] = (acc[k] ?? 0) + 1), acc), {});
    const byType = count(devices.map((d) => d.product.deviceType));
    const byRegion = count(devices.map((d) => d.region));
    const byBrand = count(devices.map((d) => d.product.brand.name));

    // Lỗi theo ngày + điện năng trung bình theo ngày (14 ngày)
    const errorRows = await prisma.$queryRaw<Array<{ day: Date; total: bigint }>>`
      SELECT date_trunc('day', created_at) AS day, COUNT(*)::bigint AS total
      FROM device_events WHERE type = 'ERROR' AND created_at >= ${since14}
      GROUP BY 1 ORDER BY 1`;
    const energyRows = await prisma.$queryRaw<Array<{ day: Date; avg_kw: number; total_kwh: number }>>`
      SELECT date_trunc('day', recorded_at) AS day, AVG(power_kw)::float AS avg_kw, SUM(power_kw)::float AS total_kwh
      FROM device_telemetry WHERE recorded_at >= ${since14} AND power_kw IS NOT NULL
      GROUP BY 1 ORDER BY 1`;
    const days: string[] = [];
    for (let i = 0; i < 14; i++) days.push(new Date(since14.getTime() + i * 24 * 3600 * 1000).toISOString().slice(0, 10));
    const key = (d: Date) => new Date(d).toISOString().slice(0, 10);
    const errMap = new Map(errorRows.map((r) => [key(r.day), Number(r.total)]));
    const enMap = new Map(energyRows.map((r) => [key(r.day), r]));

    // Phiếu bảo trì / sửa chữa theo tháng (6 tháng)
    const ticketRows = await prisma.$queryRaw<Array<{ month: Date; type: string; total: bigint }>>`
      SELECT date_trunc('month', created_at) AS month, type::text AS type, COUNT(*)::bigint AS total
      FROM service_tickets WHERE created_at >= ${since6m}
      GROUP BY 1, 2 ORDER BY 1`;
    const months: string[] = [];
    for (let i = 0; i < 6; i++) {
      const m = new Date(since6m);
      m.setMonth(since6m.getMonth() + i);
      months.push(m.toISOString().slice(0, 7));
    }
    const ticketsByMonth = months.map((m) => {
      const row: Record<string, number | string> = { month: m, REPAIR: 0, MAINTENANCE: 0, WARRANTY: 0, INSTALLATION: 0 };
      for (const r of ticketRows) if (new Date(r.month).toISOString().slice(0, 7) === m) row[r.type] = Number(r.total);
      return row;
    });

    // ===== CẢNH BÁO KHẨN CẤP =====
    const errorDevices = await prisma.device.findMany({
      where: { status: 'ERROR' },
      include: {
        product: { select: { name: true, deviceType: true, brand: { select: { name: true } } } },
        owner: { select: { email: true, profile: { select: { fullName: true, phone: true } } } },
        tickets: { where: { status: { in: ['NEW', 'ASSIGNED', 'IN_PROGRESS'] } }, select: { id: true, code: true, status: true }, take: 1 },
      },
      orderBy: { lastSeenAt: 'desc' },
      take: 50,
    });
    const codes = await prisma.errorCode.findMany({ where: { code: { in: errorDevices.map((d) => d.lastErrorCode ?? '').filter(Boolean) } } });
    const order = { CRITICAL: 0, WARNING: 1, INFO: 2 } as const;
    const urgentAlerts = errorDevices
      .map((d) => {
        const info = codes.find((c) => c.code === d.lastErrorCode && c.deviceType === (d.product.deviceType as DeviceType) && (c.brand === d.product.brand.name || c.brand === '')) ?? null;
        return {
          deviceId: d.id, serial: d.serial, name: d.name, region: d.region, product: d.product.name,
          errorCode: d.lastErrorCode, title: info?.title ?? 'Lỗi chưa có trong bảng mã', severity: info?.severity ?? 'WARNING',
          solution: info?.solution ?? null, lastSeenAt: d.lastSeenAt, owner: d.owner, openTicket: d.tickets[0] ?? null,
        };
      })
      .sort((a, b) => order[a.severity] - order[b.severity])
      .slice(0, 15);

    // ===== KINH DOANH & NGƯỜI DÙNG (dữ liệu thật do người dùng tạo ra) =====
    const since7 = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const [accounts, newUsers7d, loginsToday, activeProducts, hiddenProducts, priceAgg, estimates, comparisons, diagnoses, conversations] = await Promise.all([
      prisma.user.count({ where: { role: 'USER' } }),
      prisma.user.count({ where: { role: 'USER', createdAt: { gte: since7 } } }),
      prisma.user.count({ where: { lastLogin: { gte: today } } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: false } }),
      prisma.product.aggregate({ where: { isActive: true }, _avg: { price: true }, _min: { price: true }, _max: { price: true } }),
      prisma.costEstimate.count(),
      prisma.comparison.count(),
      prisma.diagnosis.count(),
      prisma.conversation.count(),
    ]);
    const signupRows = await prisma.$queryRaw<Array<{ day: Date; total: bigint }>>`
      SELECT date_trunc('day', created_at) AS day, COUNT(*)::bigint AS total
      FROM users WHERE role = 'USER' AND created_at >= ${since14}
      GROUP BY 1 ORDER BY 1`;
    const loginRows = await prisma.$queryRaw<Array<{ day: Date; total: bigint }>>`
      SELECT date_trunc('day', last_login) AS day, COUNT(*)::bigint AS total
      FROM users WHERE last_login >= ${since14}
      GROUP BY 1 ORDER BY 1`;
    const suMap = new Map(signupRows.map((r) => [key(r.day), Number(r.total)]));
    const liMap = new Map(loginRows.map((r) => [key(r.day), Number(r.total)]));
    const priceRows = await prisma.product.groupBy({ by: ['deviceType'], where: { isActive: true }, _avg: { price: true }, _min: { price: true }, _max: { price: true }, _count: { _all: true } });
    const recentUsers = await prisma.user.findMany({
      where: { role: 'USER' },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { id: true, email: true, authProvider: true, createdAt: true, lastLogin: true, profile: { select: { fullName: true } } },
    });
    const n = (v: unknown) => (v == null ? 0 : Math.round(Number(v)));

    return {
      business: {
        accounts, newUsers7d, loginsToday, activeProducts, hiddenProducts,
        avgPrice: n(priceAgg._avg.price), minPrice: n(priceAgg._min.price), maxPrice: n(priceAgg._max.price),
        estimates, comparisons, diagnoses, conversations,
        usersByDay: days.map((d) => ({ day: d, signups: suMap.get(d) ?? 0, logins: liMap.get(d) ?? 0 })),
        priceByType: priceRows.map((r) => ({ deviceType: r.deviceType, count: r._count._all, avg: n(r._avg.price), min: n(r._min.price), max: n(r._max.price) })),
        recentUsers,
      },
      kpi: {
        totalDevices: devices.length, online: byStatus.ONLINE, offline: byStatus.OFFLINE, error: byStatus.ERROR,
        alertsToday, openTickets, urgentTickets, customers, technicians, availableTechs,
      },
      charts: {
        byType, byRegion, byBrand,
        errorsByDay: days.map((d) => ({ day: d, total: errMap.get(d) ?? 0 })),
        energyByDay: days.map((d) => ({ day: d, avgKw: Math.round((enMap.get(d)?.avg_kw ?? 0) * 100) / 100, totalKwh: Math.round((enMap.get(d)?.total_kwh ?? 0) * 10) / 10 })),
        ticketsByMonth,
      },
      urgentAlerts,
    };
  },
};
