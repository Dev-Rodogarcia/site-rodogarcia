/* ==[DOC-FILE]===============================================================
Arquivo : src/js/analytics/consent-manager.js
Modulo  : Frontend - analytics/LGPD
Papel   : Controla consentimento de cookies, exibicao do banner e preferencias por categoria.

Responsabilidades:
- Ler/salvar consentimento em armazenamento local com versionamento.
- Exibir banner LGPD e painel de preferencias (analytics, marketing, performance).
- Notificar mudancas de consentimento para modulos de tracking e provedores externos.

Integracoes:
- Dependencias: /src/css/components/analytics-consent.css
- Endpoints/rotas: nao se aplica para este modulo.
- Classes/seletores/chaves: .rg-consent, .rg-consent-prefs, rg_cookie_consent_v*

Entradas e saidas:
- Entradas: configuracao publica de analytics + interacao do usuario no banner.
- Saidas  : objeto de consentimento persistido e evento global `rg:consent-updated`.

Elementos tecnicos: initConsentManager, saveConsent, hasConsentFor
[DOC-FILE-END]============================================================== */

const CONSENT_STORAGE_PREFIX = 'rg_cookie_consent_v';
const CONSENT_STYLE_ID = 'rg-consent-style';
const CONSENT_ROOT_ID = 'rg-consent-root';

const DEFAULT_CONSENT = {
  necessary: true,
  analytics: false,
  marketing: false,
  performance: false,
  decisionAt: '',
  version: 1
};

function ensureConsentStyles() {
  if (document.getElementById(CONSENT_STYLE_ID)) return;
  const link = document.createElement('link');
  link.id = CONSENT_STYLE_ID;
  link.rel = 'stylesheet';
  link.href = '/src/css/components/analytics-consent.css';
  document.head.appendChild(link);
}

function consentStorageKey(version) {
  const safeVersion = Number.isFinite(Number(version)) ? Number(version) : 1;
  return `${CONSENT_STORAGE_PREFIX}${safeVersion}`;
}

function isCookieTestMode() {
  try {
    const query = new URLSearchParams(window.location.search || '');
    return query.get('cookie_test') === '1';
  } catch {
    return false;
  }
}

function clearStoredConsentDecisions() {
  try {
    const keysToDelete = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (typeof key === 'string' && key.startsWith(CONSENT_STORAGE_PREFIX)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => {
      localStorage.removeItem(key);
    });
  } catch {
    // Sem armazenamento: segue somente com estado em memoria.
  }
}

function readConsent(version) {
  try {
    const raw = localStorage.getItem(consentStorageKey(version));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return normalizeConsent(parsed, version);
  } catch {
    return null;
  }
}

function saveConsent(consent) {
  const safe = normalizeConsent(consent, consent && consent.version);
  try {
    localStorage.setItem(consentStorageKey(safe.version), JSON.stringify(safe));
  } catch {
    // Sem armazenamento: segue com estado apenas em memoria.
  }

  window.dispatchEvent(
    new CustomEvent('rg:consent-updated', {
      detail: { consent: safe }
    })
  );
  return safe;
}

function normalizeConsent(input, version) {
  const source = input && typeof input === 'object' ? input : {};
  const safeVersion = Number.isFinite(Number(version)) ? Number(version) : 1;
  return {
    necessary: true,
    analytics: Boolean(source.analytics),
    marketing: Boolean(source.marketing),
    performance: Boolean(source.performance),
    decisionAt: sanitizeText(source.decisionAt, 40) || new Date().toISOString(),
    version: safeVersion
  };
}

function sanitizeText(value, maxLength = 120) {
  return String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function createBanner(consentVersion, defaultCategories = {}) {
  const existing = document.getElementById(CONSENT_ROOT_ID);
  if (existing) existing.remove();

  const root = document.createElement('aside');
  root.id = CONSENT_ROOT_ID;
  root.className = 'rg-consent';
  root.innerHTML = `
    <section class="rg-consent__panel" role="dialog" aria-modal="true" aria-labelledby="rg-consent-title">
      <h2 id="rg-consent-title" class="rg-consent__title">Privacidade e cookies</h2>
      <p class="rg-consent__text">
        Utilizamos cookies necessarios e, com sua permissao, cookies de analytics, marketing e performance para melhorar o site.
      </p>
      <div class="rg-consent__actions">
        <button type="button" class="rg-consent__btn rg-consent__btn--primary" data-consent-action="accept-all">Aceitar todos</button>
        <button type="button" class="rg-consent__btn" data-consent-action="reject-extra">Rejeitar nao essenciais</button>
        <button type="button" class="rg-consent__btn" data-consent-action="customize">Escolher categorias</button>
      </div>
      <div class="rg-consent-prefs" id="rg-consent-prefs">
        <ul class="rg-consent-prefs__list">
          <li class="rg-consent-prefs__item">
            <label class="rg-consent-prefs__label">
              <strong>Necessarios</strong>
              <span>Sempre ativos para funcionamento do site</span>
            </label>
            <input class="rg-consent-prefs__switch" type="checkbox" checked disabled>
          </li>
          <li class="rg-consent-prefs__item">
            <label class="rg-consent-prefs__label" for="rg-consent-analytics">
              <strong>Analytics</strong>
              <span>Medicao de visitas, paginas e eventos</span>
            </label>
            <input class="rg-consent-prefs__switch" id="rg-consent-analytics" type="checkbox">
          </li>
          <li class="rg-consent-prefs__item">
            <label class="rg-consent-prefs__label" for="rg-consent-marketing">
              <strong>Marketing</strong>
              <span>Campanhas, conversao e remarketing</span>
            </label>
            <input class="rg-consent-prefs__switch" id="rg-consent-marketing" type="checkbox">
          </li>
          <li class="rg-consent-prefs__item">
            <label class="rg-consent-prefs__label" for="rg-consent-performance">
              <strong>Performance</strong>
              <span>Diagnostico tecnico e experiencia</span>
            </label>
            <input class="rg-consent-prefs__switch" id="rg-consent-performance" type="checkbox">
          </li>
        </ul>
        <div class="rg-consent__actions">
          <button type="button" class="rg-consent__btn rg-consent__btn--primary" data-consent-action="save-custom">Salvar preferencias</button>
        </div>
      </div>
    </section>
  `;

  const panelPrefs = root.querySelector('#rg-consent-prefs');
  const analyticsInput = root.querySelector('#rg-consent-analytics');
  const marketingInput = root.querySelector('#rg-consent-marketing');
  const performanceInput = root.querySelector('#rg-consent-performance');
  if (analyticsInput) analyticsInput.checked = Boolean(defaultCategories.analytics);
  if (marketingInput) marketingInput.checked = Boolean(defaultCategories.marketing);
  if (performanceInput) performanceInput.checked = Boolean(defaultCategories.performance);

  root.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.getAttribute('data-consent-action');
    if (!action) return;

    if (action === 'customize') {
      panelPrefs.classList.toggle('is-open');
      return;
    }

    if (action === 'accept-all') {
      const accepted = saveConsent({
        necessary: true,
        analytics: true,
        marketing: true,
        performance: true,
        version: consentVersion,
        decisionAt: new Date().toISOString()
      });
      closeBanner(root);
      root.dispatchEvent(new CustomEvent('rg:decision', { detail: accepted }));
      return;
    }

    if (action === 'reject-extra') {
      const rejected = saveConsent({
        necessary: true,
        analytics: false,
        marketing: false,
        performance: false,
        version: consentVersion,
        decisionAt: new Date().toISOString()
      });
      closeBanner(root);
      root.dispatchEvent(new CustomEvent('rg:decision', { detail: rejected }));
      return;
    }

    if (action === 'save-custom') {
      const custom = saveConsent({
        necessary: true,
        analytics: Boolean(analyticsInput && analyticsInput.checked),
        marketing: Boolean(marketingInput && marketingInput.checked),
        performance: Boolean(performanceInput && performanceInput.checked),
        version: consentVersion,
        decisionAt: new Date().toISOString()
      });
      closeBanner(root);
      root.dispatchEvent(new CustomEvent('rg:decision', { detail: custom }));
    }
  });

  document.body.appendChild(root);
  requestAnimationFrame(() => {
    root.classList.add('is-open');
  });

  return root;
}

function closeBanner(root) {
  if (!root) return;
  root.classList.remove('is-open');
  window.setTimeout(() => {
    if (root.parentNode) {
      root.parentNode.removeChild(root);
    }
  }, 220);
}

function hasConsentFor(consent, category) {
  if (category === 'necessary') return true;
  const safe = normalizeConsent(consent, consent && consent.version);
  return Boolean(safe[category]);
}

export function initConsentManager(publicConfig) {
  const config = publicConfig && typeof publicConfig === 'object' ? publicConfig : {};
  const consentConfig = config.consent && typeof config.consent === 'object' ? config.consent : {};
  const version = Number(consentConfig.version) || DEFAULT_CONSENT.version;
  const bannerEnabled = consentConfig.bannerEnabled !== false;
  const forcedByTestMode = isCookieTestMode();

  ensureConsentStyles();

  if (forcedByTestMode) {
    clearStoredConsentDecisions();
  }

  let currentConsent = readConsent(version) || null;
  let rootBanner = null;

  if (!currentConsent && (bannerEnabled || forcedByTestMode)) {
    rootBanner = createBanner(version, consentConfig.categories || {});
    rootBanner.addEventListener('rg:decision', (event) => {
      const detail = event && event.detail ? event.detail : null;
      currentConsent = normalizeConsent(detail, version);
    });
  } else if (!currentConsent) {
    const defaultCategories = consentConfig.categories && typeof consentConfig.categories === 'object'
      ? consentConfig.categories
      : {};
    currentConsent = saveConsent({
      ...DEFAULT_CONSENT,
      analytics: Boolean(defaultCategories.analytics),
      marketing: Boolean(defaultCategories.marketing),
      performance: Boolean(defaultCategories.performance),
      version,
      decisionAt: new Date().toISOString()
    });
  }

  function getConsent() {
    if (!currentConsent) {
      currentConsent = readConsent(version) || normalizeConsent(DEFAULT_CONSENT, version);
    }
    return currentConsent;
  }

  function updateConsent(nextConsent) {
    currentConsent = saveConsent({
      ...getConsent(),
      ...(nextConsent && typeof nextConsent === 'object' ? nextConsent : {}),
      version
    });
    return currentConsent;
  }

  function onChange(callback) {
    if (typeof callback !== 'function') return () => {};
    const listener = (event) => {
      const detail = event && event.detail && event.detail.consent ? event.detail.consent : getConsent();
      callback(normalizeConsent(detail, version));
    };
    window.addEventListener('rg:consent-updated', listener);
    return () => window.removeEventListener('rg:consent-updated', listener);
  }

  return {
    getConsent,
    setConsent: updateConsent,
    hasConsent: (category) => hasConsentFor(getConsent(), category),
    onChange,
    isBannerOpen: () => Boolean(rootBanner && document.body.contains(rootBanner))
  };
}
