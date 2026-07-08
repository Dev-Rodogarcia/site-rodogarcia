const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function assertSafeTarget(target) {
  const resolved = path.resolve(target);
  const parsed = path.parse(resolved);
  const defaultStorage = path.resolve(repoRoot, "backend/storage");
  const relativeToDefault = path.relative(defaultStorage, resolved);

  if (resolved === parsed.root) {
    throw new Error("Destino de restore nao pode ser a raiz do disco.");
  }

  if (resolved === repoRoot || resolved === path.resolve(repoRoot, "backend")) {
    throw new Error("Destino de restore amplo demais para sobrescrita segura.");
  }

  if (relativeToDefault.startsWith("..") || path.isAbsolute(relativeToDefault)) {
    console.warn(
      `Aviso: destino fora do storage padrao do repo: ${resolved}`
    );
  }
}

const backupRootArg = argValue("--backup", process.argv[2]);
if (!backupRootArg) {
  throw new Error(
    "Informe o backup: node scripts/restore-storage.js --backup backups/storage-... --confirm-restore"
  );
}

if (!hasFlag("--confirm-restore")) {
  throw new Error("Restore bloqueado. Reexecute com --confirm-restore.");
}

const backupRoot = path.resolve(repoRoot, backupRootArg);
const backupStorage = path.join(backupRoot, "storage");
const target = path.resolve(repoRoot, argValue("--target", "backend/storage"));

if (!fs.existsSync(backupStorage)) {
  throw new Error(`Backup invalido: pasta storage nao encontrada em ${backupStorage}`);
}

assertSafeTarget(target);
fs.mkdirSync(path.dirname(target), { recursive: true });

if (fs.existsSync(target)) {
  const preservedTarget = path.join(
    repoRoot,
    "backups",
    `pre-restore-${timestamp()}`,
    "storage"
  );
  fs.mkdirSync(path.dirname(preservedTarget), { recursive: true });
  fs.renameSync(target, preservedTarget);
  console.log(`Storage anterior preservado em: ${preservedTarget}`);
}

fs.cpSync(backupStorage, target, {
  recursive: true,
  errorOnExist: true,
  force: false,
  dereference: false,
});

console.log(`Restore concluido em: ${target}`);
