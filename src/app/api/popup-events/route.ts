import fs from "fs";
import path from "path";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import { requireJsonContentType, requireSameOrigin } from "@/lib/api";
import {
  getClientIp,
  getRateLimitState,
  RATE_LIMITS,
  registerHit,
} from "@/lib/rateLimit";
import { sanitizePath, sanitizeText } from "@/lib/sanitize";
import { storagePaths } from "@/lib/storagePaths";

const EVENTS_FILE = storagePaths.popupEvents;

const ALLOWED_EVENTS = new Set([
  "popup_shown",
  "popup_closed",
  "popup_submitted",
  "popup_ignored",
]);

interface PopupEvent {
  id: string;
  createdAt: string;
  event: string;
  pagePath: string;
  source?: string;
  mobile?: boolean;
  sessionId?: string;
  metadata?: Record<string, string>;
}

function readEvents(): PopupEvent[] {
  try {
    if (!fs.existsSync(EVENTS_FILE)) return [];
    return JSON.parse(fs.readFileSync(EVENTS_FILE, "utf8")) as PopupEvent[];
  } catch {
    return [];
  }
}

function writeEvents(events: PopupEvent[]) {
  fs.mkdirSync(path.dirname(EVENTS_FILE), { recursive: true });
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), "utf8");
}

function sanitizeMetadata(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return undefined;
  }

  const entries = Object.entries(input as Record<string, unknown>)
    .slice(0, 8)
    .map(([key, value]) => [sanitizeText(key, 40), sanitizeText(String(value ?? ""), 120)])
    .filter(([key, value]) => key && value);

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

function summarisePopupAnalytics(events: PopupEvent[], days: number) {
  const safeDays = Math.max(1, Math.min(120, days || 30));
  const now = Date.now();
  const from = now - safeDays * 24 * 60 * 60 * 1000;
  const last7DaysFrom = now - 7 * 24 * 60 * 60 * 1000;

  const filtered = events.filter((event) => Date.parse(event.createdAt) >= from);
  const last7Days = events.filter((event) => Date.parse(event.createdAt) >= last7DaysFrom);

  const totals = {
    popup_shown: 0,
    popup_closed: 0,
    popup_submitted: 0,
    popup_ignored: 0,
  };

  const pageCounts = new Map<string, number>();

  for (const event of filtered) {
    if (event.event in totals) {
      totals[event.event as keyof typeof totals] += 1;
    }

    const pagePath = event.pagePath || "/";
    pageCounts.set(pagePath, (pageCounts.get(pagePath) ?? 0) + 1);
  }

  return {
    totals,
    conversionRate:
      totals.popup_shown > 0
        ? (totals.popup_submitted / totals.popup_shown) * 100
        : 0,
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

export async function GET(request: NextRequest) {
  const adminSession = await requireAdminSession();
  if ("error" in adminSession) return adminSession.error;

  const days = Number(request.nextUrl.searchParams.get("days") ?? "30");
  const events = readEvents()
    .slice()
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  return NextResponse.json({
    events: events.slice(0, 200),
    analytics: summarisePopupAnalytics(events, days),
  });
}

export async function POST(request: NextRequest) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const ctError = requireJsonContentType(request);
  if (ctError) {
    return NextResponse.json({ error: ctError }, { status: 415 });
  }

  const ip = getClientIp(request);
  const { windowMs, maxAttempts } = RATE_LIMITS.popupEvent;
  const state = getRateLimitState("popupEvent", ip, windowMs, maxAttempts);

  if (state.count >= maxAttempts) {
    return NextResponse.json(
      {
        error: "Muitos eventos enviados em pouco tempo.",
        retryAfterMs: Math.max(0, state.resetAt - Date.now()),
      },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalido." }, { status: 400 });
  }

  const eventName = sanitizeText(body.event, 40).toLowerCase();
  if (!ALLOWED_EVENTS.has(eventName)) {
    return NextResponse.json(
      { error: "Evento invalido para o popup." },
      { status: 422 }
    );
  }

  registerHit("popupEvent", ip, windowMs);

  const events = readEvents();
  const entry: PopupEvent = {
    id: `popup_event_${crypto.randomUUID().replace(/-/g, "")}`,
    createdAt: new Date().toISOString(),
    event: eventName,
    pagePath: sanitizePath(body.pagePath ?? body.page),
    source: sanitizeText(body.source, 40),
    mobile: Boolean(body.mobile),
    sessionId: sanitizeText(body.sessionId, 80),
    metadata: sanitizeMetadata(body.metadata),
  };

  events.push(entry);
  writeEvents(events);

  return NextResponse.json({ message: "Evento registrado." }, { status: 201 });
}
