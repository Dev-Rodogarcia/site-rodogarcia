"use client";

import { useEffect, useMemo, useState } from "react";

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
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

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
    setSelected(defaultCategories);
    if (!settings.enabled) return;
    if (!stored || stored.version !== settings.version) setVisible(true);
  }, [defaultCategories, settings.enabled, settings.version]);

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
    setVisible(false);
  }

  if (!visible || !settings.enabled) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentimento de cookies"
      className="fixed inset-x-3 bottom-3 z-[9998] mx-auto max-w-[560px] rounded-lg border border-[var(--border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-lg)] sm:left-auto sm:right-5 sm:mx-0 sm:max-w-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">{settings.title}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--color-muted-raw)]">
            {settings.description}
          </p>
        </div>
      </div>

      {preferencesOpen ? (
        <div className="mt-3 space-y-2">
          {settings.categories.map((category) => (
            <label
              key={category.key}
              className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-white/70 px-3 py-2 text-sm"
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
                className="mt-1 h-4 w-4 accent-[var(--primary)]"
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

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() =>
            decide(
              "accepted",
              Object.fromEntries(settings.categories.map((category) => [category.key, true]))
            )
          }
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[var(--color-primary-strong)]"
        >
          {settings.acceptAllLabel}
        </button>
        <button
          type="button"
          onClick={() => decide("rejected", defaultCategories)}
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-bold text-[var(--foreground)] transition-colors hover:bg-black/5"
        >
          {settings.rejectLabel}
        </button>
        <button
          type="button"
          onClick={() =>
            preferencesOpen ? decide("custom", selected) : setPreferencesOpen(true)
          }
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-bold text-[var(--foreground)] transition-colors hover:bg-black/5"
        >
          {preferencesOpen ? settings.saveLabel : settings.preferencesLabel}
        </button>
      </div>
    </div>
  );
}
