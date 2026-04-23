import { NextRequest, NextResponse } from "next/server";
import {
  getSessionFromRequest,
  destroySession,
  clearSessionCookieOnResponse,
} from "@/lib/session";
import { verifyCsrfToken } from "@/lib/csrf";
import { requireSameOrigin } from "@/lib/api";

export async function POST(request: NextRequest) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const sessionData = await getSessionFromRequest();

  if (sessionData) {
    const csrfError = verifyCsrfToken(request, sessionData.csrfToken);
    if (csrfError) return csrfError;
    destroySession(sessionData.sid);
  }

  const response = NextResponse.json({ message: "Sessão encerrada." });
  clearSessionCookieOnResponse(response);
  return response;
}
