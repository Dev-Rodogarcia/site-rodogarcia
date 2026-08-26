import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const apply = process.argv.includes("--apply");
const repoRoot = path.resolve(import.meta.dirname, "..", "..");
const imageRoots = [
  { directory: path.join(repoRoot, "frontend", "public"), publicPrefix: "/" },
  { directory: path.join(repoRoot, "backend", "storage", "uploads"), publicPrefix: "/uploads/" },
];
const referenceFiles = [
  path.join(repoRoot, "backend", "storage", "content.json"),
  path.join(repoRoot, "backend", "storage", "site-texts.json"),
  ...walkFiles(path.join(repoRoot, "frontend", "src")).filter((filePath) => /\.(ts|tsx)$/.test(filePath)),
];
const sourceExtensions = new Set([".png", ".jpg", ".jpeg", ".avif"]);

function walkFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(filePath) : [filePath];
  });
}

function publicUrl(root, filePath) {
  const relative = path.relative(root.directory, filePath).split(path.sep).join("/");
  return `${root.publicPrefix}${relative}`.replace(/\.(png|jpe?g|avif)$/i, ".webp");
}

function replaceReferences(content, replacements) {
  return replacements.reduce(
    (next, [from, to]) => next.split(from).join(to),
    content
  );
}

const sources = imageRoots.flatMap((root) =>
  walkFiles(root.directory)
    .filter((filePath) => sourceExtensions.has(path.extname(filePath).toLowerCase()))
    .map((filePath) => ({
      root,
      filePath,
      outputPath: filePath.replace(/\.(png|jpe?g|avif)$/i, ".webp"),
    }))
);

const replacements = sources.flatMap(({ root, filePath }) => {
  const from = publicUrl(root, filePath).replace(/\.webp$/i, path.extname(filePath));
  const to = publicUrl(root, filePath);
  return root.publicPrefix === "/"
    ? [[from, to], [`/public${from}`, `/public${to}`]]
    : [[from, to]];
});

const changedReferences = referenceFiles.filter((filePath) => {
  const content = fs.readFileSync(filePath, "utf8");
  return replaceReferences(content, replacements) !== content;
});

console.log(`Imagens a converter: ${sources.length}`);
console.log(`Arquivos de referência a atualizar: ${changedReferences.length}`);
console.log(`Modo: ${apply ? "aplicar" : "simulação"}`);

if (!apply) {
  console.log("Execute novamente com --apply para converter, atualizar referências e remover os originais.");
  process.exit(0);
}

let originalBytes = 0;
let webpBytes = 0;
for (const { filePath, outputPath } of sources) {
  originalBytes += fs.statSync(filePath).size;
  await sharp(filePath, { failOn: "none" })
    .rotate()
    .webp({ quality: 82, effort: 4, smartSubsample: true })
    .toFile(outputPath);
  const metadata = await sharp(outputPath).metadata();
  if (metadata.format !== "webp") {
    throw new Error(`Falha ao validar o WebP gerado: ${outputPath}`);
  }
  webpBytes += fs.statSync(outputPath).size;
}

for (const filePath of changedReferences) {
  const content = fs.readFileSync(filePath, "utf8");
  fs.writeFileSync(filePath, replaceReferences(content, replacements));
}

for (const { filePath } of sources) fs.unlinkSync(filePath);

const savedBytes = originalBytes - webpBytes;
console.log(`Conversão concluída: ${sources.length} imagem(ns).`);
console.log(`Tamanho anterior: ${originalBytes} bytes; WebP: ${webpBytes} bytes; economia: ${savedBytes} bytes.`);
