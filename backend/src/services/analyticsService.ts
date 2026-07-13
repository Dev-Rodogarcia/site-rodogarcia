import { z } from "zod";
import type { Request } from "express";
import {
  analyticsConfigRepository,
  trackingEventRepository,
} from "../repositories/jsonRepositories.js";
import { RATE_LIMITS, getClientIp, getRateLimitState, registerHit } from "../security/rateLimit.js";
import { generateId } from "../utils/ids.js";
import { HttpError } from "../utils/http.js";
import { sanitizePath, sanitizeText } from "../utils/sanitize.js";
import { recordTrackingEvent } from "./trackingService.js";

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
  "page_view",
  "session_start",
  "session_end",
  "time_on_page",
]);

const analyticsConfigSchema = z.object({
  siteUrl: z.string().max(240).optional(),
  consent: z
    .object({
      bannerEnabled: z.boolean().optional(),
      version: z.number().int().min(1).max(999).optional(),
      categories: z
        .object({
          analytics: z.boolean().optional(),
          marketing: z.boolean().optional(),
          performance: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
  tracking: z
    .object({
      enabled: z.boolean().optional(),
      heartbeatSeconds: z.number().int().min(10).max(600).optional(),
      scrollMilestones: z.array(z.number().int().min(1).max(100)).max(8).optional(),
    })
    .optional(),
  providers: z
    .object({
      ga4: z.object({ enabled: z.boolean().optional(), measurementId: z.string().max(40).optional() }).optional(),
      clarity: z.object({ enabled: z.boolean().optional(), projectId: z.string().max(80).optional() }).optional(),
      sentry: z.object({ enabled: z.boolean().optional(), dsn: z.string().max(400).optional() }).optional(),
    })
    .optional(),
  seo: z
    .object({
      enableSearchConsole: z.boolean().optional(),
      propertyUrl: z.string().max(240).optional(),
      sitemapUrl: z.string().max(240).optional(),
    })
    .optional(),
});

type AnalyticsEvent = {
  id: string;
  type: string;
  event: string;
  page: string;
  element: string;
  value: string;
  sessionId: string;
  userId?: string;
  timestamp: number;
  createdAt: string;
};

function readEvents(): AnalyticsEvent[] {
  return trackingEventRepository.read() as AnalyticsEvent[];
}

export function readAnalyticsConfig() {
  const parsed = analyticsConfigSchema.safeParse(analyticsConfigRepository.read());
  return parsed.success ? parsed.data : {};
}

export function readPublicAnalyticsConfig() {
  const config = readAnalyticsConfig();
  return {
    tracking: config.tracking ?? {},
    providers: {
      ga4:
        config.providers?.ga4?.enabled && config.providers.ga4.measurementId
          ? { enabled: true, measurementId: config.providers.ga4.measurementId }
          : { enabled: false, measurementId: "" },
      clarity:
        config.providers?.clarity?.enabled && config.providers.clarity.projectId
          ? { enabled: true, projectId: config.providers.clarity.projectId }
          : { enabled: false, projectId: "" },
    },
  };
}

export function updateAnalyticsConfig(body: Record<string, unknown>) {
  const parsed = analyticsConfigSchema.safeParse({
    ...readAnalyticsConfig(),
    ...body,
  });
  if (!parsed.success) {
    throw new HttpError(422, "Configuracao de analytics invalida.");
  }
  analyticsConfigRepository.write(parsed.data);
  return parsed.data;
}

export function createAnalyticsEvent(req: Request) {
  const ip = getClientIp(req);
  const { windowMs, maxAttempts } = RATE_LIMITS.analytics;
  const state = getRateLimitState("analytics", ip, windowMs, maxAttempts);
  if (state.count >= maxAttempts) {
    throw new HttpError(429, "Limite de eventos excedido.");
  }

  const body = req.body as Record<string, unknown>;
  const eventType = sanitizeText(body.type ?? body.event, 40).toLowerCase();
  if (!ALLOWED_EVENTS.has(eventType)) {
    throw new HttpError(422, "Tipo de evento invalido.");
  }

  registerHit("analytics", ip, windowMs);
  recordTrackingEvent({
    event: eventType,
    page: body.page,
    source: sanitizeText(body.source, 80) || "site",
    sessionId: body.sessionId,
    userId: body.userId,
    element: body.element,
    value: body.value,
    category: body.category,
    consent: body.consent,
    metadata: body.metadata,
    req,
  });
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getEventName(event: Record<string, unknown>) {
  return String(event.event ?? event.type ?? "");
}

function getEventTime(event: Record<string, unknown>) {
  const timestamp = event.timestamp;
  if (typeof timestamp === "number" && Number.isFinite(timestamp)) return timestamp;
  const parsedTimestamp = Date.parse(String(timestamp ?? ""));
  if (Number.isFinite(parsedTimestamp)) return parsedTimestamp;
  const parsedCreatedAt = Date.parse(String(event.createdAt ?? ""));
  return Number.isFinite(parsedCreatedAt) ? parsedCreatedAt : 0;
}

function getSessionDurationMs(events: Record<string, unknown>[]) {
  const times = events.map(getEventTime).filter((value) => Number.isFinite(value));
  if (times.length < 2) return 0;
  return Math.max(...times) - Math.min(...times);
}

function getNumericEventValue(event: Record<string, unknown>) {
  const value = Number(event.value);
  return Number.isFinite(value) ? value : null;
}

export function getAnalyticsStats(days: number) {
  const safeDays = Math.max(1, Math.min(365, days || 30));
  const now = Date.now();
  const from = now - safeDays * 24 * 60 * 60 * 1000;
  const events = readEvents()
    .map((item, index) => ({
      ...item,
      id: String(item.id ?? `analytics-${index + 1}`),
      event: getEventName(item),
      type: getEventName(item),
      page: sanitizePath(item.page) || "/",
      sessionId: sanitizeText(item.sessionId, 64),
      userId: sanitizeText(item.userId, 64),
      timestamp: getEventTime(item),
    }))
    .filter((event) => event.timestamp >= from)
    .sort((a, b) => b.timestamp - a.timestamp);

  const eventCounts = events.reduce<Record<string, number>>((acc, event) => {
    acc[event.event] = (acc[event.event] ?? 0) + 1;
    return acc;
  }, {});

  const eventsBySession = new Map<string, typeof events>();
  for (const event of events) {
    const key = event.sessionId || event.userId || `anonymous-${event.id}`;
    const list = eventsBySession.get(key) ?? [];
    list.push(event);
    eventsBySession.set(key, list);
  }

  const sessionEntries = [...eventsBySession.entries()];
  const sessionCount = sessionEntries.length;
  const bouncedSessions = sessionEntries.filter(([, sessionEvents]) => {
    const pageViews = sessionEvents.filter((event) => event.event === "page_view");
    return pageViews.length <= 1;
  }).length;
  const averageSessionDuration =
    average(sessionEntries.map(([, sessionEvents]) => getSessionDurationMs(sessionEvents))) / 1000;

  const pageCounts = new Map<string, number>();
  for (const event of events.filter((item) => item.event === "page_view")) {
    pageCounts.set(event.page, (pageCounts.get(event.page) ?? 0) + 1);
  }
  const topPages = [...pageCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([path, views]) => ({ path, page: path, views }));

  const conversions = {
    forms: eventCounts.form_submit ?? 0,
    downloads: eventCounts.download ?? 0,
    popupSubmissions: (eventCounts.popup_submit ?? 0) + (eventCounts.popup_submitted ?? 0),
    leads:
      (eventCounts.popup_submit ?? 0) +
      (eventCounts.popup_submitted ?? 0) +
      (eventCounts.form_submit ?? 0),
    popupOpen: (eventCounts.popup_open ?? 0) + (eventCounts.popup_shown ?? 0),
  };
  const totalConversions =
    conversions.forms + conversions.downloads + conversions.popupSubmissions;
  const scrollValues = events
    .filter((event) => event.event === "scroll")
    .map(getNumericEventValue)
    .filter((value): value is number => value !== null && value >= 0 && value <= 100);
  const clickAreaCounts = new Map<string, number>();
  for (const event of events.filter(
    (item) => item.event === "click" || item.event === "cta_click"
  )) {
    const area = sanitizeText(event.element || event.value || event.page, 80) || "Sem identificacao";
    clickAreaCounts.set(area, (clickAreaCounts.get(area) ?? 0) + 1);
  }
  const heatmap = {
    avgScrollPercent: average(scrollValues),
    topClickAreas: [...clickAreaCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([area, total]) => ({ area, total })),
  };
  const recentEvents = events.slice(0, 80).map((event) => ({
    id: event.id,
    event: event.event,
    type: event.type,
    page: event.page,
    sessionId: event.sessionId,
    userId: event.userId,
    timestamp: event.timestamp,
    createdAt: new Date(event.timestamp).toISOString(),
  }));

  return {
    totalPageViews: eventCounts.page_view ?? 0,
    uniqueSessions: sessionCount,
    topPages,
    recentEvents,
    stats: {
      generatedAt: new Date(now).toISOString(),
      metrics: {
        visitors: sessionCount,
        sessions: sessionCount,
        bounceRate: sessionCount > 0 ? (bouncedSessions / sessionCount) * 100 : 0,
        avgTimeSeconds: averageSessionDuration,
        averageSessionDuration,
        pageViews: eventCounts.page_view ?? 0,
      },
      heatmap,
      eventCounts,
      conversions: {
        ...conversions,
        total: totalConversions,
        conversionRate: sessionCount > 0 ? (totalConversions / sessionCount) * 100 : 0,
      },
      totalConversions,
      eventsTable: recentEvents,
      window: {
        days: safeDays,
        from: new Date(from).toISOString(),
        to: new Date(now).toISOString(),
      },
    },
  };
}
