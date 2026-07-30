export interface User {
  id: string;
  email: string;
  name?: string;
  role: "admin" | "user";
  createdAt: string;
  cmsTheme?: CmsTheme;
}

export type CmsTheme = "light" | "dark";

export const USER_PERMISSIONS = ["createUsers", "deleteUsers"] as const;
export type UserPermission = (typeof USER_PERMISSIONS)[number];

export interface UserRecord extends User {
  passwordHash: string;
  active?: boolean;
  isOwner?: boolean;
  /** Until explicitly cleared, this account may only change its own password. */
  mustChangePassword?: boolean;
  permissions?: UserPermission[];
  /** Pedido de redefinição aguardando atendimento do usuário supremo. */
  passwordResetRequestedAt?: string;
}

export interface Session {
  id: string;
  userId: string;
  csrfToken: string;
  createdAt: number;
  expiresAt: number;
}

export interface AuthSession {
  authenticated: boolean;
  csrfToken: string;
  user?: Pick<User, "id" | "email" | "name" | "role"> & {
    passwordChangeRequired?: boolean;
    permissions?: UserPermission[];
    cmsTheme?: CmsTheme;
  };
  expiresAt?: number;
  setupRequired?: boolean;
}
