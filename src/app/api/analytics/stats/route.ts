import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import { storagePaths } from "@/lib/storagePaths";

const ANALYTICS_FILE = storagePaths.analytics;

interface NormalizedAnalyticsEvent {
  id: string;
  event: string;
  page: string;
  sessionId: string;
  userId: string;
  element: string;
  value: string;
  timestamp: number;
  metadata: Record<string, unknown>;
}

function readAnalytics() {
  try {
    if (!fs.existsSync(ANALYTICS_FILE)) return { events: [], sessions: [] };
    return JSON.parse(fs.readFileSync(ANALYTICS_FILE, "utf8")) as {
      events: unknown[];
      sessions: unknown[];
    };
  } catch {
    return { events: [], sessions: [] };
  }
}

function parseTimestamp(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;

    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return Date.now();
}

function normalizeEvent(raw: unknown, index: number): NormalizedAnalyticsEvent {
  const item = (raw ?? {}) as Record<string, unknown>;

  return {
    id: String(item.id ?? `analytics-${index + 1}`),
    event: String(item.event ?? item.type ?? "").trim().toLowerCase(),
    page: String(item.page ?? "/").trim() || "/",
    sessionId: String(item.sessionId ?? "").trim(),
    userId: String(item.userId ?? "").trim(),
    element: String(item.element ?? "").trim(),
    value: String(item.value ?? "").trim(),
    timestamp: parseTimestamp(item.timestamp ?? item.createdAt),
    metadata:
      item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata)
        ? (item.metadata as Record<string, unknown>)
        : {},
  };
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function getScrollPercent(event: NormalizedAnalyticsEvent) {
  const percent = Number(event.metadata.percent ?? event.value);
  return Number.isFinite(percent) ? Math.min(100, Math.max(0, percent)) : null;
}

function getSessionDurationMs(events: NormalizedAnalyticsEvent[]) {
  const explicitDuration = events
    .filter((event) => event.event === "session_end")
    .map((event) => Number(event.metadata.durationMs))
    .find((value) => Number.isFinite(value) && value > 0);

  if (
    typeof explicitDuration === "number" &&
    Number.isFinite(explicitDuration) &&
    explicitDuration > 0
  ) {
    return explicitDuration;
  }

  if (events.length === 0) return 0;
  return Math.max(0, events[events.length - 1].timestamp - events[0].timestamp);
}

export async function GET(request: NextRequest) {
  const adminSession = await requireAdminSession();
  if ("error" in adminSession) return adminSession.error;

  const days = Math.max(1, Math.min(120, Number(request.nextUrl.searchParams.get("days") ?? 30)));
  const now = Date.now();
  const from = now - days * 24 * 60 * 60 * 1000;

  const analytics = readAnalytics();
  const normalizedEvents = (analytics.events ?? [])
    .map(normalizeEvent)
    .filter((event) => event.event && event.timestamp >= from)
    .sort((a, b) => a.timestamp - b.timestamp);

  const eventsBySession = new Map<string, NormalizedAnalyticsEvent[]>();
  const pageViews = normalizedEvents.filter((event) => event.event === "page_view");
  const eventCounts = normalizedEvents.reduce<Record<string, number>>((acc, event) => {
    acc[event.event] = (acc[event.event] ?? 0) + 1;
    return acc;
  }, {});

  for (const event of normalizedEvents) {
    const key = event.sessionId || event.userId || `anonymous-${event.id}`;
    const bucket = eventsBySession.get(key) ?? [];
    bucket.push(event);
    eventsBySession.set(key, bucket);
  }

  const sessionEntries = [...eventsBySession.entries()];
  const sessionCount = sessionEntries.length;
  const bouncedSessions = sessionEntries.filter(([, events]) => {
    const pageViewsInSession = events.filter((event) => event.event === "page_view").length;
    return pageViewsInSession <= 1;
  }).length;

  const avgTimeSeconds =
    average(sessionEntries.map(([, events]) => getSessionDurationMs(events))) / 1000;

  const topPagesMap = new Map<string, number>();
  for (const event of pageViews) {
    topPagesMap.set(event.page, (topPagesMap.get(event.page) ?? 0) + 1);
  }

  const topPages = [...topPagesMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([page, views]) => ({ page, views }));

  const clickableEvents = normalizedEvents.filter((event) =>
    ["click", "cta_click", "download", "form_submit", "popup_open"].includes(event.event)
  );
  const clickAreas = clickableEvents.reduce<Map<string, number>>((acc, event) => {
    const area =
      String(event.metadata.label ?? event.metadata.area ?? event.element ?? event.value).trim() ||
      "sem-identificacao";
    acc.set(area, (acc.get(area) ?? 0) + 1);
    return acc;
  }, new Map());

  const scrollValues = normalizedEvents
    .filter((event) => event.event === "scroll")
    .map(getScrollPercent)
    .filter((value): value is number => value !== null);

  const uniqueVisitors = new Set(
    normalizedEvents
      .map((event) => event.userId || event.sessionId)
      .filter(Boolean)
  ).size;

  const conversions = {
    forms: eventCounts.form_submit ?? 0,
    downloads: eventCounts.download ?? 0,
    leads: (eventCounts.popup_submit ?? 0) + (eventCounts.form_submit ?? 0),
    popupOpen: (eventCounts.popup_open ?? 0) + (eventCounts.popup_shown ?? 0),
  };
  const totalConversions =
    conversions.forms + conversions.downloads + conversions.leads + conversions.popupOpen;

  const recentEvents = normalizedEvents
    .slice(-50)
    .reverse()
    .map((event) => ({
      id: event.id,
      type: event.event,
      page: event.page,
      element: event.element || String(event.metadata.label ?? ""),
      sessionId: event.sessionId,
      userId: event.userId,
      timestamp: event.timestamp,
    }));

  const eventsTable = normalizedEvents
    .slice(-120)
    .reverse()
    .map((event) => ({
      id: event.id,
      event: event.event,
      page: event.page,
      timestamp: event.timestamp,
      userId: event.userId,
      sessionId: event.sessionId,
    }));

  const conversionRate = pageViews.length > 0 ? (totalConversions / pageViews.length) * 100 : 0;

  return NextResponse.json({
    totalPageViews: pageViews.length,
    uniqueSessions: sessionCount,
    topPages,
    recentEvents,
    period: {
      days,
      from: new Date(from).toISOString(),
      to: new Date(now).toISOString(),
    },
    stats: {
      generatedAt: new Date().toISOString(),
      metrics: {
        visitors: uniqueVisitors,
        sessions: sessionCount,
        bounceRate: sessionCount > 0 ? (bouncedSessions / sessionCount) * 100 : 0,
        avgTimeSeconds,
      },
      topPages: topPages.map((item) => ({ page: item.page, total: item.views })),
      heatmap: {
        avgScrollPercent: average(scrollValues),
        topClickAreas: [...clickAreas.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([area, total]) => ({ area, total })),
      },
      conversions: {
        ...conversions,
        total: totalConversions,
        conversionRate,
      },
      eventCounts,
      eventsTable,
    },
  });
}
