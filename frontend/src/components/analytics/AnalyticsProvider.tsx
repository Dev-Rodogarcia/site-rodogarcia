"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import ConsentBanner, {
  clearOptionalConsentStorage,
  getStoredConsent,
  type ConsentSettings,
  type StoredConsent,
} from "./ConsentBanner";
import { api } from "@/lib/routes";

const SESSION_KEY = "rg_analytics_session_id";
const DEFAULT_SCROLL_MILESTONES = [25, 50, 75, 100];

type ClarityFunction = ((...args: unknown[]) => void) & { q?: unknown[] };

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    clarity?: ClarityFunction;
  }
}

interface PublicAnalyticsConfig {
  tracking?: {
    enabled?: boolean;
    heartbeatSeconds?: number;
    scrollMilestones?: number[];
  };
  providers?: {
    ga4?: { enabled?: boolean; measurementId?: string };
    clarity?: { enabled?: boolean; projectId?: string };
  };
}

const DEFAULT_CONSENT_SETTINGS: ConsentSettings = {
  enabled: true,
  version: 1,
  title: "Usamos cookies para melhorar sua experiencia",
  description: "Utilizamos cookies necessários e, com sua permissão, cookies de analytics e marketing.",
  acceptAllLabel: "Aceitar todos",
  rejectLabel: "Recusar opcionais",
  preferencesLabel: "Preferencias",
  saveLabel: "Salvar preferencias",
  categories: [
    {
      key: "necessary",
      label: "Necessarios",
      description: "Essenciais para o funcionamento do site.",
      required: true,
      enabledByDefault: true,
    },
    {
      key: "analytics",
      label: "Analytics",
      description: "Ajudam a melhorar páginas, conteúdo e desempenho.",
      required: false,
      enabledByDefault: false,
    },
    {
      key: "marketing",
      label: "Marketing",
      description: "Ajudam a medir campanhas e conversoes.",
      required: false,
      enabledByDefault: false,
    },
  ],
};

function getOrCreateSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = `sess_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return `sess_${Date.now()}`;
  }
}

function postEvent(url: string, payload: Record<string, unknown>) {
  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
    return;
  }
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body,
  }).catch(() => {
    /* silent */
  });
}

function hasAnalyticsConsent(consent: StoredConsent | null) {
  return Boolean(consent?.categories.analytics);
}

function isTrackingEnabled(config: PublicAnalyticsConfig) {
  return config.tracking?.enabled !== false;
}

function normalizeScrollMilestones(config: PublicAnalyticsConfig) {
  const values = config.tracking?.scrollMilestones;
  if (!Array.isArray(values) || values.length === 0) return DEFAULT_SCROLL_MILESTONES;
  return [...new Set(values)]
    .filter((value) => Number.isFinite(value) && value > 0 && value <= 100)
    .sort((a, b) => a - b)
    .slice(0, 8);
}

function labelForElement(element: Element) {
  const explicit = element.getAttribute("data-track") || element.getAttribute("aria-label");
  if (explicit) return explicit.slice(0, 80);
  const text = element.textContent?.replace(/\s+/g, " ").trim();
  if (text) return text.slice(0, 80);
  return element.id || element.tagName.toLowerCase();
}

function selectorForElement(element: Element) {
  if (element.id) return `#${element.id}`.slice(0, 120);
  const track = element.getAttribute("data-track");
  if (track) return `[data-track="${track.slice(0, 60)}"]`;
  const parts: string[] = [];
  let current: Element | null = element;
  while (current && parts.length < 4 && current !== document.body) {
    const tag = current.tagName.toLowerCase();
    const className = Array.from(current.classList).slice(0, 2).join(".");
    parts.unshift(className ? `${tag}.${className}` : tag);
    current = current.parentElement;
  }
  return parts.join(" > ").slice(0, 120) || element.tagName.toLowerCase();
}

function isDownloadLink(anchor: HTMLAnchorElement) {
  if (anchor.hasAttribute("download")) return true;
  return /\.(pdf|docx?|xlsx?|zip|rar|7z|csv)$/i.test(anchor.pathname);
}

function isOutboundLink(anchor: HTMLAnchorElement) {
  return anchor.hostname.length > 0 && anchor.hostname !== window.location.hostname;
}

function sendAnalyticsEvent(input: {
  type: string;
  page: string;
  sessionId: string;
  element?: string;
  value?: string | number;
  category?: string;
  metadata?: Record<string, string | number | boolean>;
}) {
  postEvent(api.analytics.event, {
    type: input.type,
    event: input.type,
    page: input.page,
    sessionId: input.sessionId,
    element: input.element ?? "",
    value: input.value ?? "",
    category: input.category ?? "",
    source: "site",
    consent: "analytics",
    metadata: input.metadata ?? {},
  });
}

function sendTrackingEvent(event: string, payload: Record<string, unknown> = {}) {
  postEvent(api.tracking.event, {
    event,
    page: window.location.pathname,
    source: "site",
    ...payload,
  });
}

function loadScriptOnce(id: string, src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.async = true;
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Falha ao carregar ${id}`));
    document.head.appendChild(script);
  });
}

function removeManagedAnalyticsScripts() {
  ["rg-ga4-src", "rg-clarity-src"].forEach((id) => {
    document.getElementById(id)?.remove();
  });
}

export default function AnalyticsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [consent, setConsent] = useState<StoredConsent | null>(null);
  const [settings, setSettings] = useState<ConsentSettings>(DEFAULT_CONSENT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [analyticsConfig, setAnalyticsConfig] = useState<PublicAnalyticsConfig>({});
  const sessionId = useRef<string>("");
  const prevPath = useRef<string>("");
  const pageStartedAt = useRef<number>(Date.now());
  const scrollSent = useRef<Set<number>>(new Set());
  const formStarted = useRef<WeakSet<HTMLFormElement>>(new WeakSet());
  const scriptsLoaded = useRef<Set<string>>(new Set());
  const scriptsFailed = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetch(api.consent.settings)
      .then((response) => response.json())
      .then((data: { settings?: ConsentSettings }) => {
        if (data.settings) {
          setSettings({ ...DEFAULT_CONSENT_SETTINGS, ...data.settings });
        }
        setSettingsLoaded(true);
      })
      .catch(() => {
        setSettings(DEFAULT_CONSENT_SETTINGS);
        setSettingsLoaded(true);
      });

    fetch(api.analytics.publicConfig)
      .then((response) => response.json())
      .then((data: { config?: PublicAnalyticsConfig }) => {
        setAnalyticsConfig(data.config ?? {});
      })
      .catch(() => {
        setAnalyticsConfig({});
      });
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;
    const stored = getStoredConsent();
    const currentConsent = stored?.version === settings.version ? stored : null;
    setConsent(currentConsent);
    if (hasAnalyticsConsent(currentConsent)) {
      sessionId.current = getOrCreateSessionId();
    }
  }, [settings.version, settingsLoaded]);

  useEffect(() => {
    if (!hasAnalyticsConsent(consent)) {
      clearOptionalConsentStorage();
      removeManagedAnalyticsScripts();
      return;
    }

    const ga4 = analyticsConfig.providers?.ga4;
    const clarity = analyticsConfig.providers?.clarity;

    if (ga4?.enabled && ga4.measurementId) {
      window.dataLayer = window.dataLayer ?? [];
      window.gtag =
        window.gtag ??
        ((...args: unknown[]) => {
          window.dataLayer?.push(args);
        });
      window.gtag("js", new Date());
      window.gtag("config", ga4.measurementId, { anonymize_ip: true });

      loadScriptOnce("rg-ga4-src", `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4.measurementId)}`)
        .then(() => scriptsLoaded.current.add("ga4"))
        .catch(() => scriptsFailed.current.add("ga4"));
    }

    if (clarity?.enabled && clarity.projectId) {
      if (!window.clarity) {
        const queuedClarity: ClarityFunction = (...args: unknown[]) => {
          queuedClarity.q = queuedClarity.q ?? [];
          queuedClarity.q.push(args);
        };
        window.clarity = queuedClarity;
      }

      loadScriptOnce("rg-clarity-src", `https://www.clarity.ms/tag/${encodeURIComponent(clarity.projectId)}`)
        .then(() => scriptsLoaded.current.add("clarity"))
        .catch(() => scriptsFailed.current.add("clarity"));
    }
  }, [analyticsConfig.providers?.clarity, analyticsConfig.providers?.ga4, consent]);

  useEffect(() => {
    if (!hasAnalyticsConsent(consent) || !isTrackingEnabled(analyticsConfig)) return;
    if (!sessionId.current) sessionId.current = getOrCreateSessionId();
    if (prevPath.current === pathname) return;

    if (prevPath.current) {
      const elapsedSeconds = Math.max(1, Math.round((Date.now() - pageStartedAt.current) / 1000));
      sendAnalyticsEvent({
        type: "time_on_page",
        page: prevPath.current,
        sessionId: sessionId.current,
        value: elapsedSeconds,
      });
    }

    prevPath.current = pathname;
    pageStartedAt.current = Date.now();
    scrollSent.current = new Set();
    sendAnalyticsEvent({ type: "page_view", page: pathname, sessionId: sessionId.current });
  }, [analyticsConfig, pathname, consent]);

  useEffect(() => {
    if (!hasAnalyticsConsent(consent) || !isTrackingEnabled(analyticsConfig)) return;
    const milestones = normalizeScrollMilestones(analyticsConfig);

    function onScroll() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const percent = Math.min(100, Math.round((window.scrollY / scrollable) * 100));
      milestones.forEach((milestone) => {
        if (percent >= milestone && !scrollSent.current.has(milestone)) {
          scrollSent.current.add(milestone);
          sendAnalyticsEvent({
            type: "scroll",
            page: window.location.pathname,
            sessionId: sessionId.current,
            element: "document",
            value: milestone,
            category: "scroll_depth",
          });
        }
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [analyticsConfig, consent, pathname]);

  useEffect(() => {
    if (!hasAnalyticsConsent(consent) || !isTrackingEnabled(analyticsConfig)) return;

    function onClick(event: MouseEvent) {
      const target = event.target instanceof Element
        ? event.target.closest("[data-track], a, button")
        : null;
      if (!target) return;

      const anchor = target.closest("a");
      const element = selectorForElement(target);
      const metadata = {
        label: labelForElement(target),
        href: anchor?.href ?? "",
      };

      if (anchor && isDownloadLink(anchor)) {
        sendAnalyticsEvent({
          type: "download",
          page: window.location.pathname,
          sessionId: sessionId.current,
          element,
          category: "download",
          metadata,
        });
        return;
      }

      if (anchor && isOutboundLink(anchor)) {
        sendAnalyticsEvent({
          type: "outbound_link",
          page: window.location.pathname,
          sessionId: sessionId.current,
          element,
          category: "outbound",
          metadata,
        });
        return;
      }

      sendAnalyticsEvent({
        type: target.hasAttribute("data-track") ? "cta_click" : "click",
        page: window.location.pathname,
        sessionId: sessionId.current,
        element,
        category: "interaction",
        metadata,
      });
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [analyticsConfig, consent]);

  useEffect(() => {
    if (!hasAnalyticsConsent(consent) || !isTrackingEnabled(analyticsConfig)) return;

    function onFormStart(event: Event) {
      const form = event.target instanceof Element ? event.target.closest("form") : null;
      if (!form || formStarted.current.has(form)) return;
      formStarted.current.add(form);
      sendAnalyticsEvent({
        type: "form_start",
        page: window.location.pathname,
        sessionId: sessionId.current,
        element: selectorForElement(form),
        category: "form",
      });
    }

    function onFormSubmit(event: Event) {
      const form = event.target instanceof HTMLFormElement ? event.target : null;
      if (!form) return;
      sendAnalyticsEvent({
        type: "form_submit",
        page: window.location.pathname,
        sessionId: sessionId.current,
        element: selectorForElement(form),
        category: "form",
      });
    }

    function onFormSuccess(event: Event) {
      const detail = event instanceof CustomEvent ? (event.detail as Record<string, unknown>) : {};
      sendAnalyticsEvent({
        type: "form_success",
        page: window.location.pathname,
        sessionId: sessionId.current,
        element: String(detail?.form ?? "form"),
        category: "form",
      });
    }

    function onFormFail(event: Event) {
      const detail = event instanceof CustomEvent ? (event.detail as Record<string, unknown>) : {};
      sendAnalyticsEvent({
        type: "form_fail",
        page: window.location.pathname,
        sessionId: sessionId.current,
        element: String(detail?.form ?? "form"),
        category: "form",
        metadata: { reason: String(detail?.reason ?? "unknown") },
      });
    }

    document.addEventListener("focusin", onFormStart, true);
    document.addEventListener("submit", onFormSubmit, true);
    window.addEventListener("rg:form-success", onFormSuccess);
    window.addEventListener("rg:form-fail", onFormFail);
    return () => {
      document.removeEventListener("focusin", onFormStart, true);
      document.removeEventListener("submit", onFormSubmit, true);
      window.removeEventListener("rg:form-success", onFormSuccess);
      window.removeEventListener("rg:form-fail", onFormFail);
    };
  }, [analyticsConfig, consent]);

  useEffect(() => {
    if (!hasAnalyticsConsent(consent) || !isTrackingEnabled(analyticsConfig)) return;

    function flushSession() {
      if (!sessionId.current) return;
      const elapsedSeconds = Math.max(1, Math.round((Date.now() - pageStartedAt.current) / 1000));
      sendAnalyticsEvent({
        type: "time_on_page",
        page: window.location.pathname,
        sessionId: sessionId.current,
        value: elapsedSeconds,
      });
      sendAnalyticsEvent({
        type: "session_end",
        page: window.location.pathname,
        sessionId: sessionId.current,
        value: elapsedSeconds,
      });
    }

    window.addEventListener("pagehide", flushSession);
    return () => window.removeEventListener("pagehide", flushSession);
  }, [analyticsConfig, consent]);

  const handleConsent = useCallback((value: StoredConsent) => {
    setConsent(value);

    const status =
      value.decision === "accepted"
        ? "accepted"
        : value.decision === "rejected"
          ? "rejected"
          : "partial";

    postEvent(api.consent.events, {
      decision: status,
      status,
      type: status,
      version: value.version,
      consentTextVersion: value.version,
      categories: value.categories,
      sessionId: sessionId.current || "",
      scriptsLoaded: Array.from(scriptsLoaded.current),
      scriptsFailed: Array.from(scriptsFailed.current),
      logs: [{ action: "consent_changed", at: new Date().toISOString() }],
    });

    sendTrackingEvent(
      value.decision === "accepted"
        ? "cookie_accept"
        : value.decision === "rejected"
          ? "cookie_reject"
          : "cookie_preferences",
      { metadata: { version: String(value.version), status } }
    );

    if (hasAnalyticsConsent(value) && isTrackingEnabled(analyticsConfig)) {
      sessionId.current = getOrCreateSessionId();
      sendAnalyticsEvent({
        type: "session_start",
        page: window.location.pathname,
        sessionId: sessionId.current,
      });
      return;
    }

    clearOptionalConsentStorage();
    removeManagedAnalyticsScripts();
    sessionId.current = "";
  }, [analyticsConfig]);

  return (
    <>
      {children}
      <ConsentBanner settings={settings} onConsent={handleConsent} />
    </>
  );
}
