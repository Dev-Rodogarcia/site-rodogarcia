export interface User {
  id: string;
  email: string;
  name?: string;
  role: "admin" | "user";
  createdAt: string;
  passwordChangeRequired?: boolean;
  permissions?: UserPermission[];
}

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
  user?: Pick<User, "id" | "email" | "name" | "role" | "passwordChangeRequired" | "permissions">;
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
  user?: Pick<User, "id" | "email" | "name" | "role" | "passwordChangeRequired" | "permissions">;
  csrfToken?: string;
}
