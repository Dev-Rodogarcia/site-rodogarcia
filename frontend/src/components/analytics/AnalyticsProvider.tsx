"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import ConsentBanner, {
  getStoredConsent,
  type ConsentSettings,
  type StoredConsent,
} from "./ConsentBanner";
import { api } from "@/lib/routes";

const SESSION_KEY = "rg_analytics_session_id";

const DEFAULT_CONSENT_SETTINGS: ConsentSettings = {
  enabled: true,
  version: 1,
  title: "Usamos cookies para melhorar sua experiencia",
  description: "Utilizamos cookies necessarios e, com sua permissao, cookies de analytics e marketing.",
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
      description: "Ajudam a melhorar paginas, conteudo e desempenho.",
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

function sendAnalyticsEvent(
  type: string,
  page: string,
  sessionId: string,
  element?: string
) {
  postEvent(api.analytics.event, {
    type,
    event: type,
    page,
    sessionId,
    element: element ?? "",
    source: "site",
    consent: "analytics",
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

export default function AnalyticsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [consent, setConsent] = useState<StoredConsent | null>(null);
  const [settings, setSettings] = useState<ConsentSettings>(DEFAULT_CONSENT_SETTINGS);
  const sessionId = useRef<string>("");

  useEffect(() => {
    fetch(api.consent.settings)
      .then((response) => response.json())
      .then((data: { settings?: ConsentSettings }) => {
        if (data.settings) {
          setSettings({ ...DEFAULT_CONSENT_SETTINGS, ...data.settings });
        }
      })
      .catch(() => {
        setSettings(DEFAULT_CONSENT_SETTINGS);
      });
  }, []);

  useEffect(() => {
    const stored = getStoredConsent();
    setConsent(stored);
    if (hasAnalyticsConsent(stored)) {
      sessionId.current = getOrCreateSessionId();
    }
  }, []);

  const prevPath = useRef<string>("");
  useEffect(() => {
    if (!hasAnalyticsConsent(consent)) return;
    if (!sessionId.current) sessionId.current = getOrCreateSessionId();
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;
    sendAnalyticsEvent("page_view", pathname, sessionId.current);
  }, [pathname, consent]);

  useEffect(() => {
    if (!hasAnalyticsConsent(consent)) return;

    function onClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest("[data-track]");
      if (!target) return;
      const label = target.getAttribute("data-track") ?? "unknown";
      sendAnalyticsEvent("cta_click", window.location.pathname, sessionId.current, label);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [consent]);

  const handleConsent = useCallback((value: StoredConsent) => {
    setConsent(value);
    sendTrackingEvent(
      value.decision === "accepted"
        ? "cookie_accept"
        : value.decision === "rejected"
          ? "cookie_reject"
          : "cookie_preferences",
      { metadata: { version: String(value.version) } }
    );
    if (hasAnalyticsConsent(value)) {
      sessionId.current = getOrCreateSessionId();
      sendAnalyticsEvent("session_start", window.location.pathname, sessionId.current);
    }
  }, []);

  return (
    <>
      {children}
      <ConsentBanner settings={settings} onConsent={handleConsent} />
    </>
  );
}
