import { Router } from 'express';
import { optionalAuth, requireAdmin, requireAuth } from '../middlewares/auth.middleware';
import { brandController, productController } from '../controllers/catalog.controller';

// ==========================================
// /api/brands  và  /api/products
// GET: công khai (ADMIN có token thì thấy cả mục đã ẩn)
// POST / PATCH / DELETE: chỉ ADMIN
// ==========================================

export const brandRoutes = Router();
brandRoutes.get('/', optionalAuth, brandController.list);
brandRoutes.get('/:id', brandController.get);
brandRoutes.post('/', requireAuth, requireAdmin, brandController.create);
brandRoutes.patch('/:id', requireAuth, requireAdmin, brandController.update);
brandRoutes.delete('/:id', requireAuth, requireAdmin, brandController.remove);

export const productRoutes = Router();
productRoutes.get('/', optionalAuth, productController.list);
productRoutes.get('/:id', optionalAuth, productController.get);
productRoutes.post('/', requireAuth, requireAdmin, productController.create);
productRoutes.patch('/:id', requireAuth, requireAdmin, productController.update);
productRoutes.delete('/:id', requireAuth, requireAdmin, productController.remove);
