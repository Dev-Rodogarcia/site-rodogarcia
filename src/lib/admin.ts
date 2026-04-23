import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { findUserById } from "@/lib/users";

export async function requireAdminSession() {
  const session = await getSessionFromRequest();

  if (!session) {
    return {
      error: NextResponse.json({ error: "Não autenticado." }, { status: 401 }),
    };
  }

  const user = findUserById(session.userId);
  if (!user || user.role !== "admin") {
    return {
      error: NextResponse.json(
        { error: "Acesso administrativo obrigatório." },
        { status: 403 }
      ),
    };
  }

  return { session, user };
}
