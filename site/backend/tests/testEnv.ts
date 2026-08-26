import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { vi } from "vitest";

export function createIsolatedBackendEnv() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "rodogarcia-backend-"));
  const storageRoot = path.join(root, "storage");
  const privateRoot = path.join(storageRoot, "private");

  fs.mkdirSync(privateRoot, { recursive: true });

  process.env.STORAGE_ROOT = storageRoot;
  process.env.RATE_LIMITS_STORE_PATH = path.join(privateRoot, "rate-limits.json");

  vi.resetModules();
  return { root, storageRoot, privateRoot };
}
