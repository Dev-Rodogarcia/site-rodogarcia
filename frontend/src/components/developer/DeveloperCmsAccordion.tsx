"use client";

import { type ReactNode } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export function DeveloperCmsAccordion({
  items,
  openIndex,
  onOpenChange,
  getTitle,
  getEyebrow,
  renderItem,
}: {
  items: any[];
  openIndex: number | null;
  onOpenChange: (index: number | null) => void;
  getTitle: (item: any, index: number) => string;
  getEyebrow: (item: any, index: number) => string;
  renderItem: (item: any, index: number) => ReactNode;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <article
            key={`${getEyebrow(item, index)}-${index}`}
            className={cn(
              "overflow-hidden rounded-[22px] border bg-slate-50/86 transition-all duration-300",
              isOpen
                ? "border-[var(--primary)]/24 shadow-[0_14px_34px_rgba(15,23,42,0.07)]"
                : "border-[var(--border)]/80 shadow-[0_8px_20px_rgba(15,23,42,0.035)]"
            )}
          >
            <button
              type="button"
              onClick={() => onOpenChange(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors hover:bg-white/72 sm:px-5"
              aria-expanded={isOpen}
            >
              <span className="min-w-0">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-raw)]">
                  {getEyebrow(item, index)}
                </span>
                <span className="mt-1 block truncate text-sm font-semibold text-[var(--foreground)]">
                  {getTitle(item, index)}
                </span>
              </span>
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-[var(--border)] bg-white text-[var(--color-muted-raw)] transition-transform duration-300",
                  isOpen ? "rotate-180 text-[var(--primary)]" : ""
                )}
              >
                <CaretDown size={16} weight="bold" />
              </span>
            </button>
            <div
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="border-t border-slate-200/70 p-4 sm:p-5">
                  {renderItem(item, index)}
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
