import type { ReactNode } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export const developerPageClassName =
  "w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8";

export const developerCardClassName =
  "rounded-[28px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.8)_0%,rgba(241,245,249,0.94)_100%)] p-5 shadow-[0_18px_44px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-6";

export const developerInputClassName =
  "w-full rounded-2xl border border-[var(--border)]/70 bg-white/82 px-4 py-3.5 text-sm text-[var(--foreground)] placeholder:text-[var(--color-muted-raw)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] outline-none transition-all duration-200 focus:border-[var(--primary)]/30 focus:bg-white focus:ring-4 focus:ring-[var(--primary)]/10";

export const developerPrimaryButtonClassName =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_44px_rgba(29,78,216,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-primary-strong)] disabled:cursor-not-allowed disabled:opacity-60";

export const developerSecondaryButtonClassName =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-white/82 px-5 py-3 text-sm font-medium text-[var(--foreground)] transition-all hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60";

export const developerGhostButtonClassName =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-transparent bg-white/70 px-5 py-3 text-sm font-medium text-[var(--foreground)] transition-all hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60";

export const developerDangerButtonClassName =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/8 px-5 py-3 text-sm font-medium text-red-600 transition-all hover:-translate-y-0.5 hover:bg-red-500/12 disabled:cursor-not-allowed disabled:opacity-60";

export const developerSplitLayoutClassName =
  "mt-6 grid gap-6 xl:grid-cols-[minmax(320px,430px)_minmax(0,1fr)]";

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
    <section className="relative overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.78)_0%,rgba(241,245,249,0.94)_100%)] px-5 py-6 shadow-[0_20px_50px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:px-6 sm:py-7 lg:px-8 lg:py-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_16%,rgba(29,78,216,0.11),transparent_24%),radial-gradient(circle_at_84%_14%,rgba(6,182,212,0.1),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(29,78,216,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(29,78,216,0.08)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/18 to-transparent" />

      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="max-w-[860px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
            {eyebrow}
          </p>
          <h1 className="mt-4 text-[clamp(2.2rem,4vw,4.1rem)] font-bold leading-[0.96] tracking-[-0.06em] text-[var(--foreground)]">
            {title}
          </h1>
          {description ? (
            <p className="mt-4 max-w-[68ch] text-sm leading-7 text-[var(--color-muted-raw)] sm:text-base">
              {description}
            </p>
          ) : null}
        </div>

        {stats.length > 0 || actions ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[22px] border border-white/80 bg-white/78 px-4 py-3 shadow-[0_16px_34px_rgba(15,23,42,0.05)] backdrop-blur-sm"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-raw)]">
                  {stat.label}
                </div>
                <div className="mt-2 text-3xl font-bold tracking-[-0.06em] text-[var(--foreground)]">
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
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div data-admin-scroll className={cn("max-h-[680px] overflow-y-auto pr-1", className)}>
      {children}
    </div>
  );
}

export function DeveloperSectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm leading-7 text-[var(--color-muted-raw)]">{description}</p>
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
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
        {label}
        {required ? <span className="ml-1 text-[var(--primary)]">*</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-2 block text-xs leading-6 text-[var(--color-muted-raw)]">{hint}</span> : null}
    </label>
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

export function DeveloperLoadMore({
  shown,
  total,
  onClick,
  onShowAll,
  loading = false,
  buttonText = "Carregar mais",
}: {
  shown: number;
  total: number;
  onClick: () => void;
  onShowAll?: () => void;
  loading?: boolean;
  buttonText?: string;
}) {
  if (shown >= total) return null;

  return (
    <div className="mt-5 flex flex-col items-center gap-3 border-t border-[var(--border)]/80 pt-5">
      <p className="text-center text-xs font-medium uppercase tracking-[0.18em] text-[var(--color-muted-raw)]">
        Mostrando {shown} de {total}
      </p>
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onClick}
          disabled={loading}
          className={cn(
            developerSecondaryButtonClassName,
            "min-w-[180px] rounded-full border-[var(--border)]/90 bg-white/78 px-6 shadow-[0_14px_30px_rgba(15,23,42,0.05)]"
          )}
        >
          <CaretDown size={16} weight="bold" />
          {loading ? "Carregando..." : buttonText}
        </button>
        {onShowAll ? (
          <button
            type="button"
            onClick={onShowAll}
            className={cn(
              developerGhostButtonClassName,
              "min-w-[150px] rounded-full border border-[var(--border)]/70 bg-transparent px-5"
            )}
          >
            Mostrar tudo
          </button>
        ) : null}
      </div>
    </div>
  );
}
