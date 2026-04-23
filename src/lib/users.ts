/**
 * User store — portado de server/repositories/userStore.js + lógica de auth de server.js
 * Persiste em server/storage/private/users.json (mesmo arquivo do server.js legado).
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { User } from "@/types/auth";
import { storagePaths } from "@/lib/storagePaths";

const PBKDF2_ITERATIONS = 120_000;
const USERS_FILE = storagePaths.users;

interface UserRecord extends User {
  passwordHash: string;
  active?: boolean;
}

interface UsersStore {
  users: UserRecord[];
}

function readUsersFile(): UsersStore {
  try {
    if (!fs.existsSync(USERS_FILE)) return { users: [] };
    const raw = fs.readFileSync(USERS_FILE, "utf8").replace(/^\uFEFF/, "");
    const data = JSON.parse(raw) as UsersStore;
    return { users: Array.isArray(data.users) ? data.users : [] };
  } catch {
    return { users: [] };
  }
}

function writeUsersFile(data: UsersStore): void {
  fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), "utf8");
}

export function getAllUsers(): UserRecord[] {
  return readUsersFile().users;
}

export function findUserByEmail(email: string): UserRecord | null {
  const { users } = readUsersFile();
  return users.find((u) => u.email === email && u.active !== false) ?? null;
}

export function findUserById(id: string): UserRecord | null {
  const { users } = readUsersFile();
  return users.find((u) => u.id === id) ?? null;
}

export function createUser(params: {
  email: string;
  password: string;
  name?: string;
  role?: "admin" | "user";
}): UserRecord {
  const data = readUsersFile();
  const nowIso = new Date().toISOString();
  const newUser: UserRecord = {
    id: generateId("usr"),
    email: params.email,
    name: params.name,
    role: params.role ?? "admin",
    active: true,
    createdAt: nowIso,
    passwordHash: hashPassword(params.password),
  };
  data.users.push(newUser);
  writeUsersFile(data);
  return newUser;
}

export function hasAnyUser(): boolean {
  return readUsersFile().users.length > 0;
}

export function publicUser(
  user: UserRecord
): Pick<User, "id" | "email" | "name" | "role"> {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

// ── Password utilities ───────────────────────────────────────────────────────

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, "sha512")
    .toString("hex");
  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt}$${hash}`;
}

export function verifyPassword(
  password: string,
  storedHash: string
): boolean {
  if (typeof storedHash !== "string" || !storedHash.startsWith("pbkdf2$"))
    return false;

  const parts = storedHash.split("$");
  if (parts.length !== 4) return false;

  const iterations = Number(parts[1]);
  const salt = parts[2];
  const hashHex = parts[3];
  if (!iterations || !salt || !hashHex) return false;

  const candidate = crypto
    .pbkdf2Sync(password, salt, iterations, 64, "sha512")
    .toString("hex");

  const bufA = Buffer.from(candidate);
  const bufB = Buffer.from(hashHex);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function validatePasswordStrength(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 10)
    errors.push("A senha deve ter no mínimo 10 caracteres.");
  if (password.length > 72)
    errors.push("A senha deve ter no máximo 72 caracteres.");
  if (!/[a-z]/.test(password))
    errors.push("A senha deve incluir letra minúscula.");
  if (!/[A-Z]/.test(password))
    errors.push("A senha deve incluir letra maiúscula.");
  if (!/[0-9]/.test(password)) errors.push("A senha deve incluir número.");
  return errors;
}

// ── ID generation ────────────────────────────────────────────────────────────

export function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}
