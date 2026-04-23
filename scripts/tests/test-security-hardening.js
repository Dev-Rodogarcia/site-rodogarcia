const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const PORT = 5411;
const HOST = "127.0.0.1";
const BASE_URL = `http://${HOST}:${PORT}`;
function readEnvValue(name) {
  try {
    const envFile = fs.readFileSync(path.join(process.cwd(), ".env"), "utf8");
    const match = envFile.match(new RegExp(`^${name}=(.+)$`, "m"));
    return match ? match[1].trim() : "";
  } catch {
    return "";
  }
}

const SETUP_CODE = readEnvValue("ADMIN_SETUP_CODE") || "test-setup-code-2026-safe";

const BLOCKED_PATHS = [
  "/.env",
  "/README.md",
  "/docs/checklist-tecnico.md",
  "/scripts/tests/test-basic.js",
  "/src/app/page.tsx",
  "/server/storage/content.json",
];

const PUBLIC_PATHS = ["/", "/auth/entrar", "/api/public/content", "/api/popup-config"];
const AUTH_PATHS = ["/api/admin/content", "/api/analytics/config", "/api/leads"];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function getRunCommand(script, extraArgs = []) {
  if (process.platform === "win32") {
    return {
      command: "cmd",
      args: ["/c", "npm", "run", script, "--", ...extraArgs],
    };
  }

  return {
    command: "npm",
    args: ["run", script, "--", ...extraArgs],
  };
}

function copyFixture(relativePath, targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(path.join(process.cwd(), relativePath), targetPath);
}

async function waitForServer(timeoutMs = 90000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/session`, {
        method: "GET",
        redirect: "manual",
      });

      if (response.status === 200) {
        return;
      }
    } catch {
      // aguarda próxima tentativa
    }

    await sleep(500);
  }

  throw new Error("Servidor Next não ficou pronto dentro do tempo esperado.");
}

function startServer(storeDir) {
  const contentStorePath = path.join(storeDir, "content.json");
  const siteTextsStorePath = path.join(storeDir, "site-texts.json");

  copyFixture("server/storage/content.json", contentStorePath);
  copyFixture("server/storage/site-texts.json", siteTextsStorePath);

  const { command, args } = getRunCommand("start", [
    "--hostname",
    HOST,
    "--port",
    String(PORT),
  ]);

  const env = {
    ...process.env,
    PORT: String(PORT),
    NODE_ENV: "production",
    ADMIN_SETUP_CODE: SETUP_CODE,
    CONTENT_STORE_PATH: contentStorePath,
    SITE_TEXTS_STORE_PATH: siteTextsStorePath,
    USERS_STORE_PATH: path.join(storeDir, "users.json"),
    SESSIONS_STORE_PATH: path.join(storeDir, "sessions.json"),
    CONTACTS_STORE_PATH: path.join(storeDir, "contacts.json"),
    QUOTES_STORE_PATH: path.join(storeDir, "quotes.json"),
    POPUP_CONFIG_STORE_PATH: path.join(storeDir, "popup-config.json"),
    POPUP_LEADS_STORE_PATH: path.join(storeDir, "popup-leads.json"),
    POPUP_EVENTS_STORE_PATH: path.join(storeDir, "popup-events.json"),
    ANALYTICS_STORE_PATH: path.join(storeDir, "analytics.json"),
    ANALYTICS_CONFIG_PATH: path.join(storeDir, "analytics-config.json"),
    RATE_LIMITS_STORE_PATH: path.join(storeDir, "rate-limits.json"),
  };

  const child = spawn(command, args, {
    cwd: process.cwd(),
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let logs = "";
  child.stdout.on("data", (chunk) => {
    logs += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    logs += chunk.toString();
  });

  return {
    child,
    getLogs: () => logs,
  };
}

async function request(pathname, options = {}) {
  const response = await fetch(`${BASE_URL}${pathname}`, {
    method: options.method || "GET",
    headers: options.headers || {},
    body: options.body,
    redirect: options.redirect || "manual",
  });

  const contentType = String(response.headers.get("content-type") || "");
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : null;

  return { response, payload };
}

async function runChecks(logsAccessor) {
  const results = [];

  for (const pathname of BLOCKED_PATHS) {
    const { response } = await request(pathname);
    results.push({
      name: `BLOCK ${pathname}`,
      pass: response.status === 404,
      detail: `status=${response.status}`,
    });
  }

  for (const pathname of PUBLIC_PATHS) {
    const { response } = await request(pathname);
    results.push({
      name: `PUBLIC ${pathname}`,
      pass: response.status === 200,
      detail: `status=${response.status}`,
    });
  }

  for (const pathname of AUTH_PATHS) {
    const { response } = await request(pathname);
    results.push({
      name: `AUTH ${pathname}`,
      pass: response.status === 401,
      detail: `status=${response.status}`,
    });
  }

  const crossOriginLogin = await request("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://evil.example",
    },
    body: JSON.stringify({ email: "a@a.com", password: "x" }),
  });
  results.push({
    name: "SAME-ORIGIN /api/auth/login",
    pass: crossOriginLogin.response.status === 403,
    detail: `status=${crossOriginLogin.response.status}`,
  });

  const wrongContentType = await request("/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
    },
    body: "nome=teste",
  });
  results.push({
    name: "CONTENT-TYPE /api/contact",
    pass: wrongContentType.response.status === 415,
    detail: `status=${wrongContentType.response.status}`,
  });

  const logs = logsAccessor().toLowerCase();
  const leakedPatterns = [SETUP_CODE.toLowerCase(), "passwordhash"].filter((pattern) =>
    logs.includes(pattern)
  );
  results.push({
    name: "LOGS startup",
    pass: leakedPatterns.length === 0,
    detail: leakedPatterns.length === 0 ? "clean" : `found=${leakedPatterns.join(",")}`,
  });

  return results;
}

async function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rodogarcia-security-test-"));
  const { child, getLogs } = startServer(tmpDir);

  try {
    await waitForServer();
    const results = await runChecks(getLogs);
    const failed = results.filter((item) => !item.pass);

    results.forEach((item) => {
      console.log(`${item.pass ? "PASS" : "FAIL"} ${item.name} ${item.detail}`);
    });

    assert(failed.length === 0, `Falhas detectadas: ${failed.map((item) => item.name).join(", ")}`);
    console.log("ALL TESTS PASS");
  } finally {
    child.kill();
  }
}

main().catch((error) => {
  console.error(error && error.message ? error.message : String(error));
  process.exit(1);
});
