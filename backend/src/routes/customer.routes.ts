import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { customerController as c } from '../controllers/admin.controller';

// Dành cho khách hàng (app): thiết bị của tôi, yêu cầu hỗ trợ, hộp thư thông báo
export const meRoutes = Router();
meRoutes.use(requireAuth);
meRoutes.get('/devices', c.myDevices);
meRoutes.get('/tickets', c.myTickets);
meRoutes.post('/tickets', c.createTicket);
meRoutes.get('/notifications', c.inbox);
meRoutes.patch('/notifications/:id/read', c.markRead);
