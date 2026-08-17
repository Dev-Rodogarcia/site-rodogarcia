"use client";

import { useEffect, useState } from "react";

const CONSENT_KEY = "rg_landing_analytics_consent";

declare global { interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; } }

export function LandingAnalytics({ measurementId }: { measurementId: string }) {
  const [consent, setConsent] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    setConsent(stored === "accepted" ? true : stored === "rejected" ? false : null);
  }, []);

  useEffect(() => {
    if (!consent || !/^G-[A-Z0-9]{4,}$/i.test(measurementId)) return;
    const scriptId = `rg-lb-ga4-${measurementId}`;
    if (document.getElementById(scriptId)) return;
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = window.gtag ?? ((...args: unknown[]) => window.dataLayer?.push(args));
    window.gtag("js", new Date());
    window.gtag("config", measurementId, { anonymize_ip: true });
    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
  }, [consent, measurementId]);

  if (consent !== null || !measurementId) return null;
  return (
    <aside style={{ position: "fixed", right: 16, bottom: 16, zIndex: 50, maxWidth: 360, padding: 16, borderRadius: 12, background: "#10233f", color: "#fff", boxShadow: "0 18px 48px rgba(0,0,0,.25)" }}>
      <strong>Cookies de analytics</strong>
      <p style={{ margin: "8px 0 14px", lineHeight: 1.45, fontSize: 13 }}>Com sua permissão, medimos a campanha para melhorar a experiência.</p>
      <button type="button" onClick={() => { localStorage.setItem(CONSENT_KEY, "accepted"); setConsent(true); }} style={{ marginRight: 8, border: 0, borderRadius: 6, padding: "9px 12px", fontWeight: 700 }}>Aceitar</button>
      <button type="button" onClick={() => { localStorage.setItem(CONSENT_KEY, "rejected"); setConsent(false); }} style={{ border: "1px solid #fff", borderRadius: 6, padding: "8px 12px", color: "#fff", background: "transparent" }}>Recusar</button>
    </aside>
  );
}
