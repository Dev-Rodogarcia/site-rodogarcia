const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  return process.argv[index + 1] ?? fallback;
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function countFiles(root) {
  if (!fs.existsSync(root)) return 0;
  return fs.readdirSync(root, { withFileTypes: true }).reduce((total, entry) => {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) return total + countFiles(fullPath);
    return total + 1;
  }, 0);
}

function safeCopy(source, destination) {
  if (!fs.existsSync(source)) {
    throw new Error(`Storage de origem nao encontrado: ${source}`);
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(source, destination, {
    recursive: true,
    errorOnExist: true,
    force: false,
    dereference: false,
  });
}

const source = path.resolve(repoRoot, argValue("--source", "site/backend/storage"));
const outRoot = path.resolve(repoRoot, argValue("--out", "backups"));
const name = argValue("--name", `storage-${timestamp()}`);
const backupRoot = path.join(outRoot, name);
const backupStorage = path.join(backupRoot, "storage");

safeCopy(source, backupStorage);

const manifest = {
  createdAt: new Date().toISOString(),
  source,
  backupRoot,
  storagePath: backupStorage,
  fileCount: countFiles(backupStorage),
  restoreCommand: `node scripts/restore-storage.js --backup ${backupRoot} --confirm-restore`,
};

fs.writeFileSync(
  path.join(backupRoot, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`
);

console.log(`Backup criado em: ${backupRoot}`);
console.log(`Arquivos copiados: ${manifest.fileCount}`);
console.log(`Restore: ${manifest.restoreCommand}`);
