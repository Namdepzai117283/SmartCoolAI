import { actorOf, currentUserId, handle } from '../utils/http';
import { adminService } from '../services/admin.service';
import { dashboardService } from '../services/dashboard.service';
import { errorCodeService } from '../services/errorCode.service';
import { deviceService } from '../services/device.service';
import { firmwareService } from '../services/firmware.service';
import { ticketService } from '../services/ticket.service';
import { maintenanceService } from '../services/maintenance.service';
import { notificationService } from '../services/notification.service';
import { settingService } from '../services/setting.service';
import { auditService } from '../services/audit.service';

// Controller mỏng: đọc request → gọi Service → trả JSON
export const adminController = {
  me: handle((req) => adminService.me(actorOf(req))),
  stats: handle(() => adminService.stats()),
  dashboard: handle(() => dashboardService.overview()),

  // Người dùng & nhân viên
  listUsers: handle((req) => adminService.listUsers(req.query)),
  getUser: handle((req) => adminService.getUser(req.params.id)),
  setUserStatus: handle((req) => adminService.setUserStatus(actorOf(req), req.params.id, req.body)),
  setUserRole: handle((req) => adminService.setRole(actorOf(req), req.params.id, req.body)),
  updateStaffProfile: handle((req) => adminService.updateStaffProfile(actorOf(req), req.params.id, req.body)),
  technicians: handle(() => adminService.technicians()),

  // Mã lỗi
  listErrorCodes: handle((req) => errorCodeService.list(req.query)),
  createErrorCode: handle((req) => errorCodeService.create(actorOf(req), req.body), 201),
  updateErrorCode: handle((req) => errorCodeService.update(actorOf(req), req.params.id, req.body)),
  deleteErrorCode: handle((req) => errorCodeService.remove(actorOf(req), req.params.id)),

  // Thiết bị
  listDevices: handle((req) => deviceService.list(req.query)),
  getDevice: handle((req) => deviceService.get(req.params.id)),
  createDevice: handle((req) => deviceService.create(actorOf(req), req.body), 201),
  updateDevice: handle((req) => deviceService.update(actorOf(req), req.params.id, req.body)),
  deleteDevice: handle((req) => deviceService.remove(actorOf(req), req.params.id)),
  simulateDevice: handle((req) => deviceService.simulate(req.params.id, typeof req.body?.scenario === 'string' ? req.body.scenario : undefined)),

  // Firmware / OTA
  listFirmware: handle(() => firmwareService.list()),
  createFirmware: handle((req) => firmwareService.create(actorOf(req), req.body), 201),
  deleteFirmware: handle((req) => firmwareService.remove(actorOf(req), req.params.id)),
  listRollouts: handle((req) => firmwareService.rollouts(req.params.id)),
  rolloutFirmware: handle((req) => firmwareService.rollout(actorOf(req), req.params.id, req.body)),

  // Phiếu dịch vụ
  listTickets: handle((req) => ticketService.list(actorOf(req), req.query)),
  getTicket: handle((req) => ticketService.get(actorOf(req), req.params.id)),
  createTicket: handle((req) => ticketService.create(actorOf(req), req.body), 201),
  updateTicket: handle((req) => ticketService.update(actorOf(req), req.params.id, req.body)),
  deleteTicket: handle((req) => ticketService.remove(actorOf(req), req.params.id)),

  // Bảo trì định kỳ
  listRules: handle(() => maintenanceService.listRules()),
  upsertRule: handle((req) => maintenanceService.upsertRule(actorOf(req), req.body)),
  deleteRule: handle((req) => maintenanceService.removeRule(actorOf(req), req.params.id)),
  dueDevices: handle(() => maintenanceService.dueDevices()),
  runMaintenance: handle((req) => maintenanceService.run(actorOf(req))),

  // Thông báo
  listNotifications: handle((req) => notificationService.list(req.query)),
  createNotification: handle((req) => notificationService.create(actorOf(req), req.body), 201),
  deleteNotification: handle((req) => notificationService.remove(actorOf(req), req.params.id)),

  // Cấu hình & nhật ký
  listSettings: handle(() => settingService.list()),
  updateSettings: handle((req) => settingService.update(actorOf(req), req.body)),
  listAuditLogs: handle((req) => auditService.list(req.query)),
};

// Phía khách hàng (app điện thoại)
export const customerController = {
  myDevices: handle((req) => deviceService.listMine(currentUserId(req))),
  myTickets: handle((req) => ticketService.listMine(currentUserId(req))),
  createTicket: handle((req) => ticketService.createByCustomer(currentUserId(req), req.body), 201),
  inbox: handle((req) => notificationService.inbox(currentUserId(req), req.user!.role)),
  markRead: handle((req) => notificationService.markRead(currentUserId(req), req.params.id)),
};
