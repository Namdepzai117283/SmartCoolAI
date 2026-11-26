
import jwt from 'jsonwebtoken';

import {
  randomBytes,
  createHash,
} from 'node:crypto';

import { authConfig } from '../config/auth';

import { isRole, type AuthRole } from '../config/permissions';
export type { AuthRole };

export interface AccessTokenPayload {
  userId: string;
  role: AuthRole;
}

export interface RefreshTokenResult {
  token: string;
  tokenHash: string;
  expiresAt: Date;
}

// Tạo Access Token
export function generateAccessToken(
  payload: AccessTokenPayload
): string {
  return jwt.sign(
    {
      role: payload.role,
    },
    authConfig.accessTokenSecret,
    {
      algorithm: 'HS256',
      subject: payload.userId,
      issuer: authConfig.issuer,
      audience: authConfig.audience,
      expiresIn:
        authConfig.accessTokenExpiresIn,
    }
  );
}

// Kiểm tra Access Token
export function verifyAccessToken(
  token: string
): AccessTokenPayload {
  const decoded = jwt.verify(
    token,
    authConfig.accessTokenSecret,
    {
      algorithms: ['HS256'],
      issuer: authConfig.issuer,
      audience: authConfig.audience,
    }
  );

  if (
    typeof decoded === 'string' ||
    typeof decoded.sub !== 'string' ||
    !decoded.sub ||
    typeof decoded.exp !== 'number'
  ) {
    throw new Error(
      'Access Token không hợp lệ.'
    );
  }

  if (!isRole(decoded.role)) {
    throw new Error(
      'Quyền người dùng không hợp lệ.'
    );
  }

  return {
    userId: decoded.sub,
    role: decoded.role,
  };
}

// Băm Refresh Token trước khi lưu Database
export function hashRefreshToken(
  token: string
): string {
  return createHash('sha256')
    .update(token)
    .digest('hex');
}

// Tạo Refresh Token ngẫu nhiên
export function generateRefreshToken():
  RefreshTokenResult {
  const token = randomBytes(64)
    .toString('hex');

  const tokenHash =
    hashRefreshToken(token);

  const expiresAt = new Date(
    Date.now() +
      authConfig.refreshTokenExpiresInDays *
        24 *
        60 *
        60 *
        1000
  );

  return {
    token,
    tokenHash,
    expiresAt,
  };
}

// Kiểm tra thời hạn Refresh Token
export function isRefreshTokenExpired(
  expiresAt: Date
): boolean {
  return expiresAt.getTime() <= Date.now();
}
