const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const net = require("net");
const os = require("os");
const path = require("path");

const FRONTEND_PORT = Number(process.env.SECURITY_TEST_FRONTEND_PORT ?? 42511);
const BACKEND_PORT = Number(process.env.SECURITY_TEST_BACKEND_PORT ?? 42010);
const CMS_BACKEND_PORT = Number(process.env.SECURITY_TEST_CMS_BACKEND_PORT ?? 42514);
const CMS_PORT = Number(process.env.SECURITY_TEST_CMS_PORT ?? 42513);
const HOST = "127.0.0.1";
const FRONTEND_URL = `http://${HOST}:${FRONTEND_PORT}`;
const BACKEND_URL = `http://${HOST}:${BACKEND_PORT}`;
const CMS_BACKEND_URL = `http://${HOST}:${CMS_BACKEND_PORT}`;
const CMS_URL = `http://${HOST}:${CMS_PORT}`;
const ROOT_DIR = path.resolve(__dirname, "../..");

function requiredTestArtifactDirectory(environmentName, relativePath) {
  const configuredPath = process.env[environmentName]?.trim();
  if (!configuredPath) {
    throw new Error(
      `${environmentName} e obrigatoria; use o artefato isolado ${relativePath.replace(/\\/g, "/")}.`
    );
  }

  const normalizedConfiguredPath = configuredPath.replace(/\\/g, "/");
  const normalizedExpectedPath = relativePath.replace(/\\/g, "/");
  if (normalizedConfiguredPath !== normalizedExpectedPath) {
    throw new Error(
      `${environmentName} deve apontar exatamente para ${normalizedExpectedPath} durante o hardening.`
    );
  }

  return path.join(ROOT_DIR, relativePath);
}

const BACKEND_ARTIFACT_DIR = requiredTestArtifactDirectory(
  "SECURITY_TEST_BACKEND_ARTIFACT_DIR",
  path.join("site", "backend", "dist.test")
);
const CMS_BACKEND_ARTIFACT_DIR = requiredTestArtifactDirectory(
  "SECURITY_TEST_CMS_BACKEND_ARTIFACT_DIR",
  path.join("cms", "backend", "dist.test")
);
const FRONTEND_ARTIFACT_DIR = requiredTestArtifactDirectory(
  "SECURITY_TEST_FRONTEND_ARTIFACT_DIR",
  path.join("site", "frontend", "dist-prod.test")
);
const CMS_ARTIFACT_DIR = requiredTestArtifactDirectory(
  "SECURITY_TEST_CMS_ARTIFACT_DIR",
  path.join("cms", "frontend", "dist-prod.test")
);

const SETUP_CODE = "test-setup-code-2026-safe";
const OWNER_EMAIL = "security-owner@rodogarcia.test";
const OWNER_PASSWORD = "SecurityOwner2026";
const LIMITED_ADMIN_EMAIL = "security-limited@rodogarcia.test";
const LIMITED_ADMIN_TEMPORARY_PASSWORD = "SecurityTemporary2026";
const LIMITED_ADMIN_PASSWORD = "SecurityUpdated2026";
const TEST_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVQImWP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==",
  "base64"
);

const PROCESS_ENV_ALLOWLIST = new Set([
  "APPDATA",
  "COMSPEC",
  "HOME",
  "JAVA_HOME",
  "LANG",
  "LC_ALL",
  "LOCALAPPDATA",
  "NUMBER_OF_PROCESSORS",
  "OS",
  "PATH",
  "PATHEXT",
  "PROGRAMDATA",
  "PROGRAMFILES",
  "PROGRAMFILES(X86)",
  "SYSTEMROOT",
  "TEMP",
  "TMP",
  "TMPDIR",
  "USERPROFILE",
  "WINDIR",
]);

function isolatedProcessEnvironment() {
  return Object.fromEntries(
    Object.entries(process.env).filter(([name]) =>
      PROCESS_ENV_ALLOWLIST.has(name.toUpperCase())
    )
  );
}

const BLOCKED_PATHS = [
  "/.env",
  "/README.md",
  "/docs/checklist-tecnico.md",
  "/scripts/tests/test-security-hardening.js",
  "/site/frontend/src/app/page.tsx",
  "/site/backend/storage/content.json",
  "/site/backend/.env",
  "/admin/.env",
];

const PUBLIC_PATHS = ["/", "/admin/auth/entrar", "/api/public/content", "/api/popup-config"];
const AUTH_PATHS = [
  "/api/admin/content",
  "/api/analytics/config",
  "/api/leads",
  "/api/popup-events",
  "/api/contact",
  "/api/quote",
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const hardeningPorts = [
  { name: "backend", port: BACKEND_PORT },
  { name: "backend do CMS", port: CMS_BACKEND_PORT },
  { name: "site", port: FRONTEND_PORT },
  { name: "CMS", port: CMS_PORT },
];

function standaloneServerPath(artifactDir, label) {
  const serverPath = path.join(artifactDir, "server.js");
  if (!fs.existsSync(serverPath)) {
    throw new Error(`Artefato standalone de ${label} ausente: ${serverPath}`);
  }
  return serverPath;
}

function springServerCommand(artifactDir, label) {
  const serverPath = path.join(artifactDir, "server.jar");
  if (!fs.existsSync(serverPath)) {
    throw new Error(`Artefato Spring de ${label} ausente: ${serverPath}`);
  }
  return { command: "java", args: ["-jar", serverPath] };
}

function readRoutesManifest(artifactDir) {
  // O fluxo normal usa `.next`; o hardening pode usar `.next.test` para não
  // concorrer com um `next dev` manual. Ambos continuam dentro do artefato
  // isolado cuja raiz já foi validada acima.
  const manifestPath = [".next", ".next.test"]
    .map((directory) => path.join(artifactDir, directory, "routes-manifest.json"))
    .find((candidate) => fs.existsSync(candidate)) ?? path.join(artifactDir, ".next", "routes-manifest.json");
  let manifest;

  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (error) {
    throw new Error(
      `Manifesto de rotas do site de teste invalido: ${manifestPath} (${error instanceof Error ? error.message : String(error)}).`
    );
  }

  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new Error(`Manifesto de rotas do site de teste invalido: ${manifestPath}.`);
  }

  const rewrites = manifest.rewrites;
  if (!rewrites || typeof rewrites !== "object" || Array.isArray(rewrites)) {
    throw new Error(`Rewrites ausentes no manifesto de rotas do site de teste: ${manifestPath}.`);
  }

  const entries = Object.values(rewrites).flatMap((section) => (Array.isArray(section) ? section : []));
  if (entries.length === 0) {
    throw new Error(`Rewrites ausentes no manifesto de rotas do site de teste: ${manifestPath}.`);
  }

  return { manifestPath, entries };
}

function assertRewriteDestination({ manifestPath, entries }, source, destination) {
  const matchingEntries = entries.filter(
    (entry) =>
      entry &&
      typeof entry === "object" &&
      !Array.isArray(entry) &&
      entry.source === source
  );

  if (matchingEntries.length === 0) {
    throw new Error(`Rewrite obrigatorio ${source} ausente em ${manifestPath}.`);
  }

  const invalidDestinations = matchingEntries
    .map((entry) => entry.destination)
    .filter((configuredDestination) => configuredDestination !== destination);
  if (invalidDestinations.length > 0) {
    throw new Error(
      `Rewrite ${source} de ${manifestPath} deve apontar para ${destination}; recebeu ${invalidDestinations
        .map((value) => String(value))
        .join(", ")}.`
    );
  }
}

function assertRewritePrecedes({ manifestPath, entries }, source, laterSource) {
  const sourceIndex = entries.findIndex(
    (entry) => entry && typeof entry === "object" && !Array.isArray(entry) && entry.source === source
  );
  const laterIndex = entries.findIndex(
    (entry) => entry && typeof entry === "object" && !Array.isArray(entry) && entry.source === laterSource
  );

  if (sourceIndex === -1 || laterIndex === -1 || sourceIndex >= laterIndex) {
    throw new Error(
      `Rewrite ${source} precisa preceder ${laterSource} em ${manifestPath}.`
    );
  }
}

function validateTestGatewayRewrites() {
  const routesManifest = readRoutesManifest(FRONTEND_ARTIFACT_DIR);
  assertRewriteDestination(routesManifest, "/api/:path*", `${BACKEND_URL}/api/:path*`);
  assertRewriteDestination(routesManifest, "/admin", `${CMS_URL}/admin`);
  assertRewriteDestination(routesManifest, "/admin/:path*", `${CMS_URL}/admin/:path*`);
  const cmsApiSources = [
    "/api/auth/:path*",
    "/api/admin/:path*",
    "/api/public/content",
    "/api/public/seo",
    "/api/public/media-slots",
    "/api/consent-settings",
    "/api/consent-events",
    "/api/tracking/:path*",
    "/api/analytics/:path*",
    "/api/popup-config",
    "/api/popup-events",
    "/api/leads",
    "/api/contact",
    "/api/quote",
    "/api/improvements",
  ];
  cmsApiSources.forEach((source) => {
    assertRewriteDestination(routesManifest, source, `${CMS_BACKEND_URL}${source}`);
    assertRewritePrecedes(routesManifest, source, "/api/:path*");
  });
  assertRewriteDestination(routesManifest, "/uploads/:path*", `${CMS_BACKEND_URL}/uploads/:path*`);
  assertRewriteDestination(
    routesManifest,
    "/public/uploads/:path*",
    `${CMS_BACKEND_URL}/uploads/:path*`
  );
  assertRewritePrecedes(routesManifest, "/public/uploads/:path*", "/public/:path*");
}

function validateHardeningConfiguration() {
  const seenPorts = new Set();
  for (const { name, port } of hardeningPorts) {
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error(`Porta de hardening invalida para ${name}: ${String(port)}.`);
    }
    if (seenPorts.has(port)) {
      throw new Error(`Portas de hardening devem ser distintas; ${port} foi repetida.`);
    }
    seenPorts.add(port);
  }

  springServerCommand(BACKEND_ARTIFACT_DIR, "backend público");
  springServerCommand(CMS_BACKEND_ARTIFACT_DIR, "backend do CMS");
  standaloneServerPath(CMS_ARTIFACT_DIR, "CMS");
  standaloneServerPath(FRONTEND_ARTIFACT_DIR, "site");
  validateTestGatewayRewrites();
}

function assertPortAvailable({ name, port }) {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", (error) => {
      if (error && error.code === "EADDRINUSE") {
        reject(new Error(`Porta de hardening ocupada para ${name}: ${port}.`));
        return;
      }
      reject(
        new Error(
          `Nao foi possivel reservar a porta de hardening para ${name} (${port}): ${
            error instanceof Error ? error.message : String(error)
          }`
        )
      );
    });
    probe.listen({ host: HOST, port, exclusive: true }, () => {
      probe.close((error) => {
        if (error) {
          reject(
            new Error(
              `Nao foi possivel liberar a porta de hardening para ${name} (${port}): ${error.message}`
            )
          );
          return;
        }
        resolve();
      });
    });
  });
}

async function assertHardeningPortsAvailable() {
  for (const item of hardeningPorts) {
    await assertPortAvailable(item);
  }
}

function copyFixture(relativePath, targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(path.join(ROOT_DIR, relativePath), targetPath);
}

function copyDirectoryFixture(relativePath, targetPath) {
  const sourcePath = path.join(ROOT_DIR, relativePath);
  if (!fs.existsSync(sourcePath)) return;
  fs.mkdirSync(targetPath, { recursive: true });
  for (const entry of fs.readdirSync(sourcePath, { withFileTypes: true })) {
    const sourceEntry = path.join(sourcePath, entry.name);
    const targetEntry = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      copyDirectoryFixture(path.relative(ROOT_DIR, sourceEntry), targetEntry);
    } else {
      fs.copyFileSync(sourceEntry, targetEntry);
    }
  }
}

function startStandaloneBuild({ artifactDir, env, label, command }) {
  const serverCommand = command ?? {
    command: process.execPath,
    args: [standaloneServerPath(artifactDir, label)],
  };

  const child = spawn(serverCommand.command, serverCommand.args, {
    cwd: artifactDir,
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

async function waitFor(url, timeoutMs = 90000, expectedStatus) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, { redirect: "manual" });
      if (expectedStatus === undefined
        ? response.status >= 200 && response.status < 500
        : response.status === expectedStatus) return;
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
  const publicStoreDir = path.join(storeDir, "public-backend");
  const cmsStoreDir = path.join(storeDir, "cms-backend");
  const contentStorePath = path.join(cmsStoreDir, "content.json");
  const siteTextsStorePath = path.join(cmsStoreDir, "site-texts.json");

  copyFixture("site/backend/storage/content.json", contentStorePath);
  copyFixture("site/backend/storage/site-texts.json", siteTextsStorePath);
  copyDirectoryFixture("site/backend/storage/uploads", path.join(cmsStoreDir, "uploads"));
  fs.mkdirSync(publicStoreDir, { recursive: true });

  const baseProcessEnvironment = isolatedProcessEnvironment();
  const backendEnv = {
    ...baseProcessEnvironment,
    HOST,
    PORT: String(BACKEND_PORT),
    NODE_ENV: "test",
    FRONTEND_ORIGIN: FRONTEND_URL,
    ADMIN_SETUP_CODE: SETUP_CODE,
    SESSION_SECRET: "test-session-secret-with-more-than-32-characters",
    ESL_OPERATION_SECRET: "test-esl-operation-secret-with-more-than-32-characters",
    STORAGE_ROOT: publicStoreDir,
    RATE_LIMITS_STORE_PATH: path.join(publicStoreDir, "private", "rate-limits.json"),
    UPLOADS_DIR: path.join(publicStoreDir, "uploads"),
    CORS_ORIGINS: `${FRONTEND_URL},${CMS_URL}`,
    TRUST_PROXY: "false",
    ESL_TENANT: "test",
    ESL_GRAPHQL_URL: "https://127.0.0.1:1/graphql",
    GRAPHQL_API_KEY: "test-graphql-api-key",
  };

  const cmsBackendEnv = {
    ...baseProcessEnvironment,
    HOST,
    PORT: String(CMS_BACKEND_PORT),
    NODE_ENV: "test",
    FRONTEND_ORIGIN: FRONTEND_URL,
    CMS_INTERNAL_URL: CMS_URL,
    ADMIN_SETUP_CODE: SETUP_CODE,
    JWT_SECRET: "test-session-secret-with-more-than-32-characters",
    SESSION_SECRET: "test-session-secret-with-more-than-32-characters",
    STORAGE_ROOT: cmsStoreDir,
    CMS_STORAGE_ROOT: cmsStoreDir,
    CONTENT_STORE_PATH: contentStorePath,
    SITE_TEXTS_STORE_PATH: siteTextsStorePath,
    USERS_STORE_PATH: path.join(cmsStoreDir, "users.json"),
    CMS_ACCESS_PROFILES_STORE_PATH: path.join(cmsStoreDir, "cms-access-profiles.json"),
    SESSIONS_STORE_PATH: path.join(cmsStoreDir, "sessions.json"),
    CONTACTS_STORE_PATH: path.join(cmsStoreDir, "contacts.json"),
    QUOTES_STORE_PATH: path.join(cmsStoreDir, "quotes.json"),
    POPUP_CONFIG_STORE_PATH: path.join(cmsStoreDir, "popup-config.json"),
    POPUP_LEADS_STORE_PATH: path.join(cmsStoreDir, "popup-leads.json"),
    POPUP_EVENTS_STORE_PATH: path.join(cmsStoreDir, "popup-events.json"),
    ANALYTICS_STORE_PATH: path.join(cmsStoreDir, "analytics.json"),
    ANALYTICS_CONFIG_PATH: path.join(cmsStoreDir, "analytics-config.json"),
    SEO_SETTINGS_STORE_PATH: path.join(cmsStoreDir, "seo-settings.json"),
    CONSENT_SETTINGS_STORE_PATH: path.join(cmsStoreDir, "consent-settings.json"),
    COOKIE_CONSENTS_STORE_PATH: path.join(cmsStoreDir, "cookie-consents.json"),
    LEADS_STORE_PATH: path.join(cmsStoreDir, "leads.json"),
    IMPROVEMENTS_STORE_PATH: path.join(cmsStoreDir, "improvements.json"),
    IMPROVEMENT_ATTACHMENTS_PATH: path.join(cmsStoreDir, "improvement-attachments"),
    TRACKING_EVENTS_STORE_PATH: path.join(cmsStoreDir, "tracking-events.json"),
    AUDIT_LOG_STORE_PATH: path.join(cmsStoreDir, "audit-log.json"),
    MEDIA_LIBRARY_STORE_PATH: path.join(cmsStoreDir, "media-library.json"),
    MEDIA_SLOTS_STORE_PATH: path.join(cmsStoreDir, "media-slots.json"),
    MEDIA_REPLACE_TRANSACTION_PATH: path.join(cmsStoreDir, "media-replace-transaction.json"),
    CMS_RATE_LIMITS_STORE_PATH: path.join(cmsStoreDir, "cms-rate-limits.json"),
    UPLOADS_DIR: path.join(cmsStoreDir, "uploads"),
    CMS_UPLOADS_DIR: path.join(cmsStoreDir, "uploads"),
    FRONTEND_PUBLIC_DIR: path.join(ROOT_DIR, "site", "frontend", "public"),
    CORS_ORIGINS: `${FRONTEND_URL},${CMS_URL}`,
    TRUST_PROXY: "false",
    LANDING_BUILDER_API_URL: "http://127.0.0.1:1",
    LANDING_BUILDER_SERVICE_TOKEN: "test-landing-builder-service-token-with-32-characters",
  };

  const cmsEnv = {
    ...baseProcessEnvironment,
    NODE_ENV: "production",
    PORT: String(CMS_PORT),
    HOSTNAME: HOST,
    CMS_BACKEND_INTERNAL_URL: CMS_BACKEND_URL,
    CMS_BACKEND_PROXY_URL: CMS_BACKEND_URL,
    NEXT_PUBLIC_SITE_URL: FRONTEND_URL,
  };

  const frontendEnv = {
    ...baseProcessEnvironment,
    NODE_ENV: "production",
    PORT: String(FRONTEND_PORT),
    HOSTNAME: HOST,
    BACKEND_PROXY_URL: "",
    NEXT_PUBLIC_BACKEND_PROXY_URL: "",
    BACKEND_INTERNAL_URL: BACKEND_URL,
    NEXT_PUBLIC_BACKEND_URL: BACKEND_URL,
    CMS_INTERNAL_URL: CMS_URL,
    CMS_BACKEND_INTERNAL_URL: CMS_BACKEND_URL,
    NEXT_PUBLIC_SITE_URL: FRONTEND_URL,
  };

  const started = [];
  try {
    const backend = startStandaloneBuild({
      artifactDir: BACKEND_ARTIFACT_DIR,
      env: backendEnv,
      label: "backend Spring público",
      command: springServerCommand(BACKEND_ARTIFACT_DIR, "backend público"),
    });
    started.push(backend);
    const cmsBackend = startStandaloneBuild({
      artifactDir: CMS_BACKEND_ARTIFACT_DIR,
      env: cmsBackendEnv,
      label: "backend Spring do CMS",
      command: springServerCommand(CMS_BACKEND_ARTIFACT_DIR, "backend do CMS"),
    });
    started.push(cmsBackend);
    const cms = startStandaloneBuild({ artifactDir: CMS_ARTIFACT_DIR, env: cmsEnv, label: "CMS" });
    started.push(cms);
    const frontend = startStandaloneBuild({ artifactDir: FRONTEND_ARTIFACT_DIR, env: frontendEnv, label: "site" });
    started.push(frontend);
    return { backend, cmsBackend, cms, frontend };
  } catch (error) {
    started.forEach(({ child }) => killProcessTree(child));
    throw error;
  }
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

function getSetCookieHeaders(response) {
  if (typeof response.headers.getSetCookie === "function") {
    return response.headers.getSetCookie();
  }

  const setCookie = response.headers.get("set-cookie");
  return setCookie ? [setCookie] : [];
}

function getCookieHeader(response) {
  return getSetCookieHeaders(response)
    .map((value) => value.split(";", 1)[0])
    .filter(Boolean)
    .join("; ");
}

function requestHeaders({ cookie = "", csrfToken = "", json = false } = {}) {
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    Origin: FRONTEND_URL,
    ...(cookie ? { Cookie: cookie } : {}),
    ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
  };
}

function result(name, pass, detail) {
  return { name, pass, detail };
}

async function runPositiveAdminFlowChecks() {
  const results = [];

  const setupStatus = await request("/api/auth/setup");
  results.push(
    result(
      "AUTH setup status",
      setupStatus.response.status === 200 && setupStatus.payload?.setupRequired === true,
      `status=${setupStatus.response.status}; setupRequired=${String(setupStatus.payload?.setupRequired)}`
    )
  );

  const setup = await request("/api/auth/register", {
    method: "POST",
    headers: requestHeaders({ json: true }),
    body: JSON.stringify({
      name: "Security Owner",
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD,
      confirmPassword: OWNER_PASSWORD,
      setupCode: SETUP_CODE,
    }),
  });
  results.push(
    result(
      "AUTH setup owner",
      setup.response.status === 201 && setup.payload?.user?.email === OWNER_EMAIL && setup.payload?.user?.isOwner === true,
      `status=${setup.response.status}`
    )
  );

  const ownerLogin = await request("/api/auth/login", {
    method: "POST",
    headers: requestHeaders({ json: true }),
    body: JSON.stringify({ email: OWNER_EMAIL, password: OWNER_PASSWORD }),
  });
  const ownerCookie = getCookieHeader(ownerLogin.response);
  const ownerCsrfToken = typeof ownerLogin.payload?.csrfToken === "string" ? ownerLogin.payload.csrfToken : "";
  const ownerCookieHeaders = getSetCookieHeaders(ownerLogin.response);
  const hasSafeSessionCookie = ownerCookieHeaders.some(
    (value) =>
      /^sid=[^;]+/i.test(value) &&
      /;\s*path=\//i.test(value) &&
      /;\s*httponly/i.test(value) &&
      /;\s*samesite=strict/i.test(value) &&
      !/;\s*max-age=/i.test(value)
  );
  results.push(
    result(
      "AUTH login and session cookie",
      ownerLogin.response.status === 200 && Boolean(ownerCookie) && Boolean(ownerCsrfToken) && hasSafeSessionCookie,
      `status=${ownerLogin.response.status}; cookie=${hasSafeSessionCookie ? "safe" : "invalid"}`
    )
  );

  const ownerSession = await request("/api/auth/session", {
    headers: ownerCookie ? { Cookie: ownerCookie } : {},
  });
  results.push(
    result(
      "AUTH session",
      ownerSession.response.status === 200 &&
        ownerSession.payload?.authenticated === true &&
        ownerSession.payload?.user?.email === OWNER_EMAIL &&
        ownerSession.payload?.csrfToken === ownerCsrfToken,
      `status=${ownerSession.response.status}; authenticated=${String(ownerSession.payload?.authenticated)}`
    )
  );

  const invalidCsrf = await request("/api/auth/cms-theme", {
    method: "PATCH",
    headers: requestHeaders({ cookie: ownerCookie, csrfToken: "invalid-csrf-token", json: true }),
    body: JSON.stringify({ theme: "dark" }),
  });
  results.push(
    result(
      "CSRF rejects invalid token",
      invalidCsrf.response.status === 403,
      `status=${invalidCsrf.response.status}`
    )
  );

  const validCsrf = await request("/api/auth/cms-theme", {
    method: "PATCH",
    headers: requestHeaders({ cookie: ownerCookie, csrfToken: ownerCsrfToken, json: true }),
    body: JSON.stringify({ theme: "dark" }),
  });
  results.push(
    result(
      "CSRF accepts valid token",
      validCsrf.response.status === 200 && validCsrf.payload?.user?.cmsTheme === "dark",
      `status=${validCsrf.response.status}`
    )
  );

  const createLimitedAdmin = await request("/api/admin/users", {
    method: "POST",
    headers: requestHeaders({ cookie: ownerCookie, csrfToken: ownerCsrfToken, json: true }),
    body: JSON.stringify({
      name: "Security Limited Admin",
      email: LIMITED_ADMIN_EMAIL,
      password: LIMITED_ADMIN_TEMPORARY_PASSWORD,
      confirmPassword: LIMITED_ADMIN_TEMPORARY_PASSWORD,
      role: "admin",
      cmsPermissions: ["dashboard", "popup"],
    }),
  });
  results.push(
    result(
      "ACL creates limited administrator",
      createLimitedAdmin.response.status === 201 &&
        createLimitedAdmin.payload?.createdUser?.email === LIMITED_ADMIN_EMAIL &&
        createLimitedAdmin.payload?.createdUser?.passwordChangeRequired === true,
      `status=${createLimitedAdmin.response.status}`
    )
  );

  const limitedLogin = await request("/api/auth/login", {
    method: "POST",
    headers: requestHeaders({ json: true }),
    body: JSON.stringify({ email: LIMITED_ADMIN_EMAIL, password: LIMITED_ADMIN_TEMPORARY_PASSWORD }),
  });
  const limitedCookie = getCookieHeader(limitedLogin.response);
  const limitedCsrfToken = typeof limitedLogin.payload?.csrfToken === "string" ? limitedLogin.payload.csrfToken : "";
  results.push(
    result(
      "AUTH temporary administrator login",
      limitedLogin.response.status === 200 &&
        Boolean(limitedCookie) &&
        Boolean(limitedCsrfToken) &&
        limitedLogin.payload?.user?.passwordChangeRequired === true,
      `status=${limitedLogin.response.status}`
    )
  );

  const beforePasswordChange = await request("/api/admin/content", {
    headers: limitedCookie ? { Cookie: limitedCookie } : {},
  });
  results.push(
    result(
      "AUTH password change gate",
      beforePasswordChange.response.status === 403,
      `status=${beforePasswordChange.response.status}`
    )
  );

  const changePassword = await request("/api/auth/change-password", {
    method: "POST",
    headers: requestHeaders({ cookie: limitedCookie, csrfToken: limitedCsrfToken, json: true }),
    body: JSON.stringify({
      currentPassword: LIMITED_ADMIN_TEMPORARY_PASSWORD,
      password: LIMITED_ADMIN_PASSWORD,
      confirmPassword: LIMITED_ADMIN_PASSWORD,
    }),
  });
  results.push(
    result(
      "AUTH changes temporary password",
      changePassword.response.status === 200 && changePassword.payload?.user?.passwordChangeRequired === false,
      `status=${changePassword.response.status}`
    )
  );

  const dashboardAllowed = await request("/api/admin/content", {
    headers: limitedCookie ? { Cookie: limitedCookie } : {},
  });
  results.push(
    result(
      "ACL allows assigned dashboard",
      dashboardAllowed.response.status === 200,
      `status=${dashboardAllowed.response.status}`
    )
  );

  const popupEventsAllowed = await request("/api/popup-events?days=30", {
    headers: limitedCookie ? { Cookie: limitedCookie } : {},
  });
  results.push(
    result(
      "ACL allows assigned popup events",
      popupEventsAllowed.response.status === 200,
      `status=${popupEventsAllowed.response.status}`
    )
  );

  const popupConfig = await request("/api/popup-config");
  const popupConfigUpdate = await request("/api/popup-config", {
    method: "POST",
    headers: requestHeaders({ cookie: limitedCookie, csrfToken: limitedCsrfToken, json: true }),
    body: JSON.stringify(popupConfig.payload?.config ?? {}),
  });
  results.push(
    result(
      "ACL allows assigned popup configuration",
      popupConfigUpdate.response.status === 200,
      `status=${popupConfigUpdate.response.status}`
    )
  );

  const popupLeadsDenied = await request("/api/leads", {
    headers: limitedCookie ? { Cookie: limitedCookie } : {},
  });
  const contactsDenied = await request("/api/contact", {
    headers: limitedCookie ? { Cookie: limitedCookie } : {},
  });
  const quotesDenied = await request("/api/quote", {
    headers: limitedCookie ? { Cookie: limitedCookie } : {},
  });
  results.push(
    result(
      "ACL denies unassigned lead data",
      [popupLeadsDenied, contactsDenied, quotesDenied].every(({ response }) => response.status === 403),
      `popup=${popupLeadsDenied.response.status}; contact=${contactsDenied.response.status}; quote=${quotesDenied.response.status}`
    )
  );

  const imagesDenied = await request("/api/admin/images", {
    headers: limitedCookie ? { Cookie: limitedCookie } : {},
  });
  results.push(
    result(
      "ACL denies unassigned images",
      imagesDenied.response.status === 403,
      `status=${imagesDenied.response.status}`
    )
  );

  const formData = new FormData();
  formData.append("image", new Blob([TEST_PNG], { type: "image/png" }), "security-check.png");
  const upload = await request("/api/admin/images", {
    method: "POST",
    headers: requestHeaders({ cookie: ownerCookie, csrfToken: ownerCsrfToken }),
    body: formData,
  });
  const uploadedUrl = typeof upload.payload?.image?.url === "string" ? upload.payload.image.url : "";
  results.push(
    result(
      "MEDIA upload image with CSRF",
      upload.response.status === 201 && uploadedUrl.startsWith("/uploads/") && uploadedUrl.endsWith(".webp"),
      `status=${upload.response.status}`
    )
  );

  const uploadedMedia = uploadedUrl ? await request(uploadedUrl) : null;
  results.push(
    result(
      "MEDIA uploaded image served by gateway",
      uploadedMedia?.response.status === 200 &&
        String(uploadedMedia.response.headers.get("content-type") || "").includes("image/webp"),
      `status=${uploadedMedia?.response.status ?? "not-requested"}`
    )
  );

  const logout = await request("/api/auth/logout", {
    method: "POST",
    headers: requestHeaders({ cookie: ownerCookie, csrfToken: ownerCsrfToken }),
  });
  const clearsSessionCookie = getSetCookieHeaders(logout.response).some(
    (value) => /^sid=;/i.test(value) && /;\s*max-age=0/i.test(value)
  );
  results.push(
    result(
      "AUTH logout",
      logout.response.status === 200 && clearsSessionCookie,
      `status=${logout.response.status}; cookie=${clearsSessionCookie ? "cleared" : "not-cleared"}`
    )
  );

  const sessionAfterLogout = await request("/api/auth/session", {
    headers: ownerCookie ? { Cookie: ownerCookie } : {},
  });
  results.push(
    result(
      "AUTH session revoked after logout",
      sessionAfterLogout.response.status === 200 && sessionAfterLogout.payload?.authenticated === false,
      `status=${sessionAfterLogout.response.status}; authenticated=${String(sessionAfterLogout.payload?.authenticated)}`
    )
  );

  return results;
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

  const { response: publicHome } = await request("/");
  const publicCsp = String(publicHome.headers.get("content-security-policy") || "");
  const leakedInternalOrigins = [BACKEND_URL, CMS_BACKEND_URL, CMS_URL].filter((origin) =>
    publicCsp.includes(origin)
  );
  results.push({
    name: "PUBLIC CSP hides internal origins",
    pass: publicHome.status === 200 && leakedInternalOrigins.length === 0,
    detail:
      leakedInternalOrigins.length === 0
        ? `status=${publicHome.status}; origins=hidden`
        : `status=${publicHome.status}; leaked=${leakedInternalOrigins.join(",")}`,
  });

  const sitemap = await fetch(`${FRONTEND_URL}/sitemap.xml`, { redirect: "manual" });
  const sitemapBody = await sitemap.text();
  results.push({
    name: "SITEMAP uses configured public site URL",
    pass: sitemap.status === 200 && sitemapBody.includes(`${FRONTEND_URL}/sobre`),
    detail: `status=${sitemap.status}; configured-url=${sitemapBody.includes(FRONTEND_URL)}`,
  });

  for (const pathname of AUTH_PATHS) {
    const { response } = await request(pathname);
    results.push({
      name: `AUTH ${pathname}`,
      pass: response.status === 401,
      detail: `status=${response.status}`,
    });
  }

  for (const pathname of ["/coleta", "/solicitar-coleta"]) {
    const { response } = await request(pathname);
    const location = response.headers.get("location") || "";
    const destination = location ? new URL(location, FRONTEND_URL).pathname : "";
    results.push({
      name: `REDIRECT ${pathname}`,
      pass: [307, 308].includes(response.status) && destination === "/coletas",
      detail: `status=${response.status}; destination=${destination || "(ausente)"}`,
    });
  }

  const { response: cmsGatewayLogin } = await request("/admin/auth/entrar");
  const cmsGatewayCsp = String(cmsGatewayLogin.headers.get("content-security-policy") || "");
  results.push({
    name: "CMS GATEWAY noindex",
    pass: String(cmsGatewayLogin.headers.get("x-robots-tag") || "").includes("noindex"),
    detail: `x-robots-tag=${cmsGatewayLogin.headers.get("x-robots-tag") || "(ausente)"}`,
  });
  results.push({
    name: "CMS GATEWAY framing",
    pass:
      cmsGatewayLogin.headers.get("x-frame-options") === "DENY" &&
      cmsGatewayCsp.includes("frame-ancestors 'none'"),
    detail: `x-frame-options=${cmsGatewayLogin.headers.get("x-frame-options") || "(ausente)"}`,
  });

  const { response: preview } = await request("/?preview=cms");
  const previewCsp = String(preview.headers.get("content-security-policy") || "");
  results.push({
    name: "CMS PREVIEW same-origin",
    pass:
      preview.status === 200 &&
      preview.headers.get("x-frame-options") === "SAMEORIGIN" &&
      previewCsp.includes("frame-ancestors 'self'"),
    detail: `status=${preview.status}; x-frame-options=${preview.headers.get("x-frame-options") || "(ausente)"}`,
  });

  const cmsDirect = await fetch(`${CMS_URL}/admin/auth/entrar`, { redirect: "manual" });
  const cmsDirectCsp = String(cmsDirect.headers.get("content-security-policy") || "");
  results.push({
    name: "CMS STANDALONE framing",
    pass:
      cmsDirect.status === 200 &&
      cmsDirect.headers.get("x-frame-options") === "DENY" &&
      cmsDirectCsp.includes("frame-ancestors 'none'"),
    detail: `status=${cmsDirect.status}; x-frame-options=${cmsDirect.headers.get("x-frame-options") || "(ausente)"}`,
  });

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

  const collectionUpdateWithoutCapability = await request("/api/collections/359397", {
    method: "PATCH",
    headers: requestHeaders({ json: true }),
    body: JSON.stringify({ comments: "Tentativa sem capability" }),
  });
  const collectionCancelWithoutCapability = await request("/api/collections/359397/cancel", {
    method: "POST",
    headers: requestHeaders({ json: true }),
    body: JSON.stringify({ reason: "CLIENTE_SOLICITOU" }),
  });
  results.push({
    name: "ESL collection maintenance requires capability",
    pass:
      collectionUpdateWithoutCapability.response.status === 403 &&
      collectionCancelWithoutCapability.response.status === 403,
    detail: `patch=${collectionUpdateWithoutCapability.response.status}; cancel=${collectionCancelWithoutCapability.response.status}`,
  });

  results.push(...(await runPositiveAdminFlowChecks()));

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
  validateHardeningConfiguration();
  await assertHardeningPortsAvailable();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rodogarcia-security-test-"));
  const servers = startServers(tmpDir);
  const children = [
    servers.backend.child,
    servers.cmsBackend.child,
    servers.cms.child,
    servers.frontend.child,
  ];
  const logsAccessor = () =>
    `${servers.backend.getLogs()}\n${servers.cmsBackend.getLogs()}\n${servers.cms.getLogs()}\n${servers.frontend.getLogs()}`;

  try {
    try {
      await waitFor(`${BACKEND_URL}/health`, 90000, 200);
      await waitFor(`${BACKEND_URL}/ready`, 90000, 200);
      await waitFor(`${CMS_BACKEND_URL}/health`, 90000, 200);
      await waitFor(`${CMS_BACKEND_URL}/ready`, 90000, 200);
      await waitFor(`${CMS_URL}/admin/auth/entrar`);
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
