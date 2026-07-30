export interface User {
  id: string;
  email: string;
  name?: string;
  role: "admin" | "user";
  createdAt: string;
  passwordChangeRequired?: boolean;
  permissions?: UserPermission[];
  cmsTheme?: CmsTheme;
  passwordResetRequestedAt?: string;
}

export type CmsTheme = "light" | "dark";

export type UserPermission = "createUsers" | "deleteUsers";

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
  user?: Pick<User, "id" | "email" | "name" | "role" | "passwordChangeRequired" | "permissions" | "cmsTheme">;
  expiresAt?: number;
  setupRequired?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  name?: string;
  setupCode?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: Pick<User, "id" | "email" | "name" | "role" | "passwordChangeRequired" | "permissions" | "cmsTheme">;
  csrfToken?: string;
}
