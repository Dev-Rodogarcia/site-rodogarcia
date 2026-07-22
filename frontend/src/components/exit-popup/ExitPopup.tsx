"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X } from "@phosphor-icons/react";
import { usePhoneMask } from "@/hooks/usePhoneMask";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { api, isAdminRoute, isAuthRoute } from "@/lib/routes";
import { getStoredConsent, type StoredConsent } from "@/components/analytics/ConsentBanner";

interface PopupConfig {
  title: string;
  description: string;
  enableName: boolean;
  enableEmail: boolean;
  enablePhone: boolean;
  buttonText: string;
  closeText: string;
  successMessage: string;
  badgeText?: string;
  image?: string;
  delaySeconds: number;
  cooldownHours: number;
  maxShowsPerSession: number;
  enabled: boolean;
  mobileScrollTrigger?: boolean;
  mobileBackButtonTrigger?: boolean;
  desktop?: {
    title?: string;
    description?: string;
    image?: string;
  };
  mobile?: {
    title?: string;
    description?: string;
    image?: string;
    sheetTitle?: string;
  };
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
  badgeText: "Oferta especial",
  image: "",
  delaySeconds: 10,
  cooldownHours: 24,
  maxShowsPerSession: 1,
  enabled: true,
  mobileScrollTrigger: true,
  mobileBackButtonTrigger: true,
  desktop: {
    title: "Antes de sair...",
    description: "Receba uma proposta personalizada para sua operação logística.",
    image: "",
  },
  mobile: {
    title: "Fale com a Rodogarcia",
    description: "Deixe seu contato para retorno rápido pelo celular.",
    image: "",
    sheetTitle: "Atendimento rápido",
  },
};

const STORAGE = {
  lastShownAt: "rg_exit_popup_last_shown_at",
  submittedAt: "rg_exit_popup_submitted_at",
};
const SESSION_SHOWS = "rg_exit_popup_shows_in_session";
const POPUP_SESSION_KEY = "rg_popup_session_id";

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
  const previewViewport = new URLSearchParams(window.location.search).get("viewport");
  if (previewViewport === "mobile") return true;
  if (previewViewport === "desktop" || previewViewport === "tablet") return false;
  const touch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const narrow = window.matchMedia("(max-width: 900px)").matches;
  return touch && narrow;
}

function isCmsPopupPreview() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("preview") === "cms" && params.get("popup-preview") === "1";
}

function getPopupSessionId() {
  try {
    const existing = sessionStorage.getItem(POPUP_SESSION_KEY);
    if (existing) return existing;
    const id = `popup_${Date.now()}_${Math.random().toString(16).slice(2, 10)}`;
    sessionStorage.setItem(POPUP_SESSION_KEY, id);
    return id;
  } catch {
    return `popup_${Date.now()}`;
  }
}

function trackEvent(name: string, meta: Record<string, unknown> = {}) {
  if (isCmsPopupPreview()) return;
  const payload = JSON.stringify({
    event: name,
    source: "exit-intent-popup",
    pagePath: window.location.pathname,
    sessionId: getPopupSessionId(),
    mobile: isMobileDevice(),
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
  const [rendered, setRendered] = useState(false);
  const [closing, setClosing] = useState(false);
  const [formStatus, setFormStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [marketingAllowed, setMarketingAllowed] = useState(false);
  const { maskPhone } = usePhoneMask();

  const hasShown = useRef(false);
  const loadedAt = useRef(Date.now());
  const isMobile = useRef(false);
  const lastDesktopY = useRef<number | null>(null);
  const cameFromBelow = useRef(false);
  const closeTimer = useRef<number | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const closePopup = useCallback((closeType: string) => {
    if (closing) return;
    if (closeType !== "auto_after_submit" && formStatus !== "success") {
      trackEvent("popup_ignored", { closeType });
    }
    trackEvent("popup_closed", { closeType });
    setClosing(true);
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    const shouldReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    closeTimer.current = window.setTimeout(
      () => {
        setOpen(false);
        setRendered(false);
        setClosing(false);
      },
      shouldReduceMotion ? 0 : 180
    );
  }, [closing, formStatus]);

  const handleEscape = useCallback(() => closePopup("esc"), [closePopup]);

  useEffect(() => {
    const syncConsent = (event?: Event) => {
      const detail = event instanceof CustomEvent ? (event.detail as StoredConsent | undefined) : undefined;
      const consent = detail ?? getStoredConsent();
      const allowed = consent?.categories.marketing === true;
      setMarketingAllowed(allowed);
      if (!allowed) {
        clearFrequency();
        setOpen(false);
        setRendered(false);
      }
    };
    syncConsent();
    window.addEventListener("rg:consent-updated", syncConsent);
    return () => window.removeEventListener("rg:consent-updated", syncConsent);
  }, []);

  useFocusTrap({
    active: open && rendered,
    containerRef: dialogRef,
    initialFocusRef: firstFieldRef,
    onEscape: handleEscape,
  });

  useEffect(() => {
    const path = window.location.pathname;
    if (isAdminRoute(path) || isAuthRoute(path)) return;

    const params = new URLSearchParams(window.location.search);
    const testMode = params.get("popup_test") === "1";
    const previewMode = isCmsPopupPreview();
    if (!marketingAllowed && !previewMode) return;

    fetch(api.popup.config)
      .then((r) => r.json())
      .then((data) => {
        const raw = (data as { config?: Partial<PopupConfig> }).config ?? {};
        const merged: PopupConfig = {
          ...DEFAULT_CONFIG,
          ...raw,
          desktop: { ...DEFAULT_CONFIG.desktop, ...(raw.desktop ?? {}) },
          mobile: { ...DEFAULT_CONFIG.mobile, ...(raw.mobile ?? {}) },
        };
        if (!merged.enabled && !previewMode) return;
        setConfig(merged);
        if (testMode || previewMode) {
          if (previewMode) {
            hasShown.current = true;
            setTimeout(() => {
              setRendered(true);
              setClosing(false);
              setOpen(true);
            }, 300);
            return;
          }
          clearFrequency();
          setTimeout(() => triggerShow(merged), 900);
        }
      })
      .catch(() => {
        setConfig(null);
      });
  }, [marketingAllowed]); // eslint-disable-line react-hooks/exhaustive-deps

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
      setRendered(true);
      setClosing(false);
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
    if (!config.mobileScrollTrigger) return;

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
    if (!config) return;
    if (!isMobile.current) return;
    if (!config.mobileBackButtonTrigger) return;
    const state = { rgPopupGuard: true };
    try {
      window.history.pushState(state, "", window.location.href);
    } catch {
      return;
    }
    function onPopState() {
      if (!config) return;
      triggerShow(config);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [config, triggerShow]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closePopup("esc");
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  function dispatchPopupFormTracking(status: "success" | "fail", reason = "") {
    window.dispatchEvent(
      new CustomEvent(status === "success" ? "rg:form-success" : "rg:form-fail", {
        detail: { form: "exit-intent-popup", reason },
      })
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!config) return;

    if (config.enableName && !name.trim()) {
      setErrorMsg("Informe seu nome.");
      setFormStatus("error");
      dispatchPopupFormTracking("fail", "validation_name");
      return;
    }
    if (config.enableEmail && !email.trim()) {
      setErrorMsg("Informe um e-mail válido.");
      setFormStatus("error");
      dispatchPopupFormTracking("fail", "validation_email");
      return;
    }
    if (config.enableEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMsg("Informe um e-mail válido.");
      setFormStatus("error");
      dispatchPopupFormTracking("fail", "validation_email");
      return;
    }
    if (config.enablePhone && phone.replace(/\D/g, "").length < 10) {
      setErrorMsg("Informe um telefone válido.");
      setFormStatus("error");
      dispatchPopupFormTracking("fail", "validation_phone");
      return;
    }

    setFormStatus("loading");
    setErrorMsg("");

    if (isCmsPopupPreview()) {
      setFormStatus("success");
      setTimeout(() => closePopup("auto_after_submit"), 1200);
      return;
    }

    try {
      const res = await fetch(api.popup.leads, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "exit-intent-popup",
        pagePath: window.location.pathname,
        sessionId: getPopupSessionId(),
        origin: isMobile.current ? "mobile" : "desktop",
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
        const reason = data.error ?? "Falha ao enviar dados.";
        setErrorMsg(reason);
        setFormStatus("error");
        dispatchPopupFormTracking("fail", reason);
        return;
      }
      writeLocal(STORAGE.submittedAt, Date.now());
      setFormStatus("success");
      dispatchPopupFormTracking("success");
      trackEvent("popup_submitted", { leadId: data.lead?.id ?? "" });
      setTimeout(() => closePopup("auto_after_submit"), 1200);
    } catch {
      const reason = "Erro de conexão. Tente novamente.";
      setErrorMsg(reason);
      setFormStatus("error");
      dispatchPopupFormTracking("fail", reason);
    }
  }

  if (!config || !rendered) return null;
  const mobile = isMobileDevice();
  const modeConfig = mobile ? config.mobile : config.desktop;
  const popupTitle = modeConfig?.title || config.title;
  const popupDescription = modeConfig?.description || config.description;
  const popupImage = modeConfig?.image || config.image;
  const popupBadge = mobile ? config.mobile?.sheetTitle || config.badgeText : config.badgeText;

  return (
    <div
      className={[
        "fixed inset-0 z-[9999] flex",
        mobile ? "items-end justify-center p-3 pb-0 sm:p-5" : "items-center justify-center p-4 sm:p-6",
      ].join(" ")}
    >
      <div
        className={[
          "absolute inset-0 bg-slate-950/68 backdrop-blur-md transition-opacity duration-200 motion-reduce:transition-none",
          closing ? "opacity-0" : "opacity-100",
        ].join(" ")}
        onClick={() => closePopup("backdrop")}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rg-popup-title"
        aria-describedby="rg-popup-description"
        tabIndex={-1}
        className={[
          "relative w-full overflow-hidden border border-[var(--border)] bg-[var(--color-surface)] shadow-[0_24px_60px_rgba(2,6,23,0.18)] backdrop-blur-md",
          "transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
          closing ? "translate-y-2 scale-[0.97] opacity-0" : "translate-y-0 scale-100 opacity-100",
          mobile
            ? "max-h-[92dvh] max-w-[680px] overflow-y-auto rounded-t-[22px] px-5 pb-5 pt-6 sm:rounded-[22px] sm:p-6"
            : "max-w-[520px] rounded-[22px] p-6 sm:p-7",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={() => closePopup("button")}
          aria-label="Fechar popup"
          ref={closeButtonRef}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--color-surface-strong)] text-[var(--color-muted-raw)] shadow-[0_8px_18px_rgba(15,23,42,0.06)] transition-colors duration-200 hover:bg-[var(--color-surface-2)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--primary)]/20"
        >
          <X size={18} weight="bold" aria-hidden="true" />
        </button>

        <div className="relative space-y-5">
          {popupImage ? (
            <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--color-surface-2)]">
              <img
                src={popupImage}
                alt=""
                className={`${mobile ? "h-32" : "h-40"} w-full object-cover`}
              />
            </div>
          ) : null}

          {popupBadge ? (
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--primary)]/14 bg-[var(--color-primary-soft)] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--primary)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" aria-hidden="true" />
              {popupBadge}
            </span>
          ) : null}

          <div className="pr-9">
          <h2
            id="rg-popup-title"
              className="text-[clamp(1.65rem,4vw,2.25rem)] font-extrabold leading-[1.02] tracking-[-0.04em] text-[var(--foreground)]"
          >
            {popupTitle}
          </h2>
            <p
              id="rg-popup-description"
              className="mt-3 text-[15px] leading-7 text-[var(--color-muted-raw)]"
            >
            {popupDescription}
          </p>
          </div>

        {formStatus === "success" ? (
            <p className="rounded-[18px] border border-emerald-500/18 bg-emerald-500/10 px-4 py-3 text-sm font-semibold leading-6 text-emerald-600">
            {config.successMessage}
          </p>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
            {config.enableName && (
              <input
                type="text"
                placeholder="Seu nome"
                  aria-label="Seu nome"
                  ref={firstFieldRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                  className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--color-surface-strong)] px-4 text-sm font-medium text-[var(--foreground)] outline-none transition-colors duration-200 placeholder:text-[var(--color-muted-raw)] hover:border-[var(--color-border-strong)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/20"
              />
            )}
            {config.enableEmail && (
              <input
                type="email"
                placeholder="Seu e-mail"
                  aria-label="Seu e-mail"
                  ref={!config.enableName ? firstFieldRef : undefined}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={160}
                  className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--color-surface-strong)] px-4 text-sm font-medium text-[var(--foreground)] outline-none transition-colors duration-200 placeholder:text-[var(--color-muted-raw)] hover:border-[var(--color-border-strong)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/20"
              />
            )}
            {config.enablePhone && (
              <input
                type="tel"
                placeholder="Seu telefone"
                  aria-label="Seu telefone"
                  ref={!config.enableName && !config.enableEmail ? firstFieldRef : undefined}
                value={phone}
                onChange={(e) => {
                  maskPhone(e);
                  setPhone(e.target.value);
                }}
                maxLength={20}
                  className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--color-surface-strong)] px-4 text-sm font-medium text-[var(--foreground)] outline-none transition-colors duration-200 placeholder:text-[var(--color-muted-raw)] hover:border-[var(--color-border-strong)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/20"
              />
            )}

            {formStatus === "error" && (
                <p className="rounded-[14px] border border-red-500/15 bg-red-500/10 px-3 py-2 text-xs font-semibold leading-5 text-red-500" aria-live="polite">
                  {errorMsg}
                </p>
            )}

              <div className="flex flex-col gap-2.5 pt-1">
              <button
                type="submit"
                disabled={formStatus === "loading"}
                  aria-busy={formStatus === "loading"}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[var(--primary)] px-6 py-3 text-sm font-bold text-white shadow-[0_12px_26px_rgba(29,78,216,0.24)] transition-colors duration-200 hover:bg-[var(--color-primary-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--primary)]/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              >
                {formStatus === "loading" ? "Enviando..." : config.buttonText}
              </button>
              <button
                type="button"
                onClick={() => closePopup("cancel")}
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--color-surface-strong)] px-5 py-2.5 text-sm font-bold text-[var(--color-foreground-soft)] transition-colors duration-200 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--primary)]/20"
              >
                {config.closeText}
              </button>
            </div>
          </form>
        )}
        </div>
      </div>
    </div>
  );
}
