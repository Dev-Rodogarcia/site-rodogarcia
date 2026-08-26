import crypto from "node:crypto";
import { storagePaths } from "../config/storagePaths.js";
import { readJsonFile, writeJsonFile } from "../utils/jsonStore.js";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

type RateLimitStore = Record<string, RateLimitEntry>;

function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex").slice(0, 16);
}

function readStore(): RateLimitStore {
  return readJsonFile<RateLimitStore>(storagePaths.rateLimits, {});
}

function writeStore(store: RateLimitStore): void {
  writeJsonFile(storagePaths.rateLimits, store);
}

function pruneExpired(store: RateLimitStore): RateLimitStore {
  const now = Date.now();
  return Object.fromEntries(
    Object.entries(store).filter(([, entry]) => entry.resetAt > now)
  );
}

export const rateLimitRepository = {
  get(namespace: string, key: string, windowMs: number, maxAttempts: number) {
    const now = Date.now();
    const bucketKey = `${namespace}:${hashKey(key)}`;
    const store = readStore();
    const existing = store[bucketKey];

    if (!existing || existing.resetAt <= now) {
      const entry = { count: 0, resetAt: now + windowMs };
      store[bucketKey] = entry;
      writeStore(pruneExpired(store));
      return { ...entry, remaining: maxAttempts };
    }

    return {
      count: existing.count,
      resetAt: existing.resetAt,
      remaining: Math.max(0, maxAttempts - existing.count),
    };
  },
  hit(namespace: string, key: string, windowMs: number) {
    const now = Date.now();
    const bucketKey = `${namespace}:${hashKey(key)}`;
    const store = readStore();
    const existing = store[bucketKey];

    if (!existing || existing.resetAt <= now) {
      const entry = { count: 1, resetAt: now + windowMs };
      store[bucketKey] = entry;
      writeStore(pruneExpired(store));
      return entry;
    }

    existing.count += 1;
    store[bucketKey] = existing;
    writeStore(pruneExpired(store));
    return existing;
  },
};
