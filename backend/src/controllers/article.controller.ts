import { currentUserId, handle, isAdmin } from '../utils/http';
import { articleService } from '../services/article.service';

export const articleController = {
  list: handle((req) => articleService.list(req.query, isAdmin(req))),
  get: handle((req) => articleService.get(String(req.params.idOrSlug), isAdmin(req))),
  create: handle((req) => articleService.create(req.body), 201),
  update: handle((req) => articleService.update(req.params.id, req.body)),
  remove: handle((req) => articleService.remove(req.params.id)),

  listFavorites: handle((req) => articleService.listFavorites(currentUserId(req))),
  addFavorite: handle((req) => articleService.addFavorite(currentUserId(req), req.params.id)),
  removeFavorite: handle((req) => articleService.removeFavorite(currentUserId(req), req.params.id)),

  listProgress: handle((req) => articleService.listProgress(currentUserId(req))),
  saveProgress: handle((req) => articleService.saveProgress(currentUserId(req), req.params.id, req.body)),
};
