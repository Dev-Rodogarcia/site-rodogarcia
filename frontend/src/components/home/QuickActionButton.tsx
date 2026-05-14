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
}

const buttonBaseClass = [
  "group/btn relative isolate flex min-h-[110px] w-full min-w-0 flex-col items-center justify-center gap-3 overflow-hidden rounded-[20px]",
  "border border-white/74 bg-white/74 px-3 py-4 text-center backdrop-blur-xl sm:min-h-[116px] lg:min-h-[126px] lg:px-3.5 lg:py-5",
  "shadow-[0_10px_28px_rgba(15,23,42,0.055)] ring-1 ring-slate-900/[0.045]",
  "cursor-pointer transition-all duration-200 ease-out",
  "before:pointer-events-none before:absolute before:inset-0 before:-z-[1] before:bg-[linear-gradient(145deg,rgba(29,78,216,0.08),rgba(6,182,212,0.045)_44%,rgba(255,255,255,0)_72%)] before:opacity-0 before:transition-opacity before:duration-200",
  "after:pointer-events-none after:absolute after:inset-x-4 after:top-0 after:h-px after:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.94),transparent)]",
  "hover:-translate-y-1 hover:border-[var(--primary)]/20 hover:bg-white/94 hover:shadow-[0_18px_42px_rgba(15,23,42,0.105)] hover:ring-[var(--primary)]/20 hover:before:opacity-100",
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--primary)]/24 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4f8fc]",
  "active:translate-y-0 active:scale-[0.99] active:shadow-[0_8px_18px_rgba(15,23,42,0.08)]",
  "disabled:cursor-not-allowed disabled:opacity-70",
].join(" ");

const iconWrapClass = [
  "relative z-[1] flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[16px] sm:h-12 sm:w-12",
  "border border-[var(--primary)]/12 bg-[linear-gradient(135deg,rgba(29,78,216,0.14),rgba(6,182,212,0.12))] text-[var(--primary)]",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] transition-all duration-200",
  "before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(135deg,var(--primary),var(--accent))] before:opacity-0 before:transition-opacity before:duration-200",
  "group-hover/btn:-translate-y-1 group-hover/btn:scale-[1.05] group-hover/btn:text-white group-hover/btn:shadow-[0_12px_24px_rgba(29,78,216,0.24)] group-hover/btn:before:opacity-100",
].join(" ");

const labelClass =
  "relative z-[1] max-w-full text-balance text-center text-[12px] font-extrabold leading-snug text-[var(--foreground)] sm:text-[13px] lg:text-[12.5px] xl:text-[13px]";

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

export function QuickActionButton({ action, onModalClick, disabled }: QuickActionButtonProps) {
  const Icon = ICON_MAP[action.icon] ?? FileText;
  const href = resolveActionHref(action);

  const iconElement = (
    <span className={iconWrapClass} aria-hidden="true">
      <Icon
        size={22}
        weight="duotone"
        className="relative z-[1] transition-transform duration-200 group-hover/btn:-rotate-3 group-hover/btn:scale-105"
      />
    </span>
  );

  const content = (
    <>
      {iconElement}
      <span className={labelClass}>{action.label}</span>
    </>
  );

  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className={buttonBaseClass}
        aria-label={action.label}
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
        className={buttonBaseClass}
        aria-label={action.label}
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
        className={buttonBaseClass}
        aria-label={action.label}
      >
        {content}
      </a>
    );
  }

  if (action.type === "modal") {
    return (
      <button
        type="button"
        className={buttonBaseClass}
        aria-label={action.label}
        onClick={() => {
          if (onModalClick) {
            onModalClick(action);
          } else if (href) {
            const el = document.querySelector(href);
            el?.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }}
      >
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className={buttonBaseClass} aria-label={action.label}>
      {content}
    </Link>
  );
}
