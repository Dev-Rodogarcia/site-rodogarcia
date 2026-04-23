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
import { sanitizeText, sanitizeUrl, sanitizePath, sanitizeEmail } from "@/lib/sanitize";
import { storagePaths } from "@/lib/storagePaths";
import { requireJsonContentType, requireSameOrigin } from "@/lib/api";

const LEADS_FILE = storagePaths.popupLeads;

function readLeads(): unknown[] {
  try {
    if (!fs.existsSync(LEADS_FILE)) return [];
    return JSON.parse(fs.readFileSync(LEADS_FILE, "utf8")) as unknown[];
  } catch {
    return [];
  }
}

function writeLeads(leads: unknown[]) {
  fs.mkdirSync(path.dirname(LEADS_FILE), { recursive: true });
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), "utf8");
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
  const state = getRateLimitState("lead", ip, windowMs, maxAttempts);

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
  const email = sanitizeEmail(body.email);
  const phone = sanitizeText(body.phone, 20);

  if (!name && !email && !phone) {
    return NextResponse.json(
      { error: "Informe ao menos um dado de contato." },
      { status: 422 }
    );
  }

  const leads = readLeads() as Array<{ email?: string; createdAt?: string }>;
  const duplicate = email
    ? leads.find(
        (l) =>
          l.email === email &&
          Date.now() - Date.parse(l.createdAt ?? "0") < 10 * 60 * 1000
      )
    : null;

  if (duplicate) {
    return NextResponse.json(
      {
        error:
          "Este e-mail acabou de enviar um cadastro. Aguarde alguns minutos.",
      },
      { status: 409 }
    );
  }

  registerHit("lead", ip, windowMs);

  const lead = {
    id: `lead_${crypto.randomUUID().replace(/-/g, "")}`,
    createdAt: new Date().toISOString(),
    source: sanitizeText(body.source, 40) || "exit-intent",
    pagePath: sanitizePath(body.pagePath),
    name,
    email,
    phone,
    userAgent: sanitizeText(
      request.headers.get("user-agent") ?? "",
      240
    ),
  };

  leads.push(lead);
  writeLeads(leads);

  return NextResponse.json(
    { message: "Lead recebido com sucesso.", lead: { id: lead.id, createdAt: lead.createdAt } },
    { status: 201 }
  );
}

export async function GET() {
  const adminSession = await requireAdminSession();
  if ("error" in adminSession) return adminSession.error;

  const leads = readLeads() as Array<{ createdAt?: string }>;
  const sorted = leads
    .slice()
    .sort((a, b) =>
      String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""))
    );

  return NextResponse.json({ leads: sorted });
}
