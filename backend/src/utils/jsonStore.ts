import fs from "node:fs";
import path from "node:path";

export class JsonStoreError extends Error {
  constructor(filePath: string, cause: unknown) {
    super(`Não foi possível ler o armazenamento JSON: ${filePath}`, { cause });
    this.name = "JsonStoreError";
  }
}

function preserveInvalidJson(filePath: string, cause: unknown) {
  if (!(cause instanceof SyntaxError)) return;

  const directory = path.dirname(filePath);
  const backupPath = path.join(
    directory,
    `.${path.basename(filePath)}.invalid-${Date.now()}.json`
  );

  try {
    fs.copyFileSync(filePath, backupPath, fs.constants.COPYFILE_EXCL);
  } catch {
    // A leitura continua falhando fechada mesmo se não for possível preservar a cópia.
  }
}

export function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    const raw = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
    return JSON.parse(raw) as T;
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
      return defaultValue;
    }

    preserveInvalidJson(filePath, error);
    throw new JsonStoreError(filePath, error);
  }
}

export function writeJsonFile<T>(filePath: string, data: T): void {
  const directory = path.dirname(filePath);
  fs.mkdirSync(directory, { recursive: true });

  const tempPath = path.join(
    directory,
    `.${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`
  );

  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tempPath, filePath);
}
