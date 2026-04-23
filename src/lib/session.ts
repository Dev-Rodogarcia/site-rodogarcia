/**
 * Gerenciamento de sessão — portado de server.js
 *
 * Persiste sessões em sessions.json (resolve bug de in-memory Map no Vercel).
 * Cookie: sid | httpOnly | SameSite=Strict | Secure (prod)
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { generateCsrfToken } from "./csrf";
import type { Session } from "@/types/auth";
import { storagePaths } from "./storagePaths";

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const IS_PROD = process.env.NODE_ENV === "production";

const SESSIONS_FILE = storagePaths.sessions;

type SessionStore = Record<string, Session>;

function readStore(): SessionStore {
  try {
    if (!fs.existsSync(SESSIONS_FILE)) return {};
    return JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf8")) as SessionStore;
  } catch {
    return {};
  }
}

function writeStore(store: SessionStore): void {
  try {
    fs.mkdirSync(path.dirname(SESSIONS_FILE), { recursive: true });
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(store, null, 2), "utf8");
  } catch {
    // best-effort
  }
}

function pruneExpired(store: SessionStore): SessionStore {
  const now = Date.now();
  const pruned: SessionStore = {};
  for (const [k, v] of Object.entries(store)) {
    if (v.expiresAt > now) pruned[k] = v;
  }
  return pruned;
}

export function createSession(userId: string): { sid: string } & Session {
  const sid = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  const session: Session = {
    id: sid,
    userId,
    csrfToken: generateCsrfToken(),
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  };

  const store = pruneExpired(readStore());
  store[sid] = session;
  writeStore(store);

  return { sid, ...session };
}

export function getSession(sid: string): Session | null {
  const now = Date.now();
  const store = readStore();
  const session = store[sid];

  if (!session) return null;
  if (session.expiresAt <= now) {
    delete store[sid];
    writeStore(store);
    return null;
  }

  // Slide expiry
  session.expiresAt = now + SESSION_TTL_MS;
  store[sid] = session;
  writeStore(store);

  return session;
}

export function destroySession(sid: string): void {
  const store = readStore();
  delete store[sid];
  writeStore(store);
}

/** Lê o cookie sid e retorna a sessão válida, ou null. */
export async function getSessionFromRequest(): Promise<
  (Session & { sid: string }) | null
> {
  const cookieStore = await cookies();
  const sid = cookieStore.get("sid")?.value;
  if (!sid) return null;

  const session = getSession(sid);
  if (!session) return null;

  return { sid, ...session };
}

/** Seta o cookie sid na resposta (httpOnly, SameSite=Strict). */
export function setSessionCookieOnResponse(
  response: NextResponse,
  sid: string
): void {
  response.cookies.set("sid", sid, {
    httpOnly: true,
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
    sameSite: "strict",
    secure: IS_PROD,
    path: "/",
  });
}

/** Limpa o cookie sid na resposta. */
export function clearSessionCookieOnResponse(response: NextResponse): void {
  response.cookies.set("sid", "", {
    httpOnly: true,
    maxAge: 0,
    sameSite: "strict",
    secure: IS_PROD,
    path: "/",
  });
}
