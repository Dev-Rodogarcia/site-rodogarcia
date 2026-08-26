import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ffmpegStaticPath = require("ffmpeg-static");

const apply = process.argv.includes("--apply");
const ffmpegPath = process.env.FFMPEG_PATH?.trim() || ffmpegStaticPath;
const repoRoot = path.resolve(import.meta.dirname, "..", "..");
const videoRoots = [
  { directory: path.join(repoRoot, "frontend", "public"), publicPrefix: "/" },
  { directory: path.join(repoRoot, "backend", "storage", "uploads"), publicPrefix: "/uploads/" },
];
const referenceFiles = [
  path.join(repoRoot, "backend", "storage", "content.json"),
  path.join(repoRoot, "backend", "storage", "site-texts.json"),
  ...walkFiles(path.join(repoRoot, "frontend", "src")).filter((filePath) => /\.(ts|tsx)$/.test(filePath)),
];
const sourceExtensions = new Set([".mp4", ".ogg"]);

function walkFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(filePath) : [filePath];
  });
}

function publicUrl(root, filePath) {
  const relative = path.relative(root.directory, filePath).split(path.sep).join("/");
  return `${root.publicPrefix}${relative}`.replace(/\.(mp4|ogg)$/i, ".webm");
}

function replaceReferences(content, replacements) {
  return replacements.reduce((next, [from, to]) => next.split(from).join(to), content);
}

function run(command, args, captureOutput = false) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { windowsHide: true, stdio: captureOutput ? ["ignore", "pipe", "ignore"] : "ignore" });
    let stdout = "";
    process.stdout?.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    process.once("error", reject);
    process.once("close", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(`${path.basename(command)} encerrou com código ${code ?? "desconhecido"}.`));
    });
  });
}

async function validateWebm(filePath) {
  if (!ffmpegPath) throw new Error("FFmpeg não está disponível nesta plataforma.");
  await run(ffmpegPath, ["-v", "error", "-i", filePath, "-f", "null", "-"]);
}

const sources = videoRoots.flatMap((root) =>
  walkFiles(root.directory)
    .filter((filePath) => sourceExtensions.has(path.extname(filePath).toLowerCase()))
    .map((filePath) => ({ root, filePath, outputPath: filePath.replace(/\.(mp4|ogg)$/i, ".webm") }))
);
const replacements = sources.flatMap(({ root, filePath }) => {
  const from = publicUrl(root, filePath).replace(/\.webm$/i, path.extname(filePath));
  const to = publicUrl(root, filePath);
  return root.publicPrefix === "/" ? [[from, to], [`/public${from}`, `/public${to}`]] : [[from, to]];
});
const changedReferences = referenceFiles.filter((filePath) => {
  const content = fs.readFileSync(filePath, "utf8");
  return replaceReferences(content, replacements) !== content;
});

console.log(`Vídeos a converter: ${sources.length}`);
console.log(`Arquivos de referência a atualizar: ${changedReferences.length}`);
console.log(`Modo: ${apply ? "aplicar" : "simulação"}`);
if (!apply) {
  console.log("Execute novamente com --apply para converter, atualizar referências e remover os originais.");
  process.exit(0);
}
if (!ffmpegPath) throw new Error("FFmpeg não está disponível nesta plataforma.");

let originalBytes = 0;
let webmBytes = 0;
for (const { filePath, outputPath } of sources) {
  const temporaryOutputPath = `${outputPath}.tmp.webm`;
  originalBytes += fs.statSync(filePath).size;
  await run(ffmpegPath, ["-y", "-i", filePath, "-map", "0:v:0", "-map", "0:a?", "-c:v", "libvpx-vp9", "-crf", "32", "-b:v", "0", "-row-mt", "1", "-deadline", "good", "-c:a", "libopus", "-b:a", "96k", temporaryOutputPath]);
  await validateWebm(temporaryOutputPath);
  fs.renameSync(temporaryOutputPath, outputPath);
  webmBytes += fs.statSync(outputPath).size;
}
for (const filePath of changedReferences) {
  fs.writeFileSync(filePath, replaceReferences(fs.readFileSync(filePath, "utf8"), replacements));
}
for (const { filePath } of sources) fs.unlinkSync(filePath);

console.log(`Conversão concluída: ${sources.length} vídeo(s).`);
console.log(`Tamanho anterior: ${originalBytes} bytes; WebM: ${webmBytes} bytes; economia: ${originalBytes - webmBytes} bytes.`);
