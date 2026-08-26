const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const artifacts = [
  {
    label: "backend",
    active: path.join(rootDir, "site", "backend", "dist"),
    staged: path.join(rootDir, "site", "backend", "dist.next"),
    previous: path.join(rootDir, "site", "backend", "dist.previous"),
    failed: path.join(rootDir, "site", "backend", "dist.failed"),
  },
  {
    label: "backend do CMS",
    active: path.join(rootDir, "cms", "backend", "dist"),
    staged: path.join(rootDir, "cms", "backend", "dist.next"),
    previous: path.join(rootDir, "cms", "backend", "dist.previous"),
    failed: path.join(rootDir, "cms", "backend", "dist.failed"),
    // O primeiro rollout cria este processo; ainda não há uma versão ativa
    // para arquivar. Depois da primeira promoção, ele participa normalmente
    // do rollback pela pasta dist.previous.
    allowMissingActive: true,
  },
  {
    label: "site",
    active: path.join(rootDir, "site", "frontend", "dist-prod"),
    staged: path.join(rootDir, "site", "frontend", "dist-prod.next"),
    previous: path.join(rootDir, "site", "frontend", "dist-prod.previous"),
    failed: path.join(rootDir, "site", "frontend", "dist-prod.failed"),
  },
  {
    label: "CMS",
    active: path.join(rootDir, "cms", "frontend", "dist-prod"),
    staged: path.join(rootDir, "cms", "frontend", "dist-prod.next"),
    previous: path.join(rootDir, "cms", "frontend", "dist-prod.previous"),
    failed: path.join(rootDir, "cms", "frontend", "dist-prod.failed"),
  },
];

function exists(targetPath) {
  return fs.existsSync(targetPath);
}

function hasServer(artifact) {
  return exists(path.join(artifact, "server.js"));
}

function assertArtifacts(property, description) {
  const invalid = artifacts.filter((artifact) => {
    if (hasServer(artifact[property])) return false;
    return property === "active" && artifact.allowMissingActive === true ? false : true;
  });
  if (invalid.length > 0) {
    throw new Error(
      `${description} ausente para: ${invalid.map((artifact) => artifact.label).join(", ")}.`
    );
  }
}

function assertRollbackArtifacts() {
  const invalid = artifacts.filter(
    (artifact) => !hasServer(artifact.previous) && artifact.allowMissingActive !== true
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

function verify() {
  assertArtifacts("staged", "Artefato em staging");
  assertArtifacts("active", "Artefato ativo para rollback");
  console.log("Artefatos em staging validados.");
}

function promote() {
  verify();
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

function rollback() {
  assertRollbackArtifacts();
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
      if (!hasServer(artifact.previous)) continue;
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

  console.log("Rollback de artefatos concluído; as versões candidatas foram preservadas em *.failed.");
}

const command = process.argv[2] ?? "--verify";

try {
  if (command === "--verify") {
    verify();
  } else if (command === "--promote") {
    promote();
  } else if (command === "--rollback") {
    rollback();
  } else {
    throw new Error(`Comando desconhecido: ${command}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
