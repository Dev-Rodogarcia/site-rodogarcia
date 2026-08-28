import path from "node:path";

const isProduction = process.env.NODE_ENV === "production";
const configuredStorageRoot = (process.env.LANDING_BUILDER_STORAGE_ROOT ?? "").trim();
const serviceToken = (process.env.LANDING_BUILDER_SERVICE_TOKEN ?? "").trim();
const host = (process.env.LANDING_BUILDER_HOST ?? process.env.HOST ?? "127.0.0.1").trim();
const port = Number(process.env.LANDING_BUILDER_PORT ?? process.env.PORT ?? 36110);

function isStrongServiceToken(value: string) {
  return value.length >= 32 && !/altere-para|change-me|example|placeholder/i.test(value);
}

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("LANDING_BUILDER_PORT deve ser uma porta válida.");
}

if (isProduction) {
  const errors: string[] = [];

  if (!isStrongServiceToken(serviceToken)) {
    errors.push("LANDING_BUILDER_SERVICE_TOKEN deve ter ao menos 32 caracteres fortes.");
  }

  if (!configuredStorageRoot) {
    errors.push("LANDING_BUILDER_STORAGE_ROOT é obrigatório em produção.");
  } else if (!path.isAbsolute(configuredStorageRoot)) {
    errors.push("LANDING_BUILDER_STORAGE_ROOT deve ser um caminho absoluto em produção.");
  }

  if (errors.length > 0) {
    throw new Error(`Configuração inválida do Landing Builder: ${errors.join(" ")}`);
  }
}

export const env = {
  isProduction,
  host: host || "127.0.0.1",
  port,
  serviceToken,
  storageRoot: path.resolve(configuredStorageRoot || path.join(process.cwd(), "storage")),
} as const;
