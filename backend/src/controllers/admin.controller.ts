import { currentUserId, handle } from '../utils/http';
import { adminService } from '../services/admin.service';

export const adminController = {
  stats: handle(() => adminService.stats()),
  listUsers: handle((req) => adminService.listUsers(req.query)),
  setUserStatus: handle((req) => adminService.setUserStatus(currentUserId(req), req.params.id, req.body)),
};
