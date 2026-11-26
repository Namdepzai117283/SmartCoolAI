
import { z } from 'zod';

import { prisma } from '../config/database';

import { AuthError } from './auth.service';

// ==========================================
// VALIDATION
// ==========================================

const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Họ tên phải có ít nhất 2 ký tự.')
    .max(150, 'Họ tên không được quá 150 ký tự.')
    .optional(),

  phone: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === '' ||
        /^(0\d{9}|\+84\d{9})$/.test(value),
      'Số điện thoại không hợp lệ.'
    )
    .nullable()
    .optional(),

  address: z
    .string()
    .trim()
    .max(500, 'Địa chỉ không được quá 500 ký tự.')
    .nullable()
    .optional(),
})
.strict()
.refine(
  (data) =>
    data.fullName !== undefined ||
    data.phone !== undefined ||
    data.address !== undefined,
  'Vui lòng cung cấp thông tin cần cập nhật.'
);

// ==========================================
// UPDATE PROFILE
// ==========================================

export async function updateProfile(
  userId: string,
  input: unknown
) {
  const result =
    updateProfileSchema.safeParse(input);

  if (!result.success) {
    throw new AuthError(
      result.error.issues
        .map((issue) => issue.message)
        .join(' '),
      400
    );
  }

  const data = result.data;

  return prisma.$transaction(async (tx) => {
    const existingUser =
      await tx.user.findUnique({
        where: {
          id: userId,
        },

        select: {
          id: true,
          status: true,
          profile: {
            select: {
              id: true,
            },
          },
        },
      });

    if (!existingUser) {
      throw new AuthError(
        'Tài khoản không tồn tại.',
        404
      );
    }

    if (existingUser.status !== 'ACTIVE') {
      throw new AuthError(
        'Tài khoản không còn hoạt động.',
        403
      );
    }

    if (!existingUser.profile) {
      throw new AuthError(
        'Không tìm thấy hồ sơ cá nhân.',
        404
      );
    }

    const user = await tx.user.update({
      where: {
        id: userId,
      },

      data: {
        profile: {
          update: {
            ...(data.fullName !== undefined
              ? { fullName: data.fullName }
              : {}),

            ...(data.phone !== undefined
              ? { phone: data.phone || null }
              : {}),

            ...(data.address !== undefined
              ? { address: data.address || null }
              : {}),
          },
        },
      },

      select: {
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
      },
    });

    return user;
  });
}

// ==========================================
// EXPORT SERVICE
// ==========================================

export const profileService = {
  updateProfile,
};

export default profileService;
