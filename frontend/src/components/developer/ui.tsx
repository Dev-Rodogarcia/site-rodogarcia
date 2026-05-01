"use client";

import { useState, useRef, useEffect, type HTMLAttributes, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CaretDown, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export const developerPageClassName =
  "w-full px-3 py-4 sm:px-4 sm:py-5 lg:px-6 lg:py-6";

export const developerCardClassName =
  "rounded-lg border border-[var(--border)] bg-white/[0.9] p-4 shadow-[0_8px_22px_rgba(15,23,42,0.035)] backdrop-blur-xl sm:p-5";

export const developerInputClassName =
  "w-full rounded-lg border border-[var(--border)]/80 bg-white px-3 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--color-muted-raw)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] outline-none transition-all duration-200 focus:border-[var(--primary)]/35 focus:bg-white focus:ring-4 focus:ring-[var(--primary)]/10";

export const developerPrimaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white shadow-[0_6px_16px_rgba(29,78,216,0.22),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(29,78,216,0.3)] hover:bg-[var(--color-primary-strong)] active:scale-95 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:active:scale-100";

export const developerSecondaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(15,23,42,0.08)] hover:border-slate-300 hover:text-slate-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:active:scale-100";

export const developerGhostButtonClassName =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-transparent bg-slate-100/60 px-4 py-2 text-sm font-bold text-slate-600 transition-all duration-300 hover:bg-slate-200/80 hover:text-slate-900 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:active:scale-100";

export const developerDangerButtonClassName =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(239,68,68,0.15)] hover:bg-red-100 hover:border-red-500/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:active:scale-100";

export const developerSplitLayoutClassName =
  "mt-5 grid gap-5 xl:grid-cols-[minmax(420px,640px)_minmax(0,1fr)]";

interface DeveloperHeroStat {
  label: string;
  value: ReactNode;
}

interface DeveloperHeroProps {
  eyebrow: string;
  title: string;
  description?: string;
  stats?: DeveloperHeroStat[];
  actions?: ReactNode;
}

export function DeveloperPage({ children }: { children: ReactNode }) {
  return <div className={developerPageClassName}>{children}</div>;
}

export function DeveloperHero({
  eyebrow,
  title,
  description,
  stats = [],
  actions,
}: DeveloperHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-lg border border-[var(--border)] bg-white/90 px-4 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.045)] backdrop-blur-xl sm:px-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/20 to-transparent" />

      <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="max-w-[860px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-[clamp(1.45rem,2vw,2.1rem)] font-bold leading-[1.04] tracking-[-0.03em] text-[var(--foreground)]">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-[68ch] text-sm leading-6 text-[var(--color-muted-raw)]">
              {description}
            </p>
          ) : null}
        </div>

        {stats.length > 0 || actions ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 shadow-[0_8px_18px_rgba(15,23,42,0.035)]"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-raw)]">
                  {stat.label}
                </div>
                <div className="mt-1 text-xl font-bold tracking-[-0.03em] text-[var(--foreground)]">
                  {stat.value}
                </div>
              </div>
            ))}
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function DeveloperCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn(developerCardClassName, className)}>{children}</section>;
}

export function DeveloperListViewport({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative max-h-[620px] overflow-y-auto overscroll-contain pr-1",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DeveloperSectionHeading({
  eyebrow,
  title,
  description,
  action,
  tooltip,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  tooltip?: string;
}) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
            {eyebrow}
          </p>
        ) : null}
        <div className="mt-1 flex items-center gap-2">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-[var(--foreground)]">
            {title}
          </h2>
          {tooltip ? <DeveloperTooltip content={tooltip} /> : null}
        </div>
        {description ? (
          <p className="mt-1 text-sm leading-6 text-[var(--color-muted-raw)]">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function DeveloperField({
  label,
  hint,
  required,
  children,
  className,
  tooltip,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  tooltip?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-[var(--foreground)]">
        <span>
          {label}
          {required ? <span className="ml-1 text-[var(--primary)]">*</span> : null}
        </span>
        {tooltip ? <DeveloperTooltip content={tooltip} /> : null}
      </span>
      {children}
      {hint ? <span className="mt-2 block text-xs leading-6 text-[var(--color-muted-raw)]">{hint}</span> : null}
    </label>
  );
}

export function DeveloperTooltip({ content }: { content: string }) {
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function computeCoords() {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipW = 260;
    const tooltipH = 72; // estimativa
    const gap = 8;

    let left = rect.right + gap;
    let top = rect.top;

    // inverte para esquerda se passar da borda
    if (left + tooltipW > window.innerWidth - 12) {
      left = rect.left - tooltipW - gap;
    }
    // inverte para cima se passar da borda inferior
    if (top + tooltipH > window.innerHeight - 12) {
      top = rect.bottom - tooltipH;
    }

    setCoords({ top, left });
  }

  function handleMouseEnter() {
    computeCoords();
    setVisible(true);
  }

  function handleFocus() {
    computeCoords();
    setVisible(true);
  }

  const tooltip = (
    <span
      role="tooltip"
      className="pointer-events-none fixed w-[260px] rounded-lg border border-slate-200 bg-slate-950 px-3 py-2 text-xs font-medium leading-5 text-white shadow-xl transition-opacity duration-150"
      style={{
        zIndex: 9999,
        top: coords.top,
        left: coords.left,
        opacity: visible ? 1 : 0,
      }}
    >
      {content}
    </span>
  );

  return (
    <span className="relative inline-flex align-middle">
      <span
        ref={triggerRef}
        aria-describedby="dev-tooltip"
        tabIndex={0}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setVisible(false)}
        onFocus={handleFocus}
        onBlur={() => setVisible(false)}
        className="inline-flex h-4 w-4 cursor-default items-center justify-center rounded-full border border-slate-300 bg-white text-[10px] font-bold leading-none text-slate-400 outline-none transition-colors hover:border-slate-400 hover:text-slate-600 focus-visible:ring-2 focus-visible:ring-[var(--primary)]/30"
      >
        ?
      </span>
      {mounted ? createPortal(tooltip, document.body) : null}
    </span>
  );
}

export function DeveloperMessage({
  tone,
  children,
}: {
  tone: "success" | "error" | "info";
  children: ReactNode;
}) {
  const className =
    tone === "success"
      ? "border-emerald-500/16 bg-emerald-500/8 text-emerald-600"
      : tone === "error"
        ? "border-red-500/16 bg-red-500/8 text-red-500"
        : "border-[var(--border)] bg-white/72 text-[var(--color-muted-raw)]";

  return <p className={cn("rounded-2xl border px-4 py-3 text-sm", className)}>{children}</p>;
}

export function DeveloperEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <DeveloperCard className="text-center">
      <p className="text-base font-medium text-[var(--foreground)]">{title}</p>
      <p className="mt-2 text-sm leading-7 text-[var(--color-muted-raw)]">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </DeveloperCard>
  );
}

export function DeveloperStatusPill({
  active,
  activeLabel = "Ativo",
  inactiveLabel = "Inativo",
}: {
  active: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
        active
          ? "bg-emerald-500/10 text-emerald-600"
          : "bg-[var(--color-surface-2)] text-[var(--color-muted-raw)]"
      )}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}



export function DeveloperCarouselPagination({
  currentPage,
  totalPages,
  onNext,
  onPrev,
}: {
  currentPage: number;
  totalPages: number;
  onNext: () => void;
  onPrev: () => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex items-center justify-between border-t border-[var(--border)]/80 pt-6">
      <button
        type="button"
        onClick={onPrev}
        disabled={currentPage === 0}
        className={cn(
          developerSecondaryButtonClassName,
          "min-w-[110px] rounded-full border-[var(--border)]/90 bg-white/78 px-5 shadow-[0_14px_30px_rgba(15,23,42,0.05)]"
        )}
      >
        <CaretLeft size={16} weight="bold" />
        Voltar
      </button>

      <div className="flex items-center gap-2">
        {Array.from({ length: totalPages }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "h-2 w-2 rounded-full transition-all duration-500",
              currentPage === index ? "w-6 bg-[var(--primary)]" : "bg-[var(--border)]"
            )}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={currentPage === totalPages - 1}
        className={cn(
          developerSecondaryButtonClassName,
          "min-w-[110px] rounded-full border-[var(--border)]/90 bg-white/78 px-5 shadow-[0_14px_30px_rgba(15,23,42,0.05)] flex-row-reverse"
        )}
      >
        <CaretRight size={16} weight="bold" />
        Próximo
      </button>
    </div>
  );
}
