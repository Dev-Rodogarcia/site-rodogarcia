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
    position: "bottom-right",
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

export function readConsentSettings() {
  const raw = consentSettingsRepository.read<typeof DEFAULT_CONSENT>(DEFAULT_CONSENT);
  return {
    ...DEFAULT_CONSENT,
    ...raw,
    behavior: { ...DEFAULT_CONSENT.behavior, ...(raw.behavior ?? {}) },
    desktop: { ...DEFAULT_CONSENT.desktop, ...(raw.desktop ?? {}) },
    mobile: { ...DEFAULT_CONSENT.mobile, ...(raw.mobile ?? {}) },
    categories: Array.isArray(raw.categories)
      ? raw.categories
          .flatMap((item) =>
            item && typeof item === "object" && !Array.isArray(item)
              ? [normalizeCategory(item as Record<string, unknown>)]
              : []
          )
          .filter((item, index, all) => all.findIndex((candidate) => candidate.key === item.key) === index)
          .slice(0, 8)
      : DEFAULT_CONSENT.categories,
  };
}

export function updateConsentSettings(req: Request | undefined, body: Record<string, unknown>) {
  const current = readConsentSettings();
  const next = {
    ...current,
    enabled: body.enabled === undefined ? current.enabled : Boolean(body.enabled),
    version: Math.max(1, Math.min(999, Math.round(Number(body.version) || current.version))),
    title: sanitizeText(body.title, 120) || current.title,
    description: sanitizeText(body.description, 400) || current.description,
    acceptAllLabel: sanitizeText(body.acceptAllLabel, 60) || current.acceptAllLabel,
    rejectLabel: sanitizeText(body.rejectLabel, 60) || current.rejectLabel,
    preferencesLabel: sanitizeText(body.preferencesLabel, 60) || current.preferencesLabel,
    saveLabel: sanitizeText(body.saveLabel, 60) || current.saveLabel,
    style: sanitizeText(body.style, 40) || current.style,
    behavior: {
      ...current.behavior,
      ...((body.behavior && typeof body.behavior === "object") ? body.behavior : {}),
    },
    desktop: {
      ...current.desktop,
      ...((body.desktop && typeof body.desktop === "object") ? body.desktop : {}),
    },
    mobile: {
      ...current.mobile,
      ...((body.mobile && typeof body.mobile === "object") ? body.mobile : {}),
    },
    categories: Array.isArray(body.categories)
      ? body.categories
          .map((item) => normalizeCategory(item as Record<string, unknown>))
          .slice(0, 8)
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
      .map(([key, value]) => [sanitizeText(key, 40).toLowerCase(), Boolean(value)])
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
