import crypto from "node:crypto";
import type { Response } from "express";
import { env } from "../config/env.js";
import { sessionRepository } from "../repositories/sessionRepository.js";
import type { Session } from "../types/auth.js";
import { generateCsrfToken } from "./csrf.js";

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
export const SESSION_COOKIE = "sid";

export function createSession(userId: string): Session {
  const now = Date.now();
  const session: Session = {
    id: crypto.randomBytes(32).toString("hex"),
    userId,
    csrfToken: generateCsrfToken(),
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
  };
  sessionRepository.save(session);
  return session;
}

export function getSession(id: string): Session | null {
  const session = sessionRepository.find(id);
  if (!session) return null;
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  sessionRepository.save(session);
  return session;
}

export function destroySession(id: string): void {
  sessionRepository.delete(id);
}

export function setSessionCookie(res: Response, session: Session): void {
  res.cookie(SESSION_COOKIE, session.id, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "strict",
    // Sem Max-Age/Expires: o navegador descarta o identificador ao encerrar a sessão.
    // A validade de oito horas continua sendo aplicada no servidor como defesa adicional.
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.cookie(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
}
