import type { Request } from "express";
import {
  trackingEventRepository,
} from "../repositories/jsonRepositories.js";
import { RATE_LIMITS, getClientIp, getRateLimitState, registerHit } from "../security/rateLimit.js";
import { generateId } from "../utils/ids.js";
import { HttpError } from "../utils/http.js";
import { maskIpAddress, sanitizeMetadata, sanitizePath, sanitizeText } from "../utils/sanitize.js";

const ALLOWED_EVENTS = new Set([
  "click",
  "scroll",
  "form_submit",
  "form_start",
  "form_success",
  "form_fail",
  "download",
  "outbound_link",
  "cta_click",
  "popup_open",
  "popup_shown",
  "popup_submit",
  "popup_submitted",
  "popup_closed",
  "popup_ignored",
  "page_view",
  "session_start",
  "session_end",
  "time_on_page",
  "cookie_accept",
  "cookie_reject",
  "cookie_preferences",
  "lead_created",
]);

export function normalizeEventTime(event: Record<string, unknown>) {
  const value = event.timestamp ?? event.createdAt;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Date.parse(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : Date.now();
}

export function recordTrackingEvent(input: {
  event: unknown;
  page?: unknown;
  pagePath?: unknown;
  source?: unknown;
  sessionId?: unknown;
  element?: unknown;
  value?: unknown;
  category?: unknown;
  consent?: unknown;
  device?: unknown;
  metadata?: unknown;
  req?: Request;
}) {
  const eventName = sanitizeText(input.event, 60).toLowerCase();
  if (!ALLOWED_EVENTS.has(eventName)) {
    throw new HttpError(422, "Tipo de evento invalido.");
  }

  const createdAt = new Date().toISOString();
  const entry = {
    id: generateId("tracking"),
    event: eventName,
    type: eventName,
    page: sanitizePath(input.page ?? input.pagePath) || "/",
    source: sanitizeText(input.source, 80),
    sessionId: sanitizeText(input.sessionId, 80),
    element: sanitizeText(input.element, 120),
    value: sanitizeText(input.value, 180),
    category: sanitizeText(input.category, 60),
    consent: sanitizeText(input.consent, 60),
    device: sanitizeText(input.device, 60),
    metadata: sanitizeMetadata(input.metadata),
    userAgent: input.req ? sanitizeText(input.req.header("user-agent") ?? "", 240) : "",
    ip: input.req ? maskIpAddress(getClientIp(input.req)) : "",
    timestamp: Date.now(),
    createdAt,
  };

  const events = trackingEventRepository.read();
  events.push(entry);
  trackingEventRepository.write(events.slice(-25_000));
  return entry;
}

export function createPublicTrackingEvent(req: Request) {
  const ip = getClientIp(req);
  const { windowMs, maxAttempts } = RATE_LIMITS.analytics;
  const state = getRateLimitState("tracking", ip, windowMs, maxAttempts);
  if (state.count >= maxAttempts) {
    throw new HttpError(429, "Limite de eventos excedido.");
  }
  registerHit("tracking", ip, windowMs);
  const body = (req.body ?? {}) as Record<string, unknown>;
  return recordTrackingEvent({
    event: body.event,
    page: body.page,
    pagePath: body.pagePath,
    source: body.source,
    sessionId: body.sessionId,
    element: body.element,
    value: body.value,
    category: body.category,
    consent: body.consent,
    device: body.device,
    metadata: body.metadata,
    req,
  });
}

function getFilteredTrackingEvents(filters: Record<string, unknown> = {}) {
  const eventFilter = sanitizeText(filters.event ?? filters.type, 60).toLowerCase();
  const pageFilter = sanitizePath(filters.page);
  const sourceFilter = sanitizeText(filters.source, 80).toLowerCase();
  const from = Date.parse(String(filters.from ?? ""));
  const to = Date.parse(String(filters.to ?? ""));

  const ownEvents = trackingEventRepository.read();

  return ownEvents
    .map((storedEvent) => {
      const { userId: _userId, ...event } = storedEvent;
      const timestamp = normalizeEventTime(event);
      return {
        ...event,
        event: sanitizeText(event.event ?? event.type, 60).toLowerCase(),
        type: sanitizeText(event.type ?? event.event, 60).toLowerCase(),
        page: sanitizePath(event.page ?? event.pagePath) || "/",
        source: sanitizeText(event.source, 80),
        sessionId: sanitizeText(event.sessionId, 80),
        timestamp,
        createdAt: new Date(timestamp).toISOString(),
      };
    })
    .filter((event) => {
      if (eventFilter && event.event !== eventFilter) return false;
      if (pageFilter && event.page !== pageFilter) return false;
      if (sourceFilter && !String(event.source ?? "").toLowerCase().includes(sourceFilter)) {
        return false;
      }
      if (Number.isFinite(from) && event.timestamp < from) return false;
      if (Number.isFinite(to) && event.timestamp > to) return false;
      return true;
    })
    .sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
}

export function listTrackingEvents(filters: Record<string, unknown> = {}) {
  const limit = Math.min(Math.max(Number(filters.limit) || 180, 1), 1000);
  return getFilteredTrackingEvents(filters).slice(0, limit);
}

export function getTrackingSummary(filters: Record<string, unknown> = {}) {
  const events = getFilteredTrackingEvents(filters);
  const byType = events.reduce<Record<string, number>>((acc, event) => {
    acc[event.event] = (acc[event.event] ?? 0) + 1;
    return acc;
  }, {});
  const byPage = events.reduce<Record<string, number>>((acc, event) => {
    acc[event.page] = (acc[event.page] ?? 0) + 1;
    return acc;
  }, {});

  return {
    total: events.length,
    byType,
    topPages: Object.entries(byPage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([page, total]) => ({ page, total })),
    recentEvents: events.slice(0, 120),
  };
}
