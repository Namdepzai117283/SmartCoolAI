import { Router } from 'express';
import { optionalAuth, requireAuth, requirePermission } from '../middlewares/auth.middleware';

const requireCatalog = requirePermission('catalog:write');
import { brandController, productController } from '../controllers/catalog.controller';

// ==========================================
// /api/brands  và  /api/products
// GET: công khai (ADMIN có token thì thấy cả mục đã ẩn)
// POST / PATCH / DELETE: vai trò có quyền catalog:write (Super Admin, Quản lý kho)
// ==========================================

export const brandRoutes = Router();
brandRoutes.get('/', optionalAuth, brandController.list);
brandRoutes.get('/:id', brandController.get);
brandRoutes.post('/', requireAuth, requireCatalog, brandController.create);
brandRoutes.patch('/:id', requireAuth, requireCatalog, brandController.update);
brandRoutes.delete('/:id', requireAuth, requireCatalog, brandController.remove);

export const productRoutes = Router();
productRoutes.get('/', optionalAuth, productController.list);
productRoutes.get('/:id', optionalAuth, productController.get);
productRoutes.post('/', requireAuth, requireCatalog, productController.create);
productRoutes.patch('/:id', requireAuth, requireCatalog, productController.update);
productRoutes.delete('/:id', requireAuth, requireCatalog, productController.remove);
