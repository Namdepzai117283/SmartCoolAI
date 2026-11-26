import { currentUserId, handle } from '../utils/http';
import { estimateService } from '../services/estimate.service';
import { comparisonService } from '../services/comparison.service';

export const estimateController = {
  list: handle((req) => estimateService.list(currentUserId(req), req.query)),
  get: handle((req) => estimateService.get(currentUserId(req), req.params.id)),
  create: handle((req) => estimateService.create(currentUserId(req), req.body), 201),
  update: handle((req) => estimateService.update(currentUserId(req), req.params.id, req.body)),
  remove: handle((req) => estimateService.remove(currentUserId(req), req.params.id)),
};

export const comparisonController = {
  list: handle((req) => comparisonService.list(currentUserId(req), req.query)),
  get: handle((req) => comparisonService.get(currentUserId(req), req.params.id)),
  create: handle((req) => comparisonService.create(currentUserId(req), req.body), 201),
  remove: handle((req) => comparisonService.remove(currentUserId(req), req.params.id)),
};
