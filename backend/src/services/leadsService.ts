import type { Request } from "express";
import {
  contactRepository,
  leadRepository,
  popupLeadRepository,
  quoteRepository,
} from "../repositories/jsonRepositories.js";
import { generateId } from "../utils/ids.js";
import { sanitizeEmail, sanitizePath, sanitizeText } from "../utils/sanitize.js";
import { recordTrackingEvent } from "./trackingService.js";

export type LeadStatus = "new" | "contacted" | "qualified" | "archived";

function getDeviceFromRequest(req?: Request) {
  const userAgent = req?.header("user-agent") ?? "";
  if (/mobile|android|iphone|ipad/i.test(userAgent)) return "mobile";
  if (/tablet|ipad/i.test(userAgent)) return "tablet";
  return userAgent ? "desktop" : "";
}

function normalizeLegacyLead(input: Record<string, unknown>, sourceFallback: string) {
  const createdAt = String(input.createdAt ?? new Date().toISOString());
  return {
    id: String(input.id ?? generateId("lead")),
    createdAt,
    updatedAt: String(input.updatedAt ?? createdAt),
    source: sanitizeText(input.source, 60) || sourceFallback,
    pagePath: sanitizePath(input.pagePath ?? input.page) || "/",
    name: sanitizeText(input.name, 100),
    email: sanitizeEmail(input.email),
    phone: sanitizeText(input.phone, 30),
    company: sanitizeText(input.company, 140),
    sessionId: sanitizeText(input.sessionId, 100),
    device: sanitizeText(input.device, 40),
    status: sanitizeText(input.status, 40) || "new",
    metadata:
      input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata)
        ? input.metadata
        : undefined,
  };
}

export function createLeadRecord({
  req,
  source,
  pagePath,
  name,
  email,
  phone,
  company,
  sessionId,
  metadata,
}: {
  req?: Request;
  source: string;
  pagePath?: unknown;
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  company?: unknown;
  sessionId?: unknown;
  metadata?: Record<string, unknown>;
}) {
  const now = new Date().toISOString();
  const lead = {
    id: generateId("lead"),
    createdAt: now,
    updatedAt: now,
    source: sanitizeText(source, 60),
    pagePath: sanitizePath(pagePath) || "/",
    name: sanitizeText(name, 100),
    email: sanitizeEmail(email),
    phone: sanitizeText(phone, 30),
    company: sanitizeText(company, 140),
    sessionId: sanitizeText(sessionId, 100),
    device: getDeviceFromRequest(req),
    status: "new" satisfies LeadStatus,
    metadata: metadata
      ? Object.fromEntries(
          Object.entries(metadata)
            .slice(0, 12)
            .map(([key, value]) => [
              sanitizeText(key, 60),
              sanitizeText(String(value ?? ""), 180),
            ])
            .filter(([key, value]) => key && value)
        )
      : undefined,
  };

  const leads = leadRepository.read();
  leads.push(lead);
  leadRepository.write(leads);
  recordTrackingEvent({
    event: "lead_created",
    page: lead.pagePath,
    source: lead.source,
    sessionId: lead.sessionId,
    device: lead.device,
    metadata: { leadId: lead.id, hasEmail: String(Boolean(lead.email)) },
    req,
  });
  return lead;
}

export function listUnifiedLeads(filters: Record<string, unknown> = {}) {
  const q = sanitizeText(filters.q, 120).toLowerCase();
  const source = sanitizeText(filters.source, 60).toLowerCase();
  const status = sanitizeText(filters.status, 40).toLowerCase();
  const from = Date.parse(String(filters.from ?? ""));
  const to = Date.parse(String(filters.to ?? ""));
  const limit = Math.min(Math.max(Number(filters.limit) || 200, 1), 1000);

  const central = leadRepository.read().map((lead) => normalizeLegacyLead(lead, "cms"));
  const popup = popupLeadRepository
    .read()
    .map((lead) => normalizeLegacyLead(lead, "exit-intent-popup"));
  const contacts = contactRepository
    .read()
    .map((lead) => normalizeLegacyLead({ ...lead, source: "contact-form" }, "contact-form"));
  const quotes = quoteRepository
    .read()
    .map((lead) => normalizeLegacyLead({ ...lead, source: "quote-form" }, "quote-form"));

  const unique = new Map<string, ReturnType<typeof normalizeLegacyLead>>();
  for (const lead of [...central, ...popup, ...contacts, ...quotes]) {
    unique.set(lead.id, lead);
  }

  return [...unique.values()]
    .filter((lead) => {
      const createdAt = Date.parse(String(lead.createdAt ?? ""));
      const haystack = [
        lead.name,
        lead.email,
        lead.phone,
        lead.company,
        lead.pagePath,
        lead.source,
      ]
        .join(" ")
        .toLowerCase();
      if (q && !haystack.includes(q)) return false;
      if (source && !lead.source.toLowerCase().includes(source)) return false;
      if (status && lead.status.toLowerCase() !== status) return false;
      if (Number.isFinite(from) && createdAt < from) return false;
      if (Number.isFinite(to) && createdAt > to) return false;
      return true;
    })
    .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")))
    .slice(0, limit);
}
