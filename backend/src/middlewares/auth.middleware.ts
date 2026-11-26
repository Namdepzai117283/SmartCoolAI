
import type {
  Request,
  Response,
  NextFunction,
} from 'express';

import { prisma } from '../config/database';

import {
  verifyAccessToken,
} from '../utils/token';

// ==========================================
// TYPES
// ==========================================

import { hasPermission, isRole, type AuthRole, type Permission } from '../config/permissions';
export type { AuthRole };

export interface AuthenticatedUser {
  userId: string;
  role: AuthRole;
}

export interface AuthenticatedRequest
  extends Request {
  user?: AuthenticatedUser;
}

// ==========================================
// RESPONSE HELPER
// ==========================================

function sendAuthError(
  res: Response,
  statusCode: number,
  message: string
): void {
  res.status(statusCode).json({
    success: false,
    message,
  });
}

// ==========================================
// EXTRACT ACCESS TOKEN
// ==========================================

function extractAccessToken(
  req: Request
): string | null {
  const authorization =
    req.headers.authorization;

  if (
    typeof authorization !== 'string'
  ) {
    return null;
  }

  const parts = authorization
    .trim()
    .split(/\s+/);

  if (parts.length !== 2) {
    return null;
  }

  const [scheme, token] = parts;

  if (
    scheme?.toLowerCase() !== 'bearer' ||
    !token
  ) {
    return null;
  }

  return token;
}

// ==========================================
// 01. REQUIRE AUTH
// Yêu cầu người dùng đăng nhập
// ==========================================

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const accessToken =
    extractAccessToken(req);

  if (!accessToken) {
    sendAuthError(
      res,
      401,
      'Bạn chưa đăng nhập.'
    );

    return;
  }

  let payload: AuthenticatedUser;

  // Kiểm tra chữ ký và thời hạn JWT.

  try {
    payload =
      verifyAccessToken(accessToken);
  } catch {
    sendAuthError(
      res,
      401,
      'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'
    );

    return;
  }

  try {
    // Kiểm tra tài khoản trong Database.

    const user =
      await prisma.user.findUnique({
        where: {
          id: payload.userId,
        },

        select: {
          id: true,
          role: true,
          status: true,
        },
      });

    if (!user) {
      sendAuthError(
        res,
        401,
        'Tài khoản không tồn tại.'
      );

      return;
    }

    // Kiểm tra tài khoản bị khóa.

    if (user.status === 'BLOCKED') {
      sendAuthError(
        res,
        403,
        'Tài khoản của bạn đã bị khóa.'
      );

      return;
    }

    // Kiểm tra trạng thái hoạt động.

    if (user.status !== 'ACTIVE') {
      sendAuthError(
        res,
        403,
        'Tài khoản chưa được kích hoạt.'
      );

      return;
    }

    // Kiểm tra quyền người dùng.

    if (!isRole(user.role)) {
      sendAuthError(
        res,
        403,
        'Quyền tài khoản không hợp lệ.'
      );

      return;
    }

    // Sử dụng quyền hiện tại trong Database
    // thay vì chỉ tin vào quyền trong Token.

    req.user = {
      userId: user.id,
      role: user.role,
    };

    // Cho phép tiếp tục đến Controller.

    next();
  } catch (error) {
    next(error);
  }
}

// ==========================================
// 01b. OPTIONAL AUTH
// Có token hợp lệ thì gắn req.user, không có vẫn cho đi tiếp
// (dùng cho API công khai nhưng ADMIN được xem thêm dữ liệu ẩn).
// ==========================================

export function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  const accessToken = extractAccessToken(req);

  if (accessToken) {
    try {
      req.user = verifyAccessToken(accessToken);
    } catch {
      // Token sai hoặc hết hạn: coi như khách.
    }
  }

  next();
}

// ==========================================
// 02. REQUIRE ROLE
// Kiểm tra quyền truy cập
// ==========================================

export function requireRole(
  ...allowedRoles: AuthRole[]
) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      sendAuthError(
        res,
        401,
        'Bạn chưa đăng nhập.'
      );

      return;
    }

    if (
      !allowedRoles.includes(
        req.user.role
      )
    ) {
      sendAuthError(
        res,
        403,
        'Bạn không có quyền truy cập chức năng này.'
      );

      return;
    }

    next();
  };
}

// ==========================================
// 02b. REQUIRE PERMISSION (RBAC)
// Ví dụ: router.post('/', requireAuth, requirePermission('tickets:write'), ...)
// ==========================================

export function requirePermission(...permissions: Permission[]) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      sendAuthError(res, 401, 'Bạn chưa đăng nhập.');
      return;
    }

    if (!permissions.some((p) => hasPermission(req.user!.role, p))) {
      sendAuthError(res, 403, 'Vai trò của bạn không có quyền thực hiện thao tác này.');
      return;
    }

    next();
  };
}

// ==========================================
// 03. REQUIRE ADMIN
// Chỉ cho phép quản trị viên
// ==========================================

export const requireAdmin =
  requireRole('ADMIN');

// ==========================================
// 04. REQUIRE USER
// Cho phép tài khoản USER
// ==========================================

export const requireUser =
  requireRole('USER');

// ==========================================
// EXPORT MIDDLEWARE
// ==========================================

export const authMiddleware = {
  requireAuth,
  optionalAuth,
  requireRole,
  requirePermission,
  requireAdmin,
  requireUser,
};

export default authMiddleware;
