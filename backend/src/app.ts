import express from 'express';
import cors from 'cors';
import { checkDatabaseHealth } from './config/database';
import authRoutes from './routes/auth.routes';
import conversationRoutes from './routes/conversation.routes';
import { brandRoutes, productRoutes } from './routes/catalog.routes';
import articleRoutes from './routes/article.routes';
import diagnosisRoutes from './routes/diagnosis.routes';
import { comparisonRoutes, estimateRoutes } from './routes/estimate.routes';
import adminRoutes from './routes/admin.routes';
const app = express();
app.disable('x-powered-by');
// CORS_ORIGIN="https://smartcoolai.vercel.app,http://localhost:5173" (bỏ trống = cho phép tất cả)
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : undefined));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.get('/', (_req, res) => {
  res.json({ success: true, service: 'SmartCool AI Backend', message: 'Chào mừng đến với SmartCool AI API', version: '1.0.0' });
});
app.get('/api/health', async (_req, res) => {
  const databaseConnected = await checkDatabaseHealth();
  res.status(databaseConnected ? 200 : 503).json({ success: databaseConnected, service: 'SmartCool AI Backend', status: databaseConnected ? 'online' : 'degraded', database: { provider: 'PostgreSQL', orm: 'Prisma', status: databaseConnected ? 'connected' : 'disconnected' }, timestamp: new Date().toISOString(), version: '1.0.0' });
});
app.use('/api/auth', (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); }, authRoutes);
app.use('/api/conversations', (_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); }, conversationRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/products', productRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/diagnoses', diagnosisRoutes);
app.use('/api/estimates', estimateRoutes);
app.use('/api/comparisons', comparisonRoutes);
app.use('/api/admin', adminRoutes);
app.use((_req, res) => { res.status(404).json({ success: false, message: 'Không tìm thấy đường dẫn API.' }); });
const errorHandler: express.ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) { next(error); return; }
  if (error.type === 'entity.parse.failed') { res.status(400).json({ success: false, message: 'Dữ liệu JSON không hợp lệ.' }); return; }
  if (error.type === 'entity.too.large') { res.status(413).json({ success: false, message: 'Dữ liệu gửi lên quá lớn.' }); return; }
  console.error('Lỗi hệ thống:', error.name || 'UnknownError', error.code || '');
  res.status(500).json({ success: false, message: 'Đã xảy ra lỗi hệ thống.' });
};
app.use(errorHandler);
export default app;
