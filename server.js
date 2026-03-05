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
- Endpoints/rotas: /api/public/content, /api/auth/session, /api/auth/login, /api/auth/register, /api/auth/logout, /api/admin/content, /api/admin/, /api/admin/feedbacks, /api/popup-config, /api/leads, /api/popup-events, /api/analytics/event, /api/analytics/session, /api/analytics/stats, /api/analytics/config
- Classes/seletores/chaves: nao se aplica para este modulo.

Entradas e saidas:
- Entradas: Requisicoes HTTP, cookies, payload JSON e variaveis de ambiente.
- Saidas  : Respostas HTTP, persistencia em JSON e cabecalhos de seguranca.

Elementos tecnicos: loadEnvFile, resolveStorePath, resolveLegacyAdminDestination, handleRequest, handleApi, handleLogin, handleRegister, handleLogout, handleAdminEntityRoutes, createEntityItem, sanitizePopupConfig, validateLeadPayload, buildPopupAnalyticsSummary, sanitizeAnalyticsConfig, buildAnalyticsStats
[DOC-FILE-END]============================================================== */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { createDeveloperRoutes } = require('./server/routes/developerRoutes');
const { resolveAdminSetupConfig } = require('./server/config/adminSetup');
const { createUserStore } = require('./server/repositories/userStore');

loadEnvFile(path.join(__dirname, '.env'));

const PORT = Number(process.env.PORT) || 5010;
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'server', 'storage');
const CONTENT_FILE = resolveStorePath(path.join(DATA_DIR, 'content.json'), process.env.CONTENT_STORE_PATH);
const SITE_TEXTS_FILE = resolveStorePath(path.join(DATA_DIR, 'site-texts.json'), process.env.SITE_TEXTS_STORE_PATH);
const POPUP_CONFIG_FILE = resolveStorePath(path.join(DATA_DIR, 'popup-config.json'), process.env.POPUP_CONFIG_STORE_PATH);
const POPUP_LEADS_FILE = resolveStorePath(path.join(DATA_DIR, 'popup-leads.json'), process.env.POPUP_LEADS_STORE_PATH);
const POPUP_EVENTS_FILE = resolveStorePath(path.join(DATA_DIR, 'popup-events.json'), process.env.POPUP_EVENTS_STORE_PATH);
const ANALYTICS_FILE = resolveStorePath(path.join(ROOT_DIR, 'data', 'analytics.json'), process.env.ANALYTICS_STORE_PATH);
const ANALYTICS_CONFIG_FILE = resolveStorePath(path.join(ROOT_DIR, 'data', 'analytics-config.json'), process.env.ANALYTICS_CONFIG_PATH);
const LEGACY_USERS_FILE = path.join(ROOT_DIR, 'server', 'private', 'users.json');

const IS_PROD = process.env.NODE_ENV === 'production';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const MAX_BODY_BYTES = 4 * 1024 * 1024;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 8;
const LEAD_WINDOW_MS = 60 * 60 * 1000;
const LEAD_MAX_ATTEMPTS = 8;
const EVENT_WINDOW_MS = 60 * 60 * 1000;
const EVENT_MAX_ATTEMPTS = 150;
const ANALYTICS_WINDOW_MS = 60 * 60 * 1000;
const ANALYTICS_MAX_ATTEMPTS = 1200;
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
const leadSubmitAttempts = new Map();
const popupEventAttempts = new Map();
const analyticsIngestAttempts = new Map();

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

const DEFAULT_CONTENT = { heroSlides: [], dnaSlides: [], vagas: [], feedbacks: [] };
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
  ctaSecondaryUrl: '/fale-conosco.html',
  servicesFeedbackTitle: 'A escolha certa para a sua logistica!',
  servicesFeedbackSubtitle: 'Mais de 2.500 clientes confiam na Rodogarcia. Veja o que eles dizem:',
  aboutHeroTag: 'Nossa Historia',
  aboutHeroTitle: 'Mais de 35 anos conectando o Brasil',
  aboutHeroSubtitle: 'Desde 1989, transformando a logistica com excelencia, tecnologia e compromisso com cada entrega.',
  aboutHeroImage: '/public/caminhoneiro1.png',
  aboutStat1Number: '35+',
  aboutStat1Description: 'Anos de experiencia',
  aboutStat2Number: '1.500+',
  aboutStat2Description: 'Pontos de coleta',
  aboutStat3Number: '1M+',
  aboutStat3Description: 'Pacotes processados',
  contactPageTitle: 'Fale Conosco',
  contactPageSubtitle: 'Estamos prontos para apoiar voce com cotacoes, suporte operacional e orientacoes gerais.',
  contactPhoneNumber: '0800 591 4557',
  contactPhoneHours: 'segunda a sexta, das 8h as 18h',
  contactEmailAddress: 'gerente.financeiro@rodogarcia.com.br',
  contactEmailResponse: 'conforme ordem de atendimento',
  contactWhatsappUrl: 'https://wa.me/5514999999999',
  contactWhatsappLabel: 'atendimento Rodogarcia',
  contactAddressLine: 'Rua Pedro Carmine Deo, 156, Agudos - SP',
  contactAddressZip: '17123-210',
  contactAddressCountry: 'Brasil',
  contactCtaLabel: 'Solicitar Cotacao',
  contactCtaUrl: '/cotacao.html'
};
const DEFAULT_POPUP_CONFIG = {
  title: 'Antes de sair...',
  description: 'Quer receber nosso conteudo gratuito antes de ir?',
  enableName: true,
  enableEmail: true,
  enablePhone: true,
  buttonText: 'Receber conteudo',
  closeText: 'Fechar',
  successMessage: 'Recebemos seus dados. Em breve entraremos em contato.',
  delaySeconds: 10,
  cooldownHours: 24,
  maxShowsPerSession: 1,
  mobileScrollTrigger: true,
  mobileBackButtonTrigger: true
};
const DEFAULT_POPUP_LEADS = [];
const DEFAULT_POPUP_EVENTS = [];
const POPUP_EVENT_TYPES = new Set(['popup_shown', 'popup_closed', 'popup_submitted', 'popup_ignored']);
const DEFAULT_ANALYTICS_DATA = {
  events: [],
  sessions: []
};
const DEFAULT_ANALYTICS_CONFIG = {
  siteUrl: 'https://rodogarcia.com.br',
  consent: {
    bannerEnabled: true,
    version: 1,
    categories: {
      analytics: false,
      marketing: false,
      performance: false
    }
  },
  providers: {
    ga4: { enabled: false, measurementId: '' },
    matomo: { enabled: false, baseUrl: '', siteId: '' },
    plausible: { enabled: false, domain: '', scriptUrl: 'https://plausible.io/js/script.js' },
    posthog: { enabled: false, apiKey: '', apiHost: 'https://us.i.posthog.com' },
    clarity: { enabled: false, projectId: '' },
    hotjar: { enabled: false, siteId: '', version: 6 },
    crazyegg: { enabled: false, accountId: '', scriptVersion: '11' },
    fullstory: { enabled: false, orgId: '' },
    sentry: { enabled: false, dsn: '', environment: 'production' },
    logrocket: { enabled: false, appId: '' }
  },
  performance: {
    pagespeedApiKey: '',
    enableLighthouse: false,
    monitoredPages: ['/', '/servicos.html', '/sobre.html']
  },
  seo: {
    enableSearchConsole: false,
    propertyUrl: '',
    sitemapUrl: '/sitemap.xml'
  },
  tracking: {
    enabled: true,
    heartbeatSeconds: 30,
    scrollMilestones: [25, 50, 75, 100]
  }
};
const ANALYTICS_EVENT_NAMES = new Set([
  'click',
  'scroll',
  'form_submit',
  'download',
  'cta_click',
  'popup_open',
  'popup_submit',
  'page_view',
  'session_start',
  'session_end'
]);
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
  for (const [key, item] of leadSubmitAttempts.entries()) {
    if (item.resetAt <= now) leadSubmitAttempts.delete(key);
  }
  for (const [key, item] of popupEventAttempts.entries()) {
    if (item.resetAt <= now) popupEventAttempts.delete(key);
  }
  for (const [key, item] of analyticsIngestAttempts.entries()) {
    if (item.resetAt <= now) analyticsIngestAttempts.delete(key);
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
  const legacyMap = new Map([
    ['/admin', '/developer/index.html?page=dashboard'],
    ['/admin/', '/developer/index.html?page=dashboard'],
    ['/admin/index.html', '/developer/index.html?page=dashboard'],
    ['/admin/dashboard.html', '/developer/index.html?page=popup-exit'],
    ['/admin/carrosseis.html', '/developer/index.html?page=home-hero'],
    ['/admin/vagas.html', '/developer/index.html?page=servicos-feedbacks']
  ]);

  return legacyMap.get(pathname) || '';
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

  if (pathname === '/api/popup-config' && req.method === 'GET') {
    sendJson(res, 200, { config: readPopupConfigData() });
    return;
  }

  if (pathname === '/api/popup-config/admin' && req.method === 'GET') {
    const authContext = requireAuth(req, res);
    if (!authContext) return;

    const config = readPopupConfigData();
    const leads = readPopupLeadsData();
    const events = readPopupEventsData();

    sendJson(res, 200, {
      user: publicUser(authContext.user),
      csrfToken: authContext.session.csrfToken,
      config,
      analytics: buildPopupAnalyticsSummary(events, leads),
      leadCount: leads.length,
      recentLeads: leads.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 25)
    });
    return;
  }

  if (pathname === '/api/popup-config' && req.method === 'POST') {
    const authContext = requireAuth(req, res);
    if (!authContext) return;
    if (!verifyCsrf(req, res, authContext.session)) return;

    let body;
    try {
      body = await readJsonBody(req);
    } catch (error) {
      sendJson(res, error.statusCode || 400, { error: error.message || 'JSON invalido.' });
      return;
    }

    const mergedConfig = {
      ...readPopupConfigData(),
      ...(body && typeof body === 'object' ? body : {})
    };
    const sanitizedConfig = sanitizePopupConfig(mergedConfig);
    writePopupConfigData(sanitizedConfig);

    sendJson(res, 200, {
      message: 'Configuracao do popup atualizada com sucesso.',
      config: sanitizedConfig
    });
    return;
  }

  if (pathname === '/api/leads' && req.method === 'POST') {
    await handleCreatePopupLead(req, res);
    return;
  }

  if (pathname === '/api/leads' && req.method === 'GET') {
    const authContext = requireAuth(req, res);
    if (!authContext) return;

    const leads = readPopupLeadsData().slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    sendJson(res, 200, { leads });
    return;
  }

  if (pathname === '/api/popup-events' && req.method === 'POST') {
    await handleTrackPopupEvent(req, res);
    return;
  }

  if (pathname === '/api/popup-events' && req.method === 'GET') {
    const authContext = requireAuth(req, res);
    if (!authContext) return;

    const leads = readPopupLeadsData();
    const events = readPopupEventsData().slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

    sendJson(res, 200, {
      analytics: buildPopupAnalyticsSummary(events, leads),
      events: events.slice(0, 200)
    });
    return;
  }

  if (pathname === '/api/analytics/config' && req.method === 'GET') {
    const config = readAnalyticsConfigData();
    sendJson(res, 200, { config: toPublicAnalyticsConfig(config) });
    return;
  }

  if (pathname === '/api/analytics/event' && req.method === 'POST') {
    await handleAnalyticsEvent(req, res);
    return;
  }

  if (pathname === '/api/analytics/session' && req.method === 'POST') {
    await handleAnalyticsSession(req, res);
    return;
  }

  if (pathname === '/api/analytics/stats' && req.method === 'GET') {
    const authContext = requireAuth(req, res);
    if (!authContext) return;

    const requestUrl = new URL(req.url, `http://${req.headers.host || `localhost:${PORT}`}`);
    const days = clampInteger(requestUrl.searchParams.get('days'), 1, 120, 30);
    const data = readAnalyticsData();
    const stats = buildAnalyticsStats(data, days);

    sendJson(res, 200, { days, stats });
    return;
  }

  if (pathname === '/api/analytics/config/admin' && req.method === 'GET') {
    const authContext = requireAuth(req, res);
    if (!authContext) return;

    sendJson(res, 200, {
      user: publicUser(authContext.user),
      csrfToken: authContext.session.csrfToken,
      config: readAnalyticsConfigData()
    });
    return;
  }

  if (pathname === '/api/analytics/config' && req.method === 'POST') {
    const authContext = requireAuth(req, res);
    if (!authContext) return;
    if (!verifyCsrf(req, res, authContext.session)) return;

    let body;
    try {
      body = await readJsonBody(req);
    } catch (error) {
      sendJson(res, error.statusCode || 400, { error: error.message || 'JSON invalido.' });
      return;
    }

    const currentConfig = readAnalyticsConfigData();
    const mergedConfig = {
      ...currentConfig,
      ...(body && typeof body === 'object' ? body : {})
    };
    const sanitizedConfig = sanitizeAnalyticsConfig(mergedConfig);
    writeAnalyticsConfigData(sanitizedConfig);

    sendJson(res, 200, {
      message: 'Configuracao de analytics atualizada com sucesso.',
      config: sanitizedConfig
    });
    return;
  }

  if (pathname === '/api/analytics/performance' && req.method === 'GET') {
    const authContext = requireAuth(req, res);
    if (!authContext) return;

    const config = readAnalyticsConfigData();
    const report = await buildAnalyticsPerformanceReport(config);
    sendJson(res, 200, report);
    return;
  }

  if (pathname === '/api/analytics/seo' && req.method === 'GET') {
    const authContext = requireAuth(req, res);
    if (!authContext) return;

    const config = readAnalyticsConfigData();
    const report = await buildAnalyticsSeoReport(config);
    sendJson(res, 200, report);
    return;
  }

  if (pathname === '/api/admin/content' && req.method === 'GET') {
    const authContext = requireAuth(req, res);
    if (!authContext) return;

    const content = readContentData();
    content.heroSlides = sortByOrder(content.heroSlides);
    content.dnaSlides = sortByOrder(content.dnaSlides);
    content.vagas = sortByOrder(content.vagas);
    content.feedbacks = sortByOrder(content.feedbacks);

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

async function handleCreatePopupLead(req, res) {
  const ip = getClientIp(req);
  const leadWindowState = getRateLimitState(leadSubmitAttempts, ip, LEAD_WINDOW_MS);
  if (leadWindowState.count >= LEAD_MAX_ATTEMPTS) {
    sendJson(res, 429, {
      error: 'Limite de envios atingido. Tente novamente mais tarde.',
      retryAfterMs: Math.max(0, leadWindowState.resetAt - Date.now())
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

  const config = readPopupConfigData();
  const parsed = validateLeadPayload(body, config);
  if (parsed.errors.length > 0) {
    sendJson(res, 422, { error: parsed.errors[0], details: parsed.errors });
    return;
  }

  const leads = readPopupLeadsData();
  const duplicateLead = parsed.value.email
    ? leads.find((item) => item.email === parsed.value.email && Date.now() - Date.parse(item.createdAt) < 10 * 60 * 1000)
    : null;
  if (duplicateLead) {
    sendJson(res, 409, { error: 'Este e-mail acabou de enviar um cadastro. Aguarde alguns minutos.' });
    return;
  }

  registerRateLimitHit(leadSubmitAttempts, ip, LEAD_WINDOW_MS);

  const lead = {
    id: generateId('lead'),
    createdAt: new Date().toISOString(),
    source: sanitizeText(parsed.value.source || 'exit-intent', 40) || 'exit-intent',
    pagePath: sanitizePath(parsed.value.pagePath),
    name: parsed.value.name,
    email: parsed.value.email,
    phone: parsed.value.phone,
    userAgent: sanitizeText(String(req.headers['user-agent'] || ''), 240)
  };

  leads.push(lead);
  writePopupLeadsData(leads);

  sendJson(res, 201, {
    message: 'Lead recebido com sucesso.',
    lead: {
      id: lead.id,
      createdAt: lead.createdAt
    }
  });
}

async function handleTrackPopupEvent(req, res) {
  const ip = getClientIp(req);
  const eventWindowState = getRateLimitState(popupEventAttempts, ip, EVENT_WINDOW_MS);
  if (eventWindowState.count >= EVENT_MAX_ATTEMPTS) {
    sendJson(res, 429, {
      error: 'Muitos eventos enviados em pouco tempo.',
      retryAfterMs: Math.max(0, eventWindowState.resetAt - Date.now())
    });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    sendJson(res, error.statusCode || 400, { error: error.message || 'JSON invalido.' });
    return;
  }

  const eventName = sanitizeText(body.event, 40).toLowerCase();
  if (!POPUP_EVENT_TYPES.has(eventName)) {
    sendJson(res, 422, { error: 'Evento invalido para o popup.' });
    return;
  }

  registerRateLimitHit(popupEventAttempts, ip, EVENT_WINDOW_MS);

  const events = readPopupEventsData();
  const eventEntry = {
    id: generateId('popup_event'),
    createdAt: new Date().toISOString(),
    event: eventName,
    pagePath: sanitizePath(body.pagePath),
    source: sanitizeText(body.source, 40),
    mobile: Boolean(body.mobile),
    metadata: sanitizePopupEventMetadata(body.metadata),
    sessionId: sanitizeText(body.sessionId, 64),
    ipHash: hashIpAddress(ip),
    userAgent: sanitizeText(String(req.headers['user-agent'] || ''), 240)
  };

  events.push(eventEntry);
  if (events.length > 10000) {
    events.splice(0, events.length - 10000);
  }
  writePopupEventsData(events);

  sendJson(res, 202, { message: 'Evento registrado.' });
}

async function handleAnalyticsEvent(req, res) {
  const ip = getClientIp(req);
  const rateLimitState = getRateLimitState(analyticsIngestAttempts, ip, ANALYTICS_WINDOW_MS);
  if (rateLimitState.count >= ANALYTICS_MAX_ATTEMPTS) {
    sendJson(res, 429, {
      error: 'Limite de eventos por hora atingido para este IP.',
      retryAfterMs: Math.max(0, rateLimitState.resetAt - Date.now())
    });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    sendJson(res, error.statusCode || 400, { error: error.message || 'JSON invalido.' });
    return;
  }

  const parsed = sanitizeAnalyticsEventPayload(body);
  if (!parsed.event) {
    sendJson(res, 422, { error: 'Evento invalido para analytics.' });
    return;
  }

  registerRateLimitHit(analyticsIngestAttempts, ip, ANALYTICS_WINDOW_MS);

  const store = readAnalyticsData();
  const eventEntry = {
    id: generateId('analytics_event'),
    event: parsed.event,
    page: parsed.page,
    timestamp: new Date().toISOString(),
    userId: parsed.userId,
    sessionId: parsed.sessionId,
    category: parsed.category,
    metadata: parsed.metadata,
    userAgent: sanitizeText(String(req.headers['user-agent'] || ''), 220),
    ipHash: hashIpAddress(ip)
  };

  store.events.push(eventEntry);
  if (store.events.length > 50000) {
    store.events.splice(0, store.events.length - 50000);
  }

  if (eventEntry.sessionId) {
    const session = store.sessions.find((item) => item.id === eventEntry.sessionId);
    if (session) {
      session.lastSeenAt = eventEntry.timestamp;
      if (eventEntry.page) session.lastPage = eventEntry.page;
      if (eventEntry.event === 'page_view') {
        session.pageViews = (Number(session.pageViews) || 0) + 1;
      }
    }
  }

  writeAnalyticsData(store);
  sendJson(res, 202, { message: 'Evento analytics registrado.' });
}

async function handleAnalyticsSession(req, res) {
  const ip = getClientIp(req);
  const rateLimitState = getRateLimitState(analyticsIngestAttempts, ip, ANALYTICS_WINDOW_MS);
  if (rateLimitState.count >= ANALYTICS_MAX_ATTEMPTS) {
    sendJson(res, 429, {
      error: 'Limite de sessoes/eventos por hora atingido para este IP.',
      retryAfterMs: Math.max(0, rateLimitState.resetAt - Date.now())
    });
    return;
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    sendJson(res, error.statusCode || 400, { error: error.message || 'JSON invalido.' });
    return;
  }

  const action = sanitizeText(body.action, 20).toLowerCase();
  if (!['start', 'heartbeat', 'end'].includes(action)) {
    sendJson(res, 422, { error: 'Acao de sessao invalida.' });
    return;
  }

  const sessionId = sanitizeText(body.sessionId, 80);
  if (!sessionId) {
    sendJson(res, 422, { error: 'sessionId e obrigatorio.' });
    return;
  }

  registerRateLimitHit(analyticsIngestAttempts, ip, ANALYTICS_WINDOW_MS);

  const store = readAnalyticsData();
  const nowIso = new Date().toISOString();
  let session = store.sessions.find((item) => item.id === sessionId);

  if (!session && action === 'start') {
    session = {
      id: sessionId,
      userId: sanitizeText(body.userId, 80),
      startAt: nowIso,
      endAt: '',
      lastSeenAt: nowIso,
      lastPage: sanitizePath(body.page),
      pageViews: Number(body.pageViews) || 1,
      referrer: sanitizeText(body.referrer, 260),
      userAgent: sanitizeText(String(req.headers['user-agent'] || ''), 220),
      deviceType: sanitizeText(body.deviceType, 30)
    };
    store.sessions.push(session);
  } else if (session) {
    session.lastSeenAt = nowIso;
    if (sanitizePath(body.page)) {
      session.lastPage = sanitizePath(body.page);
    }
    if (action === 'end') {
      session.endAt = nowIso;
      const durationMs = clampInteger(body.durationMs, 0, 12 * 60 * 60 * 1000, 0);
      if (durationMs > 0) {
        session.durationMs = durationMs;
      }
    }
  }

  if (store.sessions.length > 20000) {
    store.sessions.splice(0, store.sessions.length - 20000);
  }

  writeAnalyticsData(store);
  sendJson(res, 202, { message: 'Sessao analytics registrada.' });
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
  if (!['hero', 'dna', 'vagas', 'feedbacks'].includes(entity)) return null;

  if (segments.length === 3) return { entity, id: null, isReorder: false };
  if (segments.length === 4 && segments[3] === 'reorder') return { entity, id: null, isReorder: true };
  if (segments.length === 4) return { entity, id: segments[3], isReorder: false };

  return null;
}

function collectionKeyFromEntity(entity) {
  if (entity === 'hero') return 'heroSlides';
  if (entity === 'dna') return 'dnaSlides';
  if (entity === 'vagas') return 'vagas';
  if (entity === 'feedbacks') return 'feedbacks';
  return null;
}

function preparePublicContent(content) {
  const heroSlides = sortByOrder(content.heroSlides)
    .filter((item) => item.active)
    .map((item) => {
      const layoutMode = normalizeHeroLayoutMode(item.layoutMode);
      const fullImageButtonsEnabled = coerceBoolean(item.fullImageButtonsEnabled, false);
      const fullImageBackgroundType = normalizeHeroBackgroundType(item.fullImageBackgroundType);

      const buttons = (Array.isArray(item.buttons) ? item.buttons : [])
        .slice(0, 2)
        .map((button) => ({
          label: sanitizeText(button.label, 40),
          url: sanitizeUrl(button.url),
          enabled: Boolean(button.enabled),
          color: sanitizeHexColor(button.color),
          variant: normalizeButtonVariant(button.variant)
        }))
        .filter((button) => button.enabled && button.label && button.url);

      const exposedButtons =
        layoutMode === 'full-image' && !fullImageButtonsEnabled
          ? []
          : buttons;

      return {
        id: item.id,
        title: sanitizeText(item.title, 120),
        description: sanitizeText(item.description, 420),
        image: sanitizeUrl(item.image),
        layoutMode,
        fullImageButtonsEnabled,
        fullImageBackgroundType,
        buttons: exposedButtons
      };
    });

  const dnaSlides = sortByOrder(content.dnaSlides)
    .filter((item) => item.active)
    .map((item) => {
      const layoutMode = normalizeDnaLayoutMode(item.layoutMode);
      return {
        id: item.id,
        title: sanitizeText(item.title, 120),
        text: sanitizeText(item.text, 420),
        image: sanitizeUrl(item.image),
        layoutMode
      };
    });

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

  const feedbacks = sortByOrder(content.feedbacks)
    .filter((item) => item.active)
    .map((item) => ({
      id: item.id,
      name: sanitizeText(item.name, 80),
      role: sanitizeText(item.role, 80),
      company: sanitizeText(item.company, 120),
      comment: sanitizeText(item.comment, 800),
      photo: sanitizeUrl(item.photo)
    }));

  return {
    heroSlides,
    dnaSlides,
    featuredJobs,
    feedbacks,
    siteTexts: readSiteTextsData(),
    updatedAt: new Date().toISOString()
  };
}

function validateEntityPayload(entity, payload) {
  if (entity === 'hero') return validateHeroPayload(payload);
  if (entity === 'dna') return validateDnaPayload(payload);
  if (entity === 'vagas') return validateVagaPayload(payload);
  if (entity === 'feedbacks') return validateFeedbackPayload(payload);
  return { value: null, errors: ['Tipo de entidade invalido.'] };
}

function validateHeroPayload(payload) {
  const errors = [];
  const title = sanitizeText(payload.title, 120);
  const description = sanitizeText(payload.description, 420);
  const image = sanitizeUrl(payload.image);
  const active = Boolean(payload.active);
  const layoutMode = normalizeHeroLayoutMode(payload.layoutMode);
  const fullImageButtonsEnabled = coerceBoolean(payload.fullImageButtonsEnabled, false);
  const fullImageBackgroundType = normalizeHeroBackgroundType(payload.fullImageBackgroundType);

  if (!title) errors.push('Titulo do slide Hero e obrigatorio.');
  if (layoutMode === 'text-image' && !description) errors.push('Descricao do slide Hero e obrigatoria.');
  if (!image) errors.push('Imagem do slide Hero e obrigatoria.');

  const parsedButtons = normalizeButtons(payload.buttons, {
    defaultSecondOutline: layoutMode === 'full-image'
  });
  const sanitizedButtons =
    layoutMode === 'full-image' && !fullImageButtonsEnabled
      ? parsedButtons.buttons.map((button) => ({ ...button, enabled: false }))
      : parsedButtons.buttons;
  errors.push(...parsedButtons.errors);

  return {
    value: {
      title,
      description,
      image,
      active,
      layoutMode,
      fullImageButtonsEnabled,
      fullImageBackgroundType,
      buttons: sanitizedButtons
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
  const hasLayoutPayload = Object.prototype.hasOwnProperty.call(payload || {}, 'layoutMode');
  let layoutMode = normalizeDnaLayoutMode(payload.layoutMode);

  // Compatibilidade: se frontend antigo nao enviar layoutMode e vier apenas imagem,
  // assume Imagem Completa para nao bloquear o fluxo.
  if (!hasLayoutPayload && image && !text) {
    layoutMode = 'full-image';
  }

  if (!title) errors.push('Titulo do slide DNA e obrigatorio.');
  if (layoutMode === 'text-image' && !text) errors.push('Texto do slide DNA e obrigatorio.');
  if (!image) errors.push('Imagem do slide DNA e obrigatoria.');

  return {
    value: { title, text, image, active, layoutMode },
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

function validateFeedbackPayload(payload) {
  const errors = [];

  const name = sanitizeText(payload.name, 80);
  const role = sanitizeText(payload.role, 80);
  const company = sanitizeText(payload.company, 120);
  const comment = sanitizeText(payload.comment, 800);
  const photo = sanitizeUrl(payload.photo);
  const active = Boolean(payload.active);

  if (!name) errors.push('Nome do cliente e obrigatorio.');
  if (!role) errors.push('Cargo do cliente e obrigatorio.');
  if (!company) errors.push('Empresa do cliente e obrigatoria.');
  if (!comment) errors.push('Comentario do feedback e obrigatorio.');

  return {
    value: {
      name,
      role,
      company,
      comment,
      photo,
      active
    },
    errors
  };
}

function normalizeButtons(buttonsRaw, options = {}) {
  const errors = [];
  const inputButtons = Array.isArray(buttonsRaw) ? buttonsRaw.slice(0, 2) : [];
  const normalized = [];
  const defaultSecondOutline = coerceBoolean(options.defaultSecondOutline, false);

  for (let index = 0; index < 2; index += 1) {
    const candidate = inputButtons[index] || {};
    const label = sanitizeText(candidate.label, 40);
    const url = sanitizeUrl(candidate.url);
    const enabled = Boolean(candidate.enabled);
    const color = sanitizeHexColor(candidate.color);
    const rawVariant =
      candidate.variant ||
      (defaultSecondOutline && index === 1 ? 'outline' : 'solid');
    const variant = normalizeButtonVariant(rawVariant);

    if (enabled && (!label || !url)) {
      errors.push(`Botao ${index + 1} requer texto e URL validos para ficar ativo.`);
    }

    normalized.push({
      label,
      url,
      enabled: Boolean(enabled && label && url),
      color,
      variant
    });
  }

  return { buttons: normalized, errors };
}

function normalizeHeroLayoutMode(value) {
  const key = normalizeEnumKey(value);
  if (key === 'fullimage' || key === 'imagemcompleta' || key === 'imagemfull') {
    return 'full-image';
  }
  return 'text-image';
}

function normalizeDnaLayoutMode(value) {
  const key = normalizeEnumKey(value);
  if (key === 'fullimage' || key === 'imagemcompleta' || key === 'imagemfull') {
    return 'full-image';
  }
  return 'text-image';
}

function normalizeHeroBackgroundType(value) {
  const key = normalizeEnumKey(value);
  if (key === 'straight' || key === 'reto' || key === 'fundoreto') {
    return 'straight';
  }
  return 'wavy';
}

function normalizeButtonVariant(value) {
  const key = normalizeEnumKey(value);
  if (key === 'outline' || key === 'contorno') return 'outline';
  return 'solid';
}

function sanitizeHexColor(input) {
  const value = sanitizeText(input, 16);
  if (!value) return '';

  const match = value.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!match) return '';

  const hex = match[1];
  if (hex.length === 3) {
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toUpperCase();
  }
  return `#${hex}`.toUpperCase();
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

function getRateLimitState(store, key, windowMs) {
  const now = Date.now();
  const bucketKey = String(key || 'unknown');
  const existing = store.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    const initial = {
      count: 0,
      resetAt: now + windowMs
    };
    store.set(bucketKey, initial);
    return initial;
  }

  return existing;
}

function registerRateLimitHit(store, key, windowMs) {
  const state = getRateLimitState(store, key, windowMs);
  state.count += 1;
  store.set(String(key || 'unknown'), state);
  return state;
}

function getClientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').trim();
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}

function hashIpAddress(ip) {
  return crypto.createHash('sha256').update(String(ip || 'unknown')).digest('hex').slice(0, 16);
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
  fs.mkdirSync(path.dirname(ANALYTICS_FILE), { recursive: true });
  fs.mkdirSync(path.dirname(ANALYTICS_CONFIG_FILE), { recursive: true });

  if (!fs.existsSync(CONTENT_FILE)) {
    writeJsonFile(CONTENT_FILE, DEFAULT_CONTENT);
  }

  if (!fs.existsSync(SITE_TEXTS_FILE)) {
    writeJsonFile(SITE_TEXTS_FILE, DEFAULT_SITE_TEXTS);
  }

  if (!fs.existsSync(POPUP_CONFIG_FILE)) {
    writeJsonFile(POPUP_CONFIG_FILE, DEFAULT_POPUP_CONFIG);
  }

  if (!fs.existsSync(POPUP_LEADS_FILE)) {
    writeJsonFile(POPUP_LEADS_FILE, DEFAULT_POPUP_LEADS);
  }

  if (!fs.existsSync(POPUP_EVENTS_FILE)) {
    writeJsonFile(POPUP_EVENTS_FILE, DEFAULT_POPUP_EVENTS);
  }

  if (!fs.existsSync(ANALYTICS_FILE)) {
    writeJsonFile(ANALYTICS_FILE, DEFAULT_ANALYTICS_DATA);
  }

  if (!fs.existsSync(ANALYTICS_CONFIG_FILE)) {
    writeJsonFile(ANALYTICS_CONFIG_FILE, DEFAULT_ANALYTICS_CONFIG);
  }

  userStore.ensure();
}

function readContentData() {
  const data = readJsonFile(CONTENT_FILE, DEFAULT_CONTENT);
  return {
    heroSlides: Array.isArray(data.heroSlides) ? data.heroSlides : [],
    dnaSlides: Array.isArray(data.dnaSlides) ? data.dnaSlides : [],
    vagas: Array.isArray(data.vagas) ? data.vagas : [],
    feedbacks: Array.isArray(data.feedbacks) ? data.feedbacks : []
  };
}

function writeContentData(content) {
  const safePayload = {
    heroSlides: sortByOrder(Array.isArray(content.heroSlides) ? content.heroSlides : []),
    dnaSlides: sortByOrder(Array.isArray(content.dnaSlides) ? content.dnaSlides : []),
    vagas: sortByOrder(Array.isArray(content.vagas) ? content.vagas : []),
    feedbacks: sortByOrder(Array.isArray(content.feedbacks) ? content.feedbacks : [])
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
    ctaSecondaryUrl: sanitizeUrl(data.ctaSecondaryUrl) || DEFAULT_SITE_TEXTS.ctaSecondaryUrl,
    servicesFeedbackTitle: sanitizeText(data.servicesFeedbackTitle, 140) || DEFAULT_SITE_TEXTS.servicesFeedbackTitle,
    servicesFeedbackSubtitle: sanitizeText(data.servicesFeedbackSubtitle, 220) || DEFAULT_SITE_TEXTS.servicesFeedbackSubtitle,
    aboutHeroTag: sanitizeText(data.aboutHeroTag, 60) || DEFAULT_SITE_TEXTS.aboutHeroTag,
    aboutHeroTitle: sanitizeText(data.aboutHeroTitle, 140) || DEFAULT_SITE_TEXTS.aboutHeroTitle,
    aboutHeroSubtitle: sanitizeText(data.aboutHeroSubtitle, 320) || DEFAULT_SITE_TEXTS.aboutHeroSubtitle,
    aboutHeroImage: sanitizeUrl(data.aboutHeroImage) || DEFAULT_SITE_TEXTS.aboutHeroImage,
    aboutStat1Number: sanitizeText(data.aboutStat1Number, 20) || DEFAULT_SITE_TEXTS.aboutStat1Number,
    aboutStat1Description: sanitizeText(data.aboutStat1Description, 80) || DEFAULT_SITE_TEXTS.aboutStat1Description,
    aboutStat2Number: sanitizeText(data.aboutStat2Number, 20) || DEFAULT_SITE_TEXTS.aboutStat2Number,
    aboutStat2Description: sanitizeText(data.aboutStat2Description, 80) || DEFAULT_SITE_TEXTS.aboutStat2Description,
    aboutStat3Number: sanitizeText(data.aboutStat3Number, 20) || DEFAULT_SITE_TEXTS.aboutStat3Number,
    aboutStat3Description: sanitizeText(data.aboutStat3Description, 80) || DEFAULT_SITE_TEXTS.aboutStat3Description,
    contactPageTitle: sanitizeText(data.contactPageTitle, 120) || DEFAULT_SITE_TEXTS.contactPageTitle,
    contactPageSubtitle: sanitizeText(data.contactPageSubtitle, 280) || DEFAULT_SITE_TEXTS.contactPageSubtitle,
    contactPhoneNumber: sanitizeText(data.contactPhoneNumber, 60) || DEFAULT_SITE_TEXTS.contactPhoneNumber,
    contactPhoneHours: sanitizeText(data.contactPhoneHours, 120) || DEFAULT_SITE_TEXTS.contactPhoneHours,
    contactEmailAddress: sanitizeEmail(data.contactEmailAddress) || DEFAULT_SITE_TEXTS.contactEmailAddress,
    contactEmailResponse: sanitizeText(data.contactEmailResponse, 120) || DEFAULT_SITE_TEXTS.contactEmailResponse,
    contactWhatsappUrl: sanitizeUrl(data.contactWhatsappUrl) || DEFAULT_SITE_TEXTS.contactWhatsappUrl,
    contactWhatsappLabel: sanitizeText(data.contactWhatsappLabel, 80) || DEFAULT_SITE_TEXTS.contactWhatsappLabel,
    contactAddressLine: sanitizeText(data.contactAddressLine, 180) || DEFAULT_SITE_TEXTS.contactAddressLine,
    contactAddressZip: sanitizeText(data.contactAddressZip, 20) || DEFAULT_SITE_TEXTS.contactAddressZip,
    contactAddressCountry: sanitizeText(data.contactAddressCountry, 60) || DEFAULT_SITE_TEXTS.contactAddressCountry,
    contactCtaLabel: sanitizeText(data.contactCtaLabel, 40) || DEFAULT_SITE_TEXTS.contactCtaLabel,
    contactCtaUrl: sanitizeUrl(data.contactCtaUrl) || DEFAULT_SITE_TEXTS.contactCtaUrl
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
    ctaSecondaryUrl: sanitizeUrl(siteTexts.ctaSecondaryUrl) || DEFAULT_SITE_TEXTS.ctaSecondaryUrl,
    servicesFeedbackTitle: sanitizeText(siteTexts.servicesFeedbackTitle, 140) || DEFAULT_SITE_TEXTS.servicesFeedbackTitle,
    servicesFeedbackSubtitle: sanitizeText(siteTexts.servicesFeedbackSubtitle, 220) || DEFAULT_SITE_TEXTS.servicesFeedbackSubtitle,
    aboutHeroTag: sanitizeText(siteTexts.aboutHeroTag, 60) || DEFAULT_SITE_TEXTS.aboutHeroTag,
    aboutHeroTitle: sanitizeText(siteTexts.aboutHeroTitle, 140) || DEFAULT_SITE_TEXTS.aboutHeroTitle,
    aboutHeroSubtitle: sanitizeText(siteTexts.aboutHeroSubtitle, 320) || DEFAULT_SITE_TEXTS.aboutHeroSubtitle,
    aboutHeroImage: sanitizeUrl(siteTexts.aboutHeroImage) || DEFAULT_SITE_TEXTS.aboutHeroImage,
    aboutStat1Number: sanitizeText(siteTexts.aboutStat1Number, 20) || DEFAULT_SITE_TEXTS.aboutStat1Number,
    aboutStat1Description: sanitizeText(siteTexts.aboutStat1Description, 80) || DEFAULT_SITE_TEXTS.aboutStat1Description,
    aboutStat2Number: sanitizeText(siteTexts.aboutStat2Number, 20) || DEFAULT_SITE_TEXTS.aboutStat2Number,
    aboutStat2Description: sanitizeText(siteTexts.aboutStat2Description, 80) || DEFAULT_SITE_TEXTS.aboutStat2Description,
    aboutStat3Number: sanitizeText(siteTexts.aboutStat3Number, 20) || DEFAULT_SITE_TEXTS.aboutStat3Number,
    aboutStat3Description: sanitizeText(siteTexts.aboutStat3Description, 80) || DEFAULT_SITE_TEXTS.aboutStat3Description,
    contactPageTitle: sanitizeText(siteTexts.contactPageTitle, 120) || DEFAULT_SITE_TEXTS.contactPageTitle,
    contactPageSubtitle: sanitizeText(siteTexts.contactPageSubtitle, 280) || DEFAULT_SITE_TEXTS.contactPageSubtitle,
    contactPhoneNumber: sanitizeText(siteTexts.contactPhoneNumber, 60) || DEFAULT_SITE_TEXTS.contactPhoneNumber,
    contactPhoneHours: sanitizeText(siteTexts.contactPhoneHours, 120) || DEFAULT_SITE_TEXTS.contactPhoneHours,
    contactEmailAddress: sanitizeEmail(siteTexts.contactEmailAddress) || DEFAULT_SITE_TEXTS.contactEmailAddress,
    contactEmailResponse: sanitizeText(siteTexts.contactEmailResponse, 120) || DEFAULT_SITE_TEXTS.contactEmailResponse,
    contactWhatsappUrl: sanitizeUrl(siteTexts.contactWhatsappUrl) || DEFAULT_SITE_TEXTS.contactWhatsappUrl,
    contactWhatsappLabel: sanitizeText(siteTexts.contactWhatsappLabel, 80) || DEFAULT_SITE_TEXTS.contactWhatsappLabel,
    contactAddressLine: sanitizeText(siteTexts.contactAddressLine, 180) || DEFAULT_SITE_TEXTS.contactAddressLine,
    contactAddressZip: sanitizeText(siteTexts.contactAddressZip, 20) || DEFAULT_SITE_TEXTS.contactAddressZip,
    contactAddressCountry: sanitizeText(siteTexts.contactAddressCountry, 60) || DEFAULT_SITE_TEXTS.contactAddressCountry,
    contactCtaLabel: sanitizeText(siteTexts.contactCtaLabel, 40) || DEFAULT_SITE_TEXTS.contactCtaLabel,
    contactCtaUrl: sanitizeUrl(siteTexts.contactCtaUrl) || DEFAULT_SITE_TEXTS.contactCtaUrl
  };

  writeJsonFile(SITE_TEXTS_FILE, safePayload);
}

function readPopupConfigData() {
  const data = readJsonFile(POPUP_CONFIG_FILE, DEFAULT_POPUP_CONFIG);
  return sanitizePopupConfig(data);
}

function writePopupConfigData(config) {
  writeJsonFile(POPUP_CONFIG_FILE, sanitizePopupConfig(config));
}

function readPopupLeadsData() {
  const data = readJsonFile(POPUP_LEADS_FILE, DEFAULT_POPUP_LEADS);
  if (!Array.isArray(data)) return [];

  return data
    .map((item) => ({
      id: sanitizeText(item.id, 120),
      createdAt: normalizeIsoDate(item.createdAt),
      source: sanitizeText(item.source, 40),
      pagePath: sanitizePath(item.pagePath),
      name: sanitizeText(item.name, 80),
      email: sanitizeEmail(item.email),
      phone: sanitizePhone(item.phone),
      userAgent: sanitizeText(item.userAgent, 240)
    }))
    .filter((item) => item.id && item.createdAt && (item.email || item.phone));
}

function writePopupLeadsData(leads) {
  const safeLeads = Array.isArray(leads)
    ? leads
      .map((item) => ({
        id: sanitizeText(item.id, 120) || generateId('lead'),
        createdAt: normalizeIsoDate(item.createdAt) || new Date().toISOString(),
        source: sanitizeText(item.source, 40) || 'exit-intent',
        pagePath: sanitizePath(item.pagePath),
        name: sanitizeText(item.name, 80),
        email: sanitizeEmail(item.email),
        phone: sanitizePhone(item.phone),
        userAgent: sanitizeText(item.userAgent, 240)
      }))
      .filter((item) => item.email || item.phone)
    : [];

  writeJsonFile(POPUP_LEADS_FILE, safeLeads);
}

function readPopupEventsData() {
  const data = readJsonFile(POPUP_EVENTS_FILE, DEFAULT_POPUP_EVENTS);
  if (!Array.isArray(data)) return [];

  return data
    .map((item) => ({
      id: sanitizeText(item.id, 120),
      createdAt: normalizeIsoDate(item.createdAt),
      event: sanitizeText(item.event, 40).toLowerCase(),
      pagePath: sanitizePath(item.pagePath),
      source: sanitizeText(item.source, 40),
      mobile: Boolean(item.mobile),
      metadata: sanitizePopupEventMetadata(item.metadata),
      sessionId: sanitizeText(item.sessionId, 64),
      ipHash: sanitizeText(item.ipHash, 40),
      userAgent: sanitizeText(item.userAgent, 240)
    }))
    .filter((item) => item.id && item.createdAt && POPUP_EVENT_TYPES.has(item.event));
}

function writePopupEventsData(events) {
  const safeEvents = Array.isArray(events)
    ? events
      .map((item) => ({
        id: sanitizeText(item.id, 120) || generateId('popup_event'),
        createdAt: normalizeIsoDate(item.createdAt) || new Date().toISOString(),
        event: sanitizeText(item.event, 40).toLowerCase(),
        pagePath: sanitizePath(item.pagePath),
        source: sanitizeText(item.source, 40),
        mobile: Boolean(item.mobile),
        metadata: sanitizePopupEventMetadata(item.metadata),
        sessionId: sanitizeText(item.sessionId, 64),
        ipHash: sanitizeText(item.ipHash, 40),
        userAgent: sanitizeText(item.userAgent, 240)
      }))
      .filter((item) => POPUP_EVENT_TYPES.has(item.event))
    : [];

  writeJsonFile(POPUP_EVENTS_FILE, safeEvents);
}

function readAnalyticsConfigData() {
  const data = readJsonFile(ANALYTICS_CONFIG_FILE, DEFAULT_ANALYTICS_CONFIG);
  return sanitizeAnalyticsConfig(data);
}

function writeAnalyticsConfigData(config) {
  writeJsonFile(ANALYTICS_CONFIG_FILE, sanitizeAnalyticsConfig(config));
}

function toPublicAnalyticsConfig(config) {
  const safe = sanitizeAnalyticsConfig(config);
  return {
    siteUrl: safe.siteUrl,
    consent: safe.consent,
    providers: safe.providers,
    tracking: safe.tracking
  };
}

function sanitizeAnalyticsConfig(input) {
  const source = input && typeof input === 'object' ? input : {};
  const consent = source.consent && typeof source.consent === 'object' ? source.consent : {};
  const providers = source.providers && typeof source.providers === 'object' ? source.providers : {};
  const performance = source.performance && typeof source.performance === 'object' ? source.performance : {};
  const seo = source.seo && typeof source.seo === 'object' ? source.seo : {};
  const tracking = source.tracking && typeof source.tracking === 'object' ? source.tracking : {};

  const monitoredPages = Array.isArray(performance.monitoredPages)
    ? performance.monitoredPages.map((item) => sanitizePath(item)).filter(Boolean).slice(0, 10)
    : [];

  const scrollMilestonesRaw = Array.isArray(tracking.scrollMilestones)
    ? tracking.scrollMilestones
    : DEFAULT_ANALYTICS_CONFIG.tracking.scrollMilestones;
  const scrollMilestones = Array.from(
    new Set(
      scrollMilestonesRaw
        .map((value) => clampInteger(value, 1, 100, 0))
        .filter((value) => value > 0)
    )
  ).sort((a, b) => a - b);

  return {
    siteUrl: sanitizeUrl(source.siteUrl) || DEFAULT_ANALYTICS_CONFIG.siteUrl,
    consent: {
      bannerEnabled: coerceBoolean(consent.bannerEnabled, DEFAULT_ANALYTICS_CONFIG.consent.bannerEnabled),
      version: clampInteger(consent.version, 1, 9999, DEFAULT_ANALYTICS_CONFIG.consent.version),
      categories: {
        analytics: coerceBoolean(
          consent.categories && consent.categories.analytics,
          DEFAULT_ANALYTICS_CONFIG.consent.categories.analytics
        ),
        marketing: coerceBoolean(
          consent.categories && consent.categories.marketing,
          DEFAULT_ANALYTICS_CONFIG.consent.categories.marketing
        ),
        performance: coerceBoolean(
          consent.categories && consent.categories.performance,
          DEFAULT_ANALYTICS_CONFIG.consent.categories.performance
        )
      }
    },
    providers: {
      ga4: {
        enabled: coerceBoolean(providers.ga4 && providers.ga4.enabled, false),
        measurementId: sanitizeText(providers.ga4 && providers.ga4.measurementId, 40)
      },
      matomo: {
        enabled: coerceBoolean(providers.matomo && providers.matomo.enabled, false),
        baseUrl: sanitizeUrl(providers.matomo && providers.matomo.baseUrl),
        siteId: sanitizeText(providers.matomo && providers.matomo.siteId, 24)
      },
      plausible: {
        enabled: coerceBoolean(providers.plausible && providers.plausible.enabled, false),
        domain: sanitizeText(providers.plausible && providers.plausible.domain, 120),
        scriptUrl: sanitizeUrl(providers.plausible && providers.plausible.scriptUrl) ||
          DEFAULT_ANALYTICS_CONFIG.providers.plausible.scriptUrl
      },
      posthog: {
        enabled: coerceBoolean(providers.posthog && providers.posthog.enabled, false),
        apiKey: sanitizeText(providers.posthog && providers.posthog.apiKey, 200),
        apiHost: sanitizeUrl(providers.posthog && providers.posthog.apiHost) ||
          DEFAULT_ANALYTICS_CONFIG.providers.posthog.apiHost
      },
      clarity: {
        enabled: coerceBoolean(providers.clarity && providers.clarity.enabled, false),
        projectId: sanitizeText(providers.clarity && providers.clarity.projectId, 40)
      },
      hotjar: {
        enabled: coerceBoolean(providers.hotjar && providers.hotjar.enabled, false),
        siteId: sanitizeText(providers.hotjar && providers.hotjar.siteId, 40),
        version: clampInteger(providers.hotjar && providers.hotjar.version, 1, 20, 6)
      },
      crazyegg: {
        enabled: coerceBoolean(providers.crazyegg && providers.crazyegg.enabled, false),
        accountId: sanitizeText(providers.crazyegg && providers.crazyegg.accountId, 64),
        scriptVersion: sanitizeText(providers.crazyegg && providers.crazyegg.scriptVersion, 20) || '11'
      },
      fullstory: {
        enabled: coerceBoolean(providers.fullstory && providers.fullstory.enabled, false),
        orgId: sanitizeText(providers.fullstory && providers.fullstory.orgId, 64)
      },
      sentry: {
        enabled: coerceBoolean(providers.sentry && providers.sentry.enabled, false),
        dsn: sanitizeText(providers.sentry && providers.sentry.dsn, 280),
        environment: sanitizeText(providers.sentry && providers.sentry.environment, 32) || 'production'
      },
      logrocket: {
        enabled: coerceBoolean(providers.logrocket && providers.logrocket.enabled, false),
        appId: sanitizeText(providers.logrocket && providers.logrocket.appId, 80)
      }
    },
    performance: {
      pagespeedApiKey: sanitizeText(performance.pagespeedApiKey, 160),
      enableLighthouse: coerceBoolean(performance.enableLighthouse, false),
      monitoredPages: monitoredPages.length > 0
        ? monitoredPages
        : DEFAULT_ANALYTICS_CONFIG.performance.monitoredPages.slice()
    },
    seo: {
      enableSearchConsole: coerceBoolean(seo.enableSearchConsole, false),
      propertyUrl: sanitizeUrl(seo.propertyUrl),
      sitemapUrl: sanitizeUrl(seo.sitemapUrl) || sanitizePath(seo.sitemapUrl) || DEFAULT_ANALYTICS_CONFIG.seo.sitemapUrl
    },
    tracking: {
      enabled: coerceBoolean(tracking.enabled, true),
      heartbeatSeconds: clampInteger(tracking.heartbeatSeconds, 10, 300, 30),
      scrollMilestones: scrollMilestones.length > 0 ? scrollMilestones : DEFAULT_ANALYTICS_CONFIG.tracking.scrollMilestones
    }
  };
}

function sanitizeAnalyticsMetadata(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {};
  }

  const entries = Object.entries(input).slice(0, 20);
  const safeMetadata = {};

  for (const [rawKey, rawValue] of entries) {
    const key = sanitizeText(rawKey, 48);
    if (!key) continue;

    if (typeof rawValue === 'boolean') {
      safeMetadata[key] = rawValue;
      continue;
    }

    if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
      safeMetadata[key] = Math.round(rawValue * 100) / 100;
      continue;
    }

    if (Array.isArray(rawValue)) {
      safeMetadata[key] = rawValue
        .slice(0, 8)
        .map((item) => sanitizeText(item, 64))
        .filter(Boolean);
      continue;
    }

    const textValue = sanitizeText(rawValue, 180);
    if (!textValue) continue;
    safeMetadata[key] = textValue;
  }

  return safeMetadata;
}

function sanitizeAnalyticsEventPayload(body) {
  const payload = body && typeof body === 'object' ? body : {};
  const eventName = sanitizeText(payload.event, 64).toLowerCase().replace(/\s+/g, '_');
  const event = ANALYTICS_EVENT_NAMES.has(eventName) ? eventName : '';
  const page = sanitizePath(payload.page || payload.pagePath || '/');
  const category = sanitizeText(payload.category, 40);
  const userId = sanitizeText(payload.userId, 80);
  const sessionId = sanitizeText(payload.sessionId, 80);

  return {
    event,
    page,
    category,
    userId,
    sessionId,
    metadata: sanitizeAnalyticsMetadata(payload.metadata)
  };
}

function readAnalyticsData() {
  const data = readJsonFile(ANALYTICS_FILE, DEFAULT_ANALYTICS_DATA);
  const eventsRaw = Array.isArray(data.events) ? data.events : [];
  const sessionsRaw = Array.isArray(data.sessions) ? data.sessions : [];

  const events = eventsRaw
    .map((item) => {
      const parsed = sanitizeAnalyticsEventPayload(item);
      return {
        id: sanitizeText(item.id, 120) || generateId('analytics_event'),
        event: parsed.event,
        page: parsed.page,
        timestamp: normalizeIsoDate(item.timestamp),
        userId: parsed.userId,
        sessionId: parsed.sessionId,
        category: parsed.category,
        metadata: parsed.metadata,
        userAgent: sanitizeText(item.userAgent, 220),
        ipHash: sanitizeText(item.ipHash, 40)
      };
    })
    .filter((item) => item.event && item.timestamp);

  const sessions = sessionsRaw
    .map((item) => ({
      id: sanitizeText(item.id, 120),
      userId: sanitizeText(item.userId, 80),
      startAt: normalizeIsoDate(item.startAt),
      endAt: normalizeIsoDate(item.endAt),
      lastSeenAt: normalizeIsoDate(item.lastSeenAt),
      lastPage: sanitizePath(item.lastPage),
      pageViews: clampInteger(item.pageViews, 0, 1000, 0),
      durationMs: clampInteger(item.durationMs, 0, 12 * 60 * 60 * 1000, 0),
      referrer: sanitizeText(item.referrer, 260),
      userAgent: sanitizeText(item.userAgent, 220),
      deviceType: sanitizeText(item.deviceType, 30)
    }))
    .filter((item) => item.id && item.startAt);

  return { events, sessions };
}

function writeAnalyticsData(data) {
  const source = data && typeof data === 'object' ? data : {};
  const normalized = {
    events: Array.isArray(source.events) ? source.events : [],
    sessions: Array.isArray(source.sessions) ? source.sessions : []
  };

  const safe = readAnalyticsDataFromObject(normalized);
  writeJsonFile(ANALYTICS_FILE, safe);
}

function readAnalyticsDataFromObject(source) {
  const eventsRaw = Array.isArray(source.events) ? source.events : [];
  const sessionsRaw = Array.isArray(source.sessions) ? source.sessions : [];

  const events = eventsRaw
    .map((item) => {
      const parsed = sanitizeAnalyticsEventPayload(item);
      return {
        id: sanitizeText(item.id, 120) || generateId('analytics_event'),
        event: parsed.event,
        page: parsed.page,
        timestamp: normalizeIsoDate(item.timestamp) || new Date().toISOString(),
        userId: parsed.userId,
        sessionId: parsed.sessionId,
        category: parsed.category,
        metadata: parsed.metadata,
        userAgent: sanitizeText(item.userAgent, 220),
        ipHash: sanitizeText(item.ipHash, 40)
      };
    })
    .filter((item) => item.event && item.timestamp)
    .slice(-50000);

  const sessions = sessionsRaw
    .map((item) => ({
      id: sanitizeText(item.id, 120),
      userId: sanitizeText(item.userId, 80),
      startAt: normalizeIsoDate(item.startAt),
      endAt: normalizeIsoDate(item.endAt),
      lastSeenAt: normalizeIsoDate(item.lastSeenAt),
      lastPage: sanitizePath(item.lastPage),
      pageViews: clampInteger(item.pageViews, 0, 1000, 0),
      durationMs: clampInteger(item.durationMs, 0, 12 * 60 * 60 * 1000, 0),
      referrer: sanitizeText(item.referrer, 260),
      userAgent: sanitizeText(item.userAgent, 220),
      deviceType: sanitizeText(item.deviceType, 30)
    }))
    .filter((item) => item.id && item.startAt)
    .slice(-20000);

  return { events, sessions };
}

function buildAnalyticsStats(data, days) {
  const safeData = readAnalyticsDataFromObject(data);
  const periodDays = clampInteger(days, 1, 120, 30);
  const now = Date.now();
  const startAt = now - (periodDays * 24 * 60 * 60 * 1000);

  const events = safeData.events
    .filter((item) => {
      const ts = Date.parse(item.timestamp);
      return !Number.isNaN(ts) && ts >= startAt;
    })
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));

  const sessions = safeData.sessions.filter((item) => {
    const start = Date.parse(item.startAt);
    const end = Date.parse(item.endAt || item.lastSeenAt || item.startAt);
    if (!Number.isNaN(start) && start >= startAt) return true;
    if (!Number.isNaN(end) && end >= startAt) return true;
    return false;
  });

  const sessionPageViews = new Map();
  for (const event of events) {
    if (!event.sessionId) continue;
    if (event.event !== 'page_view') continue;
    const current = sessionPageViews.get(event.sessionId) || 0;
    sessionPageViews.set(event.sessionId, current + 1);
  }

  let bounceSessions = 0;
  let durationTotalMs = 0;
  let durationSamples = 0;
  const visitors = new Set();

  for (const session of sessions) {
    const visitorKey = session.userId || session.id;
    visitors.add(visitorKey);

    const pageViewsBySession = sessionPageViews.get(session.id);
    const pageViews = pageViewsBySession || clampInteger(session.pageViews, 0, 1000, 0);
    if (pageViews <= 1) {
      bounceSessions += 1;
    }

    let durationMs = clampInteger(session.durationMs, 0, 12 * 60 * 60 * 1000, 0);
    if (durationMs <= 0) {
      const start = Date.parse(session.startAt);
      const end = Date.parse(session.endAt || session.lastSeenAt || session.startAt);
      if (!Number.isNaN(start) && !Number.isNaN(end) && end >= start) {
        durationMs = Math.min(12 * 60 * 60 * 1000, end - start);
      }
    }

    if (durationMs > 0) {
      durationTotalMs += durationMs;
      durationSamples += 1;
    }
  }

  const pageMap = new Map();
  const eventCounters = new Map();
  const heatmapClicks = new Map();
  const scrollValues = [];
  const conversions = {
    forms: 0,
    downloads: 0,
    leads: 0,
    popupOpen: 0
  };

  for (const event of events) {
    eventCounters.set(event.event, (eventCounters.get(event.event) || 0) + 1);

    if (event.event === 'page_view') {
      const page = event.page || '/';
      pageMap.set(page, (pageMap.get(page) || 0) + 1);
    }

    if (event.event === 'click' || event.event === 'cta_click') {
      const area = sanitizeText(
        event.metadata.selector || event.metadata.label || event.metadata.id || event.page || 'sem-identificacao',
        120
      );
      if (area) {
        heatmapClicks.set(area, (heatmapClicks.get(area) || 0) + 1);
      }
    }

    if (event.event === 'scroll') {
      const value = Number(event.metadata.percent);
      if (Number.isFinite(value) && value >= 0 && value <= 100) {
        scrollValues.push(value);
      }
    }

    if (event.event === 'form_submit') conversions.forms += 1;
    if (event.event === 'download') conversions.downloads += 1;
    if (event.event === 'popup_submit') conversions.leads += 1;
    if (event.event === 'popup_open') conversions.popupOpen += 1;
  }

  const topPages = Array.from(pageMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([page, total]) => ({ page, total }));

  const topClickAreas = Array.from(heatmapClicks.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([area, total]) => ({ area, total }));

  const chartMap = new Map();
  for (let index = periodDays - 1; index >= 0; index -= 1) {
    const dayDate = new Date(now - (index * 24 * 60 * 60 * 1000));
    const key = dayDate.toISOString().slice(0, 10);
    chartMap.set(key, 0);
  }
  for (const event of events) {
    const key = String(event.timestamp).slice(0, 10);
    if (!chartMap.has(key)) continue;
    chartMap.set(key, (chartMap.get(key) || 0) + 1);
  }

  const eventsTable = events.slice(0, 120).map((event) => ({
    event: event.event,
    page: event.page || '/',
    timestamp: event.timestamp,
    userId: event.userId || event.sessionId || 'anonimo'
  }));

  const totalSessions = sessions.length;
  const bounceRate = totalSessions > 0 ? Number(((bounceSessions / totalSessions) * 100).toFixed(2)) : 0;
  const avgTimeSeconds = durationSamples > 0 ? Math.round(durationTotalMs / durationSamples / 1000) : 0;
  const conversionTotal = conversions.forms + conversions.downloads + conversions.leads;
  const conversionRate = totalSessions > 0 ? Number(((conversionTotal / totalSessions) * 100).toFixed(2)) : 0;

  return {
    generatedAt: new Date().toISOString(),
    periodDays,
    metrics: {
      visitors: visitors.size,
      sessions: totalSessions,
      bounceRate,
      avgTimeSeconds,
      pagesTracked: topPages.length
    },
    topPages,
    heatmap: {
      topClickAreas,
      avgScrollPercent: scrollValues.length > 0
        ? Number((scrollValues.reduce((acc, value) => acc + value, 0) / scrollValues.length).toFixed(2))
        : 0
    },
    conversions: {
      ...conversions,
      total: conversionTotal,
      conversionRate
    },
    eventCounts: Object.fromEntries(eventCounters),
    eventsByDay: Array.from(chartMap.entries()).map(([day, total]) => ({ day, total })),
    eventsTable
  };
}

async function buildAnalyticsPerformanceReport(config) {
  const safe = sanitizeAnalyticsConfig(config);
  const siteUrl = sanitizeUrl(safe.siteUrl) || `http://localhost:${PORT}`;
  const monitoredPages = Array.isArray(safe.performance.monitoredPages)
    ? safe.performance.monitoredPages.slice(0, 5)
    : DEFAULT_ANALYTICS_CONFIG.performance.monitoredPages.slice(0, 5);
  const apiKey = sanitizeText(safe.performance.pagespeedApiKey, 160);

  const pagespeedResults = [];
  for (const pagePath of monitoredPages) {
    const pageUrl = toAbsoluteUrl(siteUrl, pagePath);
    if (!pageUrl) continue;

    const pagespeedUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
    pagespeedUrl.searchParams.set('url', pageUrl);
    pagespeedUrl.searchParams.set('strategy', 'mobile');
    if (apiKey) {
      pagespeedUrl.searchParams.set('key', apiKey);
    }

    const result = {
      page: pagePath,
      url: pageUrl,
      score: null,
      fcpMs: null,
      lcpMs: null,
      cls: null,
      tbtMs: null,
      status: 'ok',
      error: ''
    };

    try {
      const response = await fetchWithTimeout(pagespeedUrl.toString(), { method: 'GET' }, 18000);
      if (!response.ok) {
        result.status = 'error';
        result.error = `PageSpeed retornou ${response.status}.`;
      } else {
        const payload = await response.json();
        const lighthouse = payload && payload.lighthouseResult ? payload.lighthouseResult : {};
        const categories = lighthouse.categories || {};
        const audits = lighthouse.audits || {};

        const score = categories.performance && Number(categories.performance.score);
        result.score = Number.isFinite(score) ? Math.round(score * 100) : null;
        result.fcpMs = extractAuditNumeric(audits['first-contentful-paint']);
        result.lcpMs = extractAuditNumeric(audits['largest-contentful-paint']);
        result.cls = extractAuditNumeric(audits['cumulative-layout-shift']);
        result.tbtMs = extractAuditNumeric(audits['total-blocking-time']);
      }
    } catch (error) {
      result.status = 'error';
      result.error = sanitizeText(error && error.message, 180) || 'Falha ao consultar PageSpeed.';
    }

    pagespeedResults.push(result);
  }

  let lighthouse = {
    enabled: Boolean(safe.performance.enableLighthouse),
    available: false,
    score: null,
    status: 'disabled',
    error: ''
  };

  if (safe.performance.enableLighthouse) {
    const firstPage = monitoredPages[0] || '/';
    const url = toAbsoluteUrl(siteUrl, firstPage);
    if (url) {
      lighthouse = runLocalLighthouse(url);
    } else {
      lighthouse = {
        enabled: true,
        available: false,
        score: null,
        status: 'error',
        error: 'URL invalida para executar Lighthouse.'
      };
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    pagespeed: {
      enabled: true,
      pages: pagespeedResults
    },
    lighthouse
  };
}

function runLocalLighthouse(url) {
  try {
    const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const execResult = spawnSync(
      command,
      [
        '--yes',
        'lighthouse',
        url,
        '--quiet',
        '--chrome-flags=--headless',
        '--only-categories=performance',
        '--output=json',
        '--output-path=stdout'
      ],
      {
        encoding: 'utf8',
        timeout: 180000,
        maxBuffer: 20 * 1024 * 1024
      }
    );

    if (execResult.error) {
      return {
        enabled: true,
        available: false,
        score: null,
        status: 'error',
        error: sanitizeText(execResult.error.message, 180) || 'Nao foi possivel executar Lighthouse.'
      };
    }

    if (execResult.status !== 0) {
      return {
        enabled: true,
        available: false,
        score: null,
        status: 'error',
        error: sanitizeText(execResult.stderr || 'Falha ao executar Lighthouse.', 220)
      };
    }

    const payload = JSON.parse(execResult.stdout || '{}');
    const scoreRaw = payload &&
      payload.categories &&
      payload.categories.performance &&
      payload.categories.performance.score;

    const score = Number(scoreRaw);
    return {
      enabled: true,
      available: true,
      score: Number.isFinite(score) ? Math.round(score * 100) : null,
      status: 'ok',
      error: ''
    };
  } catch (error) {
    return {
      enabled: true,
      available: false,
      score: null,
      status: 'error',
      error: sanitizeText(error && error.message, 180) || 'Falha inesperada no Lighthouse.'
    };
  }
}

function extractAuditNumeric(audit) {
  if (!audit || typeof audit !== 'object') return null;
  const value = Number(audit.numericValue);
  if (!Number.isFinite(value)) return null;
  return Number(value.toFixed(2));
}

async function buildAnalyticsSeoReport(config) {
  const safe = sanitizeAnalyticsConfig(config);
  const siteUrl = sanitizeUrl(safe.siteUrl) || `http://localhost:${PORT}`;
  const sitemapUrlValue = safe.seo.sitemapUrl || DEFAULT_ANALYTICS_CONFIG.seo.sitemapUrl;
  const sitemapUrl = toAbsoluteUrl(siteUrl, sitemapUrlValue) || toAbsoluteUrl(siteUrl, '/sitemap.xml');

  const sitemap = await inspectSitemap(sitemapUrl);
  const searchConsoleConfigured = Boolean(safe.seo.enableSearchConsole && safe.seo.propertyUrl);

  return {
    generatedAt: new Date().toISOString(),
    siteUrl,
    searchConsole: {
      enabled: Boolean(safe.seo.enableSearchConsole),
      configured: searchConsoleConfigured,
      propertyUrl: safe.seo.propertyUrl || '',
      note: searchConsoleConfigured
        ? 'Configurado para integracao manual via API/credenciais externas.'
        : 'Defina propertyUrl e habilite Search Console para consolidar SEO.'
    },
    sitemap
  };
}

async function inspectSitemap(sitemapUrl) {
  const result = {
    url: sitemapUrl || '',
    status: 'error',
    available: false,
    totalUrls: 0,
    lastModifiedSamples: [],
    issues: []
  };

  if (!sitemapUrl) {
    result.issues.push('URL do sitemap nao configurada.');
    return result;
  }

  try {
    const parsed = new URL(sitemapUrl);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      const localPath = path.join(ROOT_DIR, parsed.pathname.replace(/^\//, ''));
      if (!fs.existsSync(localPath)) {
        result.issues.push('Arquivo sitemap local nao encontrado.');
        return result;
      }

      const xml = fs.readFileSync(localPath, 'utf8');
      const parsedXml = parseSitemapXml(xml);
      result.status = 'ok';
      result.available = true;
      result.totalUrls = parsedXml.totalUrls;
      result.lastModifiedSamples = parsedXml.lastModifiedSamples;
      if (parsedXml.totalUrls === 0) {
        result.issues.push('Sitemap sem URLs indexadas.');
      }
      return result;
    }

    const response = await fetchWithTimeout(sitemapUrl, { method: 'GET' }, 12000);
    if (!response.ok) {
      const fallback = tryLoadLocalSitemap(parsed.pathname);
      if (fallback) {
        result.status = 'ok';
        result.available = true;
        result.totalUrls = fallback.totalUrls;
        result.lastModifiedSamples = fallback.lastModifiedSamples;
        result.issues.push(`Sitemap remoto retornou ${response.status}; exibindo leitura local.`);
        return result;
      }

      result.status = 'error';
      result.issues.push(`Sitemap remoto retornou ${response.status}.`);
      return result;
    }

    const xml = await response.text();
    const parsedXml = parseSitemapXml(xml);
    result.status = 'ok';
    result.available = true;
    result.totalUrls = parsedXml.totalUrls;
    result.lastModifiedSamples = parsedXml.lastModifiedSamples;
    if (parsedXml.totalUrls === 0) {
      result.issues.push('Sitemap sem URLs indexadas.');
    }
    return result;
  } catch {
    try {
      const parsed = new URL(sitemapUrl);
      const fallback = tryLoadLocalSitemap(parsed.pathname);
      if (fallback) {
        result.status = 'ok';
        result.available = true;
        result.totalUrls = fallback.totalUrls;
        result.lastModifiedSamples = fallback.lastModifiedSamples;
        result.issues.push('Falha no sitemap remoto; exibindo leitura local.');
        return result;
      }
    } catch {
      // Segue para fallback padrao abaixo.
    }

    const localPath = path.join(ROOT_DIR, String(sitemapUrl).replace(/^\//, ''));
    if (!fs.existsSync(localPath)) {
      result.issues.push('Sitemap invalido ou nao encontrado.');
      return result;
    }

    const xml = fs.readFileSync(localPath, 'utf8');
    const parsedXml = parseSitemapXml(xml);
    result.status = 'ok';
    result.available = true;
    result.totalUrls = parsedXml.totalUrls;
    result.lastModifiedSamples = parsedXml.lastModifiedSamples;
    if (parsedXml.totalUrls === 0) {
      result.issues.push('Sitemap sem URLs indexadas.');
    }
    return result;
  }
}

function tryLoadLocalSitemap(pathname) {
  const localPath = path.join(ROOT_DIR, String(pathname || '/sitemap.xml').replace(/^\//, ''));
  if (!fs.existsSync(localPath)) return null;
  const xml = fs.readFileSync(localPath, 'utf8');
  return parseSitemapXml(xml);
}

function parseSitemapXml(xml) {
  const raw = typeof xml === 'string' ? xml : '';
  const locMatches = [...raw.matchAll(/<loc>(.*?)<\/loc>/gi)];
  const lastModMatches = [...raw.matchAll(/<lastmod>(.*?)<\/lastmod>/gi)];
  const totalUrls = locMatches.length;
  const lastModifiedSamples = lastModMatches
    .slice(0, 5)
    .map((match) => sanitizeText(match[1], 80))
    .filter(Boolean);

  return { totalUrls, lastModifiedSamples };
}

function toAbsoluteUrl(baseUrl, pagePath) {
  const safeBase = sanitizeUrl(baseUrl);
  const safePath = sanitizeUrl(pagePath) || sanitizePath(pagePath);
  if (!safeBase) return '';

  try {
    if (safePath && (safePath.startsWith('http://') || safePath.startsWith('https://'))) {
      return safePath;
    }
    const url = new URL(safePath || '/', safeBase);
    return url.toString();
  } catch {
    return '';
  }
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

function sanitizePath(input) {
  const value = sanitizeText(input, 240);
  if (!value) return '';
  if (!value.startsWith('/')) return '';
  if (value.includes('..')) return '';
  return value;
}

function sanitizePhone(input) {
  const digits = String(input || '').replace(/[^\d+]/g, '').slice(0, 20);
  return digits;
}

function normalizeIsoDate(input) {
  const value = typeof input === 'string' ? input : '';
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString();
}

function sanitizePopupConfig(input) {
  const source = input && typeof input === 'object' ? input : {};

  return {
    title: sanitizeText(source.title, 80) || DEFAULT_POPUP_CONFIG.title,
    description: sanitizeText(source.description, 220) || DEFAULT_POPUP_CONFIG.description,
    enableName: coerceBoolean(source.enableName, DEFAULT_POPUP_CONFIG.enableName),
    enableEmail: coerceBoolean(source.enableEmail, DEFAULT_POPUP_CONFIG.enableEmail),
    enablePhone: coerceBoolean(source.enablePhone, DEFAULT_POPUP_CONFIG.enablePhone),
    buttonText: sanitizeText(source.buttonText, 40) || DEFAULT_POPUP_CONFIG.buttonText,
    closeText: sanitizeText(source.closeText, 24) || DEFAULT_POPUP_CONFIG.closeText,
    successMessage: sanitizeText(source.successMessage, 160) || DEFAULT_POPUP_CONFIG.successMessage,
    delaySeconds: clampInteger(source.delaySeconds, 3, 90, DEFAULT_POPUP_CONFIG.delaySeconds),
    cooldownHours: clampInteger(source.cooldownHours, 1, 720, DEFAULT_POPUP_CONFIG.cooldownHours),
    maxShowsPerSession: clampInteger(source.maxShowsPerSession, 1, 3, DEFAULT_POPUP_CONFIG.maxShowsPerSession),
    mobileScrollTrigger: coerceBoolean(source.mobileScrollTrigger, DEFAULT_POPUP_CONFIG.mobileScrollTrigger),
    mobileBackButtonTrigger: coerceBoolean(source.mobileBackButtonTrigger, DEFAULT_POPUP_CONFIG.mobileBackButtonTrigger)
  };
}

function validateLeadPayload(body, config) {
  const payload = body && typeof body === 'object' ? body : {};
  const sanitizedConfig = sanitizePopupConfig(config);
  const errors = [];

  const name = sanitizeText(payload.name || payload.nome, 80);
  const email = sanitizeEmail(payload.email);
  const phone = sanitizePhone(payload.phone || payload.telefone);
  const source = sanitizeText(payload.source, 40);
  const pagePath = sanitizePath(payload.pagePath || payload.page || '/');

  if (sanitizedConfig.enableName && !name) {
    errors.push('Informe o nome.');
  }

  if (sanitizedConfig.enableEmail && !email) {
    errors.push('Informe um e-mail valido.');
  }

  if (!email && !phone) {
    errors.push('Informe pelo menos um contato (e-mail ou telefone).');
  }

  return {
    errors,
    value: {
      name,
      email,
      phone,
      source,
      pagePath
    }
  };
}

function sanitizePopupEventMetadata(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {};
  }

  const entries = Object.entries(input).slice(0, 12);
  const safeMetadata = {};

  for (const [rawKey, rawValue] of entries) {
    const key = sanitizeText(rawKey, 40);
    if (!key) continue;

    if (typeof rawValue === 'boolean') {
      safeMetadata[key] = rawValue;
      continue;
    }

    if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
      safeMetadata[key] = Math.round(rawValue * 100) / 100;
      continue;
    }

    const textValue = sanitizeText(rawValue, 120);
    if (!textValue) continue;
    safeMetadata[key] = textValue;
  }

  return safeMetadata;
}

function buildPopupAnalyticsSummary(events, leads) {
  const safeEvents = Array.isArray(events) ? events : [];
  const safeLeads = Array.isArray(leads) ? leads : [];
  const now = Date.now();
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

  const byEvent = {
    popup_shown: 0,
    popup_closed: 0,
    popup_submitted: 0,
    popup_ignored: 0
  };
  const pageCounter = new Map();
  let last7DaysEvents = 0;

  for (const item of safeEvents) {
    const eventName = sanitizeText(item.event, 40).toLowerCase();
    if (byEvent[eventName] !== undefined) {
      byEvent[eventName] += 1;
    }

    const pagePath = sanitizePath(item.pagePath) || '/';
    pageCounter.set(pagePath, (pageCounter.get(pagePath) || 0) + 1);

    const eventDate = Date.parse(item.createdAt);
    if (!Number.isNaN(eventDate) && eventDate >= sevenDaysAgo) {
      last7DaysEvents += 1;
    }
  }

  const last7DaysLeads = safeLeads.filter((lead) => {
    const leadDate = Date.parse(lead.createdAt);
    return !Number.isNaN(leadDate) && leadDate >= sevenDaysAgo;
  }).length;

  const topPages = Array.from(pageCounter.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pagePath, total]) => ({ pagePath, total }));

  const shownCount = byEvent.popup_shown;
  const submittedCount = byEvent.popup_submitted;
  const conversionRate = shownCount > 0
    ? Number(((submittedCount / shownCount) * 100).toFixed(2))
    : 0;

  return {
    totals: byEvent,
    leadsTotal: safeLeads.length,
    last7Days: {
      events: last7DaysEvents,
      leads: last7DaysLeads
    },
    conversionRate,
    topPages
  };
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

function clampInteger(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.round(parsed);
  return Math.min(max, Math.max(min, rounded));
}

function coerceBoolean(value, fallback) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return Boolean(fallback);
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
      "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://plausible.io https://us.i.posthog.com https://static.hotjar.com https://script.hotjar.com https://www.clarity.ms https://script.crazyegg.com https://edge.fullstory.com https://browser.sentry-cdn.com https://cdn.lr-ingest.io https://unpkg.com https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com https://cdn.jsdelivr.net",
      "font-src 'self' data: https://fonts.gstatic.com https://unpkg.com https://cdn.jsdelivr.net",
      "img-src 'self' data: https:",
      "connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://plausible.io https://us.i.posthog.com https://app.posthog.com https://www.clarity.ms https://*.hotjar.com https://script.crazyegg.com https://edge.fullstory.com https://o*.ingest.sentry.io https://cdn.lr-ingest.io",
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


