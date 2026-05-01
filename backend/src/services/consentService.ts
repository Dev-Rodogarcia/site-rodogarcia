import type { Request } from "express";
import { consentSettingsRepository } from "../repositories/jsonRepositories.js";
import { sanitizeText } from "../utils/sanitize.js";
import { recordAuditAction } from "./auditService.js";

const DEFAULT_CONSENT = {
  enabled: true,
  version: 1,
  title: "Usamos cookies para melhorar sua experiencia",
  description:
    "Utilizamos cookies necessarios e, com sua permissao, cookies de analytics e marketing para melhorar o site.",
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
      description: "Essenciais para seguranca, login e funcionamento do site.",
      required: true,
      enabledByDefault: true,
    },
    {
      key: "analytics",
      label: "Analytics",
      description: "Ajudam a entender visitas, paginas acessadas e desempenho.",
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
  return {
    key: key || "custom",
    label: sanitizeText(input.label, 80) || key || "Categoria",
    description: sanitizeText(input.description, 240),
    required: Boolean(input.required),
    enabledByDefault: Boolean(input.enabledByDefault || input.required),
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
      ? raw.categories.map((item) => normalizeCategory(item as Record<string, unknown>)).slice(0, 8)
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
