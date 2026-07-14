import type { Request } from "express";
import {
  consentSettingsRepository,
  cookieConsentRepository,
} from "../repositories/jsonRepositories.js";
import { getClientIp } from "../security/rateLimit.js";
import { generateId } from "../utils/ids.js";
import { maskIpAddress, sanitizeText } from "../utils/sanitize.js";
import { recordAuditAction } from "./auditService.js";

const DEFAULT_CONSENT = {
  enabled: true,
  version: 1,
  title: "Usamos cookies para melhorar sua experiencia",
  description:
    "Utilizamos cookies necessários e, com sua permissão, cookies de analytics e marketing para melhorar o site.",
  acceptAllLabel: "Aceitar todos",
  rejectLabel: "Recusar opcionais",
  preferencesLabel: "Preferencias",
  saveLabel: "Salvar preferencias",
  style: "floating",
  behavior: {
    requireExplicitChoice: true,
    blockAnalyticsUntilConsent: true,
    reopenOnVersionChange: true,
  },
  desktop: {
    position: "bottom-center",
    compact: true,
  },
  mobile: {
    position: "bottom-sheet",
    compact: false,
  },
  categories: [
    {
      key: "necessary",
      label: "Necessarios",
      description: "Essenciais para segurança, login e funcionamento do site.",
      required: true,
      enabledByDefault: true,
    },
    {
      key: "analytics",
      label: "Analytics",
      description: "Ajudam a entender visitas, páginas acessadas e desempenho.",
      required: false,
      enabledByDefault: false,
    },
    {
      key: "marketing",
      label: "Marketing",
      description: "Permitem medir campanhas e acoes comerciais.",
      required: false,
      enabledByDefault: false,
    },
  ],
};

function normalizeCategory(input: Record<string, unknown>) {
  const key = sanitizeText(input.key, 40).toLowerCase();
  const required = key === "necessary";
  return {
    key: key || "custom",
    label: sanitizeText(input.label, 80) || key || "Categoria",
    description: sanitizeText(input.description, 240),
    required,
    enabledByDefault: required,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function booleanOr(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizeCategories(value: unknown, fallback = DEFAULT_CONSENT.categories) {
  const normalized = Array.isArray(value)
    ? value
        .filter(isRecord)
        .map(normalizeCategory)
        .filter((item, index, all) => all.findIndex((candidate) => candidate.key === item.key) === index)
    : fallback.map((item) => normalizeCategory(item));
  const necessary = normalized.find((item) => item.key === "necessary") ??
    normalizeCategory(DEFAULT_CONSENT.categories[0]);
  return [necessary, ...normalized.filter((item) => item.key !== "necessary")].slice(0, 8);
}

export function readConsentSettings() {
  const raw = consentSettingsRepository.read<typeof DEFAULT_CONSENT>(DEFAULT_CONSENT);
  const behavior: Record<string, unknown> = isRecord(raw.behavior) ? raw.behavior : {};
  const desktop: Record<string, unknown> = isRecord(raw.desktop) ? raw.desktop : {};
  const mobile: Record<string, unknown> = isRecord(raw.mobile) ? raw.mobile : {};
  const mobilePosition = sanitizeText(mobile.position, 40);
  return {
    enabled: booleanOr(raw.enabled, DEFAULT_CONSENT.enabled),
    version: Math.max(1, Math.min(999, Math.round(Number(raw.version) || DEFAULT_CONSENT.version))),
    title: sanitizeText(raw.title, 120) || DEFAULT_CONSENT.title,
    description: sanitizeText(raw.description, 400) || DEFAULT_CONSENT.description,
    acceptAllLabel: sanitizeText(raw.acceptAllLabel, 60) || DEFAULT_CONSENT.acceptAllLabel,
    rejectLabel: sanitizeText(raw.rejectLabel, 60) || DEFAULT_CONSENT.rejectLabel,
    preferencesLabel: sanitizeText(raw.preferencesLabel, 60) || DEFAULT_CONSENT.preferencesLabel,
    saveLabel: sanitizeText(raw.saveLabel, 60) || DEFAULT_CONSENT.saveLabel,
    style: "floating",
    behavior: {
      requireExplicitChoice: booleanOr(
        behavior.requireExplicitChoice,
        DEFAULT_CONSENT.behavior.requireExplicitChoice
      ),
      blockAnalyticsUntilConsent: true,
      reopenOnVersionChange: booleanOr(
        behavior.reopenOnVersionChange,
        DEFAULT_CONSENT.behavior.reopenOnVersionChange
      ),
    },
    desktop: {
      position: "bottom-center",
      compact: booleanOr(desktop.compact, DEFAULT_CONSENT.desktop.compact),
    },
    mobile: {
      position: ["bottom-sheet", "center-modal"].includes(mobilePosition)
        ? mobilePosition
        : DEFAULT_CONSENT.mobile.position,
      compact: booleanOr(mobile.compact, DEFAULT_CONSENT.mobile.compact),
    },
    categories: normalizeCategories(raw.categories),
  };
}

export function updateConsentSettings(req: Request | undefined, body: Record<string, unknown>) {
  const current = readConsentSettings();
  const behavior = isRecord(body.behavior) ? body.behavior : {};
  const mobile = isRecord(body.mobile) ? body.mobile : {};
  const mobilePosition = sanitizeText(mobile.position, 40);
  const next = {
    ...current,
    enabled: booleanOr(body.enabled, current.enabled),
    version: Math.max(1, Math.min(999, Math.round(Number(body.version) || current.version))),
    title: sanitizeText(body.title, 120) || current.title,
    description: sanitizeText(body.description, 400) || current.description,
    acceptAllLabel: sanitizeText(body.acceptAllLabel, 60) || current.acceptAllLabel,
    rejectLabel: sanitizeText(body.rejectLabel, 60) || current.rejectLabel,
    preferencesLabel: sanitizeText(body.preferencesLabel, 60) || current.preferencesLabel,
    saveLabel: sanitizeText(body.saveLabel, 60) || current.saveLabel,
    style: "floating",
    behavior: {
      requireExplicitChoice: booleanOr(
        behavior.requireExplicitChoice,
        current.behavior.requireExplicitChoice
      ),
      blockAnalyticsUntilConsent: true,
      reopenOnVersionChange: booleanOr(
        behavior.reopenOnVersionChange,
        current.behavior.reopenOnVersionChange
      ),
    },
    desktop: {
      ...current.desktop,
      position: "bottom-center",
    },
    mobile: {
      position: ["bottom-sheet", "center-modal"].includes(mobilePosition)
        ? mobilePosition
        : current.mobile.position,
      compact: booleanOr(mobile.compact, current.mobile.compact),
    },
    categories: Array.isArray(body.categories)
      ? normalizeCategories(body.categories, current.categories)
      : current.categories,
    updatedAt: new Date().toISOString(),
  };
  consentSettingsRepository.write(next);
  recordAuditAction({
    req,
    action: "consent.update",
    target: "cookies",
    metadata: { version: String(next.version), enabled: String(next.enabled) },
  });
  return next;
}

function deviceFromUserAgent(userAgent: string) {
  if (/ipad|tablet/i.test(userAgent)) return "tablet";
  if (/mobile|android|iphone/i.test(userAgent)) return "mobile";
  return userAgent ? "desktop" : "";
}

function sanitizeBooleanMap(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  return Object.fromEntries(
    Object.entries(input as Record<string, unknown>)
      .slice(0, 12)
      .map(([key, value]) => [sanitizeText(key, 40).toLowerCase(), value === true])
      .filter(([key]) => Boolean(key))
  );
}

function sanitizeStringArray(input: unknown, maxItems = 12) {
  if (!Array.isArray(input)) return [];
  return input
    .slice(0, maxItems)
    .map((item) => sanitizeText(item, 120))
    .filter(Boolean);
}

function sanitizeConsentDecision(value: unknown) {
  const decision = sanitizeText(value, 40).toLowerCase();
  if (["accepted", "rejected", "custom", "partial", "revoked"].includes(decision)) {
    return decision;
  }
  return "custom";
}

function resolveConsentCategories(
  settings: ReturnType<typeof readConsentSettings>,
  decision: string,
  input: unknown
) {
  const requested = sanitizeBooleanMap(input);
  return Object.fromEntries(
    settings.categories.map((category) => {
      if (category.required) return [category.key, true];
      if (decision === "accepted") return [category.key, true];
      if (decision === "rejected" || decision === "revoked") return [category.key, false];
      return [category.key, requested[category.key] === true];
    })
  );
}

export function recordCookieConsent(req: Request) {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const userAgent = sanitizeText(req.header("user-agent") ?? "", 300);
  const decision = sanitizeConsentDecision(body.decision);
  const settings = readConsentSettings();
  const categories = resolveConsentCategories(settings, decision, body.categories);
  const entry = {
    id: generateId("cookie_consent"),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    decision,
    status: decision,
    type: decision,
    version: settings.version,
    consentTextVersion: String(settings.version),
    categories,
    sessionId: sanitizeText(body.sessionId, 100),
    userAgent,
    device: sanitizeText(body.device, 40) || deviceFromUserAgent(userAgent),
    approximateLocation:
      body.locationAllowed === true ? sanitizeText(body.approximateLocation, 120) : "",
    ipMasked: maskIpAddress(getClientIp(req)),
    scriptsLoaded: sanitizeStringArray(body.scriptsLoaded),
    scriptsFailed: sanitizeStringArray(body.scriptsFailed),
    logs: [
      {
        at: new Date().toISOString(),
        action: decision === "revoked" ? "consent.revoked" : "consent.saved",
        version: String(settings.version),
      },
    ],
  };

  const consents = cookieConsentRepository.read();
  consents.push(entry);
  cookieConsentRepository.write(consents.slice(-50_000));
  return entry;
}

export function listCookieConsents(filters: Record<string, unknown> = {}) {
  const status = sanitizeText(filters.status ?? filters.decision, 40).toLowerCase();
  const device = sanitizeText(filters.device, 40).toLowerCase();
  const from = Date.parse(String(filters.from ?? ""));
  const to = Date.parse(String(filters.to ?? ""));
  const page = Math.max(1, Math.round(Number(filters.page) || 1));
  const pageSize = Math.min(Math.max(Math.round(Number(filters.pageSize ?? filters.limit) || 50), 1), 250);

  const filtered = cookieConsentRepository
    .read()
    .filter((entry) => {
      const createdAt = Date.parse(String(entry.createdAt ?? ""));
      if (status && String(entry.status ?? entry.decision ?? "").toLowerCase() !== status) return false;
      if (device && String(entry.device ?? "").toLowerCase() !== device) return false;
      if (Number.isFinite(from) && createdAt < from) return false;
      if (Number.isFinite(to) && createdAt > to) return false;
      return true;
    })
    .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));

  const start = (page - 1) * pageSize;
  return {
    consents: filtered.slice(start, start + pageSize),
    total: filtered.length,
    page,
    pageSize,
  };
}
