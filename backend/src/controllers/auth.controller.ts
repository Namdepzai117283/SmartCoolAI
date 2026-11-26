
import type {
  Request,
  Response,
  NextFunction,
} from 'express';

import {
  authService,
  AuthError,
} from '../services/auth.service';

import type {
  SessionInfo,
} from '../services/auth.service';

// ==========================================
// TYPES
// ==========================================

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: 'USER' | 'ADMIN';
  };
}

// ==========================================
// RESPONSE HELPERS
// ==========================================

function sendSuccess(
  res: Response,
  statusCode: number,
  message: string,
  data?: unknown
): void {
  res.status(statusCode).json({
    success: true,
    message,
    ...(data !== undefined ? { data } : {}),
  });
}

function handleError(
  error: unknown,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof AuthError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });

    return;
  }

  next(error);
}

// ==========================================
// SESSION INFORMATION
// ==========================================

function getSessionInfo(
  req: Request
): SessionInfo {
  const deviceName =
    req.headers['x-device-name'];

  const userAgent =
    req.headers['user-agent'];

  return {
    deviceName:
      typeof deviceName === 'string'
        ? deviceName.slice(0, 150)
        : undefined,

    userAgent:
      typeof userAgent === 'string'
        ? userAgent.slice(0, 500)
        : undefined,
  };
}

// ==========================================
// 01. REGISTER
// POST /api/auth/register
// ==========================================

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.register(
      req.body,
      getSessionInfo(req)
    );

    sendSuccess(
      res,
      201,
      'Đăng ký tài khoản thành công.',
      result
    );
  } catch (error) {
    handleError(error, res, next);
  }
}

// ==========================================
// 02. LOGIN
// POST /api/auth/login
// ==========================================

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const result = await authService.login(
      req.body,
      getSessionInfo(req)
    );

    sendSuccess(
      res,
      200,
      'Đăng nhập thành công.',
      result
    );
  } catch (error) {
    handleError(error, res, next);
  }
}

// ==========================================
// 03. REFRESH TOKEN
// POST /api/auth/refresh
// ==========================================

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const refreshToken =
      req.body?.refreshToken;

    if (
      typeof refreshToken !== 'string' ||
      !refreshToken.trim()
    ) {
      throw new AuthError(
        'Vui lòng cung cấp Refresh Token.',
        400
      );
    }

    const result = await authService.refresh(
      refreshToken,
      getSessionInfo(req)
    );

    sendSuccess(
      res,
      200,
      'Làm mới phiên đăng nhập thành công.',
      result
    );
  } catch (error) {
    handleError(error, res, next);
  }
}

// ==========================================
// 04. LOGOUT
// POST /api/auth/logout
// ==========================================

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const refreshToken =
      req.body?.refreshToken;

    if (
      typeof refreshToken !== 'string' ||
      !refreshToken.trim()
    ) {
      throw new AuthError(
        'Vui lòng cung cấp Refresh Token.',
        400
      );
    }

    const result =
      await authService.logout(refreshToken);

    sendSuccess(
      res,
      200,
      result.message
    );
  } catch (error) {
    handleError(error, res, next);
  }
}

// ==========================================
// 05. LOGOUT ALL
// POST /api/auth/logout-all
// ==========================================

export async function logoutAll(
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

    const result =
      await authService.logoutAll(userId);

    sendSuccess(
      res,
      200,
      result.message,
      {
        revokedSessions:
          result.revokedSessions,
      }
    );
  } catch (error) {
    handleError(error, res, next);
  }
}

// ==========================================
// 06. GET CURRENT USER
// GET /api/auth/me
// ==========================================

export async function getCurrentUser(
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
      await authService.getCurrentUser(userId);

    sendSuccess(
      res,
      200,
      'Lấy thông tin tài khoản thành công.',
      user
    );
  } catch (error) {
    handleError(error, res, next);
  }
}

// ==========================================
// EXPORT CONTROLLER
// ==========================================

export const authController = {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  getCurrentUser,
};

export default authController;
