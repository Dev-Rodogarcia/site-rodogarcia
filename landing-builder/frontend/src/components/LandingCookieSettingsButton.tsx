"use client";

const OPEN_CONSENT_PREFERENCES_EVENT = "rg:open-consent-preferences";

export function LandingCookieSettingsButton() {
  return <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_PREFERENCES_EVENT))} style={{ border: 0, padding: 0, color: "inherit", background: "transparent", font: "inherit", textDecoration: "underline", textUnderlineOffset: 3, cursor: "pointer" }}>Gerenciar cookies</button>;
}
