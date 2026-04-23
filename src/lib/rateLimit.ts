/**
 * Rate limiting com sliding window — portado de server.js
 *
 * Usa um arquivo JSON como store para sobreviver cold starts no Vercel.
 * Chave do bucket: hash SHA-256 do IP (16 chars) para não persistir IPs brutos.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { storagePaths } from "./storagePaths";

const STORE_PATH = storagePaths.rateLimits;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

type RateLimitStore = Record<string, RateLimitEntry>;

function hashKey(key: string): string {
  return crypto
    .createHash("sha256")
    .update(key)
    .digest("hex")
    .slice(0, 16);
}

function readStore(): RateLimitStore {
  try {
    if (!fs.existsSync(STORE_PATH)) return {};
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    return JSON.parse(raw) as RateLimitStore;
  } catch {
    return {};
  }
}

function writeStore(store: RateLimitStore): void {
  try {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
  } catch {
    // best-effort — não falha a requisição por causa de rate limit store
  }
}

function pruneExpired(store: RateLimitStore): RateLimitStore {
  const now = Date.now();
  const pruned: RateLimitStore = {};
  for (const [k, v] of Object.entries(store)) {
    if (v.resetAt > now) pruned[k] = v;
  }
  return pruned;
}

export interface RateLimitState {
  count: number;
  resetAt: number;
  remaining: number;
}

export function getRateLimitState(
  namespace: string,
  key: string,
  windowMs: number,
  maxAttempts: number
): RateLimitState {
  const now = Date.now();
  const bucketKey = `${namespace}:${hashKey(key)}`;
  const store = readStore();
  const existing = store[bucketKey];

  if (!existing || existing.resetAt <= now) {
    const entry: RateLimitEntry = { count: 0, resetAt: now + windowMs };
    store[bucketKey] = entry;
    writeStore(pruneExpired(store));
    return { ...entry, remaining: maxAttempts };
  }

  return {
    count: existing.count,
    resetAt: existing.resetAt,
    remaining: Math.max(0, maxAttempts - existing.count),
  };
}

export function registerHit(
  namespace: string,
  key: string,
  windowMs: number
): RateLimitEntry {
  const now = Date.now();
  const bucketKey = `${namespace}:${hashKey(key)}`;
  const store = readStore();
  const existing = store[bucketKey];

  if (!existing || existing.resetAt <= now) {
    const entry: RateLimitEntry = { count: 1, resetAt: now + windowMs };
    store[bucketKey] = entry;
    writeStore(pruneExpired(store));
    return entry;
  }

  existing.count += 1;
  store[bucketKey] = existing;
  writeStore(pruneExpired(store));
  return existing;
}

export function clearKey(namespace: string, key: string): void {
  const bucketKey = `${namespace}:${hashKey(key)}`;
  const store = readStore();
  delete store[bucketKey];
  writeStore(store);
}

/** Extrai o IP do cliente da request do Next.js. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

// ── Constantes de rate limit (portadas de server.js) ────────────────────────
export const RATE_LIMITS = {
  login: { windowMs: 10 * 60 * 1000, maxAttempts: 8 },
  lead: { windowMs: 60 * 60 * 1000, maxAttempts: 8 },
  popupEvent: { windowMs: 60 * 60 * 1000, maxAttempts: 150 },
  analytics: { windowMs: 60 * 60 * 1000, maxAttempts: 1200 },
} as const;
