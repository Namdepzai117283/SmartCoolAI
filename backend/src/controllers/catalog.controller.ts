import { handle, isAdmin } from '../utils/http';
import { audited } from '../services/audit.service';
import { brandService } from '../services/brand.service';
import { productService } from '../services/product.service';

// Controller: chỉ đọc request → gọi Service → trả JSON. Không chứa logic nghiệp vụ.

export const brandController = {
  list: handle((req) => brandService.list(isAdmin(req))),
  get: handle((req) => brandService.get(req.params.id)),
  create: handle(audited('brand', 'CREATE', (req) => brandService.create(req.body)), 201),
  update: handle(audited('brand', 'UPDATE', (req) => brandService.update(req.params.id, req.body))),
  remove: handle(audited('brand', 'DELETE', (req) => brandService.remove(req.params.id))),
};

export const productController = {
  list: handle((req) => productService.list(req.query, isAdmin(req))),
  get: handle((req) => productService.get(req.params.id, isAdmin(req))),
  create: handle(audited('product', 'CREATE', (req) => productService.create(req.body)), 201),
  update: handle(audited('product', 'UPDATE', (req) => productService.update(req.params.id, req.body))),
  remove: handle(audited('product', 'DELETE', (req) => productService.remove(req.params.id, req.query.hard === 'true'))),
};
