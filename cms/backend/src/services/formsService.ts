import type { Request } from "express";
import { contactRepository, quoteRepository } from "../repositories/jsonRepositories.js";
import { RATE_LIMITS, getClientIp, getRateLimitState, registerHit } from "../security/rateLimit.js";
import { generateId } from "../utils/ids.js";
import { HttpError } from "../utils/http.js";
import { sanitizeEmail, sanitizeText } from "../utils/sanitize.js";
import { createLeadRecord } from "./leadsService.js";
import { recordTrackingEvent } from "./trackingService.js";

function requestBody(req: Request): Record<string, unknown> {
  const body: unknown = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(422, "Envie um objeto JSON válido.");
  }
  return body as Record<string, unknown>;
}

function enforceLeadRateLimit(req: Request, namespace: string) {
  const ip = getClientIp(req);
  const { windowMs, maxAttempts } = RATE_LIMITS.lead;
  const state = getRateLimitState(namespace, ip, windowMs, maxAttempts);
  if (state.count >= maxAttempts) {
    throw new HttpError(429, "Limite de envios atingido. Tente novamente mais tarde.");
  }
  registerHit(namespace, ip, windowMs);
}

export function createContact(req: Request) {
  enforceLeadRateLimit(req, "contact");
  const body = requestBody(req);
  const entry = {
    id: generateId("contact"),
    createdAt: new Date().toISOString(),
    name: sanitizeText(body.name, 80),
    email: sanitizeEmail(body.email),
    phone: sanitizeText(body.phone, 20),
    subject: sanitizeText(body.subject, 120),
    message: sanitizeText(body.message, 2000),
    userAgent: sanitizeText(req.header("user-agent") ?? "", 240),
  };

  if (!entry.name || !entry.email || !entry.message) {
    throw new HttpError(422, "Nome, e-mail e mensagem são obrigatórios.");
  }

  const contacts = contactRepository.read();
  contacts.push(entry);
  contactRepository.write(contacts);
  createLeadRecord({
    id: entry.id,
    req,
    source: "contact-form",
    pagePath: "/fale-conosco",
    name: entry.name,
    email: entry.email,
    phone: entry.phone,
    metadata: { subject: entry.subject, contactId: entry.id },
  });
  recordTrackingEvent({
    event: "form_submit",
    page: "/fale-conosco",
    source: "contact-form",
    metadata: { contactId: entry.id },
    req,
  });
  return entry;
}

export function listContacts() {
  return contactRepository
    .read()
    .slice()
    .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
}

export function createQuote(req: Request) {
  enforceLeadRateLimit(req, "quote");
  const body = requestBody(req);
  const entry = {
    id: generateId("quote"),
    createdAt: new Date().toISOString(),
    name: sanitizeText(body.name, 80),
    company: sanitizeText(body.company, 120),
    email: sanitizeEmail(body.email),
    phone: sanitizeText(body.phone, 20),
    origin: sanitizeText(body.origin, 120),
    destination: sanitizeText(body.destination, 120),
    cargoType: sanitizeText(body.cargoType, 80),
    weight: sanitizeText(body.weight, 40),
    notes: sanitizeText(body.notes, 1000),
    userAgent: sanitizeText(req.header("user-agent") ?? "", 240),
  };

  if (!entry.name || !entry.email || !entry.origin || !entry.destination) {
    throw new HttpError(422, "Nome, e-mail, origem e destino são obrigatórios.");
  }

  const quotes = quoteRepository.read();
  quotes.push(entry);
  quoteRepository.write(quotes);
  createLeadRecord({
    id: entry.id,
    req,
    source: "quote-form",
    pagePath: "/cotacao",
    name: entry.name,
    email: entry.email,
    phone: entry.phone,
    company: entry.company,
    metadata: {
      origin: entry.origin,
      destination: entry.destination,
      quoteId: entry.id,
    },
  });
  recordTrackingEvent({
    event: "form_submit",
    page: "/cotacao",
    source: "quote-form",
    metadata: { quoteId: entry.id },
    req,
  });
  return entry;
}

export function listQuotes() {
  return quoteRepository
    .read()
    .slice()
    .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
}
