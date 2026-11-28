import { prisma } from '../config/database';
import type { Prisma } from '../generated/prisma/client';
import { AppError, type Actor } from '../utils/http';
import { audit } from './audit.service';

// ==========================================
// Dữ liệu mẫu do "npm run db:seed" tạo ra (để demo).
// Xóa đi thì Admin chỉ còn dữ liệu thật do người dùng tạo.
// GIỮ LẠI: sản phẩm + giá, hãng, mã lỗi, bài viết, quy tắc bảo trì, cấu hình,
//          tài khoản admin / nhân viên và tài khoản demo@smartcool.vn (để đăng nhập thử).
// ==========================================

// Khách hàng mẫu trong prisma/seed-admin.ts
export const DEMO_CUSTOMER_EMAILS = [
  'an.nguyen@gmail.com', 'binh.tran@gmail.com', 'cuong.le@gmail.com', 'dung.pham@gmail.com',
  'em.hoang@gmail.com', 'giang.vo@gmail.com', 'hai.dang@gmail.com',
];
const DEMO_NOTICE_TITLES = [
  'Bảo trì hệ thống 02:00 – 03:00 Chủ nhật', 'Giảm 20% vệ sinh máy lạnh tháng 12', 'Nắng nóng 38°C tại TP.HCM',
];

function filters() {
  return {
    devices: { serial: { startsWith: 'SCD-' } } satisfies Prisma.DeviceWhereInput,
    tickets: { code: { startsWith: 'SC-DEMO-' } } satisfies Prisma.ServiceTicketWhereInput,
    customers: { email: { in: DEMO_CUSTOMER_EMAILS }, role: 'USER' } satisfies Prisma.UserWhereInput,
    notices: { title: { in: DEMO_NOTICE_TITLES } } satisfies Prisma.NotificationWhereInput,
    estimates: { isDemo: true } satisfies Prisma.CostEstimateWhereInput,
    diagnoses: { isDemo: true } satisfies Prisma.DiagnosisWhereInput,
    comparisons: { conclusion: { startsWith: 'Dữ liệu mẫu' } } satisfies Prisma.ComparisonWhereInput,
    conversations: { user: { email: 'demo@smartcool.vn' }, title: 'Tư vấn máy lạnh phòng 18m²' } satisfies Prisma.ConversationWhereInput,
    audits: { OR: [{ entityId: { startsWith: 'SC-DEMO-' } }, { entityId: { startsWith: 'SCD-' } }] } satisfies Prisma.AuditLogWhereInput,
  };
}

export const demoDataService = {
  // Đếm dữ liệu mẫu còn lại
  async summary() {
    const f = filters();
    const [devices, tickets, customers, notifications, estimates, diagnoses, comparisons, conversations] = await prisma.$transaction([
      prisma.device.count({ where: f.devices }),
      prisma.serviceTicket.count({ where: f.tickets }),
      prisma.user.count({ where: f.customers }),
      prisma.notification.count({ where: f.notices }),
      prisma.costEstimate.count({ where: f.estimates }),
      prisma.diagnosis.count({ where: f.diagnoses }),
      prisma.comparison.count({ where: f.comparisons }),
      prisma.conversation.count({ where: f.conversations }),
    ]);
    const total = devices + tickets + customers + notifications + estimates + diagnoses + comparisons + conversations;
    return { total, devices, tickets, customers, notifications, estimates, diagnoses, comparisons, conversations };
  },

  // Xóa toàn bộ dữ liệu mẫu (chỉ Super Admin). Không hoàn tác được.
  async clear(actor: Actor, body: unknown) {
    if (actor.role !== 'ADMIN') throw new AppError(403, 'Chỉ Super Admin được xóa dữ liệu mẫu.');
    if ((body as { confirm?: unknown } | null)?.confirm !== 'XOA') throw new AppError(400, 'Cần xác nhận bằng chữ XOA.');
    const before = await this.summary();
    const f = filters();
    await prisma.$transaction([
      prisma.serviceTicket.deleteMany({ where: f.tickets }),
      prisma.device.deleteMany({ where: f.devices }), // thông số, sự kiện, OTA của thiết bị xóa theo (Cascade)
      prisma.serviceTicket.deleteMany({ where: { customer: f.customers } }),
      prisma.device.deleteMany({ where: { owner: f.customers } }),
      prisma.user.deleteMany({ where: f.customers }), // hồ sơ, phiên đăng nhập... xóa theo (Cascade)
      prisma.notification.deleteMany({ where: f.notices }),
      prisma.costEstimate.deleteMany({ where: f.estimates }),
      prisma.diagnosis.deleteMany({ where: f.diagnoses }),
      prisma.comparison.deleteMany({ where: f.comparisons }),
      prisma.conversation.deleteMany({ where: f.conversations }),
      prisma.auditLog.deleteMany({ where: f.audits }),
    ]);
    await audit(actor, 'DELETE', 'demo-data', null, before);
    return { deleted: before, remaining: await this.summary() };
  },
};
