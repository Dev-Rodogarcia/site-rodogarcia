/* ==[DOC-FILE]===============================================================
Arquivo : src/js/analytics/index.js
Modulo  : Frontend - bootstrap de analytics
Papel   : Inicializa consentimento LGPD, provedores externos e tracking proprio.

Responsabilidades:
- Carregar configuracao publica de analytics no backend.
- Inicializar fluxo de consentimento e ativar provedores conforme categorias autorizadas.
- Iniciar tracker local e manter sincronizacao ao alterar consentimento.

Integracoes:
- Dependencias: /src/js/analytics/consent-manager.js, /src/js/analytics/providers-loader.js, /src/js/analytics/tracker.js
- Endpoints/rotas: /api/analytics/config
- Classes/seletores/chaves: nao se aplica.

Entradas e saidas:
- Entradas: configuracao remota de analytics e interacao do banner de consentimento.
- Saidas  : instrumentacao ativa de eventos e objeto global de debug.

Elementos tecnicos: initAnalytics
[DOC-FILE-END]============================================================== */

import { initConsentManager } from '/src/js/analytics/consent-manager.js';
import { loadProvidersByConsent, forwardEventToProviders } from '/src/js/analytics/providers-loader.js';
import { initAnalyticsTracker } from '/src/js/analytics/tracker.js';

let analyticsInitialized = false;

function isPublicPage() {
  const pathname = window.location.pathname || '/';
  return !pathname.startsWith('/developer/') && !pathname.startsWith('/auth/') && !pathname.startsWith('/admin');
}

async function fetchAnalyticsConfig() {
  const response = await fetch('/api/analytics/config', {
    method: 'GET',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Falha ao carregar configuracao de analytics.');
  }

  const payload = await response.json();
  return payload && payload.config ? payload.config : {};
}

function dispatchReadyEvent(config) {
  window.dispatchEvent(
    new CustomEvent('rg:analytics-ready', {
      detail: { config }
    })
  );
}

export async function initAnalytics() {
  if (analyticsInitialized) return;
  if (!isPublicPage()) return;
  analyticsInitialized = true;

  let config = {};
  try {
    config = await fetchAnalyticsConfig();
  } catch {
    // Falha de config nao pode quebrar site publico.
    return;
  }

  const consent = initConsentManager(config);
  await loadProvidersByConsent(config, consent);

  const tracker = initAnalyticsTracker({
    config,
    hasConsent: (category) => consent.hasConsent(category),
    forwardToProviders: (eventName, payload) => forwardEventToProviders(eventName, payload, config),
    onDebug: () => {}
  });

  consent.onChange(async () => {
    await loadProvidersByConsent(config, consent);
    tracker.handleConsentChange();
  });

  window.RodogarciaAnalytics = {
    getConfig: () => config,
    getConsent: () => consent.getConsent(),
    setConsent: (nextConsent) => consent.setConsent(nextConsent),
    track: (eventName, payload) => tracker.track(eventName, payload)
  };

  dispatchReadyEvent(config);
}
