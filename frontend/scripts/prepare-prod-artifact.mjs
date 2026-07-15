import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(scriptDir, "..");
const nextDir = path.join(frontendRoot, ".next");
const standaloneDir = path.join(nextDir, "standalone");
const staticDir = path.join(nextDir, "static");
const publicDir = path.join(frontendRoot, "public");
const outputDir = path.join(frontendRoot, "dist-prod");

async function requireDirectory(directory, label) {
  try {
    await access(directory);
  } catch {
    throw new Error(`${label} ausente. Execute \"npm run build\" antes de preparar o artefato.`);
  }
}

await requireDirectory(standaloneDir, "Build standalone do Next");
await requireDirectory(staticDir, "Assets estaticos do Next");

const buildId = (await readFile(path.join(nextDir, "BUILD_ID"), "utf8")).trim();

await rm(outputDir, { recursive: true, force: true });
await cp(standaloneDir, outputDir, { recursive: true });
await mkdir(path.join(outputDir, ".next"), { recursive: true });
await cp(staticDir, path.join(outputDir, ".next", "static"), {
  recursive: true,
  filter: (source) => !source.endsWith(".map"),
});

try {
  await access(publicDir);
  await cp(publicDir, path.join(outputDir, "public"), { recursive: true });
} catch {
  // O diretório public é opcional em projetos Next.
}

await writeFile(
  path.join(outputDir, "build-info.json"),
  `${JSON.stringify(
    {
      format: "next-standalone",
      buildId,
      generatedAt: new Date().toISOString(),
      staticAssets: ".next/static",
    },
    null,
    2
  )}\n`,
  "utf8"
);

console.log(`Artefato produtivo atualizado: ${path.relative(frontendRoot, outputDir)}`);
