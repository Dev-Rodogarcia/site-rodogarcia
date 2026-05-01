import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

export interface PageAction {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "ghost";
  external?: boolean;
}

interface StatItem {
  value: string;
  label: string;
}

interface PageHeroProps {
  eyebrow: string;
  title: string;
  titleLines?: [string, string?];
  description: string;
  pills?: string[];
  primaryAction?: PageAction;
  secondaryAction?: PageAction;
  stats?: StatItem[];
  supportingCopy?: string;
  children?: ReactNode;
  className?: string;
  tone?: "default" | "soft" | "dark";
  align?: "left" | "center";
}

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  theme?: "light" | "dark";
}

interface SurfaceSectionProps {
  children: ReactNode;
  className?: string;
  tone?: "default" | "soft" | "dark";
  contentClassName?: string;
}

interface SurfaceCardProps {
  children: ReactNode;
  className?: string;
  tone?: "default" | "soft" | "dark";
}

interface PageCtaBandProps {
  eyebrow: string;
  title: string;
  description: string;
  primaryAction: PageAction;
  secondaryAction?: PageAction;
  benefits?: string[];
  tone?: "default" | "dark";
}

interface HeroMediaCardProps {
  src: string;
  alt: string;
  kind?: "image" | "video";
  caption?: string;
  className?: string;
}

const SECTION_SPACING = "py-12 sm:py-16 lg:py-20";

export function PageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-x-clip pb-14 sm:pb-16 lg:pb-20",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_14%_12%,rgba(29,78,216,0.12),transparent_26%),radial-gradient(circle_at_85%_10%,rgba(6,182,212,0.12),transparent_24%)]" />
      {children}
    </div>
  );
}

export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1440px] px-5 sm:px-8", className)}>
      {children}
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  titleLines,
  description,
  pills = [],
  primaryAction,
  secondaryAction,
  stats,
  supportingCopy,
  children,
  className,
  tone = "default",
  align = "left",
}: PageHeroProps) {
  const isDark = tone === "dark";
  const isCenter = align === "center";
  const isCenteredDarkHero = isDark && isCenter && !children;

  if (isCenteredDarkHero) {
    return (
      <section
        className={cn(
          "relative overflow-hidden bg-slate-950 pt-20 sm:pt-24 lg:pt-28",
          className
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.15),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:32px_32px]" />

        <PageContainer>
          <div className="mx-auto max-w-[920px] py-10 text-center sm:py-12 lg:py-16">
            <span className="inline-flex items-center rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200/80 backdrop-blur-sm">
              {eyebrow}
            </span>

            <h1 className="mx-auto mt-6 max-w-[14ch] text-[clamp(2.45rem,6.2vw,4.9rem)] font-bold leading-[0.92] tracking-[-0.05em] sm:max-w-[16ch] sm:tracking-[-0.06em]">
              {titleLines?.[0] ? (
                <span className="block bg-[linear-gradient(180deg,#a5f3fc_0%,#dbeafe_100%)] bg-clip-text text-transparent">
                  {titleLines[0]}
                </span>
              ) : null}
              <span className={cn("block text-white", titleLines?.[0] ? "mt-1" : "")}>
                {titleLines?.[1] ?? title}
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-[42rem] text-sm leading-7 text-white/68 sm:text-base">
              {description}
            </p>

            {(primaryAction || secondaryAction) && (
              <div className="mt-8 flex justify-center">
                {primaryAction ? (
                  <ActionLink action={primaryAction} tone="dark" />
                ) : secondaryAction ? (
                  <ActionLink action={secondaryAction} tone="dark" />
                ) : null}
              </div>
            )}
          </div>
        </PageContainer>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "relative overflow-hidden pt-24 sm:pt-28 lg:pt-32",
        className
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0",
          isDark
            ? "bg-slate-950"
            : tone === "soft"
              ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.64)_0%,rgba(241,245,249,0.82)_70%,rgba(255,255,255,0)_100%)]"
              : "bg-[linear-gradient(180deg,rgba(248,251,255,0.78)_0%,rgba(238,243,249,0.42)_70%,rgba(255,255,255,0)_100%)]"
        )}
      />
      {isDark ? (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.15),transparent_60%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:32px_32px]" />
        </>
      ) : (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_14%_14%,rgba(29,78,216,0.12),transparent_24%),radial-gradient(circle_at_84%_12%,rgba(6,182,212,0.14),transparent_22%)]" />
      )}

      <PageContainer>
        <div className="relative">
          <div
            className={cn(
              "pointer-events-none absolute inset-x-0 top-8 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/18 to-transparent",
              isDark ? "opacity-60" : "opacity-100"
            )}
          />

          <div
            className={cn(
              "relative grid gap-10 pb-8 pt-8 lg:gap-14 lg:pb-12 lg:pt-12",
              children
                ? "lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.88fr)] lg:items-center"
                : "",
              isCenter && !children ? "justify-center" : ""
            )}
          >
            <div
              className={cn(
                "relative max-w-[780px]",
                isCenter ? "mx-auto text-center" : ""
              )}
            >
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] backdrop-blur-sm",
                  isDark
                    ? "border border-white/12 bg-white/8 text-white/82"
                    : "border border-[var(--border)] bg-white/72 text-[var(--primary)]"
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    isDark ? "bg-sky-300" : "bg-[var(--primary)]"
                  )}
                />
                {eyebrow}
              </span>

              <h1
                className={cn(
                  isCenter
                    ? "mx-auto mt-6 max-w-[16ch] text-[clamp(3rem,8vw,6rem)] font-bold leading-[0.9] tracking-[-0.05em] sm:max-w-[18ch] sm:tracking-[-0.07em]"
                    : "mt-5 max-w-[12ch] text-[clamp(3rem,6vw,5.8rem)] font-bold leading-[0.92] tracking-[-0.07em]",
                  isDark ? "text-white" : "text-[var(--foreground)]"
                )}
              >
                {title}
              </h1>

              <p
                className={cn(
                  isCenter
                    ? "mx-auto mt-5 max-w-[42rem] text-sm leading-7 sm:text-base"
                    : "mt-5 max-w-[60ch] text-sm leading-7 sm:text-base",
                  isDark ? "text-white/68" : "text-[var(--color-muted-raw)]"
                )}
              >
                {description}
              </p>

              {pills.length > 0 ? (
                <ul
                  className={cn(
                    "mt-7 flex flex-wrap gap-2.5",
                    isCenter ? "justify-center" : ""
                  )}
                >
                  {pills.map((pill) => (
                    <li
                      key={pill}
                      className={cn(
                        "inline-flex items-center rounded-full px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] backdrop-blur-sm",
                        isDark
                          ? "border border-white/12 bg-white/6 text-white/72"
                          : "border border-[var(--border)] bg-white/80 text-[var(--foreground)]/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
                      )}
                    >
                      {pill}
                    </li>
                  ))}
                </ul>
              ) : null}

              {(primaryAction || secondaryAction) && (
                <div
                  className={cn(
                    primaryAction && secondaryAction
                      ? "mt-8 grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:flex-row sm:flex-wrap"
                      : "mt-8 flex gap-3",
                    isCenter ? "justify-center" : ""
                  )}
                >
                  {primaryAction ? (
                    <ActionLink
                      action={primaryAction}
                      tone={isDark ? "dark" : "light"}
                      className={primaryAction && secondaryAction ? "w-full min-w-0 sm:w-auto" : ""}
                    />
                  ) : null}
                  {secondaryAction ? (
                    <ActionLink
                      action={secondaryAction}
                      tone={isDark ? "dark" : "light"}
                      className={primaryAction && secondaryAction ? "w-full min-w-0 sm:w-auto" : ""}
                    />
                  ) : null}
                </div>
              )}

              {stats && stats.length > 0 ? (
                <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {stats.map((item) => (
                    <div
                      key={`${item.value}-${item.label}`}
                      className={cn(
                        "rounded-[26px] px-4 py-4 shadow-[0_16px_36px_rgba(15,23,42,0.05)] backdrop-blur-xl",
                        isDark
                          ? "border border-white/10 bg-white/6"
                          : "border border-white/70 bg-white/72"
                      )}
                    >
                      <div
                        className={cn(
                          "text-[1.7rem] font-bold tracking-[-0.06em]",
                          isDark ? "text-white" : "text-[var(--foreground)]"
                        )}
                      >
                        {item.value}
                      </div>
                      <div
                        className={cn(
                          "mt-1 text-[11px] uppercase tracking-[0.18em]",
                          isDark ? "text-white/55" : "text-[var(--color-muted-raw)]"
                        )}
                      >
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {supportingCopy ? (
                <p
                  className={cn(
                    isCenter
                      ? "mx-auto mt-7 max-w-[60ch] text-center text-sm leading-7"
                      : "mt-7 max-w-[60ch] text-sm leading-7",
                    isDark ? "text-white/58" : "text-[var(--color-muted-raw)]"
                  )}
                >
                  {supportingCopy}
                </p>
              ) : null}
            </div>

            {children ? <div className="relative">{children}</div> : null}
          </div>
        </div>
      </PageContainer>
    </section>
  );
}

export function PageSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn(SECTION_SPACING, className)}>{children}</section>;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  theme = "light",
}: SectionHeaderProps) {
  const isDark = theme === "dark";

  return (
    <div
      className={cn(
        "max-w-[780px]",
        align === "center" ? "mx-auto text-center" : "",
        className
      )}
    >
      <span
        className={cn(
          "text-[11px] font-semibold uppercase tracking-[0.24em]",
          isDark ? "text-white/62" : "text-[var(--primary)]"
        )}
      >
        {eyebrow}
      </span>
      <h2
        className={cn(
          "mt-3 text-[clamp(1.5rem,2.4vw,2.2rem)] font-bold leading-[1.2] tracking-[-0.03em]",
          isDark ? "text-white" : "text-[var(--foreground)]"
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-4 text-sm leading-7 sm:text-base",
            isDark ? "text-white/66" : "text-[var(--color-muted-raw)]"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function SurfaceSection({
  children,
  className,
  tone = "soft",
  contentClassName,
}: SurfaceSectionProps) {
  const toneClassName =
    tone === "dark"
      ? "bg-[linear-gradient(180deg,#0f172a_0%,#131f38_100%)]"
      : tone === "default"
        ? "bg-[linear-gradient(180deg,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.9)_100%)]"
        : "bg-[linear-gradient(180deg,rgba(255,255,255,0.56)_0%,rgba(241,245,249,0.92)_50%,rgba(255,255,255,0.62)_100%)]";

  return (
    <section className={cn("relative overflow-hidden", SECTION_SPACING, className)}>
      <div className={cn("pointer-events-none absolute inset-0", toneClassName)} />
      <div
        className={cn(
          "pointer-events-none absolute inset-0",
          tone === "dark"
            ? "bg-[radial-gradient(circle_at_18%_18%,rgba(56,189,248,0.16),transparent_22%),radial-gradient(circle_at_84%_26%,rgba(29,78,216,0.22),transparent_24%)]"
            : "bg-[radial-gradient(circle_at_12%_18%,rgba(29,78,216,0.08),transparent_20%),radial-gradient(circle_at_84%_24%,rgba(6,182,212,0.1),transparent_22%)]"
        )}
      />
      <div
        className={cn(
          "pointer-events-none absolute inset-0",
          tone === "dark"
            ? "opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:36px_36px]"
            : "opacity-[0.22] [background-image:linear-gradient(rgba(29,78,216,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(29,78,216,0.08)_1px,transparent_1px)] [background-size:34px_34px]"
        )}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/16 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/10 to-transparent" />

      <PageContainer>
        <div className={cn("relative", contentClassName)}>{children}</div>
      </PageContainer>
    </section>
  );
}

export function SurfaceCard({
  children,
  className,
  tone = "default",
}: SurfaceCardProps) {
  const toneClassName =
    tone === "dark"
      ? "border-white/10 bg-white/6 text-white shadow-[0_22px_54px_rgba(2,6,23,0.28)]"
      : tone === "soft"
        ? "border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.76)_0%,rgba(241,245,249,0.92)_100%)] shadow-[0_18px_44px_rgba(15,23,42,0.06)]"
        : "border-white/80 bg-white/80 shadow-[0_18px_46px_rgba(15,23,42,0.08)]";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[30px] border p-5 backdrop-blur-xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 sm:p-6",
        toneClassName,
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
      <div className="relative">{children}</div>
    </div>
  );
}

export function PageCtaBand({
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  benefits = [],
  tone = "default",
}: PageCtaBandProps) {
  const isDark = tone === "dark";

  return (
    <section
      className={cn(
        "relative overflow-hidden py-20 sm:py-32",
        isDark ? "bg-[var(--foreground)]" : ""
      )}
    >
      {isDark ? (
        <>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(56,189,248,0.14),transparent_28%),radial-gradient(circle_at_84%_18%,rgba(29,78,216,0.18),transparent_28%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.32)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.24)_1px,transparent_1px)] [background-size:36px_36px]" />
        </>
      ) : null}
      <PageContainer>
        <div className="relative mx-auto flex max-w-xl flex-col items-center text-center">
          <span
            className={cn(
              "mb-5 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em]",
              isDark ? "text-sky-200/78" : "text-[var(--primary)]"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                isDark ? "bg-sky-300" : "bg-[var(--primary)]"
              )}
            />
            {eyebrow}
          </span>

          <h2
            className={cn(
              "text-[clamp(2rem,3.6vw,3.2rem)] font-extrabold leading-[1.08] tracking-[-0.04em]",
              isDark ? "text-white" : "text-[var(--foreground)]"
            )}
          >
            {title}
          </h2>

          <div
            className={cn(
              "mx-auto mt-6 h-px w-12 bg-gradient-to-r from-transparent to-transparent",
              isDark ? "via-sky-300/42" : "via-[var(--primary)]/40"
            )}
          />

          <p
            className={cn(
              "mt-5 max-w-[38ch] text-[15px] leading-7",
              isDark ? "text-white/64" : "text-slate-500"
            )}
          >
            {description}
          </p>

          {benefits.length > 0 ? (
            <ul className="mt-7 flex flex-wrap justify-center gap-2">
              {benefits.map((benefit) => (
                <li
                  key={benefit}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold",
                    isDark
                      ? "border border-white/10 bg-white/8 text-white/74"
                      : "border border-[var(--border)] bg-white/78 text-[var(--foreground)]/72"
                  )}
                >
                  <CheckCircle
                    size={14}
                    weight="fill"
                    className={isDark ? "text-sky-300" : "text-[var(--primary)]"}
                  />
                  {benefit}
                </li>
              ))}
            </ul>
          ) : null}

          <div
            className={cn(
              "mt-10 w-full",
              secondaryAction
                ? "grid grid-cols-2 gap-3 sm:flex sm:items-center sm:justify-center sm:gap-5"
                : "flex items-center justify-center"
            )}
          >
            <Link
              href={primaryAction.href}
              {...(primaryAction.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="group inline-flex min-h-[64px] w-full min-w-0 items-center justify-center rounded-full bg-[var(--primary)] px-4 text-[15px] font-extrabold tracking-tight text-white shadow-[0_12px_32px_rgba(2,132,199,0.25)] transition-all duration-200 hover:-translate-y-1 hover:bg-[var(--primary)]/90 hover:shadow-[0_20px_48px_rgba(2,132,199,0.35)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--primary)]/30 sm:w-auto sm:min-w-[320px] sm:px-10"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="min-w-0 truncate">{primaryAction.label}</span>
                <svg
                  className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>

            {secondaryAction ? (
              <Link
                href={secondaryAction.href}
                  {...(secondaryAction.external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                className="inline-flex min-h-[64px] w-full min-w-0 items-center justify-center rounded-full bg-slate-900 px-4 text-[15px] font-bold tracking-tight text-white shadow-[0_12px_32px_rgba(15,23,42,0.15)] transition-all duration-200 hover:-translate-y-1 hover:bg-slate-800 hover:shadow-[0_20px_48px_rgba(15,23,42,0.25)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/30 sm:w-auto sm:min-w-[240px] sm:px-10"
              >
                <span className="min-w-0 truncate">{secondaryAction.label}</span>
              </Link>
            ) : null}
          </div>
        </div>
      </PageContainer>
    </section>
  );
}


export function HeroMediaCard({
  src,
  alt,
  kind = "image",
  caption,
  className,
}: HeroMediaCardProps) {
  return (
    <div className={cn("relative", className)}>
      <div className="pointer-events-none absolute -left-6 top-6 h-28 w-28 rounded-full bg-[var(--primary)]/14 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-6 right-0 h-24 w-24 rounded-full bg-sky-300/18 blur-3xl" />

      <div className="relative overflow-hidden rounded-[34px] border border-white/70 bg-[#dce7f7] shadow-[0_24px_64px_rgba(15,23,42,0.12)]">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(2,6,23,0.08)_100%)]" />
        {kind === "video" ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="aspect-[4/3] w-full object-cover"
          >
            <source src={src} type="video/mp4" />
          </video>
        ) : (
          <img
            src={src}
            alt={alt}
            className="aspect-[4/3] w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        )}

        {caption ? (
          <div className="relative border-t border-black/6 bg-white/82 px-5 py-4 backdrop-blur-md">
            <p className="text-sm leading-6 text-[var(--color-muted-raw)]">{caption}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function ActionLink({
  action,
  className,
  tone = "light",
}: {
  action: PageAction;
  className?: string;
  tone?: "light" | "dark";
}) {
  const isExternal =
    action.external ||
    action.href.startsWith("http") ||
    action.href.startsWith("mailto:") ||
    action.href.startsWith("tel:");

  const sharedClassName =
    "inline-flex min-h-14 max-w-full min-w-0 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 sm:px-6";
  const variantClassName =
    action.variant === "secondary"
      ? tone === "dark"
        ? "border border-white/12 bg-white/8 text-white hover:bg-white/12 focus-visible:ring-white/12"
        : "border border-[var(--border)] bg-white/78 text-[var(--foreground)] hover:bg-[var(--color-surface-2)] focus-visible:ring-[var(--primary)]/12"
      : action.variant === "ghost"
        ? tone === "dark"
          ? "bg-transparent text-white/82 hover:bg-white/8 focus-visible:ring-white/12"
          : "bg-transparent text-[var(--foreground)] hover:bg-black/5 focus-visible:ring-[var(--primary)]/12"
        : tone === "dark"
          ? "bg-white text-[var(--foreground)] shadow-[0_18px_40px_rgba(2,6,23,0.28)] hover:bg-slate-100 focus-visible:ring-white/16"
          : "bg-[var(--primary)] text-white shadow-[0_18px_40px_rgba(29,78,216,0.22)] hover:bg-[var(--color-primary-strong)] focus-visible:ring-[var(--primary)]/24";

  const content = (
    <>
      <span className="min-w-0 truncate">{action.label}</span>
      {action.variant === "secondary" ? (
        <ArrowUpRight size={18} weight="bold" className="shrink-0" />
      ) : (
        <ArrowRight size={18} weight="bold" className="shrink-0" />
      )}
    </>
  );

  if (isExternal) {
    return (
      <a
        href={action.href}
        target={action.href.startsWith("http") ? "_blank" : undefined}
        rel={action.href.startsWith("http") ? "noopener noreferrer" : undefined}
        className={cn(sharedClassName, variantClassName, className)}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={action.href} className={cn(sharedClassName, variantClassName, className)}>
      {content}
    </Link>
  );
}
