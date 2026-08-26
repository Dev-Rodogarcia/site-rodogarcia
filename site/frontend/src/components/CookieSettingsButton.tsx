"use client";

import { OPEN_CONSENT_PREFERENCES_EVENT } from "@/components/analytics/ConsentBanner";

export default function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_PREFERENCES_EVENT))}
      className="transition-colors hover:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
    >
      Gerenciar Cookies
    </button>
  );
}
