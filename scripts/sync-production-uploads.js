const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const uploadUrlPattern = /^\/uploads\/([a-zA-Z0-9][a-zA-Z0-9._/-]*)$/;
const storageJsonFiles = [
  "content.json",
  "site-texts.json",
  "media-library.json",
  "media-slots.json",
  "popup-config.json",
  "seo-settings.json",
];

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function resolveFromRepo(value) {
  return path.isAbsolute(value) ? value : path.resolve(repoRoot, value);
}

function readEnvironment(envFile) {
  const dotenv = require(path.join(repoRoot, "backend", "node_modules", "dotenv"));
  if (!fs.existsSync(envFile)) {
    throw new Error(`Arquivo de ambiente nao encontrado: ${envFile}`);
  }
  return dotenv.parse(fs.readFileSync(envFile));
}

function walkJson(value, references) {
  if (typeof value === "string") {
    const match = value.match(uploadUrlPattern);
    if (match) references.add(match[1]);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => walkJson(item, references));
    return;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => walkJson(item, references));
  }
}

function referencedUploads(storageRoot) {
  const references = new Set();
  for (const fileName of storageJsonFiles) {
    const filePath = path.join(storageRoot, fileName);
    if (!fs.existsSync(filePath)) continue;
    try {
      walkJson(JSON.parse(fs.readFileSync(filePath, "utf8")), references);
    } catch (error) {
      throw new Error(`Nao foi possivel validar referencias de ${filePath}: ${error.message}`);
    }
  }
  return [...references].sort();
}

function copyMissingFiles(source, target) {
  if (!fs.existsSync(source)) return 0;
  let copied = 0;
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(targetPath, { recursive: true });
      copied += copyMissingFiles(sourcePath, targetPath);
      continue;
    }
    if (!entry.isFile() || fs.existsSync(targetPath)) continue;
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath, fs.constants.COPYFILE_EXCL);
    copied += 1;
  }
  return copied;
}

const envFile = resolveFromRepo(argumentValue("--env-file") ?? ".env.production.local");
const environment = readEnvironment(envFile);
const storageRoot = resolveFromRepo(environment.STORAGE_ROOT ?? "backend/storage");
const uploadsDir = resolveFromRepo(
  environment.UPLOADS_DIR ?? path.join(storageRoot, "uploads")
);
const sourceDir = resolveFromRepo(
  argumentValue("--source") ?? environment.PRODUCTION_UPLOADS_SEED_DIR ?? "backend/storage/uploads"
);
const apply = process.argv.includes("--apply");

if (apply) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  const copied = path.resolve(sourceDir) === path.resolve(uploadsDir)
    ? 0
    : copyMissingFiles(sourceDir, uploadsDir);
  console.log(`Uploads sincronizados: ${copied} arquivo(s) novo(s).`);
}

if (!fs.existsSync(uploadsDir)) {
  throw new Error(`Diretorio de uploads nao encontrado: ${uploadsDir}`);
}

const missing = referencedUploads(storageRoot).filter(
  (relativePath) => !fs.existsSync(path.join(uploadsDir, relativePath))
);

if (missing.length > 0) {
  throw new Error(
    `Uploads referenciados mas ausentes (${missing.length}): ${missing.join(", ")}`
  );
}

console.log(`Uploads validados: ${referencedUploads(storageRoot).length} referencia(s).`);
