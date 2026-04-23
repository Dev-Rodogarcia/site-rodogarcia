import fs from "fs";
import path from "path";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  getClientIp,
  getRateLimitState,
  registerHit,
  RATE_LIMITS,
} from "@/lib/rateLimit";
import { sanitizeText, sanitizePath } from "@/lib/sanitize";
import { storagePaths } from "@/lib/storagePaths";
import { requireJsonContentType, requireSameOrigin } from "@/lib/api";

const ANALYTICS_FILE = storagePaths.analytics;

const ALLOWED_EVENTS = new Set([
  "click",
  "scroll",
  "form_submit",
  "download",
  "cta_click",
  "popup_open",
  "popup_submit",
  "page_view",
  "session_start",
  "session_end",
]);

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

function writeAnalytics(data: { events: unknown[]; sessions: unknown[] }) {
  fs.mkdirSync(path.dirname(ANALYTICS_FILE), { recursive: true });
  fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2), "utf8");
}

export async function POST(request: NextRequest) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const ctError = requireJsonContentType(request);
  if (ctError) {
    return NextResponse.json({ error: ctError }, { status: 415 });
  }

  const ip = getClientIp(request);
  const { windowMs, maxAttempts } = RATE_LIMITS.analytics;
  const state = getRateLimitState("analytics", ip, windowMs, maxAttempts);

  if (state.count >= maxAttempts) {
    return NextResponse.json(
      { error: "Limite de eventos excedido." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const eventType = sanitizeText(body.type ?? body.event, 40).toLowerCase();
  if (!ALLOWED_EVENTS.has(eventType)) {
    return NextResponse.json({ error: "Tipo de evento inválido." }, { status: 422 });
  }

  registerHit("analytics", ip, windowMs);

  const analytics = readAnalytics();
  analytics.events.push({
    id: `evt_${crypto.randomUUID().replace(/-/g, "")}`,
    type: eventType,
    page: sanitizePath(body.page),
    element: sanitizeText(body.element, 80),
    value: sanitizeText(String(body.value ?? ""), 120),
    sessionId: sanitizeText(body.sessionId, 64),
    timestamp: Date.now(),
  });

  // Keep last 10k events
  if (analytics.events.length > 10_000) {
    analytics.events = analytics.events.slice(-10_000);
  }

  writeAnalytics(analytics);
  return NextResponse.json({ message: "Evento registrado." }, { status: 201 });
}
