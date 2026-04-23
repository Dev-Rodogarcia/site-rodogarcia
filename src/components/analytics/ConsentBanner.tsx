"use client";

import { useState, useEffect } from "react";

const CONSENT_KEY = "rg_analytics_consent";

export type ConsentState = "granted" | "denied" | null;

export function getStoredConsent(): ConsentState {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    if (v === "granted" || v === "denied") return v;
    return null;
  } catch {
    return null;
  }
}

export function setStoredConsent(v: "granted" | "denied") {
  try {
    localStorage.setItem(CONSENT_KEY, v);
  } catch {
    /* ignore */
  }
}

interface ConsentBannerProps {
  onConsent: (v: "granted" | "denied") => void;
}

export default function ConsentBanner({ onConsent }: ConsentBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getStoredConsent() === null) setVisible(true);
  }, []);

  function decide(v: "granted" | "denied") {
    setStoredConsent(v);
    onConsent(v);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentimento de cookies e analytics"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-[9998] bg-[var(--color-surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-lg)] space-y-3"
    >
      <p className="text-sm font-medium text-[var(--foreground)]">
        Usamos cookies analíticos
      </p>
      <p className="text-xs text-[var(--color-muted-raw)] leading-relaxed">
        Coletamos dados anônimos de navegação para melhorar a experiência no
        site. Nenhuma informação pessoal é compartilhada com terceiros.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => decide("granted")}
          className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-full font-semibold text-xs bg-[var(--primary)] text-white hover:bg-[var(--color-primary-strong)] transition-colors"
        >
          Aceitar
        </button>
        <button
          type="button"
          onClick={() => decide("denied")}
          className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-full font-medium text-xs border border-[var(--border)] text-[var(--foreground)] hover:bg-black/5 transition-colors"
        >
          Recusar
        </button>
      </div>
    </div>
  );
}
