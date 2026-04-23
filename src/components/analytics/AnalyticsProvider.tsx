"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import ConsentBanner, {
  getStoredConsent,
  type ConsentState,
} from "./ConsentBanner";
import { api } from "@/lib/routes";

const SESSION_KEY = "rg_analytics_session_id";

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

function sendEvent(
  type: string,
  page: string,
  sessionId: string,
  element?: string
) {
  const payload = JSON.stringify({
    type,
    page,
    sessionId,
    element: element ?? "",
  });
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      api.analytics.event,
      new Blob([payload], { type: "application/json" })
    );
  } else {
    fetch(api.analytics.event, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: payload,
    }).catch(() => {
      /* silent */
    });
  }
}

export default function AnalyticsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [consent, setConsent] = useState<ConsentState>(null);
  const sessionId = useRef<string>("");

  useEffect(() => {
    const stored = getStoredConsent();
    setConsent(stored);
    if (stored === "granted") {
      sessionId.current = getOrCreateSessionId();
    }
  }, []);

  const prevPath = useRef<string>("");
  useEffect(() => {
    if (consent !== "granted") return;
    if (!sessionId.current) {
      sessionId.current = getOrCreateSessionId();
    }
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;
    sendEvent("page_view", pathname, sessionId.current);
  }, [pathname, consent]);

  useEffect(() => {
    if (consent !== "granted") return;

    function onClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest("[data-track]");
      if (!target) return;
      const label = target.getAttribute("data-track") ?? "unknown";
      sendEvent("cta_click", window.location.pathname, sessionId.current, label);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [consent]);

  const handleConsent = useCallback((v: "granted" | "denied") => {
    setConsent(v);
    if (v === "granted") {
      sessionId.current = getOrCreateSessionId();
      sendEvent("session_start", window.location.pathname, sessionId.current);
    }
  }, []);

  return (
    <>
      {children}
      <ConsentBanner onConsent={handleConsent} />
    </>
  );
}
