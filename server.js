/* ==[DOC-FILE]===============================================================
Arquivo : server.js
Modulo  : Servidor HTTP principal
Papel   : Orquestra o backend HTTP (rotas publicas, auth, admin e arquivos estaticos) com persistencia local.

Responsabilidades:
- Carrega configuracao de ambiente, seguranca e stores locais de dados.
- Roteia acessos publicos, autenticados e endpoints administrativos.
- Aplica sessao, CSRF, validacao de payload e leitura/escrita de conteudo.

Integracoes:
- Dependencias: http, fs, path, crypto, ./server/routes/developerRoutes, ./server/config/adminSetup, ./server/repositories/userStore
- Endpoints/rotas: /api/public/content, /api/auth/session, /api/auth/login, /api/auth/register, /api/auth/logout, /api/admin/content, /api/admin/
- Classes/seletores/chaves: nao se aplica para este modulo.

Entradas e saidas:
- Entradas: Requisicoes HTTP, cookies, payload JSON e variaveis de ambiente.
- Saidas  : Respostas HTTP, persistencia em JSON e cabecalhos de seguranca.

Elementos tecnicos: loadEnvFile, resolveStorePath, resolveLegacyAdminDestination, handleRequest, handleApi, handleLogin, handleRegister, handleLogout, handleAdminEntityRoutes, createEntityItem
[DOC-FILE-END]============================================================== */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createDeveloperRoutes } = require('./server/routes/developerRoutes');
const { resolveAdminSetupConfig } = require('./server/config/adminSetup');
const { createUserStore } = require('./server/repositories/userStore');

loadEnvFile(path.join(__dirname, '.env'));

const PORT = Number(process.env.PORT) || 5010;
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'server', 'storage');
const CONTENT_FILE = resolveStorePath(path.join(DATA_DIR, 'content.json'), process.env.CONTENT_STORE_PATH);
const SITE_TEXTS_FILE = resolveStorePath(path.join(DATA_DIR, 'site-texts.json'), process.env.SITE_TEXTS_STORE_PATH);
const LEGACY_USERS_FILE = path.join(ROOT_DIR, 'server', 'private', 'users.json');

const IS_PROD = process.env.NODE_ENV === 'production';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const MAX_BODY_BYTES = 4 * 1024 * 1024;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 8;
const PBKDF2_ITERATIONS = 120000;
let adminSetupConfig;
try {
  adminSetupConfig = resolveAdminSetupConfig({
    env: process.env,
    isProduction: IS_PROD
  });
} catch (error) {
  console.error(`[config] ${error.message}`);
  process.exit(1);
}

const ADMIN_SETUP_CODE = adminSetupConfig.code;
const userStore = createUserStore({
  rootDir: ROOT_DIR,
  usersFilePath: process.env.USERS_STORE_PATH,
  legacyFilePath: LEGACY_USERS_FILE
});

const sessions = new Map();
const loginAttempts = new Map();

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const valueRaw = trimmed.slice(separatorIndex + 1).trim();
    if (!key) continue;

    let value = valueRaw;
    const quoted =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"));

    if (quoted && value.length >= 2) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function resolveStorePath(defaultPath, customPath) {
  if (!customPath) return defaultPath;
  if (path.isAbsolute(customPath)) return path.normalize(customPath);
  return path.normalize(path.join(ROOT_DIR, customPath));
}
const redirectMap = new Map([
  ['/index.html', { destination: '/', statusCode: 301 }],
  ['/inicio', { destination: '/', statusCode: 301 }],
  ['/institucional', { destination: '/sobre.html', statusCode: 301 }],
  ['/quem-somos', { destination: '/sobre.html', statusCode: 301 }],
  ['/trabalhe-conosco', { destination: '/trabalhe-conosco.html', statusCode: 301 }],
  ['/imprensa', { destination: '/imprensa.html', statusCode: 301 }],
  ['/servicos', { destination: '/servicos.html', statusCode: 301 }],
  ['/nossos-servicos', { destination: '/servicos.html', statusCode: 301 }],
  ['/solicitar-cotacao', { destination: '/cotacao.html', statusCode: 301 }],
  ['/rastrear-encomenda', { destination: 'https://rodogarcia.eslcloud.com.br/recipient_tracking', statusCode: 302 }],
  ['/para-empresas', { destination: '/para-empresas.html', statusCode: 301 }],
  ['/ajuda', { destination: '/central-ajuda.html', statusCode: 301 }],
  ['/central-ajuda', { destination: '/central-ajuda.html', statusCode: 301 }],
  ['/central-de-ajuda', { destination: '/central-ajuda.html', statusCode: 301 }],
  ['/fale-conosco', { destination: '/fale-conosco.html', statusCode: 301 }],
  ['/termos-de-uso', { destination: '/termos-de-uso.html', statusCode: 301 }],
  ['/entrar.html', { destination: '/auth/entrar.html', statusCode: 301 }],
  ['/criar-conta.html', { destination: '/auth/criar-conta.html', statusCode: 301 }],
  ['/auth', { destination: '/auth/entrar.html', statusCode: 302 }],
  ['/developer', { destination: '/developer/index.html', statusCode: 302 }]
]);

const routeMap = new Map([
  ['/', '/src/index.html'],
  ['/servicos.html', '/src/servicos.html'],
  ['/sobre.html', '/src/sobre.html'],
  ['/cotacao.html', '/src/cotacao.html'],
  ['/trabalhe-conosco.html', '/src/trabalhe-conosco.html'],
  ['/imprensa.html', '/src/imprensa.html'],
  ['/para-empresas.html', '/src/para-empresas.html'],
  ['/central-ajuda.html', '/src/central-ajuda.html'],
  ['/fale-conosco.html', '/src/fale-conosco.html'],
  ['/termos-de-uso.html', '/src/termos-de-uso.html']
]);

const mimeTypes = {
  '.avif': 'image/avif',
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8'
};

const DEFAULT_CONTENT = { heroSlides: [], dnaSlides: [], vagas: [] };
const DEFAULT_SITE_TEXTS = {
  dashboardTitle: 'Painel de gerenciamento de conteudo',
  dashboardSubtitle: 'Atualize conteudo do site com controle e seguranca.',
  heroSectionTitle: 'Destaques do Hero',
  heroSectionSubtitle: 'Edite titulos, descricoes, botoes e imagens do carrossel principal.',
  dnaSectionTitle: 'DNA da Rodogarcia',
  dnaSectionSubtitle: 'Mantenha os destaques institucionais sempre atualizados.',
  vagasSectionTitle: 'Vagas em destaque',
  vagasSectionSubtitle: 'Gerencie vagas em destaque com status e ordenacao.',
  ctaPrimaryLabel: 'Solicitar Cotacao',
  ctaPrimaryUrl: '/cotacao.html',
  ctaSecondaryLabel: 'Fale Conosco',
  ctaSecondaryUrl: '/fale-conosco.html'
};
const RESTRICTED_PREFIXES = ['/server/', '/backups/', '/.git', '/.vscode'];
const RESTRICTED_EXACT = new Set(['/server.js', '/package.json', '/.gitignore', '/vercel.json']);

const VAGA_STATUS_MAP = { novo: 'Novo', disponivel: 'Disponivel', encerrado: 'Encerrado' };
const VAGA_WORK_TYPE_MAP = { remoto: 'Remoto', presencial: 'Presencial', hibrido: 'Hibrido' };
const VAGA_CONTRACT_TYPE_MAP = { integral: 'Integral', meioperiodo: 'Meio periodo' };

const developerRoutes = createDeveloperRoutes({
  getAuthContext,
  requireAuth,
  sendJson,
  redirectResponse,
  publicUser,
  readContentData,
  writeContentData,
  readSiteTextsData,
  writeSiteTextsData,
  readJsonBody,
  verifyCsrf,
  sanitizeText,
  sanitizeUrl,
  rootDir: ROOT_DIR
});

ensureDataFiles();

setInterval(() => {
  const now = Date.now();
  for (const [sid, session] of sessions.entries()) {
    if (session.expiresAt <= now) sessions.delete(sid);
  }
  for (const [key, item] of loginAttempts.entries()) {
    if (item.resetAt <= now) loginAttempts.delete(key);
  }
}, 5 * 60 * 1000).unref();

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch((error) => {
    console.error('[server] erro nao tratado:', error);
    sendJson(res, 500, { error: 'Erro interno do servidor.' });
  });
});

server.on('error', (error) => {
  if (error && error.code === 'EADDRINUSE') {
    console.error(`Porta ${PORT} ja esta em uso. Feche o processo atual ou altere PORT no .env.`);
    process.exit(1);
    return;
  }

  console.error('Falha ao iniciar servidor:', error);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Modo: ${IS_PROD ? 'producao' : 'desenvolvimento'}`);
  console.log(`Store de usuarios: ${userStore.filePath}`);
  if (adminSetupConfig.source === 'generated-dev') {
    adminSetupConfig.warnings.forEach((warning) => {
      console.warn(`[config] ${warning}`);
    });
  }
});

function resolveLegacyAdminDestination(pathname) {
  if (pathname !== '/admin' && !pathname.startsWith('/admin/')) {
    return '';
  }

  const legacyMap = new Map([
    ['/admin', '/developer/index.html?page=dashboard'],
    ['/admin/', '/developer/index.html?page=dashboard'],
    ['/admin/index.html', '/developer/index.html?page=dashboard'],
    ['/admin/carrosseis.html', '/developer/index.html?page=carrossel-hero'],
    ['/admin/vagas.html', '/developer/index.html?page=vagas']
  ]);

  return legacyMap.get(pathname) || '/developer/index.html?page=dashboard';
}

async function handleRequest(req, res) {
  const host = req.headers.host || `localhost:${PORT}`;
  const parsedUrl = new URL(req.url, `http://${host}`);
  let pathname;

  try {
    pathname = decodeURIComponent(parsedUrl.pathname);
  } catch {
    sendJson(res, 400, { error: 'URL invalida.' });
    return;
  }

  const legacyAdminDestination = resolveLegacyAdminDestination(pathname);
  if (legacyAdminDestination) {
    redirectResponse(res, 302, legacyAdminDestination);
    return;
  }

  const redirect = redirectMap.get(pathname);
  if (redirect) {
    redirectResponse(res, redirect.statusCode, `${redirect.destination}${parsedUrl.search}`);
    return;
  }

  if (isUnsafeMethod(req.method) && !isSameOriginRequest(req)) {
    sendJson(res, 403, { error: 'Origem da requisicao nao permitida.' });
    return;
  }

  if (pathname.startsWith('/api/')) {
    await handleApi(req, res, pathname);
    return;
  }

  if (developerRoutes.guardDeveloperPages(req, res, pathname, parsedUrl.search)) {
    return;
  }

  serveStaticFile(req, res, pathname);
}
async function handleApi(req, res, pathname) {
  if (pathname === '/api/public/content' && req.method === 'GET') {
    const data = preparePublicContent(readContentData());
    sendJson(res, 200, data);
    return;
  }

  if (pathname === '/api/auth/session' && req.method === 'GET') {
    const authContext = getAuthContext(req);
    const setupRequired = readUsersData().users.length === 0;

    if (!authContext) {
      sendJson(res, 200, { authenticated: false, setupRequired });
      return;
    }

    sendJson(res, 200, {
      authenticated: true,
      user: publicUser(authContext.user),
      csrfToken: authContext.session.csrfToken,
      expiresAt: authContext.session.expiresAt,
      setupRequired
    });
    return;
  }

  if (pathname === '/api/auth/login' && req.method === 'POST') {
    await handleLogin(req, res);
    return;
  }

  if (pathname === '/api/auth/register' && req.method === 'POST') {
    await handleRegister(req, res);
    return;
  }

  if (pathname === '/api/auth/logout' && req.method === 'POST') {
    await handleLogout(req, res);
    return;
  }

  if (pathname === '/api/admin/content' && req.method === 'GET') {
    const authContext = requireAuth(req, res);
    if (!authContext) return;

    const content = readContentData();
    content.heroSlides = sortByOrder(content.heroSlides);
    content.dnaSlides = sortByOrder(content.dnaSlides);
    content.vagas = sortByOrder(content.vagas);

    sendJson(res, 200, {
      user: publicUser(authContext.user),
      csrfToken: authContext.session.csrfToken,
      content
    });
    return;
  }

  if (pathname.startsWith('/api/admin/')) {
    await handleAdminEntityRoutes(req, res, pathname);
    return;
  }

  if (await developerRoutes.handleDeveloperApi(req, res, pathname)) {
    return;
  }

  sendJson(res, 404, { error: 'Endpoint nao encontrado.' });
}

async function handleLogin(req, res) {
  const ip = getClientIp(req);
  const remainingMs = getRateLimitRemaining(ip);
  if (remainingMs > 0) {
    sendJson(res, 429, {
      error: 'Muitas tentativas. Tente novamente em instantes.',
      retryAfterMs: remainingMs
    });
    return;
  }

  const contentType = String(req.headers['content-type'] || '');
  if (!contentType.includes('application/json')) {
    sendJson(res, 415, { error: 'Content-Type deve ser application/json.' });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    sendJson(res, error.statusCode || 400, { error: error.message || 'JSON invalido.' });
    return;
  }

  const email = sanitizeEmail(body.email);
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !password) {
    recordLoginFailure(ip);
    sendJson(res, 400, { error: 'E-mail e senha sao obrigatorios.' });
    return;
  }

  const usersData = readUsersData();
  const user = usersData.users.find((item) => item.email === email && item.active !== false);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    recordLoginFailure(ip);
    sendJson(res, 401, { error: 'Credenciais invalidas.' });
    return;
  }

  clearLoginFailures(ip);

  const created = createSession(user.id);
  setSessionCookie(res, created.sid);

  sendJson(res, 200, {
    message: 'Autenticado com sucesso.',
    user: publicUser(user),
    csrfToken: created.csrfToken,
    expiresAt: created.expiresAt
  });
}

async function handleRegister(req, res) {
  const contentType = String(req.headers['content-type'] || '');
  if (!contentType.includes('application/json')) {
    sendJson(res, 415, { error: 'Content-Type deve ser application/json.' });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    sendJson(res, error.statusCode || 400, { error: error.message || 'JSON invalido.' });
    return;
  }

  const name = sanitizeText(body.name, 80);
  const email = sanitizeEmail(body.email);
  const password = typeof body.password === 'string' ? body.password : '';
  const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : '';
  const setupCode = typeof body.setupCode === 'string' ? body.setupCode.trim() : '';

  if (!name || !email || !password || !confirmPassword) {
    sendJson(res, 400, { error: 'Preencha nome, e-mail e senha.' });
    return;
  }

  if (password !== confirmPassword) {
    sendJson(res, 400, { error: 'As senhas nao conferem.' });
    return;
  }

  const passwordErrors = validatePasswordStrength(password);
  if (passwordErrors.length > 0) {
    sendJson(res, 400, { error: passwordErrors[0] });
    return;
  }

  const usersData = readUsersData();
  const existing = usersData.users.find((item) => item.email === email);
  if (existing) {
    sendJson(res, 409, { error: 'Ja existe conta com este e-mail.' });
    return;
  }

  const hasAnyUser = usersData.users.length > 0;

  if (hasAnyUser) {
    const authContext = requireAuth(req, res);
    if (!authContext) return;
    if (!verifyCsrf(req, res, authContext.session)) return;

    if (authContext.user.role !== 'admin') {
      sendJson(res, 403, { error: 'Somente administradores podem criar novas contas.' });
      return;
    }
  } else if (!setupCode || setupCode !== ADMIN_SETUP_CODE) {
    sendJson(res, 403, { error: 'Codigo de configuracao invalido para cadastro inicial.' });
    return;
  }

  const nowIso = new Date().toISOString();
  const newUser = {
    id: generateId('usr'),
    name,
    email,
    role: 'admin',
    active: true,
    createdAt: nowIso,
    passwordHash: hashPassword(password)
  };

  usersData.users.push(newUser);
  writeUsersData(usersData);

  if (!hasAnyUser) {
    const created = createSession(newUser.id);
    setSessionCookie(res, created.sid);
    sendJson(res, 201, {
      message: 'Conta inicial criada e sessao iniciada.',
      user: publicUser(newUser),
      csrfToken: created.csrfToken,
      expiresAt: created.expiresAt
    });
    return;
  }

  sendJson(res, 201, {
    message: 'Conta criada com sucesso.',
    user: publicUser(newUser)
  });
}

async function handleLogout(req, res) {
  const authContext = getAuthContext(req);
  if (authContext && !verifyCsrf(req, res, authContext.session)) return;

  if (authContext) {
    destroySession(authContext.sid);
  }

  clearSessionCookie(res);
  sendJson(res, 200, { message: 'Sessao encerrada.' });
}

async function handleAdminEntityRoutes(req, res, pathname) {
  const authContext = requireAuth(req, res);
  if (!authContext) return;

  const route = parseAdminEntityPath(pathname);
  if (!route) {
    sendJson(res, 404, { error: 'Recurso administrativo nao encontrado.' });
    return;
  }

  const { entity, id, isReorder } = route;
  const collectionKey = collectionKeyFromEntity(entity);
  if (!collectionKey) {
    sendJson(res, 404, { error: 'Tipo de recurso invalido.' });
    return;
  }

  if (req.method === 'GET' && !id && !isReorder) {
    const content = readContentData();
    sendJson(res, 200, { items: sortByOrder(content[collectionKey]) });
    return;
  }

  if (!verifyCsrf(req, res, authContext.session)) return;

  if (isReorder && req.method === 'POST') {
    let body;
    try {
      body = await readJsonBody(req);
    } catch (error) {
      sendJson(res, error.statusCode || 400, { error: error.message || 'JSON invalido.' });
      return;
    }

    const orderedIds = Array.isArray(body.orderedIds) ? body.orderedIds.map(String) : [];
    const content = readContentData();
    const currentCollection = sortByOrder(content[collectionKey]);
    const mapById = new Map(currentCollection.map((item) => [item.id, item]));

    let order = 1;
    const touched = new Set();

    for (const itemId of orderedIds) {
      const item = mapById.get(itemId);
      if (!item || touched.has(itemId)) continue;
      item.order = order;
      order += 1;
      touched.add(itemId);
    }

    for (const item of currentCollection) {
      if (touched.has(item.id)) continue;
      item.order = order;
      order += 1;
    }

    content[collectionKey] = sortByOrder(currentCollection);
    writeContentData(content);
    sendJson(res, 200, { message: 'Ordem atualizada.', items: content[collectionKey] });
    return;
  }

  if (req.method === 'POST' && !id) {
    await createEntityItem(req, res, entity, collectionKey);
    return;
  }

  if (id && req.method === 'PUT') {
    await updateEntityItem(req, res, entity, collectionKey, id);
    return;
  }

  if (id && req.method === 'DELETE') {
    deleteEntityItem(res, collectionKey, id);
    return;
  }

  sendJson(res, 405, { error: 'Metodo nao permitido para este recurso.' });
}

async function createEntityItem(req, res, entity, collectionKey) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    sendJson(res, error.statusCode || 400, { error: error.message || 'JSON invalido.' });
    return;
  }

  const parsed = validateEntityPayload(entity, body);
  if (parsed.errors.length > 0) {
    sendJson(res, 422, { error: parsed.errors[0], details: parsed.errors });
    return;
  }

  const content = readContentData();
  const collection = sortByOrder(content[collectionKey]);
  const maxOrder = collection.reduce((acc, item) => Math.max(acc, Number(item.order) || 0), 0);

  const nowIso = new Date().toISOString();
  const newItem = {
    id: generateId(entity),
    order: maxOrder + 1,
    createdAt: nowIso,
    updatedAt: nowIso,
    ...parsed.value
  };

  collection.push(newItem);
  content[collectionKey] = collection;
  writeContentData(content);

  sendJson(res, 201, {
    message: 'Item criado com sucesso.',
    item: newItem,
    items: sortByOrder(collection)
  });
}

async function updateEntityItem(req, res, entity, collectionKey, id) {
  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    sendJson(res, error.statusCode || 400, { error: error.message || 'JSON invalido.' });
    return;
  }

  const parsed = validateEntityPayload(entity, body);
  if (parsed.errors.length > 0) {
    sendJson(res, 422, { error: parsed.errors[0], details: parsed.errors });
    return;
  }

  const content = readContentData();
  const collection = content[collectionKey];
  const index = collection.findIndex((item) => item.id === id);
  if (index === -1) {
    sendJson(res, 404, { error: 'Item nao encontrado.' });
    return;
  }

  const current = collection[index];
  const updated = {
    ...current,
    ...parsed.value,
    id: current.id,
    order: current.order,
    updatedAt: new Date().toISOString()
  };

  collection[index] = updated;
  content[collectionKey] = sortByOrder(collection);
  writeContentData(content);

  sendJson(res, 200, {
    message: 'Item atualizado com sucesso.',
    item: updated,
    items: content[collectionKey]
  });
}

function deleteEntityItem(res, collectionKey, id) {
  const content = readContentData();
  const collection = content[collectionKey];
  const index = collection.findIndex((item) => item.id === id);

  if (index === -1) {
    sendJson(res, 404, { error: 'Item nao encontrado.' });
    return;
  }

  collection.splice(index, 1);
  normalizeOrders(collection);
  content[collectionKey] = sortByOrder(collection);
  writeContentData(content);

  sendJson(res, 200, {
    message: 'Item removido com sucesso.',
    items: content[collectionKey]
  });
}
function parseAdminEntityPath(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length < 3) return null;

  const entity = segments[2];
  if (!['hero', 'dna', 'vagas'].includes(entity)) return null;

  if (segments.length === 3) return { entity, id: null, isReorder: false };
  if (segments.length === 4 && segments[3] === 'reorder') return { entity, id: null, isReorder: true };
  if (segments.length === 4) return { entity, id: segments[3], isReorder: false };

  return null;
}

function collectionKeyFromEntity(entity) {
  if (entity === 'hero') return 'heroSlides';
  if (entity === 'dna') return 'dnaSlides';
  if (entity === 'vagas') return 'vagas';
  return null;
}

function preparePublicContent(content) {
  const heroSlides = sortByOrder(content.heroSlides)
    .filter((item) => item.active)
    .map((item) => ({
      id: item.id,
      title: sanitizeText(item.title, 120),
      description: sanitizeText(item.description, 420),
      image: sanitizeUrl(item.image),
      buttons: (Array.isArray(item.buttons) ? item.buttons : [])
        .slice(0, 2)
        .map((button) => ({
          label: sanitizeText(button.label, 40),
          url: sanitizeUrl(button.url),
          enabled: Boolean(button.enabled)
        }))
        .filter((button) => button.enabled && button.label && button.url)
    }));

  const dnaSlides = sortByOrder(content.dnaSlides)
    .filter((item) => item.active)
    .map((item) => ({
      id: item.id,
      title: sanitizeText(item.title, 120),
      text: sanitizeText(item.text, 420),
      image: sanitizeUrl(item.image)
    }));

  const featuredJobs = sortByOrder(content.vagas)
    .filter((item) => item.active && item.featured)
    .map((item) => ({
      id: item.id,
      title: sanitizeText(item.title, 120),
      status: normalizeVagaStatus(item.status),
      location: sanitizeText(item.location, 120),
      workType: normalizeVagaWorkType(item.workType),
      contractType: normalizeVagaContractType(item.contractType),
      description: sanitizeText(item.description, 600),
      applyUrl: sanitizeUrl(item.applyUrl)
    }));

  return {
    heroSlides,
    dnaSlides,
    featuredJobs,
    siteTexts: readSiteTextsData(),
    updatedAt: new Date().toISOString()
  };
}

function validateEntityPayload(entity, payload) {
  if (entity === 'hero') return validateHeroPayload(payload);
  if (entity === 'dna') return validateDnaPayload(payload);
  if (entity === 'vagas') return validateVagaPayload(payload);
  return { value: null, errors: ['Tipo de entidade invalido.'] };
}

function validateHeroPayload(payload) {
  const errors = [];
  const title = sanitizeText(payload.title, 120);
  const description = sanitizeText(payload.description, 420);
  const image = sanitizeUrl(payload.image);
  const active = Boolean(payload.active);

  if (!title) errors.push('Titulo do slide Hero e obrigatorio.');
  if (!description) errors.push('Descricao do slide Hero e obrigatoria.');
  if (!image) errors.push('Imagem do slide Hero e obrigatoria.');

  const parsedButtons = normalizeButtons(payload.buttons);
  errors.push(...parsedButtons.errors);

  return {
    value: {
      title,
      description,
      image,
      active,
      buttons: parsedButtons.buttons
    },
    errors
  };
}

function validateDnaPayload(payload) {
  const errors = [];
  const title = sanitizeText(payload.title, 120);
  const text = sanitizeText(payload.text, 420);
  const image = sanitizeUrl(payload.image);
  const active = Boolean(payload.active);

  if (!title) errors.push('Titulo do slide DNA e obrigatorio.');
  if (!text) errors.push('Texto do slide DNA e obrigatorio.');
  if (!image) errors.push('Imagem do slide DNA e obrigatoria.');

  return {
    value: { title, text, image, active },
    errors
  };
}

function validateVagaPayload(payload) {
  const errors = [];

  const title = sanitizeText(payload.title, 120);
  const status = normalizeVagaStatus(payload.status);
  const location = sanitizeText(payload.location, 120);
  const workType = normalizeVagaWorkType(payload.workType);
  const contractType = normalizeVagaContractType(payload.contractType);
  const description = sanitizeText(payload.description, 600);
  const applyUrl = sanitizeUrl(payload.applyUrl);
  const featured = Boolean(payload.featured);
  const active = Boolean(payload.active);

  if (!title) errors.push('Titulo da vaga e obrigatorio.');
  if (!status) errors.push('Status da vaga invalido.');
  if (!location) errors.push('Localizacao da vaga e obrigatoria.');
  if (!workType) errors.push('Tipo de trabalho da vaga e obrigatorio.');
  if (!contractType) errors.push('Tipo de contrato da vaga e obrigatorio.');
  if (!description) errors.push('Descricao da vaga e obrigatoria.');
  if (!applyUrl) errors.push('URL de candidatura invalida.');

  return {
    value: {
      title,
      status,
      location,
      workType,
      contractType,
      description,
      applyUrl,
      featured,
      active
    },
    errors
  };
}

function normalizeButtons(buttonsRaw) {
  const errors = [];
  const inputButtons = Array.isArray(buttonsRaw) ? buttonsRaw.slice(0, 2) : [];
  const normalized = [];

  for (let index = 0; index < 2; index += 1) {
    const candidate = inputButtons[index] || {};
    const label = sanitizeText(candidate.label, 40);
    const url = sanitizeUrl(candidate.url);
    const enabled = Boolean(candidate.enabled);

    if (enabled && (!label || !url)) {
      errors.push(`Botao ${index + 1} requer texto e URL validos para ficar ativo.`);
    }

    normalized.push({ label, url, enabled: Boolean(enabled && label && url) });
  }

  return { buttons: normalized, errors };
}

function normalizeVagaStatus(value) {
  return VAGA_STATUS_MAP[normalizeEnumKey(value)] || '';
}

function normalizeVagaWorkType(value) {
  return VAGA_WORK_TYPE_MAP[normalizeEnumKey(value)] || '';
}

function normalizeVagaContractType(value) {
  return VAGA_CONTRACT_TYPE_MAP[normalizeEnumKey(value)] || '';
}

function normalizeEnumKey(value) {
  const text = sanitizeText(String(value || ''), 40).toLowerCase();
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  };
}

function requireAuth(req, res) {
  const authContext = getAuthContext(req);
  if (!authContext) {
    sendJson(res, 401, { error: 'Sessao invalida ou expirada.' });
    return null;
  }
  return authContext;
}

function verifyCsrf(req, res, session) {
  const headerToken = String(req.headers['x-csrf-token'] || '').trim();
  if (!headerToken || !timingSafeEqualString(headerToken, session.csrfToken)) {
    sendJson(res, 403, { error: 'Token CSRF invalido.' });
    return false;
  }
  return true;
}

function getAuthContext(req) {
  const requestSession = getSessionFromRequest(req);
  if (!requestSession) return null;

  const usersData = readUsersData();
  const user = usersData.users.find((item) => item.id === requestSession.userId && item.active !== false);

  if (!user) {
    destroySession(requestSession.sid);
    return null;
  }

  return {
    sid: requestSession.sid,
    session: requestSession,
    user
  };
}

function createSession(userId) {
  const sid = crypto.randomBytes(32).toString('hex');
  const csrfToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_TTL_MS;

  sessions.set(sid, { userId, csrfToken, expiresAt });
  return { sid, csrfToken, expiresAt };
}

function getSessionFromRequest(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const sid = cookies.sid;
  if (!sid) return null;

  const session = sessions.get(sid);
  if (!session) return null;

  if (session.expiresAt <= Date.now()) {
    sessions.delete(sid);
    return null;
  }

  session.expiresAt = Date.now() + SESSION_TTL_MS;
  sessions.set(sid, session);

  return { sid, ...session };
}

function destroySession(sid) {
  sessions.delete(sid);
}

function setSessionCookie(res, sid) {
  const cookie = serializeCookie('sid', sid, {
    httpOnly: true,
    maxAgeSeconds: Math.floor(SESSION_TTL_MS / 1000),
    sameSite: 'Strict',
    secure: IS_PROD,
    path: '/'
  });

  res.setHeader('Set-Cookie', [cookie]);
}

function clearSessionCookie(res) {
  const cookie = serializeCookie('sid', '', {
    httpOnly: true,
    maxAgeSeconds: 0,
    sameSite: 'Strict',
    secure: IS_PROD,
    path: '/'
  });

  res.setHeader('Set-Cookie', [cookie]);
}

function parseCookies(cookieHeader) {
  const result = {};
  if (!cookieHeader) return result;

  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex <= 0) continue;

    const key = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();
    result[key] = decodeURIComponent(value);
  }

  return result;
}

function serializeCookie(name, value, options = {}) {
  const segments = [`${name}=${encodeURIComponent(String(value || ''))}`];
  segments.push(`Path=${options.path || '/'}`);

  if (typeof options.maxAgeSeconds === 'number') {
    segments.push(`Max-Age=${Math.max(0, Math.floor(options.maxAgeSeconds))}`);
  }

  if (options.httpOnly) segments.push('HttpOnly');
  segments.push(`SameSite=${options.sameSite || 'Strict'}`);
  if (options.secure) segments.push('Secure');

  return segments.join('; ');
}
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, 'sha512').toString('hex');
  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt}$${hash}`;
}

function verifyPassword(password, storedHash) {
  if (typeof storedHash !== 'string' || !storedHash.startsWith('pbkdf2$')) return false;

  const parts = storedHash.split('$');
  if (parts.length !== 4) return false;

  const iterations = Number(parts[1]);
  const salt = parts[2];
  const hashHex = parts[3];
  if (!iterations || !salt || !hashHex) return false;

  const candidate = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex');
  return timingSafeEqualString(candidate, hashHex);
}

function validatePasswordStrength(password) {
  const errors = [];
  if (password.length < 10) errors.push('A senha deve ter no minimo 10 caracteres.');
  if (password.length > 72) errors.push('A senha deve ter no maximo 72 caracteres.');
  if (!/[a-z]/.test(password)) errors.push('A senha deve incluir letra minuscula.');
  if (!/[A-Z]/.test(password)) errors.push('A senha deve incluir letra maiuscula.');
  if (!/[0-9]/.test(password)) errors.push('A senha deve incluir numero.');
  return errors;
}

function getRateLimitRemaining(ip) {
  const now = Date.now();
  const existing = loginAttempts.get(ip);

  if (!existing) return 0;
  if (existing.resetAt <= now) {
    loginAttempts.delete(ip);
    return 0;
  }

  if (existing.count >= LOGIN_MAX_ATTEMPTS) {
    return existing.resetAt - now;
  }

  return 0;
}

function recordLoginFailure(ip) {
  const now = Date.now();
  const existing = loginAttempts.get(ip);

  if (!existing || existing.resetAt <= now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return;
  }

  existing.count += 1;
  loginAttempts.set(ip, existing);
}

function clearLoginFailures(ip) {
  loginAttempts.delete(ip);
}

function getClientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').trim();
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}

function isSameOriginRequest(req) {
  const originHeader = req.headers.origin;
  if (!originHeader) return true;

  try {
    const origin = new URL(originHeader);
    const hostHeader = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
    if (!hostHeader) return false;

    const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
    const protocol = forwardedProto || (req.socket.encrypted ? 'https' : 'http');
    const expectedOrigin = `${protocol}://${hostHeader}`;

    return origin.origin === expectedOrigin;
  } catch {
    return false;
  }
}

function isUnsafeMethod(method) {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(String(method || '').toUpperCase());
}

function timingSafeEqualString(a, b) {
  const bufferA = Buffer.from(String(a));
  const bufferB = Buffer.from(String(b));
  if (bufferA.length !== bufferB.length) return false;
  return crypto.timingSafeEqual(bufferA, bufferB);
}

function ensureDataFiles() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!fs.existsSync(CONTENT_FILE)) {
    writeJsonFile(CONTENT_FILE, DEFAULT_CONTENT);
  }

  if (!fs.existsSync(SITE_TEXTS_FILE)) {
    writeJsonFile(SITE_TEXTS_FILE, DEFAULT_SITE_TEXTS);
  }
  userStore.ensure();
}

function readContentData() {
  const data = readJsonFile(CONTENT_FILE, DEFAULT_CONTENT);
  return {
    heroSlides: Array.isArray(data.heroSlides) ? data.heroSlides : [],
    dnaSlides: Array.isArray(data.dnaSlides) ? data.dnaSlides : [],
    vagas: Array.isArray(data.vagas) ? data.vagas : []
  };
}

function writeContentData(content) {
  const safePayload = {
    heroSlides: sortByOrder(Array.isArray(content.heroSlides) ? content.heroSlides : []),
    dnaSlides: sortByOrder(Array.isArray(content.dnaSlides) ? content.dnaSlides : []),
    vagas: sortByOrder(Array.isArray(content.vagas) ? content.vagas : [])
  };

  writeJsonFile(CONTENT_FILE, safePayload);
}

function readSiteTextsData() {
  const data = readJsonFile(SITE_TEXTS_FILE, DEFAULT_SITE_TEXTS);
  return {
    dashboardTitle: sanitizeText(data.dashboardTitle, 80) || DEFAULT_SITE_TEXTS.dashboardTitle,
    dashboardSubtitle: sanitizeText(data.dashboardSubtitle, 180) || DEFAULT_SITE_TEXTS.dashboardSubtitle,
    heroSectionTitle: sanitizeText(data.heroSectionTitle, 120) || DEFAULT_SITE_TEXTS.heroSectionTitle,
    heroSectionSubtitle: sanitizeText(data.heroSectionSubtitle, 220) || DEFAULT_SITE_TEXTS.heroSectionSubtitle,
    dnaSectionTitle: sanitizeText(data.dnaSectionTitle, 120) || DEFAULT_SITE_TEXTS.dnaSectionTitle,
    dnaSectionSubtitle: sanitizeText(data.dnaSectionSubtitle, 220) || DEFAULT_SITE_TEXTS.dnaSectionSubtitle,
    vagasSectionTitle: sanitizeText(data.vagasSectionTitle, 120) || DEFAULT_SITE_TEXTS.vagasSectionTitle,
    vagasSectionSubtitle: sanitizeText(data.vagasSectionSubtitle, 220) || DEFAULT_SITE_TEXTS.vagasSectionSubtitle,
    ctaPrimaryLabel: sanitizeText(data.ctaPrimaryLabel, 40) || DEFAULT_SITE_TEXTS.ctaPrimaryLabel,
    ctaPrimaryUrl: sanitizeUrl(data.ctaPrimaryUrl) || DEFAULT_SITE_TEXTS.ctaPrimaryUrl,
    ctaSecondaryLabel: sanitizeText(data.ctaSecondaryLabel, 40) || DEFAULT_SITE_TEXTS.ctaSecondaryLabel,
    ctaSecondaryUrl: sanitizeUrl(data.ctaSecondaryUrl) || DEFAULT_SITE_TEXTS.ctaSecondaryUrl
  };
}

function writeSiteTextsData(siteTexts) {
  const safePayload = {
    dashboardTitle: sanitizeText(siteTexts.dashboardTitle, 80) || DEFAULT_SITE_TEXTS.dashboardTitle,
    dashboardSubtitle: sanitizeText(siteTexts.dashboardSubtitle, 180) || DEFAULT_SITE_TEXTS.dashboardSubtitle,
    heroSectionTitle: sanitizeText(siteTexts.heroSectionTitle, 120) || DEFAULT_SITE_TEXTS.heroSectionTitle,
    heroSectionSubtitle: sanitizeText(siteTexts.heroSectionSubtitle, 220) || DEFAULT_SITE_TEXTS.heroSectionSubtitle,
    dnaSectionTitle: sanitizeText(siteTexts.dnaSectionTitle, 120) || DEFAULT_SITE_TEXTS.dnaSectionTitle,
    dnaSectionSubtitle: sanitizeText(siteTexts.dnaSectionSubtitle, 220) || DEFAULT_SITE_TEXTS.dnaSectionSubtitle,
    vagasSectionTitle: sanitizeText(siteTexts.vagasSectionTitle, 120) || DEFAULT_SITE_TEXTS.vagasSectionTitle,
    vagasSectionSubtitle: sanitizeText(siteTexts.vagasSectionSubtitle, 220) || DEFAULT_SITE_TEXTS.vagasSectionSubtitle,
    ctaPrimaryLabel: sanitizeText(siteTexts.ctaPrimaryLabel, 40) || DEFAULT_SITE_TEXTS.ctaPrimaryLabel,
    ctaPrimaryUrl: sanitizeUrl(siteTexts.ctaPrimaryUrl) || DEFAULT_SITE_TEXTS.ctaPrimaryUrl,
    ctaSecondaryLabel: sanitizeText(siteTexts.ctaSecondaryLabel, 40) || DEFAULT_SITE_TEXTS.ctaSecondaryLabel,
    ctaSecondaryUrl: sanitizeUrl(siteTexts.ctaSecondaryUrl) || DEFAULT_SITE_TEXTS.ctaSecondaryUrl
  };

  writeJsonFile(SITE_TEXTS_FILE, safePayload);
}

function readUsersData() {
  return userStore.read();
}

function writeUsersData(usersData) {
  userStore.write(usersData);
}

function readJsonFile(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    return JSON.parse(raw);
  } catch {
    return JSON.parse(JSON.stringify(fallback));
  }
}

function writeJsonFile(filePath, payload) {
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
}

function sortByOrder(items) {
  return [...items].sort((a, b) => {
    const orderA = Number(a.order) || 0;
    const orderB = Number(b.order) || 0;
    return orderA - orderB;
  });
}

function normalizeOrders(items) {
  const sorted = sortByOrder(items);
  sorted.forEach((item, index) => {
    item.order = index + 1;
  });
}

function sanitizeText(input, maxLength = 200) {
  const value = typeof input === 'string' ? input : '';
  return value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function sanitizeEmail(input) {
  const email = sanitizeText(input, 160).toLowerCase();
  const basicEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return basicEmailRegex.test(email) ? email : '';
}

function sanitizeUrl(input) {
  if (typeof input !== 'string') return '';

  const value = input.trim();
  if (!value) return '';

  if (value.startsWith('/')) return value.slice(0, 300);
  if (value.startsWith('#')) return value.slice(0, 100);

  try {
    const parsed = new URL(value);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString().slice(0, 400);
    }
    return '';
  } catch {
    return '';
  }
}

function generateId(prefix) {
  if (typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${crypto.randomBytes(16).toString('hex')}`;
}

async function readJsonBody(req) {
  const chunks = [];
  let totalLength = 0;

  for await (const chunk of req) {
    totalLength += chunk.length;
    if (totalLength > MAX_BODY_BYTES) {
      const error = new Error('Payload excede limite permitido.');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error('JSON invalido.');
    error.statusCode = 400;
    throw error;
  }
}

function isRestrictedPath(pathname) {
  if (RESTRICTED_EXACT.has(pathname)) return true;

  for (const prefix of RESTRICTED_PREFIXES) {
    if (pathname === prefix.slice(0, -1) || pathname.startsWith(prefix)) return true;
  }

  return false;
}

function resolveStaticFilePath(pathname) {
  if (!pathname || pathname.includes('\u0000')) return null;

  let mappedPath = routeMap.get(pathname) || pathname;
  if (pathname.startsWith('/developer/')) mappedPath = `/src${pathname}`;
  if (pathname.startsWith('/auth/')) mappedPath = `/src${pathname}`;
  if (pathname.startsWith('/css/')) mappedPath = `/src${pathname}`;
  if (pathname.startsWith('/js/')) mappedPath = `/src${pathname}`;

  // Compatibilidade legada para caminhos antigos.
  if (pathname.startsWith('/script/')) {
    mappedPath = `/src/js/${pathname.slice('/script/'.length)}`;
  }

  if (pathname === '/assets/css/auth.css') mappedPath = '/src/auth/css/auth.css';
  if (pathname === '/assets/js/auth.js') mappedPath = '/src/auth/js/auth.js';
  if (pathname === '/assets/js/public-content.js') mappedPath = '/src/js/public-content.js';
  if (pathname === '/assets/js/api.js') mappedPath = '/src/js/shared/api.js';
  if (pathname.startsWith('/assets/js/utils/')) {
    mappedPath = `/src/js/shared/${pathname.slice('/assets/js/'.length)}`;
  }
  if (pathname.startsWith('/assets/')) mappedPath = `/src${pathname}`;

  const relativePath = mappedPath.startsWith('/') ? mappedPath.slice(1) : mappedPath;
  const normalizedRelative = path.normalize(relativePath);
  const filePath = path.normalize(path.join(ROOT_DIR, normalizedRelative));

  const rootWithSeparator = ROOT_DIR.endsWith(path.sep) ? ROOT_DIR : `${ROOT_DIR}${path.sep}`;
  if (filePath !== ROOT_DIR && !filePath.startsWith(rootWithSeparator)) return null;

  return filePath;
}

function serveStaticFile(req, res, pathname) {
  if (isRestrictedPath(pathname)) {
    sendText(res, 403, '403 - Acesso negado', 'text/plain; charset=utf-8');
    return;
  }

  const filePath = resolveStaticFilePath(pathname);
  if (!filePath) {
    sendText(res, 403, '403 - Acesso negado', 'text/plain; charset=utf-8');
    return;
  }

  fs.stat(filePath, (statError, stats) => {
    if (statError || !stats.isFile()) {
      sendText(res, 404, '404 - Arquivo nao encontrado', 'text/plain; charset=utf-8');
      return;
    }

    const extension = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extension] || 'application/octet-stream';

    fs.readFile(filePath, (readError, content) => {
      if (readError) {
        sendText(res, 500, '500 - Erro ao ler arquivo', 'text/plain; charset=utf-8');
        return;
      }

      const isHtml = extension === '.html';
      const shouldDisableCache =
        pathname.startsWith('/auth/') ||
        pathname.startsWith('/developer/');

      applySecurityHeaders(res, { isHtml });
      res.setHeader('Content-Type', contentType);
      if (shouldDisableCache) {
        res.setHeader('Cache-Control', 'no-store');
      }

      res.statusCode = 200;
      if (req.method === 'HEAD') {
        res.end();
        return;
      }

      res.end(content);
    });
  });
}

function applySecurityHeaders(res, options = {}) {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

  if (IS_PROD) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  if (options.isHtml) {
    const csp = [
      "default-src 'self'",
      "script-src 'self' https://unpkg.com https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com https://cdn.jsdelivr.net",
      "font-src 'self' data: https://fonts.gstatic.com https://unpkg.com https://cdn.jsdelivr.net",
      "img-src 'self' data: https:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'"
    ].join('; ');

    res.setHeader('Content-Security-Policy', csp);
  }
}

function sendJson(res, statusCode, payload) {
  applySecurityHeaders(res);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, text, contentType) {
  applySecurityHeaders(res);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', contentType || 'text/plain; charset=utf-8');
  res.end(text);
}

function redirectResponse(res, statusCode, destination) {
  applySecurityHeaders(res);
  res.statusCode = statusCode;
  res.setHeader('Location', destination);
  res.end();
}

module.exports = {
  server
};


