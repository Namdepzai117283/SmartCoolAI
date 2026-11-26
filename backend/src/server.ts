
import 'dotenv/config';

import app from './app';

import {
  connectDatabase,
  disconnectDatabase,
} from './config/database';

const PORT = Number(process.env.PORT || 5000);
const HOST = '0.0.0.0';

async function startServer(): Promise<void> {
  try {
    await connectDatabase();

    const server = app.listen(PORT, HOST, () => {
      console.log('========================================');
      console.log('       SMARTCOOL AI BACKEND');
      console.log('========================================');
      console.log('Trạng thái: Đang hoạt động');
      console.log(`Cổng kết nối: ${PORT}`);
      console.log(`Môi trường: ${process.env.NODE_ENV}`);
      console.log('Database: PostgreSQL - Connected');
      console.log(`Server: http://localhost:${PORT}`);
      console.log(`Health: http://localhost:${PORT}/api/health`);
      console.log('========================================');
    });

    server.on('error', async (error) => {
      console.error('Lỗi Server:', error);
      await disconnectDatabase();
      process.exit(1);
    });

    let shuttingDown = false;

    function shutdown(signal: string): void {
      if (shuttingDown) return;

      shuttingDown = true;

      console.log(`\nNhận tín hiệu ${signal}`);
      console.log('Đang dừng SmartCool AI Backend...');

      server.close(async () => {
        try {
          await disconnectDatabase();
          console.log('Server đã dừng an toàn.');
          process.exit(0);
        } catch (error) {
          console.error('Lỗi khi đóng Database:', error);
          process.exit(1);
        }
      });
    }

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error) {
    console.error('Không thể khởi động Backend:', error);

    await disconnectDatabase().catch(console.error);

    process.exit(1);
  }
}

void startServer();
