import { handle, isAdmin } from '../utils/http';
import { brandService } from '../services/brand.service';
import { productService } from '../services/product.service';

// Controller: chỉ đọc request → gọi Service → trả JSON. Không chứa logic nghiệp vụ.

export const brandController = {
  list: handle((req) => brandService.list(isAdmin(req))),
  get: handle((req) => brandService.get(req.params.id)),
  create: handle((req) => brandService.create(req.body), 201),
  update: handle((req) => brandService.update(req.params.id, req.body)),
  remove: handle((req) => brandService.remove(req.params.id)),
};

export const productController = {
  list: handle((req) => productService.list(req.query, isAdmin(req))),
  get: handle((req) => productService.get(req.params.id, isAdmin(req))),
  create: handle((req) => productService.create(req.body), 201),
  update: handle((req) => productService.update(req.params.id, req.body)),
  remove: handle((req) => productService.remove(req.params.id, req.query.hard === 'true')),
};
