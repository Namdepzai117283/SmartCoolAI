
import type {
  Request,
  Response,
  NextFunction,
} from 'express';

import {
  AuthError,
} from '../services/auth.service';

import {
  profileService,
} from '../services/profile.service';

// ==========================================
// TYPES
// ==========================================

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: import('../config/permissions').AuthRole;
  };
}

// ==========================================
// UPDATE PROFILE
// PATCH /api/auth/profile
// ==========================================

export async function updateProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AuthError(
        'Bạn chưa đăng nhập.',
        401
      );
    }

    const user =
      await profileService.updateProfile(
        userId,
        req.body
      );

    res.status(200).json({
      success: true,

      message:
        'Cập nhật hồ sơ cá nhân thành công.',

      data: user,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });

      return;
    }

    next(error);
  }
}

// ==========================================
// EXPORT CONTROLLER
// ==========================================

export const profileController = {
  updateProfile,
};

export default profileController;
