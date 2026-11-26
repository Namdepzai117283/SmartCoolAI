import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { conversationService, ConversationError } from '../services/conversation.service';

function handle(action: (req: AuthenticatedRequest, userId: string) => Promise<unknown>, status = 200) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) { res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập.' }); return; }
      const data = await action(req, req.user.userId);
      res.status(status).json({ success: true, data });
    } catch (error) {
      if (error instanceof ConversationError) { res.status(error.statusCode).json({ success: false, message: error.message }); return; }
      next(error);
    }
  };
}
export const conversationController = {
  list: handle((_req, userId) => conversationService.list(userId)),
  create: handle((req, userId) => conversationService.create(userId, req.body), 201),
  get: handle((req, userId) => conversationService.get(userId, req.params.id)),
  update: handle((req, userId) => conversationService.update(userId, req.params.id, req.body)),
  remove: handle((req, userId) => conversationService.remove(userId, req.params.id)),
  addMessage: handle((req, userId) => conversationService.addMessage(userId, req.params.id, req.body), 201),
};
