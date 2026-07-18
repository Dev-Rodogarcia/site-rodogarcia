import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import dotenv from "dotenv";

const require = createRequire(import.meta.url);
const ffmpegStaticPath = require("ffmpeg-static") as string | null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "../..");
const repoRoot = path.resolve(backendRoot, "..");

dotenv.config({ path: path.join(repoRoot, ".env") });

function numberEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

function parseOrigins(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseTrustProxy(value: string | undefined): boolean | number | string {
  const normalized = value?.trim().toLowerCase();
  if (!normalized || normalized === "false" || normalized === "0") return false;
  if (normalized === "true") return true;
  const hops = Number(normalized);
  return Number.isInteger(hops) && hops >= 0 ? hops : value!.trim();
}

function isLocalHostname(hostname: string) {
  return ["localhost", "127.0.0.1", "0.0.0.0", "::1"].includes(hostname);
}

function validateHttpsOrigin(name: string, origin: string, errors: string[]) {
  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== "https:") {
      errors.push(`${name} deve usar HTTPS em produção.`);
    }
    if (isLocalHostname(parsed.hostname)) {
      errors.push(`${name} não pode apontar para localhost em produção.`);
    }
  } catch {
    errors.push(`${name} deve ser uma origem absoluta válida.`);
  }
}

function isWeakSecret(value: string) {
  const lower = value.toLowerCase();
  return (
    value.length < 32 ||
    lower.includes("dev-only") ||
    lower.includes("change-this") ||
    lower.includes("altere-para")
  );
}

function isWeakSetupCode(value: string) {
  const lower = value.toLowerCase();
  return (
    value.length < 16 ||
    lower.includes("altere-para") ||
    lower.includes("change-this") ||
    lower.includes("dev-only")
  );
}

function normalizeEslTenant(value: string | undefined) {
  const tenant = value?.trim().toLowerCase() || "rodogarcia";
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(tenant)
    ? tenant
    : "rodogarcia";
}

function resolveEslGraphqlUrl(tenant: string, override: string | undefined) {
  const value = override?.trim();
  if (!value) return `https://${tenant}.eslcloud.com.br/graphql`;

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://127.0.0.1:5010";
const frontendOriginLocalhost =
  frontendOrigin.includes("127.0.0.1")
    ? frontendOrigin.replace("127.0.0.1", "localhost")
    : frontendOrigin.replace("localhost", "127.0.0.1");
const nodeEnv = process.env.NODE_ENV ?? "development";
const isProduction = nodeEnv === "production";
const host = process.env.HOST ?? "127.0.0.1";
const port = numberEnv("PORT", 4010);
const extraCorsOrigins = parseOrigins(process.env.CORS_ORIGINS);
const trustProxy = parseTrustProxy(process.env.TRUST_PROXY);
const rawJwtSecret = process.env.JWT_SECRET ?? process.env.SESSION_SECRET ?? "";
const jwtSecret = rawJwtSecret || "dev-only-change-this-rodogarcia-secret";
const adminSetupCode = process.env.ADMIN_SETUP_CODE ?? "";
const eslTenant = normalizeEslTenant(process.env.ESL_TENANT);

if (isProduction) {
  const errors: string[] = [];

  if (isWeakSecret(rawJwtSecret)) {
    errors.push("JWT_SECRET ou SESSION_SECRET deve ter pelo menos 32 caracteres fortes.");
  }
  if (isWeakSetupCode(adminSetupCode)) {
    errors.push("ADMIN_SETUP_CODE deve ser forte e ter pelo menos 16 caracteres.");
  }

  validateHttpsOrigin("FRONTEND_ORIGIN", frontendOrigin, errors);
  extraCorsOrigins.forEach((origin, index) => {
    validateHttpsOrigin(`CORS_ORIGINS[${index}]`, origin, errors);
  });

  if (errors.length > 0) {
    throw new Error(`Configuração de produção insegura: ${errors.join(" ")}`);
  }
}

export const env = {
  nodeEnv,
  host,
  port,
  backendRoot,
  repoRoot,
  storageRoot: path.resolve(
    process.env.STORAGE_ROOT ?? path.join(backendRoot, "storage")
  ),
  frontendPublicDir: path.resolve(
    process.env.FRONTEND_PUBLIC_DIR ?? path.join(repoRoot, "frontend", "public")
  ),
  uploadsDir: path.resolve(
    process.env.UPLOADS_DIR ?? path.join(backendRoot, "storage", "uploads")
  ),
  ffmpegPath: process.env.FFMPEG_PATH?.trim() || ffmpegStaticPath || "",
  frontendOrigin,
  allowedOrigins: new Set([
    frontendOrigin,
    ...(isProduction
      ? []
      : [frontendOriginLocalhost, `http://${host}:${port}`]),
    ...extraCorsOrigins,
  ]),
  trustProxy,
  jwtSecret,
  adminSetupCode,
  eslTenant,
  eslGraphqlUrl: resolveEslGraphqlUrl(eslTenant, process.env.ESL_GRAPHQL_URL),
  eslGraphqlApiKey: process.env.GRAPHQL_API_KEY?.trim() ?? "",
  isProduction,
} as const;
