/* ==[DOC-FILE]===============================================================
Arquivo : src/js/analytics/providers-loader.js
Modulo  : Frontend - analytics/integracoes
Papel   : Carrega scripts de provedores externos de analytics e encaminha eventos customizados.

Responsabilidades:
- Inicializar provedores externos conforme configuracao e consentimento LGPD.
- Evitar carregamento duplicado de scripts durante a sessao.
- Encaminhar eventos rastreados para cada provider disponivel.

Integracoes:
- Dependencias: configuracao vinda de /api/analytics/config
- Endpoints/rotas: nao se aplica para este modulo.
- Classes/seletores/chaves: nao se aplica.

Entradas e saidas:
- Entradas: config publica de providers + objeto de consentimento.
- Saidas  : scripts externos carregados e chamadas de tracking dos providers.

Elementos tecnicos: loadProvidersByConsent, forwardEventToProviders
[DOC-FILE-END]============================================================== */

const loadedScripts = new Set();
const initializedProviders = new Set();

function sanitizeText(value, maxLength = 180) {
  return String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function safeBoolean(value) {
  if (typeof value === 'boolean') return value;
  return String(value || '').toLowerCase() === 'true';
}

function injectScript(src, id, attributes = {}) {
  const safeSrc = sanitizeText(src, 300);
  if (!safeSrc) return Promise.resolve(false);
  if (loadedScripts.has(id || safeSrc)) return Promise.resolve(true);

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = safeSrc;
    script.async = true;
    script.defer = true;
    if (id) script.id = id;

    Object.entries(attributes).forEach(([key, value]) => {
      if (value == null || value === '') return;
      script.setAttribute(key, String(value));
    });

    script.onload = () => {
      loadedScripts.add(id || safeSrc);
      resolve(true);
    };
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

async function initGa4(provider) {
  const measurementId = sanitizeText(provider.measurementId, 40);
  if (!measurementId || initializedProviders.has('ga4')) return;

  await injectScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`, 'rg-ana-ga4');
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
  }
  window.gtag('js', new Date());
  window.gtag('config', measurementId, { anonymize_ip: true });
  initializedProviders.add('ga4');
}

async function initMatomo(provider) {
  const baseUrlRaw = sanitizeText(provider.baseUrl, 220);
  const siteId = sanitizeText(provider.siteId, 24);
  if (!baseUrlRaw || !siteId || initializedProviders.has('matomo')) return;

  const baseUrl = baseUrlRaw.endsWith('/') ? baseUrlRaw : `${baseUrlRaw}/`;
  window._paq = window._paq || [];
  window._paq.push(['setTrackerUrl', `${baseUrl}matomo.php`]);
  window._paq.push(['setSiteId', siteId]);
  window._paq.push(['trackPageView']);
  window._paq.push(['enableLinkTracking']);
  await injectScript(`${baseUrl}matomo.js`, 'rg-ana-matomo');
  initializedProviders.add('matomo');
}

async function initPlausible(provider) {
  const domain = sanitizeText(provider.domain, 120);
  const scriptUrl = sanitizeText(provider.scriptUrl, 220) || 'https://plausible.io/js/script.js';
  if (!domain || initializedProviders.has('plausible')) return;
  await injectScript(scriptUrl, 'rg-ana-plausible', { 'data-domain': domain });
  initializedProviders.add('plausible');
}

async function initPosthog(provider) {
  const apiKey = sanitizeText(provider.apiKey, 220);
  const apiHost = sanitizeText(provider.apiHost, 220) || 'https://us.i.posthog.com';
  if (!apiKey || initializedProviders.has('posthog')) return;

  await injectScript(`${apiHost}/static/array.js`, 'rg-ana-posthog');
  if (window.posthog && typeof window.posthog.init === 'function') {
    window.posthog.init(apiKey, { api_host: apiHost });
    initializedProviders.add('posthog');
  }
}

async function initClarity(provider) {
  const projectId = sanitizeText(provider.projectId, 48);
  if (!projectId || initializedProviders.has('clarity')) return;
  await injectScript(`https://www.clarity.ms/tag/${encodeURIComponent(projectId)}`, 'rg-ana-clarity');
  initializedProviders.add('clarity');
}

async function initHotjar(provider) {
  const siteId = sanitizeText(provider.siteId, 48);
  const version = Number(provider.version) || 6;
  if (!siteId || initializedProviders.has('hotjar')) return;

  window.hj = window.hj || function hotjarQueue() {
    (window.hj.q = window.hj.q || []).push(arguments);
  };
  window._hjSettings = { hjid: Number(siteId), hjsv: version };
  await injectScript(
    `https://static.hotjar.com/c/hotjar-${encodeURIComponent(siteId)}.js?sv=${encodeURIComponent(String(version))}`,
    'rg-ana-hotjar'
  );
  initializedProviders.add('hotjar');
}

async function initCrazyEgg(provider) {
  const accountId = sanitizeText(provider.accountId, 64);
  const scriptVersion = sanitizeText(provider.scriptVersion, 20) || '11';
  if (!accountId || initializedProviders.has('crazyegg')) return;
  await injectScript(
    `https://script.crazyegg.com/pages/scripts/${encodeURIComponent(accountId)}/${encodeURIComponent(scriptVersion)}.js`,
    'rg-ana-crazyegg'
  );
  initializedProviders.add('crazyegg');
}

async function initFullstory(provider) {
  const orgId = sanitizeText(provider.orgId, 64);
  if (!orgId || initializedProviders.has('fullstory')) return;
  window._fs_host = 'edge.fullstory.com';
  window._fs_org = orgId;
  window._fs_namespace = 'FS';
  await injectScript('https://edge.fullstory.com/s/fs.js', 'rg-ana-fullstory');
  initializedProviders.add('fullstory');
}

async function initSentry(provider) {
  const dsn = sanitizeText(provider.dsn, 280);
  const environment = sanitizeText(provider.environment, 40) || 'production';
  if (!dsn || initializedProviders.has('sentry')) return;

  await injectScript('https://browser.sentry-cdn.com/8.30.0/bundle.tracing.min.js', 'rg-ana-sentry');
  if (window.Sentry && typeof window.Sentry.init === 'function') {
    window.Sentry.init({ dsn, environment, tracesSampleRate: 0.1 });
    initializedProviders.add('sentry');
  }
}

async function initLogrocket(provider) {
  const appId = sanitizeText(provider.appId, 80);
  if (!appId || initializedProviders.has('logrocket')) return;

  await injectScript('https://cdn.lr-ingest.io/LogRocket.min.js', 'rg-ana-logrocket');
  if (window.LogRocket && typeof window.LogRocket.init === 'function') {
    window.LogRocket.init(appId);
    initializedProviders.add('logrocket');
  }
}

export async function loadProvidersByConsent(config, consentManager) {
  const safeConfig = config && typeof config === 'object' ? config : {};
  const providers = safeConfig.providers && typeof safeConfig.providers === 'object' ? safeConfig.providers : {};
  const hasConsent = (category) => Boolean(consentManager && typeof consentManager.hasConsent === 'function' && consentManager.hasConsent(category));

  const tasks = [];

  if (providers.ga4 && safeBoolean(providers.ga4.enabled) && hasConsent('analytics')) tasks.push(initGa4(providers.ga4));
  if (providers.matomo && safeBoolean(providers.matomo.enabled) && hasConsent('analytics')) tasks.push(initMatomo(providers.matomo));
  if (providers.plausible && safeBoolean(providers.plausible.enabled) && hasConsent('analytics')) tasks.push(initPlausible(providers.plausible));
  if (providers.posthog && safeBoolean(providers.posthog.enabled) && hasConsent('analytics')) tasks.push(initPosthog(providers.posthog));
  if (providers.clarity && safeBoolean(providers.clarity.enabled) && hasConsent('analytics')) tasks.push(initClarity(providers.clarity));

  if (providers.hotjar && safeBoolean(providers.hotjar.enabled) && hasConsent('marketing')) tasks.push(initHotjar(providers.hotjar));
  if (providers.crazyegg && safeBoolean(providers.crazyegg.enabled) && hasConsent('marketing')) tasks.push(initCrazyEgg(providers.crazyegg));
  if (providers.fullstory && safeBoolean(providers.fullstory.enabled) && hasConsent('marketing')) tasks.push(initFullstory(providers.fullstory));
  if (providers.logrocket && safeBoolean(providers.logrocket.enabled) && hasConsent('marketing')) tasks.push(initLogrocket(providers.logrocket));

  if (providers.sentry && safeBoolean(providers.sentry.enabled) && hasConsent('performance')) tasks.push(initSentry(providers.sentry));

  await Promise.all(tasks);
}

export function forwardEventToProviders(eventName, payload, config) {
  const event = sanitizeText(eventName, 64).toLowerCase().replace(/\s+/g, '_');
  if (!event) return;

  const safePayload = payload && typeof payload === 'object' ? payload : {};
  const metadata = safePayload.metadata && typeof safePayload.metadata === 'object' ? safePayload.metadata : {};
  const pagePath = sanitizeText(safePayload.page || window.location.pathname || '/', 240) || '/';

  try {
    if (window.gtag) {
      window.gtag('event', event, { page_path: pagePath, ...metadata });
    }
  } catch {
    // Provider opcional.
  }

  try {
    if (window._paq && Array.isArray(window._paq)) {
      window._paq.push(['trackEvent', 'site', event, pagePath]);
    }
  } catch {
    // Provider opcional.
  }

  try {
    if (typeof window.plausible === 'function') {
      window.plausible(event, { props: metadata });
    }
  } catch {
    // Provider opcional.
  }

  try {
    if (window.posthog && typeof window.posthog.capture === 'function') {
      window.posthog.capture(event, { page: pagePath, ...metadata });
    }
  } catch {
    // Provider opcional.
  }

  try {
    if (typeof window.clarity === 'function') {
      window.clarity('event', event);
    }
  } catch {
    // Provider opcional.
  }

  try {
    const providers = config && config.providers ? config.providers : {};
    if (providers.sentry && providers.sentry.enabled && window.Sentry && typeof window.Sentry.addBreadcrumb === 'function') {
      window.Sentry.addBreadcrumb({
        category: 'analytics',
        message: event,
        level: 'info',
        data: { page: pagePath }
      });
    }
  } catch {
    // Provider opcional.
  }

  try {
    if (window.LogRocket && typeof window.LogRocket.track === 'function') {
      window.LogRocket.track(event, { page: pagePath, ...metadata });
    }
  } catch {
    // Provider opcional.
  }
}
