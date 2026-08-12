export type UserRole = "ADMIN" | "ACCOUNTANT" | "VIEWER";

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: [
    "upload:batch",
    "reports:export",
    "company:edit",
    "users:manage",
    "settings:edit",
  ],
  ACCOUNTANT: [
    "upload:batch",
    "reports:export",
    "company:read",
  ],
  VIEWER: [
    "dashboard:read",
    "reports:read",
  ],
};

export const hasPermission = (role: UserRole, permission: string): boolean => {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
};