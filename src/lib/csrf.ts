/**
 * CSRF token — portado de server.js
 * Double-submit pattern: token gerado na criação da sessão,
 * enviado como header X-CSRF-Token em todas as requisições mutantes.
 */

import crypto from "crypto";
import { NextResponse } from "next/server";

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verifica o CSRF token do header X-CSRF-Token contra o token armazenado na sessão.
 * Retorna null se válido, ou uma NextResponse 403 se inválido.
 */
export function verifyCsrfToken(
  request: Request,
  sessionCsrfToken: string
): NextResponse | null {
  const headerToken = request.headers.get("x-csrf-token") ?? "";

  if (!headerToken || !timingSafeEqual(headerToken, sessionCsrfToken)) {
    return NextResponse.json(
      { error: "Token CSRF inválido ou ausente." },
      { status: 403 }
    );
  }

  return null;
}
