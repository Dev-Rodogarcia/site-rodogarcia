import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { vi } from "vitest";

export function createIsolatedBackendEnv() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "rodogarcia-backend-"));
  const storageRoot = path.join(root, "storage");
  const privateRoot = path.join(storageRoot, "private");
  const uploadsDir = path.join(storageRoot, "uploads");
  const publicDir = path.join(root, "public");

  fs.mkdirSync(privateRoot, { recursive: true });
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.mkdirSync(publicDir, { recursive: true });

  process.env.STORAGE_ROOT = storageRoot;
  process.env.UPLOADS_DIR = uploadsDir;
  process.env.FRONTEND_PUBLIC_DIR = publicDir;
  process.env.CONTENT_STORE_PATH = path.join(storageRoot, "content.json");
  process.env.SITE_TEXTS_STORE_PATH = path.join(storageRoot, "site-texts.json");
  process.env.MEDIA_LIBRARY_STORE_PATH = path.join(storageRoot, "media-library.json");
  process.env.MEDIA_SLOTS_STORE_PATH = path.join(storageRoot, "media-slots.json");
  process.env.COOKIE_CONSENTS_STORE_PATH = path.join(privateRoot, "cookie-consents.json");
  process.env.CONSENT_SETTINGS_STORE_PATH = path.join(storageRoot, "consent-settings.json");
  process.env.AUDIT_LOG_STORE_PATH = path.join(privateRoot, "audit-log.json");
  process.env.RATE_LIMITS_STORE_PATH = path.join(privateRoot, "rate-limits.json");

  vi.resetModules();
  return { root, storageRoot, privateRoot, uploadsDir, publicDir };
}
