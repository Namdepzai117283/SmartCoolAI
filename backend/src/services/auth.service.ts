
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';

import { prisma } from '../config/database';

import {
  hashPassword,
  verifyPassword,
  validatePassword,
} from '../utils/password';

import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from '../utils/token';

// ==========================================
// AUTH ERROR
// ==========================================

export class AuthError extends Error {
  public readonly statusCode: number;

  constructor(
    message: string,
    statusCode: number = 400
  ) {
    super(message);

    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

// ==========================================
// VALIDATION
// ==========================================

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(150),

  email: z
    .string()
    .trim()
    .email()
    .max(255)
    .transform((value) => value.toLowerCase()),

  password: z.string().min(8).max(72),

  phone: z
    .string()
    .trim()
    .max(20)
    .optional(),

  address: z
    .string()
    .trim()
    .max(500)
    .optional(),
});

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(255)
    .transform((value) => value.toLowerCase()),

  password: z.string().min(1).max(72),
});

const refreshSchema = z.object({
  refreshToken: z
    .string()
    .regex(/^[a-f0-9]{128}$/),
});

// ==========================================
// TYPES
// ==========================================

export type RegisterInput =
  z.input<typeof registerSchema>;

export type LoginInput =
  z.input<typeof loginSchema>;

export interface SessionInfo {
  deviceName?: string;
  userAgent?: string;
}

// ==========================================
// PUBLIC USER SELECT
// Không trả passwordHash ra ngoài
// ==========================================

const publicUserSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,

  profile: {
    select: {
      id: true,
      fullName: true,
      phone: true,
      address: true,
      avatarUrl: true,
    },
  },
} as const;

// ==========================================
// HELPERS
// ==========================================

function isUniqueConstraintError(
  error: unknown
): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}

function getValidationMessage(
  error: z.ZodError
): string {
  return error.issues
    .map((issue) => {
      return `${issue.path.join('.')}: ${issue.message}`;
    })
    .join('; ');
}

function ensureActiveUser(
  status: string
): void {
  if (status === 'BLOCKED') {
    throw new AuthError(
      'Tài khoản của bạn đã bị khóa.',
      403
    );
  }

  if (status !== 'ACTIVE') {
    throw new AuthError(
      'Tài khoản chưa được kích hoạt.',
      403
    );
  }
}

// ==========================================
// CREATE SESSION
// ==========================================

async function createSession(
  userId: string,
  role: import('../config/permissions').AuthRole,
  sessionInfo: SessionInfo = {}
) {
  const accessToken = generateAccessToken({
    userId,
    role,
  });

  const refresh = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      userId,

      tokenHash: refresh.tokenHash,

      expiresAt: refresh.expiresAt,

      deviceName:
        sessionInfo.deviceName?.slice(0, 150),

      userAgent:
        sessionInfo.userAgent?.slice(0, 500),
    },
  });

  return {
    accessToken,

    refreshToken: refresh.token,

    tokenType: 'Bearer',

    expiresIn: 900,

    refreshExpiresAt: refresh.expiresAt,
  };
}

// ==========================================
// 01. REGISTER
// Đăng ký tài khoản
// ==========================================

export async function register(
  input: RegisterInput,
  sessionInfo: SessionInfo = {}
) {
  const result = registerSchema.safeParse(input);

  if (!result.success) {
    throw new AuthError(
      getValidationMessage(result.error),
      400
    );
  }

  const data = result.data;

  const passwordValidation =
    validatePassword(data.password);

  if (!passwordValidation.valid) {
    throw new AuthError(
      passwordValidation.errors.join(' '),
      400
    );
  }

  const existingUser =
    await prisma.user.findUnique({
      where: {
        email: data.email,
      },
      select: {
        id: true,
      },
    });

  if (existingUser) {
    throw new AuthError(
      'Email này đã được đăng ký.',
      409
    );
  }

  const passwordHash = await hashPassword(
    data.password
  );

  try {
    const user = await prisma.user.create({
      data: {
        email: data.email,

        passwordHash,

        role: 'USER',

        status: 'ACTIVE',

        lastLogin: new Date(),

        profile: {
          create: {
            fullName: data.fullName,

            phone: data.phone || null,

            address: data.address || null,
          },
        },
      },

      select: publicUserSelect,
    });

    const tokens = await createSession(
      user.id,
      user.role,
      sessionInfo
    );

    return {
      user,
      ...tokens,
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AuthError(
        'Email này đã được đăng ký.',
        409
      );
    }

    throw error;
  }
}

// ==========================================
// 02. LOGIN
// Đăng nhập tài khoản
// ==========================================

export async function login(
  input: LoginInput,
  sessionInfo: SessionInfo = {}
) {
  const result = loginSchema.safeParse(input);

  if (!result.success) {
    throw new AuthError(
      getValidationMessage(result.error),
      400
    );
  }

  const data = result.data;

  const existingUser =
    await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    });

  if (!existingUser) {
    throw new AuthError(
      'Email hoặc mật khẩu không chính xác.',
      401
    );
  }

  const passwordCorrect =
    await verifyPassword(
      data.password,
      existingUser.passwordHash
    );

  if (!passwordCorrect) {
    throw new AuthError(
      'Email hoặc mật khẩu không chính xác.',
      401
    );
  }

  ensureActiveUser(existingUser.status);

  const user = await prisma.user.update({
    where: {
      id: existingUser.id,
    },

    data: {
      lastLogin: new Date(),
    },

    select: publicUserSelect,
  });

  const tokens = await createSession(
    user.id,
    user.role,
    sessionInfo
  );

  return {
    user,
    ...tokens,
  };
}

// ==========================================
// 03. REFRESH TOKEN
// Làm mới phiên đăng nhập
// ==========================================

export async function refresh(
  refreshToken: string,
  sessionInfo: SessionInfo = {}
) {
  const result = refreshSchema.safeParse({
    refreshToken,
  });

  if (!result.success) {
    throw new AuthError(
      'Refresh Token không hợp lệ.',
      401
    );
  }

  const tokenHash =
    hashRefreshToken(refreshToken);

  return prisma.$transaction(async (tx) => {
    const currentToken =
      await tx.refreshToken.findUnique({
        where: {
          tokenHash,
        },

        include: {
          user: {
            select: publicUserSelect,
          },
        },
      });

    if (!currentToken) {
      throw new AuthError(
        'Phiên đăng nhập không tồn tại.',
        401
      );
    }

    const now = new Date();

    if (
      currentToken.revokedAt ||
      currentToken.expiresAt <= now
    ) {
      throw new AuthError(
        'Phiên đăng nhập đã hết hạn.',
        401
      );
    }

    ensureActiveUser(
      currentToken.user.status
    );

    // Thu hồi token cũ.
    // Ngăn một token được sử dụng hai lần.

    const revoked =
      await tx.refreshToken.updateMany({
        where: {
          id: currentToken.id,

          revokedAt: null,

          expiresAt: {
            gt: now,
          },
        },

        data: {
          revokedAt: now,
        },
      });

    if (revoked.count !== 1) {
      throw new AuthError(
        'Phiên đăng nhập không còn hợp lệ.',
        401
      );
    }

    const newRefresh =
      generateRefreshToken();

    // Giữ thời hạn tối đa của phiên ban đầu.

    const expiresAt = new Date(
      Math.min(
        newRefresh.expiresAt.getTime(),
        currentToken.expiresAt.getTime()
      )
    );

    await tx.refreshToken.create({
      data: {
        userId: currentToken.userId,

        tokenHash: newRefresh.tokenHash,

        expiresAt,

        deviceName:
          sessionInfo.deviceName?.slice(0, 150) ??
          currentToken.deviceName,

        userAgent:
          sessionInfo.userAgent?.slice(0, 500) ??
          currentToken.userAgent,
      },
    });

    const accessToken =
      generateAccessToken({
        userId: currentToken.user.id,

        role: currentToken.user.role,
      });

    return {
      user: currentToken.user,

      accessToken,

      refreshToken: newRefresh.token,

      tokenType: 'Bearer',

      expiresIn: 900,

      refreshExpiresAt: expiresAt,
    };
  });
}

// ==========================================
// 04. LOGOUT
// Đăng xuất thiết bị hiện tại
// ==========================================

export async function logout(
  refreshToken: string
) {
  const result = refreshSchema.safeParse({
    refreshToken,
  });

  if (!result.success) {
    throw new AuthError(
      'Refresh Token không hợp lệ.',
      400
    );
  }

  const tokenHash =
    hashRefreshToken(refreshToken);

  await prisma.refreshToken.updateMany({
    where: {
      tokenHash,
      revokedAt: null,
    },

    data: {
      revokedAt: new Date(),
    },
  });

  return {
    success: true,

    message: 'Đăng xuất thành công.',
  };
}

// ==========================================
// 05. LOGOUT ALL
// Đăng xuất tất cả thiết bị
// ==========================================

export async function logoutAll(
  userId: string
) {
  const result =
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },

      data: {
        revokedAt: new Date(),
      },
    });

  return {
    success: true,

    message:
      'Đã đăng xuất khỏi tất cả thiết bị.',

    revokedSessions: result.count,
  };
}

// ==========================================
// 06. GET CURRENT USER
// Lấy thông tin tài khoản hiện tại
// ==========================================

export async function getCurrentUser(
  userId: string
) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },

    select: publicUserSelect,
  });

  if (!user) {
    throw new AuthError(
      'Tài khoản không tồn tại.',
      404
    );
  }

  ensureActiveUser(user.status);

  return user;
}

// ==========================================
// EXPORT AUTH SERVICE
// ==========================================


// ==========================================
// 07. GOOGLE LOGIN
// App/Web lấy idToken từ Google → gửi lên đây.
// Server tự xác minh idToken với Google (chữ ký + audience = GOOGLE_CLIENT_ID),
// rồi cấp access/refresh token JWT của SmartCool giống đăng nhập thường.
// ==========================================

const googleSchema = z.object({ idToken: z.string().min(20).max(5000) });

const googleClientIds = (process.env.GOOGLE_CLIENT_ID || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

const googleClient = new OAuth2Client();

export function getGoogleConfig() {
  return { enabled: googleClientIds.length > 0, clientId: googleClientIds[0] ?? null };
}

export async function loginWithGoogle(
  input: unknown,
  sessionInfo: SessionInfo = {}
) {
  if (!googleClientIds.length) {
    throw new AuthError('Server chưa cấu hình GOOGLE_CLIENT_ID.', 503);
  }

  const parsed = googleSchema.safeParse(input);
  if (!parsed.success) {
    throw new AuthError('Thiếu idToken của Google.', 400);
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: parsed.data.idToken,
      audience: googleClientIds,
    });
    payload = ticket.getPayload();
  } catch {
    throw new AuthError('Token Google không hợp lệ hoặc đã hết hạn.', 401);
  }

  if (!payload?.sub || !payload.email || !payload.email_verified) {
    throw new AuthError('Tài khoản Google chưa xác minh email.', 401);
  }

  const email = payload.email.toLowerCase();
  const fullName = (payload.name || email.split('@')[0] || 'Người dùng Google').slice(0, 150);

  // 1) Đã liên kết Google → đăng nhập
  // 2) Email đã đăng ký bằng mật khẩu → liên kết googleId vào tài khoản đó
  // 3) Chưa có → tạo tài khoản mới (mật khẩu ngẫu nhiên, không dùng được để đăng nhập thường)
  let existing = await prisma.user.findUnique({ where: { googleId: payload.sub } });
  if (!existing) existing = await prisma.user.findUnique({ where: { email } });

  let userId: string;
  if (existing) {
    ensureActiveUser(existing.status);
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        googleId: payload.sub,
        lastLogin: new Date(),
        ...(payload.picture ? { profile: { upsert: { create: { fullName, avatarUrl: payload.picture }, update: { avatarUrl: payload.picture } } } } : {}),
      },
    });
    userId = existing.id;
  } else {
    const created = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(randomBytes(24).toString('hex')),
        googleId: payload.sub,
        authProvider: 'GOOGLE',
        lastLogin: new Date(),
        profile: { create: { fullName, avatarUrl: payload.picture ?? null } },
      },
    });
    userId = created.id;
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: publicUserSelect });
  await prisma.auditLog.create({ data: { actorId: user.id, action: 'LOGIN_GOOGLE', entity: 'user', entityId: user.id } });
  const tokens = await createSession(user.id, user.role, sessionInfo);
  return { user, ...tokens, isNewUser: !existing };
}

export const authService = {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  getCurrentUser,
  loginWithGoogle,
  getGoogleConfig,
};

export default authService;
