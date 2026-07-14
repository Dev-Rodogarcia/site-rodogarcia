import fs from "node:fs";
import path from "node:path";

export class JsonStoreError extends Error {
  constructor(filePath: string, cause: unknown) {
    super(`Não foi possível ler o armazenamento JSON: ${filePath}`, { cause });
    this.name = "JsonStoreError";
  }
}

export interface JsonTransactionEntry {
  filePath: string;
  data: unknown;
}

type JsonTransactionPhase = "prepared" | "committing" | "committed";

interface JsonTransactionJournal {
  phase: JsonTransactionPhase;
  entries: Array<{
    filePath: string;
    tempPath: string;
    backupPath: string;
    hadOriginal: boolean;
  }>;
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

function removeFileIfExists(filePath: string) {
  try {
    fs.rmSync(filePath, { force: true });
  } catch {
    // A recuperação continua para os demais arquivos do lote.
  }
}

/**
 * Recupera uma troca interrompida antes de qualquer leitura do lote afetado.
 * Uma transação incompleta é revertida integralmente; uma já confirmada só limpa
 * seus artefatos temporários.
 */
export function recoverJsonTransaction(journalPath: string): void {
  if (!fs.existsSync(journalPath)) return;

  const journal = readJsonFile<JsonTransactionJournal | null>(journalPath, null);
  if (!journal || !Array.isArray(journal.entries)) {
    removeFileIfExists(journalPath);
    return;
  }

  if (journal.phase === "committed") {
    for (const entry of journal.entries) {
      removeFileIfExists(entry.tempPath);
      removeFileIfExists(entry.backupPath);
    }
    removeFileIfExists(journalPath);
    return;
  }

  for (const entry of [...journal.entries].reverse()) {
    if (fs.existsSync(entry.backupPath)) {
      removeFileIfExists(entry.filePath);
      fs.renameSync(entry.backupPath, entry.filePath);
    } else if (!entry.hadOriginal) {
      removeFileIfExists(entry.filePath);
    }
    removeFileIfExists(entry.tempPath);
  }
  removeFileIfExists(journalPath);
}

/**
 * Troca um conjunto de JSONs com journal e rollback. Não há commit atômico de
 * múltiplos arquivos no filesystem; o journal garante que uma interrupção seja
 * recuperada como estado anterior completo ou estado novo completo.
 */
export function writeJsonFilesTransaction(
  entries: JsonTransactionEntry[],
  journalPath: string
): void {
  if (entries.length === 0) return;
  if (new Set(entries.map((entry) => entry.filePath)).size !== entries.length) {
    throw new Error("A transação JSON contém caminhos duplicados.");
  }

  recoverJsonTransaction(journalPath);
  const transactionId = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const journal: JsonTransactionJournal = {
    phase: "prepared",
    entries: entries.map((entry) => {
      const directory = path.dirname(entry.filePath);
      const baseName = path.basename(entry.filePath);
      return {
        filePath: entry.filePath,
        tempPath: path.join(directory, `.${baseName}.${transactionId}.tmp`),
        backupPath: path.join(directory, `.${baseName}.${transactionId}.bak`),
        hadOriginal: fs.existsSync(entry.filePath),
      };
    }),
  };

  try {
    fs.mkdirSync(path.dirname(journalPath), { recursive: true });
    for (const entry of journal.entries) {
      fs.mkdirSync(path.dirname(entry.filePath), { recursive: true });
    }
    writeJsonFile(journalPath, journal);

    for (const [index, entry] of entries.entries()) {
      fs.writeFileSync(journal.entries[index]!.tempPath, JSON.stringify(entry.data, null, 2), "utf8");
    }

    journal.phase = "committing";
    writeJsonFile(journalPath, journal);
    for (const entry of journal.entries) {
      if (entry.hadOriginal) fs.renameSync(entry.filePath, entry.backupPath);
      fs.renameSync(entry.tempPath, entry.filePath);
    }

    journal.phase = "committed";
    writeJsonFile(journalPath, journal);
    recoverJsonTransaction(journalPath);
  } catch (error) {
    recoverJsonTransaction(journalPath);
    throw error;
  }
}
