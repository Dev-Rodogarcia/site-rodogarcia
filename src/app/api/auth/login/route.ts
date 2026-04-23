import { NextRequest, NextResponse } from "next/server";
import {
  findUserByEmail,
  verifyPassword,
  publicUser,
} from "@/lib/users";
import {
  createSession,
  setSessionCookieOnResponse,
} from "@/lib/session";
import {
  getClientIp,
  getRateLimitState,
  registerHit,
  clearKey,
  RATE_LIMITS,
} from "@/lib/rateLimit";
import { sanitizeEmail } from "@/lib/sanitize";
import { requireJsonContentType, requireSameOrigin } from "@/lib/api";

export async function POST(request: NextRequest) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const ctError = requireJsonContentType(request);
  if (ctError) {
    return NextResponse.json({ error: ctError }, { status: 415 });
  }

  const ip = getClientIp(request);
  const { windowMs, maxAttempts } = RATE_LIMITS.login;
  const state = getRateLimitState("login", ip, windowMs, maxAttempts);

  if (state.count >= maxAttempts) {
    return NextResponse.json(
      {
        error: "Muitas tentativas. Tente novamente em instantes.",
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

  const email = sanitizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    registerHit("login", ip, windowMs);
    return NextResponse.json(
      { error: "E-mail e senha são obrigatórios." },
      { status: 400 }
    );
  }

  const user = findUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    registerHit("login", ip, windowMs);
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
  }

  clearKey("login", ip);

  const created = createSession(user.id);
  const response = NextResponse.json(
    {
      message: "Autenticado com sucesso.",
      user: publicUser(user),
      csrfToken: created.csrfToken,
      expiresAt: created.expiresAt,
    },
    { status: 200 }
  );

  setSessionCookieOnResponse(response, created.sid);
  return response;
}
