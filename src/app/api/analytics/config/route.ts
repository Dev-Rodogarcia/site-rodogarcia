import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { publicUser } from "@/lib/users";
import { requireAdminSession } from "@/lib/admin";
import { verifyCsrfToken } from "@/lib/csrf";
import { storagePaths } from "@/lib/storagePaths";
import { requireJsonContentType, requireSameOrigin } from "@/lib/api";

const ANALYTICS_CONFIG_FILE = storagePaths.analyticsConfig;

function readConfig(): Record<string, unknown> {
  try {
    if (!fs.existsSync(ANALYTICS_CONFIG_FILE)) return {};
    return JSON.parse(
      fs.readFileSync(ANALYTICS_CONFIG_FILE, "utf8")
    ) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function writeConfig(data: Record<string, unknown>) {
  fs.mkdirSync(path.dirname(ANALYTICS_CONFIG_FILE), { recursive: true });
  fs.writeFileSync(
    ANALYTICS_CONFIG_FILE,
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

export async function GET() {
  const adminSession = await requireAdminSession();
  if ("error" in adminSession) return adminSession.error;

  return NextResponse.json({
    user: publicUser(adminSession.user),
    csrfToken: adminSession.session.csrfToken,
    config: readConfig(),
  });
}

export async function POST(request: NextRequest) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const ctError = requireJsonContentType(request);
  if (ctError) {
    return NextResponse.json({ error: ctError }, { status: 415 });
  }

  const adminSession = await requireAdminSession();
  if ("error" in adminSession) return adminSession.error;

  const csrfError = verifyCsrfToken(request, adminSession.session.csrfToken);
  if (csrfError) return csrfError;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const merged = { ...readConfig(), ...body };
  writeConfig(merged);

  return NextResponse.json({
    message: "Configuração de analytics atualizada com sucesso.",
    config: merged,
  });
}
