/* ==[DOC-FILE]===============================================================
Arquivo : src/js/exit-intent/exit-popup.js
Modulo  : Frontend - captura de leads
Papel   : Implementa o popup de intencao de saida com heuristicas, anti-abuso e envio de dados para API.

Responsabilidades:
- Carrega configuracao remota do popup e monta o componente no DOM.
- Detecta sinais de saida em desktop e mobile sem exibir de forma agressiva.
- Controla frequencia por sessao/cooldown e persiste eventos em localStorage.
- Envia leads e eventos de analytics para endpoints backend.

Integracoes:
- Dependencias: /src/css/components/exit-popup.css
- Endpoints/rotas: /api/popup-config, /api/leads, /api/popup-events
- Classes/seletores/chaves: .rg-exit-popup, .rg-exit-popup__form, rg_exit_popup_last_shown_at, rg_exit_popup_submitted_at

Entradas e saidas:
- Entradas: movimentos de mouse, scroll, popstate, formulario e configuracao da API.
- Saidas  : exibicao do modal, requisicoes HTTP e persistencia local de estado.

Elementos tecnicos: initExitIntentPopup, loadPopupConfig, shouldShowPopup, bindDesktopSignals, bindMobileSignals, submitLeadForm, trackPopupEvent
[DOC-FILE-END]============================================================== */

const STORAGE_KEYS = {
  lastShownAt: 'rg_exit_popup_last_shown_at',
  closedAt: 'rg_exit_popup_closed_at',
  submittedAt: 'rg_exit_popup_submitted_at'
};

const SESSION_KEYS = {
  popupShows: 'rg_exit_popup_shows_in_session',
  sessionId: 'rg_exit_popup_session_id'
};

const DEFAULT_CONFIG = {
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

const EXIT_TOP_THRESHOLD_PX = 12;
const EXIT_MIN_UPWARD_DELTA_PX = -18;
const EXIT_MIN_UPWARD_SPEED = -0.45;
const MOBILE_SCROLL_TOP_THRESHOLD = 24;
const MOBILE_SCROLL_DELTA_TRIGGER = 140;
const MOBILE_SCROLL_WINDOW_MS = 240;

const state = {
  config: { ...DEFAULT_CONFIG },
  root: null,
  form: null,
  status: null,
  isOpen: false,
  hasShown: false,
  hasInteracted: false,
  hasSubmitted: false,
  testMode: false,
  pageLoadedAt: Date.now(),
  isMobile: false,
  desktop: {
    lastY: null,
    lastTime: 0,
    lastUpwardAt: 0,
    cameFromBelow: false
  },
  mobile: {
    lastScrollY: 0,
    lastScrollAt: 0,
    backGuardArmed: false,
    backBound: false
  }
};

function initExitIntentPopup() {
  const pathname = window.location.pathname || '/';
  if (pathname.startsWith('/developer/') || pathname.startsWith('/auth/') || pathname.startsWith('/admin')) {
    return;
  }

  const query = new URLSearchParams(window.location.search);
  state.testMode = query.get('popup_test') === '1';

  state.isMobile = detectMobileDevice();
  ensurePopupStyles();

  loadPopupConfig()
    .then((config) => {
      state.config = config;
      mountPopup(config);
      bindGlobalSignals();
      bindDesktopSignals();
      bindMobileSignals(config);
      if (state.testMode) {
        limparFrequenciaPersistida();
        setTimeout(() => showPopup('forced_test_mode', { force: true }), 900);
      }
    })
    .catch(() => {
      state.config = { ...DEFAULT_CONFIG };
      mountPopup(state.config);
      bindGlobalSignals();
      bindDesktopSignals();
      bindMobileSignals(state.config);
      if (state.testMode) {
        limparFrequenciaPersistida();
        setTimeout(() => showPopup('forced_test_mode_fallback', { force: true }), 900);
      }
    });
}

function ensurePopupStyles() {
  if (document.getElementById('rg-exit-popup-css')) return;

  const link = document.createElement('link');
  link.id = 'rg-exit-popup-css';
  link.rel = 'stylesheet';
  link.href = '/src/css/components/exit-popup.css';
  document.head.appendChild(link);
}

async function loadPopupConfig() {
  const response = await fetch('/api/popup-config', {
    method: 'GET',
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Nao foi possivel carregar configuracao do popup.');
  }

  const payload = await response.json();
  const source = payload && typeof payload.config === 'object' ? payload.config : {};

  return {
    title: sanitizeText(source.title, 80) || DEFAULT_CONFIG.title,
    description: sanitizeText(source.description, 220) || DEFAULT_CONFIG.description,
    enableName: toBoolean(source.enableName, DEFAULT_CONFIG.enableName),
    enableEmail: toBoolean(source.enableEmail, DEFAULT_CONFIG.enableEmail),
    enablePhone: toBoolean(source.enablePhone, DEFAULT_CONFIG.enablePhone),
    buttonText: sanitizeText(source.buttonText, 40) || DEFAULT_CONFIG.buttonText,
    closeText: sanitizeText(source.closeText, 24) || DEFAULT_CONFIG.closeText,
    successMessage: sanitizeText(source.successMessage, 160) || DEFAULT_CONFIG.successMessage,
    delaySeconds: clampInteger(source.delaySeconds, 3, 90, DEFAULT_CONFIG.delaySeconds),
    cooldownHours: clampInteger(source.cooldownHours, 1, 720, DEFAULT_CONFIG.cooldownHours),
    maxShowsPerSession: clampInteger(source.maxShowsPerSession, 1, 3, DEFAULT_CONFIG.maxShowsPerSession),
    mobileScrollTrigger: toBoolean(source.mobileScrollTrigger, DEFAULT_CONFIG.mobileScrollTrigger),
    mobileBackButtonTrigger: toBoolean(source.mobileBackButtonTrigger, DEFAULT_CONFIG.mobileBackButtonTrigger)
  };
}

function mountPopup(config) {
  const existing = document.querySelector('.rg-exit-popup');
  if (existing) {
    existing.remove();
  }

  const root = document.createElement('div');
  root.className = 'rg-exit-popup';
  root.setAttribute('aria-hidden', 'true');

  const fieldsHtml = [
    config.enableName
      ? '<div class="rg-exit-popup__field"><label for="rg-exit-name">Nome</label><input id="rg-exit-name" name="name" type="text" autocomplete="name" maxlength="80" required></div>'
      : '',
    config.enableEmail
      ? '<div class="rg-exit-popup__field"><label for="rg-exit-email">Email</label><input id="rg-exit-email" name="email" type="email" autocomplete="email" maxlength="160" required></div>'
      : '',
    config.enablePhone
      ? '<div class="rg-exit-popup__field"><label for="rg-exit-phone">Telefone (opcional)</label><input id="rg-exit-phone" name="phone" type="tel" autocomplete="tel" maxlength="20"></div>'
      : ''
  ].join('');

  root.innerHTML = `
    <div class="rg-exit-popup__backdrop" data-popup-close="backdrop"></div>
    <section class="rg-exit-popup__panel" role="dialog" aria-modal="true" aria-labelledby="rg-exit-popup-title">
      <button class="rg-exit-popup__close" type="button" data-popup-close="button" aria-label="Fechar popup">&times;</button>
      <span class="rg-exit-popup__tag">Oferta especial</span>
      <h2 id="rg-exit-popup-title" class="rg-exit-popup__title">${escapeHtml(config.title)}</h2>
      <p class="rg-exit-popup__description">${escapeHtml(config.description)}</p>
      <form class="rg-exit-popup__form" novalidate>
        ${fieldsHtml}
        <div class="rg-exit-popup__actions">
          <button class="rg-exit-popup__submit" type="submit">${escapeHtml(config.buttonText)}</button>
          <button class="rg-exit-popup__cancel" type="button" data-popup-close="cancel">${escapeHtml(config.closeText)}</button>
        </div>
        <p class="rg-exit-popup__status" aria-live="polite"></p>
      </form>
    </section>
  `;

  document.body.appendChild(root);
  state.root = root;
  state.form = root.querySelector('.rg-exit-popup__form');
  state.status = root.querySelector('.rg-exit-popup__status');

  root.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const closeType = target.getAttribute('data-popup-close');
    if (closeType) {
      closePopup('popup_closed', { closeType });
    }
  });

  state.form.addEventListener('submit', submitLeadForm);
}

function bindGlobalSignals() {
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !state.isOpen) return;
    closePopup('popup_closed', { closeType: 'esc' });
  });

  window.addEventListener('pagehide', () => {
    if (state.hasShown && !state.hasInteracted && !state.hasSubmitted) {
      trackPopupEvent('popup_ignored', { reason: 'pagehide' });
      state.hasInteracted = true;
    }
  });
}

function bindDesktopSignals() {
  if (state.isMobile) return;

  document.addEventListener('mousemove', (event) => {
    if (!shouldShowPopup()) {
      updateDesktopState(event.clientY);
      return;
    }

    const now = performance.now();
    const currentY = event.clientY;
    const previousY = state.desktop.lastY;

    if (typeof previousY === 'number') {
      const deltaY = currentY - previousY;
      const deltaTime = Math.max(now - state.desktop.lastTime, 16);
      const speedY = deltaY / deltaTime;

      if (deltaY <= EXIT_MIN_UPWARD_DELTA_PX && speedY <= EXIT_MIN_UPWARD_SPEED) {
        state.desktop.lastUpwardAt = Date.now();
      }

      state.desktop.cameFromBelow = previousY > 80;
    }

    if (currentY <= EXIT_TOP_THRESHOLD_PX && state.desktop.cameFromBelow) {
      showPopup('desktop_top_detection');
      return;
    }

    updateDesktopState(currentY, now);
  }, { passive: true });

  document.addEventListener('mouseout', (event) => {
    if (!shouldShowPopup()) return;
    if (event.clientY > 0) return;
    if (!state.desktop.cameFromBelow) return;

    showPopup('desktop_mouseout');
  });
}

function bindMobileSignals(config) {
  if (!state.isMobile) return;

  if (config.mobileScrollTrigger) {
    state.mobile.lastScrollY = getScrollY();
    state.mobile.lastScrollAt = Date.now();

    window.addEventListener('scroll', () => {
      if (!shouldShowPopup()) {
        state.mobile.lastScrollY = getScrollY();
        state.mobile.lastScrollAt = Date.now();
        return;
      }

      const now = Date.now();
      const currentY = getScrollY();
      const deltaY = state.mobile.lastScrollY - currentY;
      const deltaTime = now - state.mobile.lastScrollAt;

      if (
        deltaTime > 0 &&
        deltaTime <= MOBILE_SCROLL_WINDOW_MS &&
        deltaY >= MOBILE_SCROLL_DELTA_TRIGGER &&
        currentY <= MOBILE_SCROLL_TOP_THRESHOLD
      ) {
        showPopup('mobile_fast_scroll_top');
        return;
      }

      state.mobile.lastScrollY = currentY;
      state.mobile.lastScrollAt = now;
    }, { passive: true });
  }

  if (config.mobileBackButtonTrigger && !state.mobile.backBound) {
    state.mobile.backBound = true;
    armMobileBackGuard();

    window.addEventListener('popstate', () => {
      if (!state.mobile.backGuardArmed) return;

      if (shouldShowPopup()) {
        showPopup('mobile_back_button');
        state.mobile.backGuardArmed = false;
        return;
      }

      state.mobile.backGuardArmed = false;
    }, { passive: true });
  }
}

function armMobileBackGuard() {
  try {
    history.pushState({ rgExitIntent: true, ts: Date.now() }, '', window.location.href);
    state.mobile.backGuardArmed = true;
  } catch {
    state.mobile.backGuardArmed = false;
  }
}

function updateDesktopState(currentY, timestamp = performance.now()) {
  state.desktop.lastY = currentY;
  state.desktop.lastTime = timestamp;
}

function shouldShowPopup() {
  if (!state.root) return false;
  if (state.isOpen) return false;
  if (state.hasShown) return false;

  const elapsedMs = Date.now() - state.pageLoadedAt;
  if (elapsedMs < state.config.delaySeconds * 1000) return false;

  if (state.config.maxShowsPerSession > 0 && getSessionShowCount() >= state.config.maxShowsPerSession) {
    return false;
  }

  const cooldownMs = state.config.cooldownHours * 60 * 60 * 1000;

  const lastSubmittedAt = readLocalNumber(STORAGE_KEYS.submittedAt);
  if (lastSubmittedAt > 0 && Date.now() - lastSubmittedAt < cooldownMs) {
    return false;
  }

  const lastShownAt = readLocalNumber(STORAGE_KEYS.lastShownAt);
  if (lastShownAt > 0 && Date.now() - lastShownAt < cooldownMs) {
    return false;
  }

  return true;
}

function showPopup(trigger, options = {}) {
  const force = Boolean(options.force);
  if (!force && !shouldShowPopup()) return;
  if (!state.root || state.isOpen) return;

  state.isOpen = true;
  state.hasShown = true;
  state.root.classList.add('is-open');
  state.root.setAttribute('aria-hidden', 'false');

  writeLocalNumber(STORAGE_KEYS.lastShownAt, Date.now());
  incrementSessionShowCount();
  setStatusMessage('');
  trackPopupEvent('popup_shown', { trigger });

  const firstInput = state.form.querySelector('input');
  if (firstInput) {
    setTimeout(() => firstInput.focus(), 10);
  }
}

function closePopup(eventName = 'popup_closed', metadata = {}) {
  if (!state.root || !state.isOpen) return;

  state.root.classList.remove('is-open');
  state.root.setAttribute('aria-hidden', 'true');
  state.isOpen = false;
  state.hasInteracted = true;

  if (eventName === 'popup_closed') {
    writeLocalNumber(STORAGE_KEYS.closedAt, Date.now());
    trackPopupEvent('popup_closed', metadata);
  }
}

async function submitLeadForm(event) {
  event.preventDefault();

  const submitButton = state.form.querySelector('.rg-exit-popup__submit');
  if (submitButton) {
    submitButton.disabled = true;
  }

  setStatusMessage('Enviando seus dados...');

  const formData = new FormData(state.form);
  const payload = {
    source: 'exit-intent-popup',
    pagePath: window.location.pathname,
    name: sanitizeText(formData.get('name'), 80),
    email: sanitizeEmail(formData.get('email')),
    phone: sanitizePhone(formData.get('phone'))
  };

  if (state.config.enableName && !payload.name) {
    setStatusMessage('Informe seu nome.', 'error');
    if (submitButton) submitButton.disabled = false;
    return;
  }

  if (state.config.enableEmail && !payload.email) {
    setStatusMessage('Informe um e-mail valido.', 'error');
    if (submitButton) submitButton.disabled = false;
    return;
  }

  if (!payload.email && !payload.phone) {
    setStatusMessage('Informe e-mail ou telefone para contato.', 'error');
    if (submitButton) submitButton.disabled = false;
    return;
  }

  try {
    const response = await fetch('/api/leads', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) {
      const errorMessage = result && result.error ? result.error : 'Falha ao enviar seus dados.';
      throw new Error(errorMessage);
    }

    state.hasSubmitted = true;
    state.hasInteracted = true;
    writeLocalNumber(STORAGE_KEYS.submittedAt, Date.now());
    setStatusMessage(state.config.successMessage, 'success');
    trackPopupEvent('popup_submitted', { leadId: result && result.lead ? result.lead.id : '' });

    setTimeout(() => {
      closePopup('popup_closed', { closeType: 'auto_after_submit' });
    }, 1200);
  } catch (error) {
    setStatusMessage(error.message || 'Falha ao enviar dados.', 'error');
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
    }
  }
}

function setStatusMessage(message, type = '') {
  if (!state.status) return;

  state.status.textContent = message || '';
  state.status.classList.remove('is-error', 'is-success');

  if (type === 'error') {
    state.status.classList.add('is-error');
  }

  if (type === 'success') {
    state.status.classList.add('is-success');
  }
}

function trackPopupEvent(eventName, metadata = {}) {
  const payload = {
    event: eventName,
    source: 'exit-intent-popup',
    pagePath: window.location.pathname,
    mobile: state.isMobile,
    metadata,
    sessionId: getSessionId()
  };

  try {
    window.dispatchEvent(
      new CustomEvent('rg:popup-event', {
        detail: {
          event: payload.event,
          pagePath: payload.pagePath,
          metadata: payload.metadata,
          source: payload.source
        }
      })
    );
  } catch {
    // Ambiente sem suporte a CustomEvent: ignora ponte interna.
  }

  const encoded = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    const blob = new Blob([encoded], { type: 'application/json' });
    navigator.sendBeacon('/api/popup-events', blob);
    return;
  }

  fetch('/api/popup-events', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    keepalive: true,
    body: encoded
  }).catch(() => {
    // Falha silenciosa: analytics nao deve quebrar UX.
  });
}

function getSessionShowCount() {
  try {
    return clampInteger(sessionStorage.getItem(SESSION_KEYS.popupShows), 0, 99, 0);
  } catch {
    return 0;
  }
}

function incrementSessionShowCount() {
  const current = getSessionShowCount();
  try {
    sessionStorage.setItem(SESSION_KEYS.popupShows, String(current + 1));
  } catch {
    // Ambiente sem sessionStorage: ignora.
  }
}

function getSessionId() {
  try {
    const existing = sessionStorage.getItem(SESSION_KEYS.sessionId);
    if (existing) return existing;

    const generated = `sess_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEYS.sessionId, generated);
    return generated;
  } catch {
    return `sess_${Date.now()}`;
  }
}

function readLocalNumber(key) {
  try {
    const value = Number(localStorage.getItem(key));
    if (!Number.isFinite(value)) return 0;
    return value;
  } catch {
    return 0;
  }
}

function writeLocalNumber(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Ambiente sem localStorage: ignora.
  }
}

function limparFrequenciaPersistida() {
  try {
    localStorage.removeItem(STORAGE_KEYS.lastShownAt);
    localStorage.removeItem(STORAGE_KEYS.closedAt);
    localStorage.removeItem(STORAGE_KEYS.submittedAt);
  } catch {
    // Ignora falhas de armazenamento.
  }

  try {
    sessionStorage.removeItem(SESSION_KEYS.popupShows);
  } catch {
    // Ignora falhas de armazenamento.
  }
}

function detectMobileDevice() {
  const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const narrowViewport = window.matchMedia('(max-width: 900px)').matches;
  return touch && narrowViewport;
}

function getScrollY() {
  return window.scrollY || document.documentElement.scrollTop || 0;
}

function sanitizeText(input, maxLength = 200) {
  return String(input || '')
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

function sanitizePhone(input) {
  return String(input || '').replace(/[^\d+]/g, '').slice(0, 20);
}

function clampInteger(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.round(parsed);
  return Math.min(max, Math.max(min, rounded));
}

function toBoolean(value, fallback) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return Boolean(fallback);
}

function escapeHtml(input) {
  return String(input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

initExitIntentPopup();
