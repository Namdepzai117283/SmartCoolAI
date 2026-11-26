import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { comparisonController, estimateController } from '../controllers/estimate.controller';

// /api/estimates – Dự toán chi phí (server tự tính tổng tiền)
export const estimateRoutes = Router();
estimateRoutes.use(requireAuth);
estimateRoutes.get('/', estimateController.list);
estimateRoutes.post('/', estimateController.create);
estimateRoutes.get('/:id', estimateController.get);
estimateRoutes.patch('/:id', estimateController.update);
estimateRoutes.delete('/:id', estimateController.remove);

// /api/comparisons – Lịch sử so sánh sản phẩm
export const comparisonRoutes = Router();
comparisonRoutes.use(requireAuth);
comparisonRoutes.get('/', comparisonController.list);
comparisonRoutes.post('/', comparisonController.create);
comparisonRoutes.get('/:id', comparisonController.get);
comparisonRoutes.delete('/:id', comparisonController.remove);
