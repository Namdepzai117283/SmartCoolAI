import { Router } from 'express';
import { requireAdmin, requireAuth } from '../middlewares/auth.middleware';
import { adminController } from '../controllers/admin.controller';

// /api/admin – chỉ ADMIN
const router = Router();
router.use(requireAuth, requireAdmin);
router.get('/stats', adminController.stats);
router.get('/users', adminController.listUsers);
router.patch('/users/:id/status', adminController.setUserStatus);
export default router;
