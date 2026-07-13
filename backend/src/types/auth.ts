export interface User {
  id: string;
  email: string;
  name?: string;
  role: "admin" | "user";
  createdAt: string;
}

export interface UserRecord extends User {
  passwordHash: string;
  active?: boolean;
  isOwner?: boolean;
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
  user?: Pick<User, "id" | "email" | "name" | "role">;
  expiresAt?: number;
  setupRequired?: boolean;
}
