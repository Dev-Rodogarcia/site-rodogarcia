"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import type { QuickAction } from "@/types/content";
import {
  Calculator,
  ChatCircleDots,
  Envelope,
  FilePdf,
  MapPin,
  MagnifyingGlass,
  Phone,
  Truck,
  WhatsappLogo,
  ArrowSquareOut,
  Headset,
  Package,
  Handshake,
  FileText,
} from "@phosphor-icons/react";

type IconComponent = ComponentType<{
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  className?: string;
  "aria-hidden"?: boolean;
}>;

const ICON_MAP: Record<string, IconComponent> = {
  FilePdf,
  Calculator,
  MagnifyingGlass,
  Truck,
  MapPin,
  WhatsappLogo,
  Phone,
  Envelope,
  ChatCircleDots,
  Headset,
  Package,
  Handshake,
  FileText,
  ArrowSquareOut,
};

interface QuickActionButtonProps {
  action: QuickAction;
  onModalClick?: (action: QuickAction) => void;
  disabled?: boolean;
  variant?: "card" | "icon" | "primary";
}

const actionSurfaceClass = [
  "group/btn relative isolate overflow-hidden border border-[var(--color-action-border)] bg-[var(--color-action-surface)] text-[var(--foreground)] backdrop-blur-xl",
  "shadow-[var(--shadow-action)] ring-1 ring-[var(--color-action-ring)]",
  "cursor-pointer transition-[background-color,border-color,box-shadow,transform] duration-300 ease-out",
  "before:pointer-events-none before:absolute before:inset-0 before:-z-[1] before:bg-[linear-gradient(135deg,rgba(29,78,216,0.1),rgba(6,182,212,0.055)_46%,transparent_76%)] before:opacity-0 before:transition-opacity before:duration-300",
  "after:pointer-events-none after:absolute after:inset-x-4 after:top-0 after:h-px after:bg-[linear-gradient(90deg,transparent,var(--color-action-highlight),transparent)]",
  "hover:-translate-y-px hover:border-[var(--primary)]/28 hover:bg-[var(--color-action-surface-hover)] hover:shadow-[var(--shadow-action-hover)] hover:before:opacity-100",
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--primary)]/20",
  "active:translate-y-0 active:scale-[0.99]",
  "disabled:cursor-not-allowed disabled:opacity-65",
].join(" ");

const iconButtonClass = [
  actionSurfaceClass,
  "flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full sm:h-[58px] sm:w-[58px]",
].join(" ");

const cardButtonClass = [
  actionSurfaceClass,
  "flex min-h-[96px] w-full min-w-0 flex-col items-center justify-center gap-2.5 rounded-[var(--radius-action)] px-3 py-3.5 text-center",
].join(" ");

const primaryButtonClass = [
  actionSurfaceClass,
  "flex min-h-[64px] w-full min-w-0 items-center justify-between gap-2.5 rounded-[var(--radius-action)] px-3.5 py-3 text-left sm:min-h-[70px] sm:px-4.5",
].join(" ");

const cardIconWrapClass = [
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/[0.04] text-[var(--primary)]",
  "transition-[background-color,transform] duration-300 ease-out group-hover/btn:-translate-y-px group-hover/btn:bg-[var(--primary)]/[0.08]",
].join(" ");

const primaryIconWrapClass = [
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/[0.04] text-[var(--primary)]",
  "transition-[background-color,transform] duration-300 ease-out group-hover/btn:-translate-y-0.5 group-hover/btn:bg-[var(--primary)]/[0.08]",
].join(" ");

const iconOnlyClass =
  "text-[var(--primary)] opacity-95 transition-[opacity,transform] duration-300 ease-out group-hover/btn:scale-105 group-hover/btn:opacity-100";

const labelClass =
  "max-w-full truncate whitespace-nowrap text-xs font-extrabold leading-snug text-[var(--foreground)]";

const primaryLabelClass =
  "max-w-full truncate text-[13px] font-extrabold leading-tight tracking-[-0.012em] text-[var(--foreground)] sm:text-sm";

const primaryArrowClass = [
  "ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-white/42 text-[var(--primary)]",
  "transition-[background-color,border-color,transform] duration-300 ease-out group-hover/btn:translate-x-0.5 group-hover/btn:border-[var(--primary)]/18 group-hover/btn:bg-white/72",
].join(" ");

function resolveDownloadHref(action: QuickAction) {
  const rawAction = action as QuickAction & {
    taxasPdfUrl?: string;
    pdfUrl?: string;
    fileUrl?: string;
    url?: string;
  };
  return (
    action.downloadFile ||
    action.href ||
    rawAction.taxasPdfUrl ||
    rawAction.pdfUrl ||
    rawAction.fileUrl ||
    rawAction.url ||
    ""
  );
}

function resolveActionHref(action: QuickAction) {
  const rawAction = action as QuickAction & { url?: string };
  return action.href || rawAction.url || "";
}

export function QuickActionButton({
  action,
  onModalClick,
  disabled,
  variant = "card",
}: QuickActionButtonProps) {
  const Icon = ICON_MAP[action.icon] ?? FileText;
  const href = resolveActionHref(action);
  const isIconVariant = variant === "icon";
  const isPrimaryVariant = variant === "primary";
  const buttonClassName = isIconVariant
    ? iconButtonClass
    : isPrimaryVariant
      ? primaryButtonClass
      : cardButtonClass;

  const iconElement = (
    <span
      className={
        isIconVariant ? iconOnlyClass : isPrimaryVariant ? primaryIconWrapClass : cardIconWrapClass
      }
      aria-hidden="true"
    >
      <Icon
        size={isIconVariant ? 24 : isPrimaryVariant ? 18 : 20}
        weight="duotone"
        className={
          "transition-colors duration-200" +
          (isIconVariant ? " h-6 w-6 sm:h-[28px] sm:w-[28px]" : "")
        }
      />
    </span>
  );

  const content = (
    <>
      {iconElement}
      {isIconVariant ? null : isPrimaryVariant ? (
        <>
          <span className="flex min-w-0 flex-1 items-center">
            <span className={primaryLabelClass}>{action.label}</span>
          </span>
          <span className={primaryArrowClass} aria-hidden="true">
            <ArrowSquareOut size={13} weight="bold" />
          </span>
        </>
      ) : (
        <span className={labelClass}>{action.label}</span>
      )}
    </>
  );

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className={buttonClassName}
        aria-label={action.label}
        title={action.label}
      >
        {content}
      </button>
    );
  }

  if (action.type === "download") {
    const href = resolveDownloadHref(action);
    return (
      <a
        href={href}
        download
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClassName}
        aria-label={action.label}
        title={action.label}
      >
        {content}
      </a>
    );
  }

  if (action.type === "external") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClassName}
        aria-label={action.label}
        title={action.label}
      >
        {content}
      </a>
    );
  }

  if (action.type === "modal") {
    return (
      <button
        type="button"
        className={buttonClassName}
        aria-label={action.label}
        title={action.label}
        onClick={() => {
          if (onModalClick) {
            onModalClick(action);
          } else if (href.startsWith("#")) {
            const el = document.getElementById(href.slice(1));
            const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            el?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
          }
        }}
      >
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className={buttonClassName} aria-label={action.label} title={action.label}>
      {content}
    </Link>
  );
}
