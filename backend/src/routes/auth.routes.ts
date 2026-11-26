
import { Router } from 'express';

import {
  authController,
} from '../controllers/auth.controller';

import {
  profileController,
} from '../controllers/profile.controller';

import {
  requireAuth,
} from '../middlewares/auth.middleware';

const router = Router();

// ==========================================
// PUBLIC ROUTES
// Không yêu cầu Access Token
// ==========================================

// 01. Đăng ký tài khoản
// POST /api/auth/register

router.post(
  '/register',
  authController.register
);

// 02. Đăng nhập
// POST /api/auth/login

router.post(
  '/login',
  authController.login
);

// 03. Làm mới phiên đăng nhập
// POST /api/auth/refresh

router.post(
  '/refresh',
  authController.refresh
);

// 04. Đăng xuất thiết bị hiện tại
// POST /api/auth/logout

router.post(
  '/logout',
  authController.logout
);

// ==========================================
// PROTECTED ROUTES
// Yêu cầu Access Token hợp lệ
// ==========================================

// 05. Đăng xuất khỏi tất cả thiết bị
// POST /api/auth/logout-all

router.post(
  '/logout-all',
  requireAuth,
  authController.logoutAll
);

// 06. Lấy thông tin tài khoản hiện tại
// GET /api/auth/me

router.get(
  '/me',
  requireAuth,
  authController.getCurrentUser
);

// 07. Cập nhật hồ sơ cá nhân
// PATCH /api/auth/profile

router.patch(
  '/profile',
  requireAuth,
  profileController.updateProfile
);

// ==========================================
// EXPORT ROUTER
// ==========================================

export default router;
