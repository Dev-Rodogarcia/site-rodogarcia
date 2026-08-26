import path from "node:path";
import { env } from "./env.js";

const privateRoot = path.join(env.storageRoot, "private");

function resolveStoragePath(envKey: string, fallback: string) {
  const override = process.env[envKey];
  if (!override) return fallback;
  return path.isAbsolute(override)
    ? override
    : path.join(env.backendRoot, override);
}

export const storagePaths = {
  root: env.storageRoot,
  privateRoot,
  content: resolveStoragePath(
    "CONTENT_STORE_PATH",
    path.join(env.storageRoot, "content.json")
  ),
  siteTexts: resolveStoragePath(
    "SITE_TEXTS_STORE_PATH",
    path.join(env.storageRoot, "site-texts.json")
  ),
  contacts: resolveStoragePath(
    "CONTACTS_STORE_PATH",
    path.join(env.storageRoot, "contacts.json")
  ),
  quotes: resolveStoragePath(
    "QUOTES_STORE_PATH",
    path.join(env.storageRoot, "quotes.json")
  ),
  popupConfig: resolveStoragePath(
    "POPUP_CONFIG_STORE_PATH",
    path.join(env.storageRoot, "popup-config.json")
  ),
  popupLeads: resolveStoragePath(
    "POPUP_LEADS_STORE_PATH",
    path.join(env.storageRoot, "popup-leads.json")
  ),
  popupEvents: resolveStoragePath(
    "POPUP_EVENTS_STORE_PATH",
    path.join(env.storageRoot, "popup-events.json")
  ),
  users: resolveStoragePath(
    "USERS_STORE_PATH",
    path.join(privateRoot, "users.json")
  ),
  cmsAccessProfiles: resolveStoragePath(
    "CMS_ACCESS_PROFILES_STORE_PATH",
    path.join(privateRoot, "cms-access-profiles.json")
  ),
  sessions: resolveStoragePath(
    "SESSIONS_STORE_PATH",
    path.join(privateRoot, "sessions.json")
  ),
  analytics: resolveStoragePath(
    "ANALYTICS_STORE_PATH",
    path.join(privateRoot, "analytics.json")
  ),
  analyticsConfig: resolveStoragePath(
    "ANALYTICS_CONFIG_PATH",
    path.join(privateRoot, "analytics-config.json")
  ),
  seoSettings: resolveStoragePath(
    "SEO_SETTINGS_STORE_PATH",
    path.join(env.storageRoot, "seo-settings.json")
  ),
  consentSettings: resolveStoragePath(
    "CONSENT_SETTINGS_STORE_PATH",
    path.join(env.storageRoot, "consent-settings.json")
  ),
  cookieConsents: resolveStoragePath(
    "COOKIE_CONSENTS_STORE_PATH",
    path.join(privateRoot, "cookie-consents.json")
  ),
  leads: resolveStoragePath(
    "LEADS_STORE_PATH",
    path.join(env.storageRoot, "leads.json")
  ),
  improvements: resolveStoragePath(
    "IMPROVEMENTS_STORE_PATH",
    path.join(privateRoot, "improvements.json")
  ),
  improvementAttachments: resolveStoragePath(
    "IMPROVEMENT_ATTACHMENTS_PATH",
    path.join(privateRoot, "improvement-attachments")
  ),
  trackingEvents: resolveStoragePath(
    "TRACKING_EVENTS_STORE_PATH",
    path.join(privateRoot, "tracking-events.json")
  ),
  auditLog: resolveStoragePath(
    "AUDIT_LOG_STORE_PATH",
    path.join(privateRoot, "audit-log.json")
  ),
  mediaLibrary: resolveStoragePath(
    "MEDIA_LIBRARY_STORE_PATH",
    path.join(env.storageRoot, "media-library.json")
  ),
  mediaSlots: resolveStoragePath(
    "MEDIA_SLOTS_STORE_PATH",
    path.join(env.storageRoot, "media-slots.json")
  ),
  mediaReplaceTransaction: resolveStoragePath(
    "MEDIA_REPLACE_TRANSACTION_PATH",
    path.join(privateRoot, "media-replace-transaction.json")
  ),
  rateLimits: resolveStoragePath(
    "CMS_RATE_LIMITS_STORE_PATH",
    path.join(privateRoot, "cms-rate-limits.json")
  ),
} as const;
