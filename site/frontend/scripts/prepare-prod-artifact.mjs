import { access, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(scriptDir, "..");
const nextBuildDirectoryName = process.env.NEXT_BUILD_DIST_DIR?.trim() || ".next";
const allowedNextBuildDirectories = new Set([".next", ".next.test"]);

if (!allowedNextBuildDirectories.has(nextBuildDirectoryName)) {
  throw new Error("NEXT_BUILD_DIST_DIR deve ser .next ou .next.test.");
}

const nextDir = path.join(frontendRoot, nextBuildDirectoryName);
const standaloneDir = path.join(nextDir, "standalone");
const workspaceRoot = path.resolve(frontendRoot, "..", "..");
const standaloneAppDir = path.join(standaloneDir, path.relative(workspaceRoot, frontendRoot));
const staticDir = path.join(nextDir, "static");
const publicDir = path.join(frontendRoot, "public");
const artifactDirectoryName = process.env.PROD_ARTIFACT_DIR?.trim() || "dist-prod";
const allowedArtifactDirectories = new Set(["dist-prod", "dist-prod.next", "dist-prod.test"]);

if (!allowedArtifactDirectories.has(artifactDirectoryName)) {
  throw new Error(
    "PROD_ARTIFACT_DIR deve ser dist-prod, dist-prod.next ou dist-prod.test."
  );
}

const outputDir = path.join(frontendRoot, artifactDirectoryName);

async function requireDirectory(directory, label) {
  try {
    await access(directory);
  } catch {
    throw new Error(`${label} ausente. Execute \"npm run build\" antes de preparar o artefato.`);
  }
}

await requireDirectory(standaloneDir, "Build standalone do Next");
await requireDirectory(standaloneAppDir, "Raiz standalone do site");
await requireDirectory(staticDir, "Assets estaticos do Next");

const buildId = (await readFile(path.join(nextDir, "BUILD_ID"), "utf8")).trim();

await rm(outputDir, { recursive: true, force: true });
// Com `externalDir`, o Next preserva o caminho `site/frontend` dentro de
// `.next/standalone`. O artefato operacional precisa manter `server.js` na
// raiz para coincidir com o processo PM2 e com os testes de hardening.
await cp(standaloneAppDir, outputDir, { recursive: true });
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
