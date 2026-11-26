import { Router } from 'express';
import { optionalAuth, requireAuth, requirePermission } from '../middlewares/auth.middleware';

const requireContent = requirePermission('content:write');
import { articleController } from '../controllers/article.controller';

// ==========================================
// /api/articles – Thư viện kiến thức
// ==========================================

const router = Router();

// Của người dùng đăng nhập (đặt trước /:idOrSlug để không bị nhầm)
router.get('/me/favorites', requireAuth, articleController.listFavorites);
router.get('/me/progress', requireAuth, articleController.listProgress);

// Công khai
router.get('/', optionalAuth, articleController.list);
router.get('/:idOrSlug', optionalAuth, articleController.get);

// Yêu thích & tiến độ
router.post('/:id/favorite', requireAuth, articleController.addFavorite);
router.delete('/:id/favorite', requireAuth, articleController.removeFavorite);
router.put('/:id/progress', requireAuth, articleController.saveProgress);

// Quản lý nội dung (CMS): Super Admin, Chăm sóc khách hàng
router.post('/', requireAuth, requireContent, articleController.create);
router.patch('/:id', requireAuth, requireContent, articleController.update);
router.delete('/:id', requireAuth, requireContent, articleController.remove);

export default router;
