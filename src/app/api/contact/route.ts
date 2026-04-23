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

const CONTACTS_FILE = storagePaths.contacts;

function readContacts(): unknown[] {
  try {
    if (!fs.existsSync(CONTACTS_FILE)) return [];
    return JSON.parse(fs.readFileSync(CONTACTS_FILE, "utf8")) as unknown[];
  } catch {
    return [];
  }
}

function writeContacts(contacts: unknown[]) {
  fs.mkdirSync(path.dirname(CONTACTS_FILE), { recursive: true });
  fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2), "utf8");
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
  const state = getRateLimitState("contact", ip, windowMs, maxAttempts);

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
  const subject = sanitizeText(body.subject, 120);
  const message = sanitizeText(body.message, 2000);

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Nome, e-mail e mensagem são obrigatórios." },
      { status: 422 }
    );
  }

  registerHit("contact", ip, windowMs);

  const entry = {
    id: `contact_${crypto.randomUUID().replace(/-/g, "")}`,
    createdAt: new Date().toISOString(),
    name,
    email,
    phone,
    subject,
    message,
    userAgent: sanitizeText(request.headers.get("user-agent") ?? "", 240),
  };

  const contacts = readContacts();
  contacts.push(entry);
  writeContacts(contacts);

  return NextResponse.json(
    { message: "Mensagem recebida com sucesso.", id: entry.id },
    { status: 201 }
  );
}

export async function GET() {
  const adminSession = await requireAdminSession();
  if ("error" in adminSession) return adminSession.error;

  const contacts = readContacts() as Array<{ createdAt?: string }>;
  const sorted = contacts
    .slice()
    .sort((a, b) =>
      String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""))
    );

  return NextResponse.json({ contacts: sorted });
}
