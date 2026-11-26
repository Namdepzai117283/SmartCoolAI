import { currentUserId, handle } from '../utils/http';
import { diagnosisService } from '../services/diagnosis.service';

export const diagnosisController = {
  analyze: handle(async (req) => diagnosisService.preview(req.body)),
  list: handle((req) => diagnosisService.list(currentUserId(req), req.query)),
  get: handle((req) => diagnosisService.get(currentUserId(req), req.params.id)),
  create: handle((req) => diagnosisService.create(currentUserId(req), req.body), 201),
  update: handle((req) => diagnosisService.update(currentUserId(req), req.params.id, req.body)),
  remove: handle((req) => diagnosisService.remove(currentUserId(req), req.params.id)),
};
