import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

// ==========================================
// LỖI NGHIỆP VỤ DÙNG CHUNG
// Service ném AppError, Controller trả về HTTP status tương ứng.
// ==========================================

export class AppError extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

// Kiểm tra dữ liệu đầu vào bằng Zod. Sai → lỗi 400.
export function parseInput<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value ?? {});
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
      .join('; ');
    throw new AppError(400, `Dữ liệu không hợp lệ: ${detail}`);
  }
  return result.data;
}

const uuidSchema = z.string().uuid();

export function parseId(value: unknown): string {
  const result = uuidSchema.safeParse(value);
  if (!result.success) throw new AppError(400, 'ID không hợp lệ.');
  return result.data;
}

// Prisma: P2002 = trùng unique, P2003 = vướng khóa ngoại, P2025 = không tìm thấy.
export function mapPrismaError(error: unknown): AppError | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) return null;
  switch ((error as { code: string }).code) {
    case 'P2002': return new AppError(409, 'Dữ liệu đã tồn tại (trùng giá trị duy nhất).');
    case 'P2003': return new AppError(409, 'Dữ liệu đang được sử dụng ở bảng khác nên không thể xóa.');
    case 'P2025': return new AppError(404, 'Không tìm thấy dữ liệu.');
    default: return null;
  }
}

// ==========================================
// BỌC CONTROLLER
// Mỗi controller chỉ cần: đọc req → gọi service → trả JSON.
// ==========================================

type Action = (req: AuthenticatedRequest) => Promise<unknown>;

export function handle(action: Action, successStatus = 200) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data = await action(req as AuthenticatedRequest);
      res.status(successStatus).json({ success: true, data });
    } catch (error) {
      const appError = error instanceof AppError ? error : mapPrismaError(error);
      if (appError) {
        res.status(appError.statusCode).json({ success: false, message: appError.message });
        return;
      }
      next(error);
    }
  };
}

// Lấy userId từ request đã qua requireAuth.
export function currentUserId(req: AuthenticatedRequest): string {
  if (!req.user) throw new AppError(401, 'Bạn chưa đăng nhập.');
  return req.user.userId;
}

export function isAdmin(req: AuthenticatedRequest): boolean {
  return req.user?.role === 'ADMIN';
}

// Phân trang chung: ?page=1&limit=20
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export function paginate(page: number, limit: number) {
  return { skip: (page - 1) * limit, take: limit };
}

export function pageResult<T>(items: T[], total: number, page: number, limit: number) {
  return { items, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}
