
import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'Không tìm thấy DATABASE_URL trong file .env'
  );
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

export const prisma = new PrismaClient({
  adapter,
  log:
    process.env.NODE_ENV === 'development'
      ? ['warn', 'error']
      : ['error'],
});

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();

    await prisma.$queryRaw`SELECT 1`;

    console.log(
      '========================================'
    );
    console.log('SMARTCOOL AI DATABASE');
    console.log('Trạng thái: Kết nối thành công');
    console.log('Database: PostgreSQL');
    console.log('ORM: Prisma');
    console.log(
      '========================================'
    );
  } catch (error) {
    console.error(
      'Không thể kết nối cơ sở dữ liệu:',
      error
    );

    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();

  console.log('Đã ngắt kết nối cơ sở dữ liệu.');
}

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return true;
  } catch {
    return false;
  }
}

export default prisma;
