const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const FRONTEND_PORT = 5411;
const BACKEND_PORT = 4010;
const HOST = "127.0.0.1";
const FRONTEND_URL = `http://${HOST}:${FRONTEND_PORT}`;
const BACKEND_URL = `http://${HOST}:${BACKEND_PORT}`;
const ROOT_DIR = path.resolve(__dirname, "../..");
const FRONTEND_DIR = path.join(ROOT_DIR, "frontend");
const BACKEND_DIR = path.join(ROOT_DIR, "backend");

const SETUP_CODE = "test-setup-code-2026-safe";

const BLOCKED_PATHS = [
  "/.env",
  "/README.md",
  "/docs/checklist-tecnico.md",
  "/scripts/tests/test-security-hardening.js",
  "/frontend/src/app/page.tsx",
  "/backend/storage/content.json",
  "/backend/.env",
];

const PUBLIC_PATHS = ["/", "/auth/entrar", "/api/public/content", "/api/popup-config"];
const AUTH_PATHS = ["/api/admin/content", "/api/analytics/config", "/api/leads"];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function npmCommand(script, extraArgs = []) {
  if (process.platform === "win32") {
    return { command: "cmd", args: ["/c", "npm", "run", script, "--", ...extraArgs] };
  }
  return { command: "npm", args: ["run", script, "--", ...extraArgs] };
}

function copyFixture(relativePath, targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(path.join(ROOT_DIR, relativePath), targetPath);
}

function startProcess({ cwd, script, args = [], env }) {
  const command = npmCommand(script, args);
  const child = spawn(command.command, command.args, {
    cwd,
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

  return { child, getLogs: () => logs };
}

async function waitFor(url, timeoutMs = 90000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (response.status >= 200 && response.status < 500) return;
    } catch {
      // wait
    }
    await sleep(500);
  }
  throw new Error(`Servidor nao ficou pronto: ${url}`);
}

function killProcessTree(child) {
  if (!child || child.killed) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
    });
    return;
  }
  child.kill();
}

function startServers(storeDir) {
  const contentStorePath = path.join(storeDir, "content.json");
  const siteTextsStorePath = path.join(storeDir, "site-texts.json");

  copyFixture("backend/storage/content.json", contentStorePath);
  copyFixture("backend/storage/site-texts.json", siteTextsStorePath);

  const backendEnv = {
    ...process.env,
    HOST,
    PORT: String(BACKEND_PORT),
    NODE_ENV: "production",
    FRONTEND_ORIGIN: FRONTEND_URL,
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
    UPLOADS_DIR: path.join(storeDir, "uploads"),
  };

  const frontendEnv = {
    ...process.env,
    NODE_ENV: "production",
    BACKEND_INTERNAL_URL: BACKEND_URL,
    NEXT_PUBLIC_BACKEND_URL: BACKEND_URL,
  };

  return {
    backend: startProcess({ cwd: BACKEND_DIR, script: "start", env: backendEnv }),
    frontend: startProcess({
      cwd: FRONTEND_DIR,
      script: "start",
      args: ["--hostname", HOST, "--port", String(FRONTEND_PORT)],
      env: frontendEnv,
    }),
  };
}

async function request(pathname, options = {}) {
  const response = await fetch(`${FRONTEND_URL}${pathname}`, {
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
    headers: { "Content-Type": "text/plain" },
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
  const servers = startServers(tmpDir);
  const children = [servers.backend.child, servers.frontend.child];
  const logsAccessor = () => `${servers.backend.getLogs()}\n${servers.frontend.getLogs()}`;

  try {
    try {
      await waitFor(`${BACKEND_URL}/health`);
      await waitFor(`${FRONTEND_URL}/api/auth/session`);
    } catch (error) {
      console.error(logsAccessor());
      throw error;
    }

    const results = await runChecks(logsAccessor);
    const failed = results.filter((item) => !item.pass);

    results.forEach((item) => {
      console.log(`${item.pass ? "PASS" : "FAIL"} ${item.name} ${item.detail}`);
    });

    assert(
      failed.length === 0,
      `Falhas detectadas: ${failed.map((item) => item.name).join(", ")}`
    );
    console.log("ALL TESTS PASS");
  } finally {
    children.forEach(killProcessTree);
  }
}

main().catch((error) => {
  console.error(error && error.message ? error.message : String(error));
  process.exit(1);
});
