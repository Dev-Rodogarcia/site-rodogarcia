import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { findUserById, publicUser, hasAnyUser } from "@/lib/users";

export async function GET() {
  const sessionData = await getSessionFromRequest();
  const setupRequired = !hasAnyUser();

  if (!sessionData) {
    return NextResponse.json({ authenticated: false, setupRequired });
  }

  const user = findUserById(sessionData.userId);
  if (!user) {
    return NextResponse.json({ authenticated: false, setupRequired });
  }

  return NextResponse.json({
    authenticated: true,
    user: publicUser(user),
    csrfToken: sessionData.csrfToken,
    expiresAt: sessionData.expiresAt,
    setupRequired,
  });
}
