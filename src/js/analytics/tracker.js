/* ==[DOC-FILE]===============================================================
Arquivo : src/js/analytics/tracker.js
Modulo  : Frontend - analytics/tracking proprio
Papel   : Coleta eventos de comportamento e envia para backend local de analytics.

Responsabilidades:
- Rastrear page_view, click, scroll, form_submit, download, cta_click e eventos de popup.
- Gerenciar ciclo de sessao (start, heartbeat, end) com identificadores persistentes.
- Encaminhar eventos para backend local e callback de providers externos.

Integracoes:
- Dependencias: /api/analytics/event, /api/analytics/session
- Endpoints/rotas: /api/analytics/event, /api/analytics/session
- Classes/seletores/chaves: [data-track="true"], [data-cta], a[href*=".pdf"], rg_analytics_user_id, rg_analytics_session_id

Entradas e saidas:
- Entradas: interacoes do usuario no DOM e sinais do navegador (scroll, visibilitychange, pagehide).
- Saidas  : eventos enviados para backend + repasse opcional para providers.

Elementos tecnicos: initAnalyticsTracker, sendEvent, sendSessionEvent
[DOC-FILE-END]============================================================== */

const STORAGE_KEYS = {
  userId: 'rg_analytics_user_id',
  consentSentVersion: 'rg_analytics_consent_version'
};

const SESSION_KEYS = {
  sessionId: 'rg_analytics_session_id',
  sessionStart: 'rg_analytics_session_start',
  lastHeartbeat: 'rg_analytics_session_last_heartbeat'
};

function sanitizeText(value, maxLength = 180) {
  return String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function sanitizePath(value) {
  const safe = sanitizeText(value, 240);
  if (!safe) return '';
  if (safe.startsWith('http://') || safe.startsWith('https://')) {
    try {
      const url = new URL(safe);
      return url.pathname || '/';
    } catch {
      return '/';
    }
  }
  if (!safe.startsWith('/')) return '/';
  return safe;
}

function clampInteger(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.round(parsed);
  return Math.min(max, Math.max(min, rounded));
}

function generateId(prefix) {
  const random = Math.random().toString(16).slice(2, 10);
  return `${prefix}_${Date.now()}_${random}`;
}

function getOrCreateLocalStorageKey(key, fallbackPrefix) {
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const created = generateId(fallbackPrefix);
    localStorage.setItem(key, created);
    return created;
  } catch {
    return generateId(fallbackPrefix);
  }
}

function getOrCreateSessionId() {
  try {
    const existing = sessionStorage.getItem(SESSION_KEYS.sessionId);
    if (existing) return existing;
    const created = generateId('session');
    sessionStorage.setItem(SESSION_KEYS.sessionId, created);
    sessionStorage.setItem(SESSION_KEYS.sessionStart, String(Date.now()));
    sessionStorage.setItem(SESSION_KEYS.lastHeartbeat, String(Date.now()));
    return created;
  } catch {
    return generateId('session');
  }
}

function getSessionStartMs() {
  try {
    const value = Number(sessionStorage.getItem(SESSION_KEYS.sessionStart));
    if (Number.isFinite(value) && value > 0) return value;
  } catch {
    // Sem sessionStorage.
  }
  return Date.now();
}

function setLastHeartbeatNow() {
  try {
    sessionStorage.setItem(SESSION_KEYS.lastHeartbeat, String(Date.now()));
  } catch {
    // Sem sessionStorage.
  }
}

function buildBasePayload(state) {
  return {
    userId: state.userId,
    sessionId: state.sessionId,
    page: window.location.pathname || '/',
    metadata: {}
  };
}

function postJson(url, payload, useBeacon = false) {
  const encoded = JSON.stringify(payload || {});
  if (useBeacon && navigator.sendBeacon) {
    const blob = new Blob([encoded], { type: 'application/json' });
    return navigator.sendBeacon(url, blob);
  }

  fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    keepalive: true,
    body: encoded
  }).catch(() => {
    // Tracking nao pode quebrar UX.
  });
  return true;
}

function isDownloadLink(element) {
  if (!(element instanceof HTMLAnchorElement)) return false;
  const href = element.getAttribute('href') || '';
  if (!href) return false;
  if (element.hasAttribute('download')) return true;
  return /\.(pdf|zip|rar|doc|docx|xls|xlsx|ppt|pptx|csv)$/i.test(href);
}

function mapPopupEventToAnalytics(eventName) {
  if (eventName === 'popup_shown') return 'popup_open';
  if (eventName === 'popup_submitted') return 'popup_submit';
  return '';
}

export function initAnalyticsTracker(options) {
  const config = options && typeof options.config === 'object' ? options.config : {};
  const hasConsent = typeof options.hasConsent === 'function' ? options.hasConsent : () => false;
  const forwardToProviders = typeof options.forwardToProviders === 'function' ? options.forwardToProviders : () => {};
  const onDebug = typeof options.onDebug === 'function' ? options.onDebug : () => {};

  const trackingConfig = config.tracking && typeof config.tracking === 'object' ? config.tracking : {};
  const trackingEnabled = trackingConfig.enabled !== false;
  const heartbeatSeconds = clampInteger(trackingConfig.heartbeatSeconds, 10, 300, 30);
  const scrollMilestones = Array.isArray(trackingConfig.scrollMilestones)
    ? trackingConfig.scrollMilestones.map((value) => clampInteger(value, 1, 100, 0)).filter((value) => value > 0)
    : [25, 50, 75, 100];

  const state = {
    userId: getOrCreateLocalStorageKey(STORAGE_KEYS.userId, 'user'),
    sessionId: getOrCreateSessionId(),
    page: window.location.pathname || '/',
    active: false,
    destroyed: false,
    scrollSent: new Set(),
    heartbeatTimer: null
  };

  function canTrack() {
    return trackingEnabled && hasConsent('analytics');
  }

  function sendEvent(eventName, payload = {}, useBeacon = false) {
    const event = sanitizeText(eventName, 64).toLowerCase().replace(/\s+/g, '_');
    if (!event || !canTrack()) return;

    const base = buildBasePayload(state);
    const metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {};
    const body = {
      event,
      userId: base.userId,
      sessionId: base.sessionId,
      page: sanitizePath(payload.page || base.page || '/'),
      category: sanitizeText(payload.category, 40) || '',
      metadata
    };

    postJson('/api/analytics/event', body, useBeacon);
    forwardToProviders(event, body, config);
    onDebug({ type: 'event', payload: body });
  }

  function sendSessionEvent(action, payload = {}, useBeacon = false) {
    if (!canTrack()) return;
    const body = {
      action,
      userId: state.userId,
      sessionId: state.sessionId,
      page: sanitizePath(payload.page || state.page || '/'),
      pageViews: clampInteger(payload.pageViews, 1, 999, 1),
      referrer: sanitizeText(document.referrer || '', 260),
      deviceType: window.matchMedia('(max-width: 900px)').matches ? 'mobile' : 'desktop',
      durationMs: clampInteger(payload.durationMs, 0, 12 * 60 * 60 * 1000, 0)
    };
    postJson('/api/analytics/session', body, useBeacon);
    onDebug({ type: 'session', payload: body });
  }

  function capturePageView() {
    sendEvent('page_view', {
      metadata: {
        title: sanitizeText(document.title || '', 140)
      }
    });
  }

  function startSession() {
    if (state.active || state.destroyed) return;
    state.active = true;
    sendSessionEvent('start', { pageViews: 1 });
    sendEvent('session_start', { category: 'session' });
    capturePageView();

    state.heartbeatTimer = window.setInterval(() => {
      if (!canTrack()) return;
      setLastHeartbeatNow();
      sendSessionEvent('heartbeat', { pageViews: 1 });
    }, heartbeatSeconds * 1000);
  }

  function endSession(reason) {
    if (!state.active || state.destroyed) return;
    state.active = false;
    if (state.heartbeatTimer) {
      window.clearInterval(state.heartbeatTimer);
      state.heartbeatTimer = null;
    }

    const durationMs = Math.max(0, Date.now() - getSessionStartMs());
    sendEvent('session_end', {
      category: 'session',
      metadata: { reason: sanitizeText(reason, 24) || 'unknown', durationMs }
    }, true);
    sendSessionEvent('end', { durationMs, pageViews: 1 }, true);
  }

  function bindClicks() {
    document.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const tracked = target.closest('[data-track="true"]');
      if (tracked) {
        const trackId = sanitizeText(
          tracked.getAttribute('data-track-id') ||
            tracked.id ||
            tracked.className ||
            tracked.tagName.toLowerCase(),
          120
        );
        sendEvent('click', {
          category: 'interaction',
          metadata: {
            selector: trackId,
            text: sanitizeText(tracked.textContent || '', 100)
          }
        });
      }

      const cta = target.closest('[data-cta], .btn-primary, .btn-secondary, .btn-hero');
      if (cta) {
        sendEvent('cta_click', {
          category: 'conversion',
          metadata: {
            label: sanitizeText(cta.textContent || '', 100),
            id: sanitizeText(cta.getAttribute('data-cta') || cta.id || '', 80)
          }
        });
      }

      const anchor = target.closest('a');
      if (anchor && isDownloadLink(anchor)) {
        sendEvent('download', {
          category: 'conversion',
          metadata: {
            href: sanitizeText(anchor.href || anchor.getAttribute('href') || '', 240),
            label: sanitizeText(anchor.textContent || '', 100)
          }
        });
      }
    }, { passive: true });
  }

  function bindScroll() {
    window.addEventListener('scroll', () => {
      if (!canTrack()) return;
      const doc = document.documentElement;
      const maxScroll = Math.max(1, doc.scrollHeight - doc.clientHeight);
      const percent = Math.round((window.scrollY / maxScroll) * 100);

      scrollMilestones.forEach((milestone) => {
        if (percent < milestone || state.scrollSent.has(milestone)) return;
        state.scrollSent.add(milestone);
        sendEvent('scroll', {
          category: 'engagement',
          metadata: { percent: milestone }
        });
      });
    }, { passive: true });
  }

  function bindForms() {
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      sendEvent('form_submit', {
        category: 'conversion',
        metadata: {
          formId: sanitizeText(form.id || form.getAttribute('name') || 'form_sem_id', 80),
          action: sanitizeText(form.getAttribute('action') || '', 200)
        }
      });
    });
  }

  function bindPopupBridge() {
    window.addEventListener('rg:popup-event', (event) => {
      const detail = event && event.detail ? event.detail : {};
      const popupEvent = mapPopupEventToAnalytics(sanitizeText(detail.event, 40).toLowerCase());
      if (!popupEvent) return;
      sendEvent(popupEvent, {
        category: 'conversion',
        metadata: detail.metadata && typeof detail.metadata === 'object' ? detail.metadata : {}
      });
    });
  }

  function bindSessionLifeCycle() {
    window.addEventListener('beforeunload', () => endSession('beforeunload'));
    window.addEventListener('pagehide', () => endSession('pagehide'));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        endSession('hidden');
      } else if (document.visibilityState === 'visible' && canTrack() && !state.active) {
        state.sessionId = getOrCreateSessionId();
        startSession();
      }
    });
  }

  bindClicks();
  bindScroll();
  bindForms();
  bindPopupBridge();
  bindSessionLifeCycle();

  if (canTrack()) {
    startSession();
  }

  function handleConsentChange() {
    if (canTrack() && !state.active) {
      state.sessionId = getOrCreateSessionId();
      startSession();
      return;
    }
    if (!canTrack() && state.active) {
      endSession('consent_revoked');
    }
  }

  function track(eventName, payload = {}) {
    sendEvent(eventName, payload);
  }

  function destroy() {
    state.destroyed = true;
    endSession('destroy');
  }

  return {
    track,
    destroy,
    handleConsentChange
  };
}
