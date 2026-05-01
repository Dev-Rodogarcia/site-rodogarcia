import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

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

const frontendOrigin = process.env.FRONTEND_ORIGIN ?? "http://127.0.0.1:5010";
const frontendOriginLocalhost =
  frontendOrigin.includes("127.0.0.1")
    ? frontendOrigin.replace("127.0.0.1", "localhost")
    : frontendOrigin.replace("localhost", "127.0.0.1");

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  host: process.env.HOST ?? "127.0.0.1",
  port: numberEnv("PORT", 4010),
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
  frontendOrigin,
  allowedOrigins: new Set([
    frontendOrigin,
    frontendOriginLocalhost,
    `http://${process.env.HOST ?? "127.0.0.1"}:${numberEnv("PORT", 4010)}`,
    ...parseOrigins(process.env.CORS_ORIGINS),
  ]),
  jwtSecret:
    process.env.JWT_SECRET ??
    process.env.SESSION_SECRET ??
    "dev-only-change-this-rodogarcia-secret",
  adminSetupCode: process.env.ADMIN_SETUP_CODE ?? "",
  isProduction: process.env.NODE_ENV === "production",
} as const;
