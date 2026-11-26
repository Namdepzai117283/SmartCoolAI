
import {
  apiRequest,
  ApiError,
} from './apiService';

// ==========================================
// KIỂU DỮ LIỆU TÀI KHOẢN
// ==========================================

export interface UserProfile {
  id: string;
  fullName: string;
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
  profile: UserProfile | null;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  refreshExpiresAt: string;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UpdateProfileInput {
  fullName?: string;
  phone?: string | null;
  address?: string | null;
}

// ==========================================
// KIỂM TRA PHIÊN ĐĂNG NHẬP
// ==========================================

function requireSession(
  data: AuthSession | undefined
): AuthSession {
  if (
    !data ||
    !data.user?.id ||
    typeof data.accessToken !== 'string' ||
    !data.accessToken ||
    typeof data.refreshToken !== 'string' ||
    !data.refreshToken
  ) {
    throw new ApiError(
      'Dữ liệu phiên đăng nhập không hợp lệ.'
    );
  }

  return data;
}

// ==========================================
// 01. ĐĂNG KÝ
// ==========================================

export async function register(
  input: RegisterInput
): Promise<AuthSession> {
  const response = await apiRequest<AuthSession>(
    '/auth/register',
    {
      method: 'POST',

      body: {
        fullName: input.fullName.trim(),
        email: input.email.trim().toLowerCase(),
        password: input.password,
        phone: input.phone,
        address: input.address,
      },
    }
  );

  return requireSession(response.data);
}

// ==========================================
// 02. ĐĂNG NHẬP
// ==========================================

export async function login(
  input: LoginInput
): Promise<AuthSession> {
  const response = await apiRequest<AuthSession>(
    '/auth/login',
    {
      method: 'POST',

      body: {
        email: input.email.trim().toLowerCase(),
        password: input.password,
      },
    }
  );

  return requireSession(response.data);
}

// ==========================================
// 03. LÀM MỚI TOKEN
// ==========================================

export async function refresh(
  refreshToken: string
): Promise<AuthSession> {
  const response = await apiRequest<AuthSession>(
    '/auth/refresh',
    {
      method: 'POST',

      body: {
        refreshToken,
      },
    }
  );

  return requireSession(response.data);
}

// ==========================================
// 04. ĐĂNG XUẤT
// ==========================================

export async function logout(
  refreshToken: string
): Promise<void> {
  await apiRequest('/auth/logout', {
    method: 'POST',

    body: {
      refreshToken,
    },
  });
}

// ==========================================
// 05. ĐĂNG XUẤT TẤT CẢ THIẾT BỊ
// ==========================================

export async function logoutAll(
  accessToken: string
): Promise<void> {
  await apiRequest('/auth/logout-all', {
    method: 'POST',
    accessToken,
  });
}

// ==========================================
// 06. LẤY THÔNG TIN TÀI KHOẢN
// ==========================================

export async function getCurrentUser(
  accessToken: string
): Promise<AuthUser> {
  const response = await apiRequest<AuthUser>(
    '/auth/me',
    {
      method: 'GET',
      accessToken,
    }
  );

  if (!response.data?.id) {
    throw new ApiError(
      'Không tìm thấy thông tin tài khoản.'
    );
  }

  return response.data;
}

// ==========================================
// 07. CẬP NHẬT HỒ SƠ CÁ NHÂN
// ==========================================

export async function updateProfile(
  accessToken: string,
  input: UpdateProfileInput
): Promise<AuthUser> {
  const response = await apiRequest<AuthUser>(
    '/auth/profile',
    {
      method: 'PATCH',

      accessToken,

      body: {
        ...(input.fullName !== undefined
          ? {
              fullName: input.fullName.trim(),
            }
          : {}),

        ...(input.phone !== undefined
          ? {
              phone: input.phone?.trim() || null,
            }
          : {}),

        ...(input.address !== undefined
          ? {
              address: input.address?.trim() || null,
            }
          : {}),
      },
    }
  );

  if (!response.data?.id) {
    throw new ApiError(
      'Dữ liệu hồ sơ trả về không hợp lệ.'
    );
  }

  return response.data;
}

// ==========================================
// EXPORT
// ==========================================

export const authService = {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  getCurrentUser,
  updateProfile,
};

export default authService;
