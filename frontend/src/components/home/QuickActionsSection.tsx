"use client";

import { useId, useMemo } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import type { QuickAction } from "@/types/content";
import { useSiteSearch } from "@/components/search/SiteSearchProvider";
import { QuickActionButton } from "./QuickActionButton";

interface QuickActionsSectionProps {
  actions: QuickAction[];
}

function hasActionTarget(action: QuickAction) {
  const rawAction = action as QuickAction & {
    taxasPdfUrl?: string;
    pdfUrl?: string;
    fileUrl?: string;
    url?: string;
  };
  if (action.type === "download") {
    return Boolean(
      action.downloadFile ||
        action.href ||
        rawAction.taxasPdfUrl ||
        rawAction.pdfUrl ||
        rawAction.fileUrl ||
        rawAction.url
    );
  }
  return Boolean(action.href || rawAction.url);
}

function isRatesAction(action: QuickAction) {
  const normalizedLabel = normalizeSearch(action.label);
  return action.id === "qa-taxas" || normalizedLabel.includes("taxas");
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function QuickActionsSection({ actions }: QuickActionsSectionProps) {
  const { isOpen: searchOpen, openSearch } = useSiteSearch();
  const visible = useMemo(
    () =>
      actions
        .filter((action) => action.enabled !== false && action.label.trim())
        .slice()
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999)),
    [actions]
  );
  const labelId = useId();

  const cmsLabels = useMemo(
    () => visible.map((action) => action.label.trim()).filter(Boolean),
    [visible]
  );
  const searchLabel = cmsLabels.join(" / ");

  if (visible.length === 0) return null;

  return (
    <section
      aria-labelledby={labelId}
      className={[
        "relative z-10 overflow-hidden border-y border-slate-900/[0.06] px-4 py-7 sm:px-5 sm:py-9 lg:py-10",
        "bg-[#f4f8fc]",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(6,182,212,0.08),transparent_28%),radial-gradient(circle_at_82%_8%,rgba(29,78,216,0.08),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.22] [background-image:linear-gradient(rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.045)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(29,78,216,0.34),rgba(6,182,212,0.24),transparent)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(15,23,42,0.12),transparent)]" />

      <h2 id={labelId} className="sr-only">
        {searchLabel}
      </h2>

      <div className="relative mx-auto max-w-[1216px]">
        <div className="relative">
          <MagnifyingGlass
            size={24}
            weight="bold"
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 z-[1] -translate-y-1/2 text-[var(--primary)] sm:left-5"
          />
          <input
            type="search"
            readOnly
            value=""
            onFocus={openSearch}
            onClick={openSearch}
            aria-label={searchLabel}
            aria-controls="site-search-panel"
            aria-expanded={searchOpen}
            placeholder={searchLabel}
            className={[
              "h-[58px] w-full cursor-text rounded-[22px] border border-white/80 bg-white/88 pl-[52px] pr-4 text-sm font-bold text-[var(--foreground)] shadow-[0_16px_42px_rgba(15,23,42,0.08)] outline-none ring-1 ring-slate-900/[0.04] backdrop-blur-xl transition-all duration-200 sm:h-[64px] sm:pl-[60px] sm:pr-5 sm:text-base",
              "placeholder:text-[var(--color-muted-raw)]/72",
              "hover:border-[var(--primary)]/20 hover:bg-white hover:shadow-[0_20px_52px_rgba(15,23,42,0.1)]",
              "focus:border-[var(--primary)]/40 focus:bg-white focus:shadow-[0_22px_58px_rgba(29,78,216,0.14)] focus:ring-4 focus:ring-[var(--primary)]/15",
              "focus-visible:outline-none",
            ].join(" ")}
          />
          <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.95),transparent)]" />
        </div>

        <div className="mt-4 h-px w-full bg-[linear-gradient(90deg,transparent,rgba(15,23,42,0.1),transparent)] sm:mt-5" />

        <div
          className={[
            "relative mt-4 grid grid-cols-2 gap-3 sm:mt-5 sm:grid-cols-3 sm:gap-3.5",
            "lg:grid-cols-[repeat(auto-fit,minmax(112px,1fr))] lg:gap-3 xl:gap-4",
          ].join(" ")}
          role="list"
          aria-label={searchLabel}
        >
          {visible.map((action) => (
            <div key={action.id} role="listitem" className="min-w-0">
              <QuickActionButton
                action={action}
                disabled={!hasActionTarget(action) && !isRatesAction(action)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
