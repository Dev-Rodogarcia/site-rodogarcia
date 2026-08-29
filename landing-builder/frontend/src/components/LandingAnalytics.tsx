"use client";

import { useEffect, useState } from "react";

const SHARED_CONSENT_KEY = "rg_analytics_consent";
const LEGACY_CONSENT_KEY = "rg_landing_analytics_consent";
const CONSENT_UPDATED_EVENT = "rg:consent-updated";
const OPEN_CONSENT_PREFERENCES_EVENT = "rg:open-consent-preferences";
const ga4MeasurementIdPattern = /^G-[A-Z0-9]{4,}$/i;

type ConsentDecision = boolean | null;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function consentFromValue(value: unknown): ConsentDecision {
  if (value === "accepted") return true;
  if (value === "rejected") return false;
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const consent = value as Record<string, unknown>;
  const categories = consent.categories;
  if (categories && typeof categories === "object" && !Array.isArray(categories)) {
    const analytics = (categories as Record<string, unknown>).analytics;
    if (typeof analytics === "boolean") return analytics;
  }
  if (consent.decision === "accepted") return true;
  return consent.decision === "rejected" ? false : null;
}

function readStoredConsent(): ConsentDecision {
  try {
    const shared = localStorage.getItem(SHARED_CONSENT_KEY);
    if (shared) {
      try {
        const consent = consentFromValue(JSON.parse(shared) as unknown);
        if (consent !== null) return consent;
      } catch {
        // Um valor corrompido não é consentimento; o fallback continua seguro.
      }
    }

    return consentFromValue(localStorage.getItem(LEGACY_CONSENT_KEY));
  } catch {
    return null;
  }
}

function writeFallbackConsent(accepted: boolean) {
  const value = {
    version: 1,
    decision: accepted ? "accepted" : "rejected",
    categories: { necessary: true, analytics: accepted, marketing: false },
  };

  try {
    localStorage.setItem(SHARED_CONSENT_KEY, JSON.stringify(value));
  } catch {
    // Sem storage disponível, analytics continua bloqueado pela ausência de consentimento.
  }
  window.dispatchEvent(new CustomEvent(CONSENT_UPDATED_EVENT, { detail: value }));
}

function updateGoogleConsent(allowed: boolean) {
  window.gtag?.("consent", "update", { analytics_storage: allowed ? "granted" : "denied" });
}

function clearOptionalAnalyticsStorage() {
  const expires = "Thu, 01 Jan 1970 00:00:00 GMT";
  const hostParts = window.location.hostname.split(".");
  const domains = [
    window.location.hostname,
    hostParts.length > 1 ? `.${hostParts.slice(-2).join(".")}` : "",
  ].filter(Boolean);
  const cookieNames = document.cookie
    .split(";")
    .map((item) => item.split("=")[0]?.trim())
    .filter((name): name is string => Boolean(name))
    .filter((name) => /^(_ga|_gid|_gat|_gcl|_clck|_clsk|fbp|fr)/i.test(name));

  for (const name of cookieNames) {
    document.cookie = `${name}=; expires=${expires}; path=/; SameSite=Lax`;
    for (const domain of domains) {
      document.cookie = `${name}=; expires=${expires}; path=/; domain=${domain}; SameSite=Lax`;
    }
  }
}

export function LandingAnalytics({ measurementId }: { measurementId: string }) {
  const [consent, setConsent] = useState<ConsentDecision>(null);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const validMeasurementId = ga4MeasurementIdPattern.test(measurementId);

  useEffect(() => {
    const syncStoredConsent = () => setConsent(readStoredConsent());
    const syncEventConsent = (event: Event) => {
      const detail = event instanceof CustomEvent ? consentFromValue(event.detail) : null;
      setConsent(detail ?? readStoredConsent());
    };
    const syncStorage = (event: StorageEvent) => {
      if (event.key === SHARED_CONSENT_KEY || event.key === LEGACY_CONSENT_KEY) syncStoredConsent();
    };
    const openPreferences = () => setPreferencesOpen(true);

    syncStoredConsent();
    window.addEventListener(CONSENT_UPDATED_EVENT, syncEventConsent);
    window.addEventListener("storage", syncStorage);
    window.addEventListener(OPEN_CONSENT_PREFERENCES_EVENT, openPreferences);
    return () => {
      window.removeEventListener(CONSENT_UPDATED_EVENT, syncEventConsent);
      window.removeEventListener("storage", syncStorage);
      window.removeEventListener(OPEN_CONSENT_PREFERENCES_EVENT, openPreferences);
    };
  }, []);

  useEffect(() => {
    if (!validMeasurementId || consent !== true) {
      if (consent === false) {
        updateGoogleConsent(false);
        clearOptionalAnalyticsStorage();
        document.getElementById(`rg-lb-ga4-${measurementId}`)?.remove();
      }
      return;
    }

    const scriptId = `rg-lb-ga4-${measurementId}`;
    let active = true;
    const configure = () => {
      if (!active) return;
      window.dataLayer = window.dataLayer ?? [];
      window.gtag = window.gtag ?? ((...args: unknown[]) => window.dataLayer?.push(args));
      window.gtag("consent", "default", { analytics_storage: "denied" });
      window.gtag("consent", "update", { analytics_storage: "granted" });
      window.gtag("js", new Date());
      window.gtag("config", measurementId, { anonymize_ip: true });
    };

    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
      configure();
      return () => { active = false; };
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    script.onload = configure;
    document.head.appendChild(script);
    return () => { active = false; };
  }, [consent, measurementId, validMeasurementId]);

  const showConsentDialog = preferencesOpen || (validMeasurementId && consent === null);
  if (!showConsentDialog) return null;

  function saveConsent(accepted: boolean) {
    writeFallbackConsent(accepted);
    setConsent(accepted);
    setPreferencesOpen(false);
  }

  return (
    <aside
      role="dialog"
      aria-modal="true"
      aria-label="Preferências de cookies"
      style={{ position: "fixed", right: 16, bottom: 16, zIndex: 50, maxWidth: 360, padding: 16, borderRadius: 12, background: "#10233f", color: "#fff", boxShadow: "0 18px 48px rgba(0,0,0,.25)" }}
    >
      <strong>Preferências de cookies</strong>
      <p style={{ margin: "8px 0 14px", lineHeight: 1.45, fontSize: 13 }}>Os cookies necessários mantêm a landing funcionando. Com sua permissão, os opcionais medem a campanha para melhorar a experiência.</p>
      <button type="button" onClick={() => saveConsent(true)} style={{ marginRight: 8, border: 0, borderRadius: 6, padding: "9px 12px", fontWeight: 700 }}>Aceitar opcionais</button>
      <button type="button" onClick={() => saveConsent(false)} style={{ border: "1px solid #fff", borderRadius: 6, padding: "8px 12px", color: "#fff", background: "transparent" }}>Recusar opcionais</button>
      {consent !== null ? <button type="button" onClick={() => setPreferencesOpen(false)} style={{ display: "block", marginTop: 12, border: 0, padding: 0, color: "rgba(255,255,255,.78)", background: "transparent", fontSize: 12, textDecoration: "underline", textUnderlineOffset: 3, cursor: "pointer" }}>Fechar</button> : null}
    </aside>
  );
}
