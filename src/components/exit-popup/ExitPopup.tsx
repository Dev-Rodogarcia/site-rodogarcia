"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePhoneMask } from "@/hooks/usePhoneMask";
import { api, isAdminRoute, isAuthRoute } from "@/lib/routes";

interface PopupConfig {
  title: string;
  description: string;
  enableName: boolean;
  enableEmail: boolean;
  enablePhone: boolean;
  buttonText: string;
  closeText: string;
  successMessage: string;
  delaySeconds: number;
  cooldownHours: number;
  maxShowsPerSession: number;
  enabled: boolean;
}

const DEFAULT_CONFIG: PopupConfig = {
  title: "Antes de sair...",
  description: "Receba uma proposta personalizada para sua operação logística.",
  enableName: true,
  enableEmail: true,
  enablePhone: true,
  buttonText: "Receber proposta",
  closeText: "Fechar",
  successMessage: "Recebemos seus dados. Em breve entraremos em contato.",
  delaySeconds: 10,
  cooldownHours: 24,
  maxShowsPerSession: 1,
  enabled: true,
};

const STORAGE = {
  lastShownAt: "rg_exit_popup_last_shown_at",
  submittedAt: "rg_exit_popup_submitted_at",
};
const SESSION_SHOWS = "rg_exit_popup_shows_in_session";

function readLocal(key: string): number {
  try {
    const v = Number(localStorage.getItem(key));
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}
function writeLocal(key: string, v: number) {
  try {
    localStorage.setItem(key, String(v));
  } catch {
    /* ignore */
  }
}
function getSessionShows(): number {
  try {
    return Number(sessionStorage.getItem(SESSION_SHOWS)) || 0;
  } catch {
    return 0;
  }
}
function incSessionShows() {
  try {
    sessionStorage.setItem(SESSION_SHOWS, String(getSessionShows() + 1));
  } catch {
    /* ignore */
  }
}
function clearFrequency() {
  try {
    localStorage.removeItem(STORAGE.lastShownAt);
    localStorage.removeItem(STORAGE.submittedAt);
    sessionStorage.removeItem(SESSION_SHOWS);
  } catch {
    /* ignore */
  }
}

function isMobileDevice() {
  if (typeof window === "undefined") return false;
  const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const narrow = window.matchMedia("(max-width: 900px)").matches;
  return touch && narrow;
}

function trackEvent(name: string, meta: Record<string, unknown> = {}) {
  const payload = JSON.stringify({
    event: name,
    source: "exit-intent-popup",
    pagePath: window.location.pathname,
    metadata: meta,
  });
  if (navigator.sendBeacon) {
    navigator.sendBeacon(
      api.popup.events,
      new Blob([payload], { type: "application/json" })
    );
  } else {
    fetch(api.popup.events, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: payload,
    }).catch(() => {
      /* silent */
    });
  }
}

export default function ExitPopup() {
  const [config, setConfig] = useState<PopupConfig | null>(null);
  const [open, setOpen] = useState(false);
  const [formStatus, setFormStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const { maskPhone } = usePhoneMask();

  const hasShown = useRef(false);
  const loadedAt = useRef(Date.now());
  const isMobile = useRef(false);
  const lastDesktopY = useRef<number | null>(null);
  const cameFromBelow = useRef(false);

  useEffect(() => {
    const path = window.location.pathname;
    if (isAdminRoute(path) || isAuthRoute(path)) return;

    const params = new URLSearchParams(window.location.search);
    const testMode = params.get("popup_test") === "1";

    fetch(api.popup.config)
      .then((r) => r.json())
      .then((data) => {
        const raw = (data as { config?: Partial<PopupConfig> }).config ?? {};
        const merged: PopupConfig = { ...DEFAULT_CONFIG, ...raw };
        if (!merged.enabled) return;
        setConfig(merged);
        if (testMode) {
          clearFrequency();
          setTimeout(() => triggerShow(merged), 900);
        }
      })
      .catch(() => {
        setConfig(DEFAULT_CONFIG);
        if (testMode) {
          clearFrequency();
          setTimeout(() => triggerShow(DEFAULT_CONFIG), 900);
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const shouldShow = useCallback((cfg: PopupConfig) => {
    if (hasShown.current) return false;
    if (Date.now() - loadedAt.current < cfg.delaySeconds * 1000) return false;
    if (getSessionShows() >= cfg.maxShowsPerSession) return false;
    const cooldownMs = cfg.cooldownHours * 3_600_000;
    if (
      readLocal(STORAGE.submittedAt) > 0 &&
      Date.now() - readLocal(STORAGE.submittedAt) < cooldownMs
    )
      return false;
    if (
      readLocal(STORAGE.lastShownAt) > 0 &&
      Date.now() - readLocal(STORAGE.lastShownAt) < cooldownMs
    )
      return false;
    return true;
  }, []);

  const triggerShow = useCallback(
    (cfg: PopupConfig) => {
      if (!shouldShow(cfg)) return;
      hasShown.current = true;
      writeLocal(STORAGE.lastShownAt, Date.now());
      incSessionShows();
      setOpen(true);
      trackEvent("popup_shown", { trigger: "exit_intent" });
    },
    [shouldShow]
  );

  useEffect(() => {
    if (!config) return;
    isMobile.current = isMobileDevice();
    if (isMobile.current) return;

    function onMouseMove(e: MouseEvent) {
      if (e.clientY > 80) cameFromBelow.current = true;
      lastDesktopY.current = e.clientY;
    }
    function onMouseOut(e: MouseEvent) {
      if (!config || e.clientY > 0) return;
      if (!cameFromBelow.current) return;
      triggerShow(config);
    }

    document.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseout", onMouseOut);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseout", onMouseOut);
    };
  }, [config, triggerShow]);

  useEffect(() => {
    if (!config) return;
    if (!isMobile.current) return;

    let lastScrollY = window.scrollY;
    let lastScrollAt = Date.now();

    function onScroll() {
      if (!config) return;
      const now = Date.now();
      const currentY = window.scrollY;
      const deltaY = lastScrollY - currentY;
      const deltaTime = now - lastScrollAt;

      if (deltaTime > 0 && deltaTime <= 240 && deltaY >= 140 && currentY <= 24) {
        triggerShow(config);
      }
      lastScrollY = currentY;
      lastScrollAt = now;
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [config, triggerShow]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closePopup("esc");
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function closePopup(closeType: string) {
    setOpen(false);
    trackEvent("popup_closed", { closeType });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!config) return;

    if (config.enableName && !name.trim()) {
      setErrorMsg("Informe seu nome.");
      setFormStatus("error");
      return;
    }
    if (config.enableEmail && !email.trim()) {
      setErrorMsg("Informe um e-mail válido.");
      setFormStatus("error");
      return;
    }

    setFormStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch(api.popup.leads, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "exit-intent-popup",
          pagePath: window.location.pathname,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        lead?: { id: string };
      };
      if (!res.ok) {
        setErrorMsg(data.error ?? "Falha ao enviar dados.");
        setFormStatus("error");
        return;
      }
      writeLocal(STORAGE.submittedAt, Date.now());
      setFormStatus("success");
      trackEvent("popup_submitted", { leadId: data.lead?.id ?? "" });
      setTimeout(() => closePopup("auto_after_submit"), 1200);
    } catch {
      setErrorMsg("Erro de conexão. Tente novamente.");
      setFormStatus("error");
    }
  }

  if (!config || !open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rg-popup-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => closePopup("backdrop")}
        aria-hidden="true"
      />

      <div className="relative bg-[var(--color-surface)] rounded-[var(--radius-xl)] p-8 w-full max-w-md shadow-[var(--shadow-lg)] border border-[var(--border)] space-y-5">
        <button
          type="button"
          onClick={() => closePopup("button")}
          aria-label="Fechar popup"
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-muted-raw)] hover:text-[var(--foreground)] hover:bg-black/10 transition-colors text-lg"
        >
          ×
        </button>

        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[var(--primary)]/10 text-[var(--primary)]">
          Oferta especial
        </span>

        <div>
          <h2
            id="rg-popup-title"
            className="text-xl font-bold text-[var(--foreground)] mb-2"
          >
            {config.title}
          </h2>
          <p className="text-sm text-[var(--color-muted-raw)] leading-relaxed">
            {config.description}
          </p>
        </div>

        {formStatus === "success" ? (
          <p className="text-sm font-medium text-green-500 bg-green-500/10 rounded-[var(--radius-md)] px-4 py-3">
            {config.successMessage}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            {config.enableName && (
              <input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                className="w-full px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--color-muted-raw)] outline-none focus:ring-2 focus:ring-[var(--primary)]/30 transition"
              />
            )}
            {config.enableEmail && (
              <input
                type="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={160}
                className="w-full px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--color-muted-raw)] outline-none focus:ring-2 focus:ring-[var(--primary)]/30 transition"
              />
            )}
            {config.enablePhone && (
              <input
                type="tel"
                placeholder="Telefone (opcional)"
                value={phone}
                onChange={(e) => {
                  maskPhone(e);
                  setPhone(e.target.value);
                }}
                maxLength={20}
                className="w-full px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-surface-2)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--color-muted-raw)] outline-none focus:ring-2 focus:ring-[var(--primary)]/30 transition"
              />
            )}

            {formStatus === "error" && (
              <p className="text-xs text-red-500">{errorMsg}</p>
            )}

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="submit"
                disabled={formStatus === "loading"}
                className="w-full inline-flex items-center justify-center px-6 py-3 rounded-full font-semibold text-sm bg-[var(--primary)] text-white hover:bg-[var(--color-primary-strong)] disabled:opacity-60 transition-colors"
              >
                {formStatus === "loading" ? "Enviando..." : config.buttonText}
              </button>
              <button
                type="button"
                onClick={() => closePopup("cancel")}
                className="w-full text-center text-sm text-[var(--color-muted-raw)] hover:text-[var(--foreground)] transition-colors py-1"
              >
                {config.closeText}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
