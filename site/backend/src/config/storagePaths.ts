import path from "node:path";
import { env } from "./env.js";

function resolveStoragePath(fallback: string) {
  const envKey = "RATE_LIMITS_STORE_PATH";
  const override = process.env[envKey];
  if (!override) return fallback;
  return path.isAbsolute(override)
    ? override
    : path.join(env.backendRoot, override);
}

export const storagePaths = {
  root: env.storageRoot,
  rateLimits: resolveStoragePath(path.join(env.storageRoot, "private", "rate-limits.json")),
} as const;
