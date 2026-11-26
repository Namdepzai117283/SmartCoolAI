
import bcrypt from 'bcryptjs';

import { authConfig } from '../config/auth';

export async function hashPassword(
  password: string
): Promise<string> {
  if (!password || password.length < 8) {
    throw new Error(
      'Mật khẩu phải có ít nhất 8 ký tự.'
    );
  }

  if (Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error(
      'Mật khẩu không được vượt quá 72 byte.'
    );
  }

  return bcrypt.hash(
    password,
    authConfig.bcryptSaltRounds
  );
}

export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  if (!password || !passwordHash) {
    return false;
  }

  if (Buffer.byteLength(password, 'utf8') > 72) {
    return false;
  }

  return bcrypt.compare(
    password,
    passwordHash
  );
}

export function validatePassword(
  password: string
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push(
      'Mật khẩu phải có ít nhất 8 ký tự.'
    );
  }

  if (Buffer.byteLength(password, 'utf8') > 72) {
    errors.push(
      'Mật khẩu không được vượt quá 72 byte.'
    );
  }

  if (!/[A-Z]/.test(password)) {
    errors.push(
      'Mật khẩu phải có ít nhất một chữ hoa.'
    );
  }

  if (!/[a-z]/.test(password)) {
    errors.push(
      'Mật khẩu phải có ít nhất một chữ thường.'
    );
  }

  if (!/[0-9]/.test(password)) {
    errors.push(
      'Mật khẩu phải có ít nhất một chữ số.'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
