import { Router } from 'express';
import { requireAuth, requirePermission } from '../middlewares/auth.middleware';
import { adminController as c } from '../controllers/admin.controller';

// ==========================================
// /api/admin – Giao diện quản trị
// Mỗi route kiểm tra quyền theo vai trò (RBAC, xem config/permissions.ts)
// ==========================================

const router = Router();
router.use(requireAuth);

const p = requirePermission;

router.get('/me', c.me);
router.get('/stats', p('dashboard:read'), c.stats);
router.get('/dashboard', p('dashboard:read'), c.dashboard);

// Dữ liệu mẫu (seed): xem số lượng / xóa hết (chỉ Super Admin)
router.get('/demo-data', p('dashboard:read'), c.demoSummary);
router.post('/demo-data/clear', p('settings:write'), c.clearDemo);

// 1. Người dùng, kỹ thuật viên, phân quyền
router.get('/users', p('users:read'), c.listUsers);
router.get('/users/:id', p('users:read'), c.getUser);
router.patch('/users/:id/status', p('users:write'), c.setUserStatus);
router.patch('/users/:id/role', p('users:write'), c.setUserRole);
router.patch('/users/:id/staff-profile', p('users:write'), c.updateStaffProfile);
router.get('/technicians', p('tickets:read'), c.technicians);

// 2. Mã lỗi chuẩn
router.get('/error-codes', p('devices:read', 'catalog:write'), c.listErrorCodes);
router.post('/error-codes', p('catalog:write'), c.createErrorCode);
router.patch('/error-codes/:id', p('catalog:write'), c.updateErrorCode);
router.delete('/error-codes/:id', p('catalog:write'), c.deleteErrorCode);

// 3. Thiết bị thực tế (IoT)
router.get('/devices', p('devices:read'), c.listDevices);
router.get('/devices/:id', p('devices:read'), c.getDevice);
router.post('/devices', p('devices:write'), c.createDevice);
router.patch('/devices/:id', p('devices:write'), c.updateDevice);
router.delete('/devices/:id', p('devices:write'), c.deleteDevice);
router.post('/devices/:id/simulate', p('devices:write'), c.simulateDevice);

// 4. Firmware / OTA
router.get('/firmware', p('devices:read'), c.listFirmware);
router.post('/firmware', p('firmware:write'), c.createFirmware);
router.delete('/firmware/:id', p('firmware:write'), c.deleteFirmware);
router.get('/firmware/:id/rollouts', p('devices:read'), c.listRollouts);
router.post('/firmware/:id/rollout', p('firmware:write'), c.rolloutFirmware);

// 5. Phiếu dịch vụ (kỹ thuật viên chỉ thấy phiếu của mình – lọc trong service)
router.get('/tickets', p('tickets:read'), c.listTickets);
router.get('/tickets/:id', p('tickets:read'), c.getTicket);
router.post('/tickets', p('tickets:write'), c.createTicket);
router.patch('/tickets/:id', p('tickets:write', 'tickets:work'), c.updateTicket);
router.delete('/tickets/:id', p('tickets:write'), c.deleteTicket);

// 6. Bảo trì định kỳ
router.get('/maintenance/rules', p('tickets:read'), c.listRules);
router.put('/maintenance/rules', p('settings:write', 'tickets:write'), c.upsertRule);
router.delete('/maintenance/rules/:id', p('settings:write'), c.deleteRule);
router.get('/maintenance/due', p('tickets:read'), c.dueDevices);
router.post('/maintenance/run', p('notifications:write'), c.runMaintenance);

// 7. Thông báo đẩy
router.get('/notifications', p('notifications:write'), c.listNotifications);
router.post('/notifications', p('notifications:write'), c.createNotification);
router.delete('/notifications/:id', p('notifications:write'), c.deleteNotification);

// 8. Cấu hình & Audit log
router.get('/settings', p('dashboard:read'), c.listSettings);
router.put('/settings', p('settings:write'), c.updateSettings);
router.get('/audit-logs', p('audit:read'), c.listAuditLogs);

export default router;
