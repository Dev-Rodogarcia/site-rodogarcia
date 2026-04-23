import path from "path";

const SERVER_STORAGE_DIR = path.join(
  /* turbopackIgnore: true */ process.cwd(),
  "server",
  "storage"
);
const SERVER_PRIVATE_STORAGE_DIR = path.join(SERVER_STORAGE_DIR, "private");

function resolveStoragePath(envKey: string, fallback: string) {
  const override = process.env[envKey];
  if (!override) return fallback;
  return path.isAbsolute(override)
    ? override
    : path.join(/* turbopackIgnore: true */ process.cwd(), override);
}

export const storagePaths = {
  root: SERVER_STORAGE_DIR,
  privateRoot: SERVER_PRIVATE_STORAGE_DIR,
  content: resolveStoragePath(
    "CONTENT_STORE_PATH",
    path.join(SERVER_STORAGE_DIR, "content.json")
  ),
  siteTexts: resolveStoragePath(
    "SITE_TEXTS_STORE_PATH",
    path.join(SERVER_STORAGE_DIR, "site-texts.json")
  ),
  contacts: resolveStoragePath(
    "CONTACTS_STORE_PATH",
    path.join(SERVER_STORAGE_DIR, "contacts.json")
  ),
  quotes: resolveStoragePath(
    "QUOTES_STORE_PATH",
    path.join(SERVER_STORAGE_DIR, "quotes.json")
  ),
  popupConfig: resolveStoragePath(
    "POPUP_CONFIG_STORE_PATH",
    path.join(SERVER_STORAGE_DIR, "popup-config.json")
  ),
  popupLeads: resolveStoragePath(
    "POPUP_LEADS_STORE_PATH",
    path.join(SERVER_STORAGE_DIR, "popup-leads.json")
  ),
  popupEvents: resolveStoragePath(
    "POPUP_EVENTS_STORE_PATH",
    path.join(SERVER_STORAGE_DIR, "popup-events.json")
  ),
  users: resolveStoragePath(
    "USERS_STORE_PATH",
    path.join(SERVER_PRIVATE_STORAGE_DIR, "users.json")
  ),
  sessions: resolveStoragePath(
    "SESSIONS_STORE_PATH",
    path.join(SERVER_PRIVATE_STORAGE_DIR, "sessions.json")
  ),
  analytics: resolveStoragePath(
    "ANALYTICS_STORE_PATH",
    path.join(SERVER_PRIVATE_STORAGE_DIR, "analytics.json")
  ),
  analyticsConfig: resolveStoragePath(
    "ANALYTICS_CONFIG_PATH",
    path.join(SERVER_PRIVATE_STORAGE_DIR, "analytics-config.json")
  ),
  rateLimits: resolveStoragePath(
    "RATE_LIMITS_STORE_PATH",
    path.join(SERVER_PRIVATE_STORAGE_DIR, "rate-limits.json")
  ),
} as const;
