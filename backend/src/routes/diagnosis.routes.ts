import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { diagnosisController } from '../controllers/diagnosis.controller';

// /api/diagnoses – mỗi người chỉ thấy phiếu chẩn đoán của mình
const router = Router();
router.post('/analyze', diagnosisController.analyze); // thử phân tích, không lưu, không cần đăng nhập
router.use(requireAuth);
router.get('/', diagnosisController.list);
router.post('/', diagnosisController.create);
router.get('/:id', diagnosisController.get);
router.patch('/:id', diagnosisController.update);
router.delete('/:id', diagnosisController.remove);
export default router;
