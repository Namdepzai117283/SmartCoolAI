
import 'dotenv/config';

import { z } from 'zod';

const authEnvSchema = z.object({
  JWT_ACCESS_SECRET: z.string().min(
    64,
    'JWT_ACCESS_SECRET phải có ít nhất 64 ký tự.'
  ),

  JWT_ACCESS_EXPIRES_IN: z
    .literal('15m')
    .default('15m'),

  JWT_REFRESH_EXPIRES_IN_DAYS: z.coerce
    .number()
    .int()
    .positive()
    .max(90)
    .default(30),
});

const result = authEnvSchema.safeParse(process.env);

if (!result.success) {
  const errors = result.error.issues
    .map((issue) => {
      return `${issue.path.join('.')}: ${issue.message}`;
    })
    .join('\n');

  throw new Error(
    `Cấu hình xác thực không hợp lệ:\n${errors}`
  );
}

export const authConfig = Object.freeze({
  accessTokenSecret: result.data.JWT_ACCESS_SECRET,

  accessTokenExpiresIn:
    result.data.JWT_ACCESS_EXPIRES_IN,

  refreshTokenExpiresInDays:
    result.data.JWT_REFRESH_EXPIRES_IN_DAYS,

  bcryptSaltRounds: 12,

  issuer: 'smartcool-ai',

  audience: 'smartcool-ai-client',
});

export default authConfig;
