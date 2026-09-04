const fs = require("node:fs");
const { parseEnv } = require("node:util");

function fallbackParse(contents) {
  const values = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;

    const [, name, rawValue] = match;
    const value = rawValue.trim();
    const quoted = value.match(/^(?:"([\s\S]*)"|'([\s\S]*)')$/);
    values[name] = quoted ? (quoted[1] ?? quoted[2] ?? "") : value.replace(/\s+#.*$/, "");
  }

  return values;
}

function parseEnvironmentFile(contents) {
  if (typeof parseEnv === "function") return parseEnv(contents);
  return fallbackParse(contents);
}

function readEnvironmentFile(envFile) {
  if (!fs.existsSync(envFile)) {
    throw new Error(`Arquivo de ambiente não encontrado: ${envFile}`);
  }
  return parseEnvironmentFile(fs.readFileSync(envFile, "utf8"));
}

module.exports = {
  parseEnvironmentFile,
  readEnvironmentFile,
};
