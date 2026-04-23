import { NextRequest, NextResponse } from "next/server";
import {
  findUserByEmail,
  createUser,
  publicUser,
  hasAnyUser,
  validatePasswordStrength,
} from "@/lib/users";
import {
  createSession,
  setSessionCookieOnResponse,
} from "@/lib/session";
import { requireAdminSession } from "@/lib/admin";
import { verifyCsrfToken } from "@/lib/csrf";
import { sanitizeEmail, sanitizeText } from "@/lib/sanitize";
import { requireJsonContentType, requireSameOrigin } from "@/lib/api";

const ADMIN_SETUP_CODE = process.env.ADMIN_SETUP_CODE ?? "";

export async function POST(request: NextRequest) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const ctError = requireJsonContentType(request);
  if (ctError) {
    return NextResponse.json({ error: ctError }, { status: 415 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const name = sanitizeText(body.name, 80);
  const email = sanitizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  const confirmPassword =
    typeof body.confirmPassword === "string" ? body.confirmPassword : "";
  const setupCode =
    typeof body.setupCode === "string" ? body.setupCode.trim() : "";

  if (!name || !email || !password || !confirmPassword) {
    return NextResponse.json(
      { error: "Preencha nome, e-mail e senha." },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return NextResponse.json(
      { error: "As senhas não conferem." },
      { status: 400 }
    );
  }

  const passwordErrors = validatePasswordStrength(password);
  if (passwordErrors.length > 0) {
    return NextResponse.json({ error: passwordErrors[0] }, { status: 400 });
  }

  if (findUserByEmail(email)) {
    return NextResponse.json(
      { error: "Já existe conta com este e-mail." },
      { status: 409 }
    );
  }

  const alreadyHasUsers = hasAnyUser();

  if (alreadyHasUsers) {
    const adminSession = await requireAdminSession();
    if ("error" in adminSession) return adminSession.error;

    const csrfError = verifyCsrfToken(request, adminSession.session.csrfToken);
    if (csrfError) return csrfError;
  } else {
    // Cadastro inicial: requer setup code
    if (!setupCode || setupCode !== ADMIN_SETUP_CODE) {
      return NextResponse.json(
        { error: "Código de configuração inválido para cadastro inicial." },
        { status: 403 }
      );
    }
  }

  const newUser = createUser({ email, password, name, role: "admin" });

  if (!alreadyHasUsers) {
    const created = createSession(newUser.id);
    const response = NextResponse.json(
      {
        message: "Conta inicial criada e sessão iniciada.",
        user: publicUser(newUser),
        csrfToken: created.csrfToken,
        expiresAt: created.expiresAt,
      },
      { status: 201 }
    );
    setSessionCookieOnResponse(response, created.sid);
    return response;
  }

  return NextResponse.json(
    { message: "Conta criada com sucesso.", user: publicUser(newUser) },
    { status: 201 }
  );
}
