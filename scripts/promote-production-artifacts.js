const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const artifacts = [
  {
    label: "backend Spring público",
    active: path.join(rootDir, "site", "backend", "dist"),
    staged: path.join(rootDir, "site", "backend", "dist.next"),
    previous: path.join(rootDir, "site", "backend", "dist.previous"),
    failed: path.join(rootDir, "site", "backend", "dist.failed"),
    entrypoint: "server.jar",
  },
  {
    label: "backend Spring do CMS",
    active: path.join(rootDir, "cms", "backend", "dist"),
    staged: path.join(rootDir, "cms", "backend", "dist.next"),
    previous: path.join(rootDir, "cms", "backend", "dist.previous"),
    failed: path.join(rootDir, "cms", "backend", "dist.failed"),
    entrypoint: "server.jar",
  },
  {
    label: "site",
    active: path.join(rootDir, "site", "frontend", "dist-prod"),
    staged: path.join(rootDir, "site", "frontend", "dist-prod.next"),
    previous: path.join(rootDir, "site", "frontend", "dist-prod.previous"),
    failed: path.join(rootDir, "site", "frontend", "dist-prod.failed"),
    entrypoint: "server.js",
  },
  {
    label: "CMS",
    active: path.join(rootDir, "cms", "frontend", "dist-prod"),
    staged: path.join(rootDir, "cms", "frontend", "dist-prod.next"),
    previous: path.join(rootDir, "cms", "frontend", "dist-prod.previous"),
    failed: path.join(rootDir, "cms", "frontend", "dist-prod.failed"),
    entrypoint: "server.js",
  },
  {
    label: "backend Spring do Landing Builder",
    active: path.join(rootDir, "landing-builder", "backend", "dist"),
    staged: path.join(rootDir, "landing-builder", "backend", "dist.next"),
    previous: path.join(rootDir, "landing-builder", "backend", "dist.previous"),
    failed: path.join(rootDir, "landing-builder", "backend", "dist.failed"),
    entrypoint: "server.jar",
    allowMissingActive: true,
  },
  {
    label: "frontend do Landing Builder",
    active: path.join(rootDir, "landing-builder", "frontend", "dist-prod"),
    staged: path.join(rootDir, "landing-builder", "frontend", "dist-prod.next"),
    previous: path.join(rootDir, "landing-builder", "frontend", "dist-prod.previous"),
    failed: path.join(rootDir, "landing-builder", "frontend", "dist-prod.failed"),
    entrypoint: "server.js",
    allowMissingActive: true,
  },
];

function exists(targetPath) {
  return fs.existsSync(targetPath);
}

function hasEntrypoint(artifact, entrypoint) {
  return exists(path.join(artifact, entrypoint));
}

function assertArtifacts(property, description, { initialRollout = false } = {}) {
  const invalid = artifacts.filter((artifact) => {
    if (hasEntrypoint(artifact[property], artifact.entrypoint)) return false;
    return property === "active" && (artifact.allowMissingActive === true || initialRollout)
      ? false
      : true;
  });
  if (invalid.length > 0) {
    throw new Error(
      `${description} ausente para: ${invalid.map((artifact) => artifact.label).join(", ")}.`
    );
  }
}

function assertRollbackArtifacts({ initialRollout = false } = {}) {
  const invalid = artifacts.filter(
    (artifact) =>
      !hasEntrypoint(artifact.previous, artifact.entrypoint) &&
      artifact.allowMissingActive !== true &&
      !initialRollout
  );
  if (invalid.length > 0) {
    throw new Error(
      `Artefato anterior ausente para: ${invalid.map((artifact) => artifact.label).join(", ")}.`
    );
  }
}

function removeIfPresent(targetPath) {
  fs.rmSync(targetPath, { recursive: true, force: true });
}

function move(source, target) {
  fs.renameSync(source, target);
}

function verify(options) {
  assertArtifacts("staged", "Artefato em staging", options);
  assertArtifacts("active", "Artefato ativo para rollback", options);
  console.log("Artefatos Spring e frontends em staging validados.");
}

function promote(options) {
  verify(options);
  const archived = [];
  const activated = [];

  try {
    for (const artifact of artifacts) {
      removeIfPresent(artifact.previous);
    }

    for (const artifact of artifacts) {
      if (!exists(artifact.active)) continue;
      move(artifact.active, artifact.previous);
      archived.push(artifact);
    }

    for (const artifact of artifacts) {
      move(artifact.staged, artifact.active);
      activated.push(artifact);
    }
  } catch (error) {
    for (const artifact of activated.reverse()) {
      if (exists(artifact.active) && !exists(artifact.staged)) {
        move(artifact.active, artifact.staged);
      }
    }

    for (const artifact of archived.reverse()) {
      if (!exists(artifact.active) && exists(artifact.previous)) {
        move(artifact.previous, artifact.active);
      }
    }

    throw error;
  }

  console.log("Artefatos de produção promovidos; a versão anterior foi preservada.");
}

function rollback(options) {
  assertRollbackArtifacts(options);
  const archived = [];
  const restored = [];

  try {
    for (const artifact of artifacts) {
      removeIfPresent(artifact.failed);
    }

    for (const artifact of artifacts) {
      if (!exists(artifact.active)) continue;
      move(artifact.active, artifact.failed);
      archived.push(artifact);
    }

    for (const artifact of artifacts) {
      if (!hasEntrypoint(artifact.previous, artifact.entrypoint)) continue;
      move(artifact.previous, artifact.active);
      restored.push(artifact);
    }
  } catch (error) {
    for (const artifact of restored.reverse()) {
      if (exists(artifact.active) && !exists(artifact.previous)) {
        move(artifact.active, artifact.previous);
      }
    }

    for (const artifact of archived.reverse()) {
      if (!exists(artifact.active) && exists(artifact.failed)) {
        move(artifact.failed, artifact.active);
      }
    }

    throw error;
  }

  if (options.initialRollout) {
    console.log("Rollback inicial concluído; artefatos sem versão anterior foram preservados em *.failed.");
  } else {
    console.log("Rollback de artefatos concluído; as versões candidatas foram preservadas em *.failed.");
  }
}

const [command = "--verify", ...flags] = process.argv.slice(2);
const initialRollout = flags.includes("--initial-rollout");
const invalidFlags = flags.filter((flag) => flag !== "--initial-rollout");
const options = { initialRollout };

try {
  if (invalidFlags.length > 0) {
    throw new Error(`Opção desconhecida: ${invalidFlags.join(", ")}`);
  }
  if (command === "--verify") {
    verify(options);
  } else if (command === "--promote") {
    promote(options);
  } else if (command === "--rollback") {
    rollback(options);
  } else {
    throw new Error(`Comando desconhecido: ${command}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
