import { env } from "../config/env.js";
import { userRepository } from "../repositories/userRepository.js";
import type { UserRecord } from "../types/auth.js";
import { generateId } from "../utils/ids.js";
import { sanitizeEmail, sanitizeText } from "../utils/sanitize.js";
import {
  hashPassword,
  validatePasswordStrength,
  verifyPassword,
} from "../security/password.js";
import { createSession } from "../security/session.js";
import { HttpError } from "../utils/http.js";

export function publicUser(user: UserRecord) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export function listUsers() {
  return userRepository
    .list()
    .map((user) => ({
      ...publicUser(user),
      createdAt: user.createdAt,
      active: user.active !== false,
    }))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function login(emailRaw: unknown, passwordRaw: unknown) {
  const email = sanitizeEmail(emailRaw);
  const password = typeof passwordRaw === "string" ? passwordRaw : "";

  if (!email || !password) {
    throw new HttpError(400, "E-mail e senha sao obrigatorios.");
  }

  const user = userRepository.findByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new HttpError(401, "Credenciais invalidas.");
  }

  const session = createSession(user.id);
  return { user, session };
}

export function createUser(params: {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
  role?: unknown;
}) {
  const name = sanitizeText(params.name, 80);
  const email = sanitizeEmail(params.email);
  const password = typeof params.password === "string" ? params.password : "";
  const confirmPassword =
    typeof params.confirmPassword === "string" ? params.confirmPassword : password;
  const role = params.role === "user" ? "user" : "admin";

  if (!name || !email || !password) {
    throw new HttpError(422, "Preencha nome, e-mail e senha corretamente.");
  }
  if (password !== confirmPassword) {
    throw new HttpError(422, "As senhas nao coincidem.");
  }

  const passwordErrors = validatePasswordStrength(password);
  if (passwordErrors.length > 0) {
    throw new HttpError(422, passwordErrors[0] ?? "Senha invalida.");
  }

  if (userRepository.findByEmail(email)) {
    throw new HttpError(409, "Ja existe conta com este e-mail.");
  }

  const nowIso = new Date().toISOString();
  return userRepository.create({
    id: generateId("usr"),
    email,
    name,
    role,
    active: true,
    createdAt: nowIso,
    passwordHash: hashPassword(password),
  });
}

export function createInitialUser(params: {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
  setupCode?: unknown;
}) {
  if (userRepository.hasAny()) {
    throw new HttpError(403, "Setup inicial ja foi concluido.");
  }

  const setupCode = sanitizeText(params.setupCode, 160);
  if (!env.adminSetupCode || setupCode !== env.adminSetupCode) {
    throw new HttpError(403, "Codigo de setup invalido.");
  }

  return createUser({ ...params, role: "admin" });
}

export function hasAnyUser() {
  return userRepository.hasAny();
}
