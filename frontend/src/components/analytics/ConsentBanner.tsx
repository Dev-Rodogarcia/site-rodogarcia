"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

const CONSENT_KEY = "rg_analytics_consent";

export interface ConsentCategory {
  key: string;
  label: string;
  description: string;
  required: boolean;
  enabledByDefault: boolean;
}

export interface ConsentSettings {
  enabled: boolean;
  version: number;
  title: string;
  description: string;
  acceptAllLabel: string;
  rejectLabel: string;
  preferencesLabel: string;
  saveLabel: string;
  desktop?: { position?: string; compact?: boolean };
  mobile?: { position?: string; compact?: boolean };
  behavior?: {
    requireExplicitChoice?: boolean;
    blockAnalyticsUntilConsent?: boolean;
    reopenOnVersionChange?: boolean;
  };
  categories: ConsentCategory[];
}

export interface StoredConsent {
  version: number;
  decision: "accepted" | "rejected" | "custom";
  categories: Record<string, boolean>;
}

export function getStoredConsent(): StoredConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(CONSENT_KEY);
    if (!value) return null;
    if (value === "granted") {
      return {
        version: 1,
        decision: "accepted",
        categories: { necessary: true, analytics: true, marketing: true },
      };
    }
    if (value === "denied") {
      return {
        version: 1,
        decision: "rejected",
        categories: { necessary: true, analytics: false, marketing: false },
      };
    }
    return JSON.parse(value) as StoredConsent;
  } catch {
    return null;
  }
}

export function setStoredConsent(value: StoredConsent) {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

interface ConsentBannerProps {
  settings: ConsentSettings;
  onConsent: (value: StoredConsent) => void;
}

export default function ConsentBanner({ settings, onConsent }: ConsentBannerProps) {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const titleId = useId();
  const descriptionId = useId();
  const closeTimer = useRef<number | null>(null);

  const defaultCategories = useMemo(() => {
    return Object.fromEntries(
      settings.categories.map((category) => [
        category.key,
        category.required || category.enabledByDefault,
      ])
    );
  }, [settings.categories]);

  useEffect(() => {
    const stored = getStoredConsent();
    setSelected(stored?.categories ?? defaultCategories);
    if (!settings.enabled) return;
    const shouldReopenForVersion =
      settings.behavior?.reopenOnVersionChange !== false &&
      stored?.version !== settings.version;
    if (!stored || shouldReopenForVersion) {
      setClosing(false);
      setVisible(true);
    }
  }, [defaultCategories, settings.behavior?.reopenOnVersionChange, settings.enabled, settings.version]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  function decide(decision: StoredConsent["decision"], categories: Record<string, boolean>) {
    const normalized = {
      ...categories,
      ...Object.fromEntries(
        settings.categories.filter((category) => category.required).map((category) => [category.key, true])
      ),
    };
    const value = { version: settings.version, decision, categories: normalized };
    setStoredConsent(value);
    onConsent(value);
    setClosing(true);
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    const shouldReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    closeTimer.current = window.setTimeout(
      () => {
        setVisible(false);
        setClosing(false);
      },
      shouldReduceMotion ? 0 : 180
    );
  }

  if (!visible || !settings.enabled) return null;

  return (
    <div
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className={[
        "fixed inset-x-3 bottom-4 z-[9998] mx-auto max-w-[720px] overflow-hidden rounded-[24px]",
        "border border-white/44 bg-[var(--color-surface)] p-4 shadow-[0_26px_80px_rgba(2,6,23,0.22)] backdrop-blur-2xl",
        "transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none sm:p-5",
        closing ? "translate-y-3 scale-[0.98] opacity-0" : "translate-y-0 scale-100 opacity-100",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,rgba(6,182,212,0.58),rgba(29,78,216,0.88),rgba(255,255,255,0.28))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(29,78,216,0.06),transparent)]" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p id={titleId} className="text-sm font-extrabold tracking-[-0.01em] text-[var(--foreground)] sm:text-base">
            {settings.title}
          </p>
          <p id={descriptionId} className="mt-1.5 text-xs leading-5 text-[var(--color-muted-raw)] sm:text-[13px] sm:leading-6">
            {settings.description}
          </p>
        </div>
      </div>

      {preferencesOpen ? (
        <div className="relative mt-4 grid gap-2.5">
          {settings.categories.map((category) => (
            <label
              key={category.key}
              className="flex items-start gap-3 rounded-[18px] border border-[var(--border)] bg-[var(--color-surface-2)] px-3.5 py-3 text-sm transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-strong)]"
            >
              <input
                type="checkbox"
                checked={Boolean(selected[category.key])}
                disabled={category.required}
                onChange={(event) =>
                  setSelected((current) => ({
                    ...current,
                    [category.key]: event.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4 accent-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/35"
              />
              <span>
                <span className="block font-semibold text-[var(--foreground)]">{category.label}</span>
                <span className="block text-xs leading-5 text-[var(--color-muted-raw)]">
                  {category.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      ) : null}

      <div className="relative mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={() =>
            decide(
              "accepted",
              Object.fromEntries(settings.categories.map((category) => [category.key, true]))
            )
          }
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--primary)] px-5 py-2.5 text-xs font-extrabold text-white shadow-[0_14px_30px_rgba(29,78,216,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-primary-strong)] hover:shadow-[0_18px_36px_rgba(29,78,216,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/45 focus-visible:ring-offset-2 sm:order-3"
        >
          {settings.acceptAllLabel}
        </button>
        <button
          type="button"
          onClick={() => decide("rejected", defaultCategories)}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--color-surface-strong)] px-5 py-2.5 text-xs font-bold text-[var(--color-foreground-soft)] transition-all duration-200 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/35 sm:order-1"
        >
          {settings.rejectLabel}
        </button>
        <button
          type="button"
          onClick={() =>
            preferencesOpen ? decide("custom", selected) : setPreferencesOpen(true)
          }
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--color-surface-strong)] px-5 py-2.5 text-xs font-bold text-[var(--color-foreground-soft)] transition-all duration-200 hover:border-[var(--primary)]/24 hover:bg-[var(--color-primary-soft)] hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/35 sm:order-2"
        >
          {preferencesOpen ? settings.saveLabel : settings.preferencesLabel}
        </button>
      </div>
    </div>
  );
}
