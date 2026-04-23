import fs from "fs";
import path from "path";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import {
  getClientIp,
  getRateLimitState,
  registerHit,
  RATE_LIMITS,
} from "@/lib/rateLimit";
import { requireAdminSession } from "@/lib/admin";
import { sanitizeText, sanitizeEmail } from "@/lib/sanitize";
import { storagePaths } from "@/lib/storagePaths";
import { requireJsonContentType, requireSameOrigin } from "@/lib/api";

const QUOTES_FILE = storagePaths.quotes;

function readQuotes(): unknown[] {
  try {
    if (!fs.existsSync(QUOTES_FILE)) return [];
    return JSON.parse(fs.readFileSync(QUOTES_FILE, "utf8")) as unknown[];
  } catch {
    return [];
  }
}

function writeQuotes(quotes: unknown[]) {
  fs.mkdirSync(path.dirname(QUOTES_FILE), { recursive: true });
  fs.writeFileSync(QUOTES_FILE, JSON.stringify(quotes, null, 2), "utf8");
}

export async function POST(request: NextRequest) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const ctError = requireJsonContentType(request);
  if (ctError) {
    return NextResponse.json({ error: ctError }, { status: 415 });
  }

  const ip = getClientIp(request);
  const { windowMs, maxAttempts } = RATE_LIMITS.lead;
  const state = getRateLimitState("quote", ip, windowMs, maxAttempts);

  if (state.count >= maxAttempts) {
    return NextResponse.json(
      {
        error: "Limite de envios atingido. Tente novamente mais tarde.",
        retryAfterMs: Math.max(0, state.resetAt - Date.now()),
      },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const name = sanitizeText(body.name, 80);
  const company = sanitizeText(body.company, 120);
  const email = sanitizeEmail(body.email);
  const phone = sanitizeText(body.phone, 20);
  const origin = sanitizeText(body.origin, 120);
  const destination = sanitizeText(body.destination, 120);
  const cargoType = sanitizeText(body.cargoType, 80);
  const weight = sanitizeText(body.weight, 40);
  const notes = sanitizeText(body.notes, 1000);

  if (!name || !email || !origin || !destination) {
    return NextResponse.json(
      { error: "Nome, e-mail, origem e destino são obrigatórios." },
      { status: 422 }
    );
  }

  registerHit("quote", ip, windowMs);

  const entry = {
    id: `quote_${crypto.randomUUID().replace(/-/g, "")}`,
    createdAt: new Date().toISOString(),
    name,
    company,
    email,
    phone,
    origin,
    destination,
    cargoType,
    weight,
    notes,
    userAgent: sanitizeText(request.headers.get("user-agent") ?? "", 240),
  };

  const quotes = readQuotes();
  quotes.push(entry);
  writeQuotes(quotes);

  return NextResponse.json(
    { message: "Solicitação de cotação recebida.", id: entry.id },
    { status: 201 }
  );
}

export async function GET() {
  const adminSession = await requireAdminSession();
  if ("error" in adminSession) return adminSession.error;

  const quotes = readQuotes() as Array<{ createdAt?: string }>;
  const sorted = quotes
    .slice()
    .sort((a, b) =>
      String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""))
    );

  return NextResponse.json({ quotes: sorted });
}
