// ==========================================
// PHÂN QUYỀN THEO VAI TRÒ (RBAC)
// Vai trò → danh sách quyền. Middleware requirePermission() đọc bảng này.
// ==========================================

export const ROLES = ['USER', 'ADMIN', 'WAREHOUSE', 'SUPPORT', 'TECHNICIAN'] as const;
export type AuthRole = (typeof ROLES)[number];

export const ROLE_LABELS: Record<AuthRole, string> = {
  ADMIN: 'Super Admin',
  WAREHOUSE: 'Quản lý kho / kỹ thuật',
  SUPPORT: 'Chăm sóc khách hàng',
  TECHNICIAN: 'Kỹ thuật viên',
  USER: 'Khách hàng',
};

export const PERMISSIONS = [
  'dashboard:read',
  'catalog:write',       // sản phẩm, thương hiệu, mã lỗi
  'devices:read',
  'devices:write',
  'firmware:write',      // đẩy OTA
  'users:read',
  'users:write',         // khóa tài khoản, đổi vai trò
  'tickets:read',
  'tickets:write',       // tạo, gán kỹ thuật viên
  'tickets:work',        // kỹ thuật viên cập nhật phiếu của mình
  'notifications:write',
  'content:write',       // bài viết, FAQ, hướng dẫn
  'settings:write',
  'audit:read',
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<AuthRole, readonly Permission[]> = {
  ADMIN: PERMISSIONS,
  WAREHOUSE: ['dashboard:read', 'catalog:write', 'devices:read', 'devices:write', 'firmware:write', 'tickets:read'],
  SUPPORT: ['dashboard:read', 'devices:read', 'users:read', 'tickets:read', 'tickets:write', 'notifications:write', 'content:write'],
  TECHNICIAN: ['dashboard:read', 'devices:read', 'tickets:read', 'tickets:work'],
  USER: [],
};

export function isRole(value: unknown): value is AuthRole {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

export function hasPermission(role: AuthRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function permissionsOf(role: AuthRole): Permission[] {
  return [...ROLE_PERMISSIONS[role]];
}

export function isStaff(role: AuthRole): boolean {
  return role !== 'USER';
}
