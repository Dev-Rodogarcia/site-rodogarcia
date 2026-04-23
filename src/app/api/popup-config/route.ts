import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import { requireJsonContentType, requireSameOrigin } from "@/lib/api";
import { verifyCsrfToken } from "@/lib/csrf";
import { sanitizeText } from "@/lib/sanitize";
import { storagePaths } from "@/lib/storagePaths";

const POPUP_CONFIG_FILE = storagePaths.popupConfig;

const DEFAULT_CONFIG = {
  enabled: true,
  title: "Antes de sair...",
  description: "Quer receber nosso conteudo gratuito antes de ir?",
  enableName: true,
  enableEmail: true,
  enablePhone: true,
  buttonText: "Receber conteudo",
  closeText: "Fechar",
  successMessage: "Recebemos seus dados. Em breve entraremos em contato.",
  delaySeconds: 10,
  cooldownHours: 24,
  maxShowsPerSession: 1,
  mobileScrollTrigger: true,
  mobileBackButtonTrigger: true,
};

type PopupConfig = typeof DEFAULT_CONFIG;

function readConfig(): PopupConfig {
  try {
    if (!fs.existsSync(POPUP_CONFIG_FILE)) return { ...DEFAULT_CONFIG };
    return {
      ...DEFAULT_CONFIG,
      ...(JSON.parse(fs.readFileSync(POPUP_CONFIG_FILE, "utf8")) as Partial<PopupConfig>),
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

function writeConfig(config: PopupConfig) {
  fs.mkdirSync(path.dirname(POPUP_CONFIG_FILE), { recursive: true });
  fs.writeFileSync(POPUP_CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
}

function sanitizeConfig(raw: Record<string, unknown>): PopupConfig {
  return {
    enabled: Boolean(raw.enabled ?? DEFAULT_CONFIG.enabled),
    title: sanitizeText(raw.title, 120) || DEFAULT_CONFIG.title,
    description: sanitizeText(raw.description, 280) || DEFAULT_CONFIG.description,
    enableName: Boolean(raw.enableName ?? DEFAULT_CONFIG.enableName),
    enableEmail: Boolean(raw.enableEmail ?? DEFAULT_CONFIG.enableEmail),
    enablePhone: Boolean(raw.enablePhone ?? DEFAULT_CONFIG.enablePhone),
    buttonText: sanitizeText(raw.buttonText, 60) || DEFAULT_CONFIG.buttonText,
    closeText: sanitizeText(raw.closeText, 40) || DEFAULT_CONFIG.closeText,
    successMessage:
      sanitizeText(raw.successMessage, 280) || DEFAULT_CONFIG.successMessage,
    delaySeconds: Math.min(
      Math.max(0, Number(raw.delaySeconds) || DEFAULT_CONFIG.delaySeconds),
      120
    ),
    cooldownHours: Math.min(
      Math.max(0, Number(raw.cooldownHours) || DEFAULT_CONFIG.cooldownHours),
      720
    ),
    maxShowsPerSession: Math.min(
      Math.max(1, Number(raw.maxShowsPerSession) || DEFAULT_CONFIG.maxShowsPerSession),
      10
    ),
    mobileScrollTrigger: Boolean(
      raw.mobileScrollTrigger ?? DEFAULT_CONFIG.mobileScrollTrigger
    ),
    mobileBackButtonTrigger: Boolean(
      raw.mobileBackButtonTrigger ?? DEFAULT_CONFIG.mobileBackButtonTrigger
    ),
  };
}

export async function GET() {
  return NextResponse.json({ config: readConfig() });
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
    return NextResponse.json({ error: "JSON invalido." }, { status: 400 });
  }

  const sanitized = sanitizeConfig({ ...readConfig(), ...body });
  writeConfig(sanitized);

  return NextResponse.json({
    message: "Configuracao do popup atualizada com sucesso.",
    config: sanitized,
  });
}
