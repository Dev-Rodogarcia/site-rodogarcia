import type { Request } from "express";
import { env } from "../config/env.js";
import { userRepository } from "../repositories/userRepository.js";
import { cmsAccessProfileRepository } from "../repositories/cmsAccessProfileRepository.js";
import { USER_PERMISSIONS, type UserPermission, type UserRecord } from "../types/auth.js";
import { generateId } from "../utils/ids.js";
import { sanitizeEmail, sanitizeText } from "../utils/sanitize.js";
import {
  hashPassword,
  validatePasswordStrength,
  verifyPassword,
} from "../security/password.js";
import { createSession } from "../security/session.js";
import { sessionRepository } from "../repositories/sessionRepository.js";
import { HttpError } from "../utils/http.js";
import {
  RATE_LIMITS,
  getClientIp,
  getRateLimitState,
  registerHit,
} from "../security/rateLimit.js";
import { effectiveCmsPermissions, parseCmsOverrides, parseCmsPermissions } from "../security/cmsAccess.js";

export function publicUser(user: UserRecord) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isSupreme: isSupremeUser(user),
    isOwner: user.isOwner === true,
    passwordChangeRequired: isPasswordChangeRequired(user),
    permissions: user.permissions ?? [],
    accessProfileId: user.accessProfileId ?? "",
    cmsPermissions: effectiveCmsPermissions(user),
    cmsPermissionOverrides: user.cmsPermissionOverrides ?? [],
    cmsTheme: user.cmsTheme,
  };
}

export function isPasswordChangeRequired(user: UserRecord | null | undefined) {
  return Boolean(user && user.isOwner !== true && user.mustChangePassword !== false);
}

export function isSupremeUser(user: UserRecord | null | undefined) {
  if (!user) return false;
  return (
    user.role === "admin" &&
    user.active !== false &&
    user.isOwner === true
  );
}

type UserRole = UserRecord["role"];

interface CreateUserParams {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
  role?: unknown;
  permissions?: unknown;
  accessProfileId?: unknown;
  cmsPermissions?: unknown;
  cmsPermissionOverrides?: unknown;
}

function parseUserPermissions(value: unknown): UserPermission[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.some((permission) => typeof permission !== "string" || !USER_PERMISSIONS.includes(permission as UserPermission))) {
    throw new HttpError(422, "Permissões de usuário inválidas.");
  }
  return [...new Set(value as UserPermission[])];
}

function parseUserRole(value: unknown, required: boolean): UserRole | undefined {
  if (value === undefined && !required) return undefined;
  if (value === "admin" || value === "user") return value;
  throw new HttpError(422, "Perfil de acesso inválido.");
}

function parseUserActive(value: unknown): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "boolean") return value;
  throw new HttpError(422, "O status do usuário deve ser booleano.");
}

function parseUserName(value: unknown, required: boolean): string | undefined {
  if (value === undefined && !required) return undefined;
  if (typeof value !== "string") {
    throw new HttpError(422, "Informe um nome válido.");
  }

  const name = sanitizeText(value, 81);
  if (!name) throw new HttpError(422, "Informe um nome válido.");
  if (name.length > 80) {
    throw new HttpError(422, "O nome deve ter no máximo 80 caracteres.");
  }
  return name;
}

function parseUserEmail(value: unknown, required: boolean): string | undefined {
  if (value === undefined && !required) return undefined;
  if (typeof value !== "string") {
    throw new HttpError(422, "Informe um e-mail válido.");
  }

  const normalized = sanitizeText(value, 161);
  if (normalized.length > 160) {
    throw new HttpError(422, "O e-mail deve ter no máximo 160 caracteres.");
  }
  const email = sanitizeEmail(value);
  if (!email) throw new HttpError(422, "Informe um e-mail válido.");
  return email;
}

function assertSupremeActor(actor: UserRecord | null | undefined) {
  if (!isSupremeUser(actor)) {
    throw new HttpError(403, "Somente o usuário supremo pode gerenciar acessos.");
  }
}

export function hasUserPermission(
  user: UserRecord | null | undefined,
  permission: UserPermission
) {
  return Boolean(
    user &&
      user.role === "admin" &&
      user.active !== false &&
      (isSupremeUser(user) || user.permissions?.includes(permission))
  );
}

function assertUserPermission(actor: UserRecord | null | undefined, permission: UserPermission) {
  if (!hasUserPermission(actor, permission)) {
    throw new HttpError(403, "Você não tem permissão para gerenciar usuários desta forma.");
  }
}

function parseAccessProfileId(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  const id = sanitizeText(value, 120);
  if (!id) return undefined;
  const profile = cmsAccessProfileRepository.findById(id);
  if (!profile || profile.active === false) {
    throw new HttpError(422, "Perfil-base de acesso inválido ou inativo.");
  }
  return id;
}

function assertLoginRateLimit(req: Request, email: string) {
  const { windowMs, maxAttempts } = RATE_LIMITS.login;
  const ip = getClientIp(req);
  const ipState = getRateLimitState("login:ip", ip, windowMs, maxAttempts);
  const emailState = email
    ? getRateLimitState("login:email", email, windowMs, maxAttempts)
    : null;

  if (ipState.count >= maxAttempts || (emailState && emailState.count >= maxAttempts)) {
    throw new HttpError(429, "Muitas tentativas de login. Tente novamente mais tarde.");
  }
}

function registerFailedLogin(req: Request, email: string) {
  const { windowMs } = RATE_LIMITS.login;
  registerHit("login:ip", getClientIp(req), windowMs);
  if (email) registerHit("login:email", email, windowMs);
}

export function listUsers(actor?: UserRecord) {
  const canViewPasswordResetRequests = isSupremeUser(actor);
  return userRepository
    .list()
    .map((user) => ({
      ...publicUser(user),
      createdAt: user.createdAt,
      active: user.active !== false,
      protected: isSupremeUser(user),
      passwordResetRequestedAt: canViewPasswordResetRequests ? user.passwordResetRequestedAt : undefined,
    }))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function login(req: Request) {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const emailRaw = body.email;
  const passwordRaw = body.password;
  const email = sanitizeEmail(emailRaw);
  const password = typeof passwordRaw === "string" ? passwordRaw : "";

  assertLoginRateLimit(req, email);

  if (!email || !password) {
    registerFailedLogin(req, email);
    throw new HttpError(400, "E-mail e senha são obrigatórios.");
  }

  const user = userRepository.findByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    registerFailedLogin(req, email);
    throw new HttpError(401, "Credenciais invalidas.");
  }

  const session = createSession(user.id);
  return { user, session };
}

/**
 * A resposta é sempre genérica para não revelar se um endereço possui conta.
 * O pedido é visível apenas para o usuário supremo na gestão de acessos.
 */
export function requestPasswordReset(params: { email?: unknown }) {
  const email = parseUserEmail(params.email, true)!;
  const user = userRepository.findByEmail(email);
  if (user && user.active !== false) {
    userRepository.update(user.id, { passwordResetRequestedAt: new Date().toISOString() });
  }
}

function createUserRecord(
  params: CreateUserParams,
  isInitialOwner: boolean
) {
  const name = parseUserName(params.name, true)!;
  const email = parseUserEmail(params.email, true)!;
  const password = typeof params.password === "string" ? params.password : "";
  const confirmPassword =
    typeof params.confirmPassword === "string" ? params.confirmPassword : password;
  const role = parseUserRole(params.role, true)!;
  const permissions = parseUserPermissions(params.permissions) ?? [];
  const cmsPermissions = parseCmsPermissions(params.cmsPermissions);
  const cmsPermissionOverrides = parseCmsOverrides(params.cmsPermissionOverrides);
  const accessProfileId = parseAccessProfileId(params.accessProfileId);
  if (role !== "admin" && permissions.length > 0) {
    throw new HttpError(422, "Permissões de usuários exigem perfil de administrador.");
  }

  if (!password) {
    throw new HttpError(422, "Preencha nome, e-mail e senha corretamente.");
  }
  if (password !== confirmPassword) {
    throw new HttpError(422, "As senhas não coincidem.");
  }

  const passwordErrors = validatePasswordStrength(password);
  if (passwordErrors.length > 0) {
    throw new HttpError(422, passwordErrors[0] ?? "Senha invalida.");
  }

  if (userRepository.findAnyByEmail(email)) {
    throw new HttpError(409, "Ja existe conta com este e-mail.");
  }

  const nowIso = new Date().toISOString();
  return userRepository.create({
    id: generateId("usr"),
    email,
    name,
    role,
    active: true,
    isOwner: isInitialOwner,
    mustChangePassword: isInitialOwner ? false : true,
    permissions: isInitialOwner ? [] : permissions,
    accessProfileId: isInitialOwner ? undefined : accessProfileId || undefined,
    cmsPermissions: isInitialOwner ? undefined : (cmsPermissions ?? []),
    cmsPermissionOverrides: isInitialOwner ? undefined : cmsPermissionOverrides,
    createdAt: nowIso,
    passwordHash: hashPassword(password),
  });
}

export function createUser(params: CreateUserParams, actor?: UserRecord) {
  if (userRepository.hasAny() && (!actor || actor.role !== "admin" || actor.active === false)) {
    throw new HttpError(403, "Acesso administrativo obrigatório para criar usuários.");
  }
  return createUserRecord(params, false);
}

export function updateUser(
  id: unknown,
  params: {
    name?: unknown;
    email?: unknown;
    role?: unknown;
    active?: unknown;
    password?: unknown;
    confirmPassword?: unknown;
    permissions?: unknown;
    accessProfileId?: unknown;
    cmsPermissions?: unknown;
    cmsPermissionOverrides?: unknown;
  },
  actor: UserRecord
) {
  assertSupremeActor(actor);
  const userId = sanitizeText(id, 120);
  const target = userRepository.findById(userId);
  if (!target) throw new HttpError(404, "Usuário não encontrado.");
  const requestedRole = parseUserRole(params.role, false);
  const requestedActive = parseUserActive(params.active);
  const requestedPermissions = parseUserPermissions(params.permissions);
  const requestedCmsPermissions = parseCmsPermissions(params.cmsPermissions);
  const requestedCmsOverrides = parseCmsOverrides(params.cmsPermissionOverrides);
  const requestedAccessProfileId = parseAccessProfileId(params.accessProfileId);
  if (isSupremeUser(target)) {
    if (
      (requestedRole !== undefined && requestedRole !== "admin") ||
      requestedActive === false
    ) {
      throw new HttpError(403, "O usuário supremo não pode perder perfil master ou ser desativado.");
    }
  }

  const patch: Partial<UserRecord> = {};
  const name = parseUserName(params.name, false);
  const email = parseUserEmail(params.email, false);
  if (name !== undefined) patch.name = name;
  if (email !== undefined && email !== target.email) {
    const existing = userRepository.findAnyByEmail(email);
    if (existing && existing.id !== target.id) {
      throw new HttpError(409, "Ja existe conta com este e-mail.");
    }
    patch.email = email;
  }
  if (requestedRole !== undefined) patch.role = requestedRole;
  if (requestedActive !== undefined) patch.active = requestedActive;
  if (requestedPermissions !== undefined) {
    if (requestedRole === "user" || (requestedRole === undefined && target.role !== "admin")) {
      throw new HttpError(422, "Permissões de usuários exigem perfil de administrador.");
    }
    patch.permissions = requestedPermissions;
  } else if (requestedRole === "user") {
    patch.permissions = [];
  }
  if (requestedCmsPermissions !== undefined) patch.cmsPermissions = requestedCmsPermissions;
  if (requestedCmsOverrides !== undefined) patch.cmsPermissionOverrides = requestedCmsOverrides;
  if (requestedAccessProfileId !== undefined) patch.accessProfileId = requestedAccessProfileId || undefined;

  if (params.password !== undefined && typeof params.password !== "string") {
    throw new HttpError(422, "A senha deve ser uma string.");
  }
  const password = typeof params.password === "string" ? params.password : "";
  if (password) {
    const confirmPassword =
      typeof params.confirmPassword === "string" ? params.confirmPassword : "";
    if (password !== confirmPassword) {
      throw new HttpError(422, "As senhas não coincidem.");
    }
    const passwordErrors = validatePasswordStrength(password);
    if (passwordErrors.length > 0) {
      throw new HttpError(422, passwordErrors[0] ?? "Senha invalida.");
    }
    patch.passwordHash = hashPassword(password);
    // A password defined by the account owner is temporary until its holder replaces it.
    patch.mustChangePassword = isSupremeUser(target) ? false : true;
    patch.passwordResetRequestedAt = undefined;
  }

  const updated = userRepository.update(target.id, patch);
  if (!updated) throw new HttpError(404, "Usuário não encontrado.");
  if (
    patch.passwordHash ||
    (patch.active !== undefined && patch.active !== (target.active !== false)) ||
    (patch.role !== undefined && patch.role !== target.role) ||
    patch.cmsPermissions !== undefined || patch.cmsPermissionOverrides !== undefined || patch.accessProfileId !== undefined
  ) {
    sessionRepository.deleteByUserId(target.id);
  }
  return updated;
}

export function changeOwnPassword(
  user: UserRecord,
  params: { currentPassword?: unknown; password?: unknown; confirmPassword?: unknown }
) {
  const currentPassword = typeof params.currentPassword === "string" ? params.currentPassword : "";
  const password = typeof params.password === "string" ? params.password : "";
  const confirmPassword = typeof params.confirmPassword === "string" ? params.confirmPassword : "";

  if (!currentPassword || !password || !confirmPassword) {
    throw new HttpError(422, "Preencha a senha atual e a nova senha.");
  }
  if (!verifyPassword(currentPassword, user.passwordHash)) {
    throw new HttpError(422, "A senha atual está incorreta.");
  }
  if (password !== confirmPassword) {
    throw new HttpError(422, "As senhas não coincidem.");
  }
  const passwordErrors = validatePasswordStrength(password);
  if (passwordErrors.length > 0) {
    throw new HttpError(422, passwordErrors[0] ?? "Senha invalida.");
  }

  const updated = userRepository.update(user.id, {
    passwordHash: hashPassword(password),
    mustChangePassword: false,
  });
  if (!updated) throw new HttpError(404, "Usuário não encontrado.");
  return updated;
}

export function updateOwnCmsTheme(user: UserRecord, params: { theme?: unknown }) {
  const theme = params.theme;
  if (theme !== "light" && theme !== "dark") {
    throw new HttpError(422, "Tema do CMS inválido.");
  }

  const updated = userRepository.update(user.id, { cmsTheme: theme });
  if (!updated) throw new HttpError(404, "Usuário não encontrado.");
  return updated;
}

export function deleteUser(id: unknown, actor: UserRecord) {
  assertUserPermission(actor, "deleteUsers");
  const userId = sanitizeText(id, 120);
  const target = userRepository.findById(userId);
  if (!target) throw new HttpError(404, "Usuário não encontrado.");
  if (isSupremeUser(target)) {
    throw new HttpError(403, "O usuário supremo não pode ser excluído.");
  }
  if (target.id === actor.id) {
    throw new HttpError(403, "Você não pode excluir sua própria conta.");
  }
  sessionRepository.deleteByUserId(target.id);
  userRepository.delete(target.id);
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

  return createUserRecord(
    { ...params, role: "admin" },
    true
  );
}

export function hasAnyUser() {
  return userRepository.hasAny();
}
