import type { Request } from "express";
import {
  popupConfigRepository,
  popupEventRepository,
  popupLeadRepository,
} from "../repositories/jsonRepositories.js";
import { RATE_LIMITS, getClientIp, getRateLimitState, registerHit } from "../security/rateLimit.js";
import { generateId } from "../utils/ids.js";
import { HttpError } from "../utils/http.js";
import { sanitizeEmail, sanitizeMetadata, sanitizePath, sanitizeText } from "../utils/sanitize.js";
import { createLeadRecord } from "./leadsService.js";
import { recordAuditAction } from "./auditService.js";
import { recordTrackingEvent } from "./trackingService.js";
import { sanitizeInternalImageUrl } from "./mediaValidationService.js";

const DEFAULT_CONFIG = {
  enabled: true,
  title: "Antes de sair...",
  description: "Quer receber nosso conteúdo gratuito antes de ir?",
  enableName: true,
  enableEmail: true,
  enablePhone: true,
  buttonText: "Receber conteúdo",
  closeText: "Fechar",
  successMessage: "Recebemos seus dados. Em breve entraremos em contato.",
  badgeText: "Oferta especial",
  image: "",
  delaySeconds: 10,
  cooldownHours: 24,
  maxShowsPerSession: 1,
  mobileScrollTrigger: true,
  mobileBackButtonTrigger: true,
  desktop: {
    title: "Antes de sair...",
    description: "Receba uma proposta personalizada para sua operação logística.",
    image: "",
  },
  mobile: {
    title: "Antes de sair...",
    description: "Receba atendimento pelo celular em poucos segundos.",
    image: "",
    sheetTitle: "Fale com a Rodogarcia",
  },
};

const ALLOWED_EVENTS = new Set([
  "popup_shown",
  "popup_closed",
  "popup_submitted",
  "popup_ignored",
]);

type PopupConfig = typeof DEFAULT_CONFIG;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function configNumber(value: unknown, fallback: number, min: number, max: number) {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(Math.max(min, parsed), max) : fallback;
}

function configBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function storedImage(value: unknown, label: string) {
  try {
    return sanitizeInternalImageUrl(value, label);
  } catch {
    return "";
  }
}

function normalizePopupConfig(config: Record<string, unknown>, strictMedia: boolean): PopupConfig {
  const desktop = isRecord(config.desktop) ? config.desktop : {};
  const mobile = isRecord(config.mobile) ? config.mobile : {};
  const normalizeImage = strictMedia ? sanitizeInternalImageUrl : storedImage;
  return {
    enabled: configBoolean(config.enabled, DEFAULT_CONFIG.enabled),
    title: sanitizeText(config.title, 120) || DEFAULT_CONFIG.title,
    description: sanitizeText(config.description, 280) || DEFAULT_CONFIG.description,
    enableName: configBoolean(config.enableName, DEFAULT_CONFIG.enableName),
    enableEmail: configBoolean(config.enableEmail, DEFAULT_CONFIG.enableEmail),
    enablePhone: configBoolean(config.enablePhone, DEFAULT_CONFIG.enablePhone),
    buttonText: sanitizeText(config.buttonText, 60) || DEFAULT_CONFIG.buttonText,
    closeText: sanitizeText(config.closeText, 40) || DEFAULT_CONFIG.closeText,
    successMessage:
      sanitizeText(config.successMessage, 280) || DEFAULT_CONFIG.successMessage,
    badgeText: sanitizeText(config.badgeText, 60) || DEFAULT_CONFIG.badgeText,
    image: normalizeImage(config.image, "Popup: imagem padrão"),
    delaySeconds: configNumber(config.delaySeconds, DEFAULT_CONFIG.delaySeconds, 0, 120),
    cooldownHours: configNumber(config.cooldownHours, DEFAULT_CONFIG.cooldownHours, 0, 720),
    maxShowsPerSession: Math.round(
      configNumber(config.maxShowsPerSession, DEFAULT_CONFIG.maxShowsPerSession, 1, 10)
    ),
    mobileScrollTrigger: configBoolean(config.mobileScrollTrigger, DEFAULT_CONFIG.mobileScrollTrigger),
    mobileBackButtonTrigger: configBoolean(
      config.mobileBackButtonTrigger,
      DEFAULT_CONFIG.mobileBackButtonTrigger
    ),
    desktop: {
      title:
        sanitizeText(desktop.title, 120) ||
        sanitizeText(config.title, 120) ||
        DEFAULT_CONFIG.desktop.title,
      description:
        sanitizeText(desktop.description, 280) ||
        sanitizeText(config.description, 280) ||
        DEFAULT_CONFIG.desktop.description,
      image: normalizeImage(desktop.image, "Popup: imagem desktop"),
    },
    mobile: {
      title:
        sanitizeText(mobile.title, 120) ||
        sanitizeText(config.title, 120) ||
        DEFAULT_CONFIG.mobile.title,
      description:
        sanitizeText(mobile.description, 280) ||
        sanitizeText(config.description, 280) ||
        DEFAULT_CONFIG.mobile.description,
      image: normalizeImage(mobile.image, "Popup: imagem mobile"),
      sheetTitle:
        sanitizeText(mobile.sheetTitle, 80) ||
        DEFAULT_CONFIG.mobile.sheetTitle,
    },
  };
}

function withSafeContactField(config: PopupConfig): PopupConfig {
  if (config.enableName || config.enableEmail || config.enablePhone) return config;
  return { ...config, enableEmail: true };
}

export function readPopupConfig(): PopupConfig {
  const raw = popupConfigRepository.read<Record<string, unknown>>(DEFAULT_CONFIG);
  return withSafeContactField(normalizePopupConfig({
    ...DEFAULT_CONFIG,
    ...raw,
    desktop: { ...DEFAULT_CONFIG.desktop, ...(isRecord(raw.desktop) ? raw.desktop : {}) },
    mobile: { ...DEFAULT_CONFIG.mobile, ...(isRecord(raw.mobile) ? raw.mobile : {}) },
  }, false));
}

export function updatePopupConfig(raw: Record<string, unknown>, req?: Request): PopupConfig {
  const current = readPopupConfig();
  const sanitized = normalizePopupConfig({
    ...current,
    ...raw,
    desktop: { ...current.desktop, ...(isRecord(raw.desktop) ? raw.desktop : {}) },
    mobile: { ...current.mobile, ...(isRecord(raw.mobile) ? raw.mobile : {}) },
  }, true);
  if (!sanitized.enableName && !sanitized.enableEmail && !sanitized.enablePhone) {
    throw new HttpError(422, "Ative ao menos um campo de contato no popup.");
  }
  popupConfigRepository.write(sanitized);
  recordAuditAction({
    req,
    action: "popup.update",
    target: "exit-popup",
    metadata: { enabled: String(sanitized.enabled) },
  });
  return sanitized;
}

export function createLead(req: Request) {
  const ip = getClientIp(req);
  const { windowMs, maxAttempts } = RATE_LIMITS.lead;
  const state = getRateLimitState("lead", ip, windowMs, maxAttempts);
  if (state.count >= maxAttempts) {
    throw new HttpError(429, "Limite de envios atingido. Tente novamente mais tarde.");
  }

  const body = req.body as Record<string, unknown>;
  const name = sanitizeText(body.name, 80);
  const email = sanitizeEmail(body.email);
  const phone = sanitizeText(body.phone, 20);
  if (!name && !email && !phone) {
    throw new HttpError(422, "Informe ao menos um dado de contato.");
  }

  const leads = popupLeadRepository.read();
  const duplicate = email
    ? leads.find(
        (lead) =>
          lead.email === email &&
          Date.now() - Date.parse(String(lead.createdAt ?? "0")) < 10 * 60 * 1000
      )
    : null;
  if (duplicate) {
    throw new HttpError(409, "Este e-mail acabou de enviar um cadastro. Aguarde alguns minutos.");
  }

  registerHit("lead", ip, windowMs);
  const lead = createLeadRecord({
    req,
    source: sanitizeText(body.source, 40) || "exit-intent-popup",
    pagePath: body.pagePath,
    name,
    email,
    phone,
    sessionId: body.sessionId,
    metadata: { origin: sanitizeText(body.origin, 80) },
  });
  leads.push(lead);
  popupLeadRepository.write(leads);
  return lead;
}

export function listLeads() {
  return popupLeadRepository
    .read()
    .slice()
    .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
}

export function createPopupEvent(req: Request) {
  const ip = getClientIp(req);
  const { windowMs, maxAttempts } = RATE_LIMITS.popupEvent;
  const state = getRateLimitState("popupEvent", ip, windowMs, maxAttempts);
  if (state.count >= maxAttempts) {
    throw new HttpError(429, "Muitos eventos enviados em pouco tempo.");
  }

  const body = req.body as Record<string, unknown>;
  const eventName = sanitizeText(body.event, 40).toLowerCase();
  if (!ALLOWED_EVENTS.has(eventName)) {
    throw new HttpError(422, "Evento invalido para o popup.");
  }
  registerHit("popupEvent", ip, windowMs);

  const entry = {
    id: generateId("popup_event"),
    createdAt: new Date().toISOString(),
    event: eventName,
    pagePath: sanitizePath(body.pagePath ?? body.page),
    source: sanitizeText(body.source, 40),
    mobile: body.mobile === true,
    sessionId: sanitizeText(body.sessionId, 80),
    metadata: sanitizeMetadata(body.metadata, { maxEntries: 8, keyMaxLength: 40, valueMaxLength: 120 }),
  };
  const events = popupEventRepository.read();
  events.push(entry);
  popupEventRepository.write(events);
  recordTrackingEvent({
    event: eventName,
    page: entry.pagePath,
    source: entry.source || "exit-intent-popup",
    sessionId: entry.sessionId,
    device: entry.mobile ? "mobile" : "desktop",
    metadata: entry.metadata,
    req,
  });
  return entry;
}

function summarisePopupAnalytics(events: Record<string, unknown>[], days: number) {
  const safeDays = Math.max(1, Math.min(120, days || 30));
  const now = Date.now();
  const from = now - safeDays * 24 * 60 * 60 * 1000;
  const last7DaysFrom = now - 7 * 24 * 60 * 60 * 1000;
  const filtered = events.filter((event) => Date.parse(String(event.createdAt)) >= from);
  const last7Days = events.filter((event) => Date.parse(String(event.createdAt)) >= last7DaysFrom);
  const totals = {
    popup_shown: 0,
    popup_closed: 0,
    popup_submitted: 0,
    popup_ignored: 0,
  };
  const pageCounts = new Map<string, number>();

  for (const event of filtered) {
    const name = String(event.event ?? "");
    if (name in totals) totals[name as keyof typeof totals] += 1;
    const pagePath = String(event.pagePath || "/");
    pageCounts.set(pagePath, (pageCounts.get(pagePath) ?? 0) + 1);
  }

  return {
    totals,
    conversionRate:
      totals.popup_shown > 0 ? (totals.popup_submitted / totals.popup_shown) * 100 : 0,
    topPages: [...pageCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([pagePath, total]) => ({ pagePath, total })),
    last7Days: {
      events: last7Days.length,
      shown: last7Days.filter((event) => event.event === "popup_shown").length,
      submitted: last7Days.filter((event) => event.event === "popup_submitted").length,
    },
    window: {
      days: safeDays,
      from: new Date(from).toISOString(),
      to: new Date(now).toISOString(),
    },
  };
}

export function getPopupEvents(days: number) {
  const events = popupEventRepository
    .read()
    .slice()
    .sort((a, b) => Date.parse(String(b.createdAt)) - Date.parse(String(a.createdAt)));
  return {
    events: events.slice(0, 200),
    analytics: summarisePopupAnalytics(events, days),
  };
}
