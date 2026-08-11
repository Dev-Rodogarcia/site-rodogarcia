"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ChatCircleDots,
  ClipboardText,
  EnvelopeSimple,
  Headset,
  MapPinLine,
  PhoneCall,
  Truck,
  WhatsappLogo,
} from "@phosphor-icons/react";
import type { ComponentType } from "react";
import type { QuoteOtherChannel } from "@/types/content";
import { cn } from "@/lib/utils";

const ICONS: Record<string, ComponentType<{ size?: number; weight?: "duotone" | "fill" | "regular" | "bold" }>> = {
  WhatsappLogo,
  PhoneCall,
  EnvelopeSimple,
  ClipboardText,
  ChatCircleDots,
  Headset,
  MapPinLine,
  Truck,
};

function isExternalUrl(url: string) {
  return url.startsWith("http") || url.startsWith("mailto:") || url.startsWith("tel:");
}

export function QuoteOtherChannelsSection({ channels }: { channels: QuoteOtherChannel[] }) {
  const activeChannels = useMemo(
    () => channels.filter((channel) => channel.active !== false),
    [channels]
  );
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(activeChannels.length / 4));
  const pageItems = activeChannels.slice(page * 4, page * 4 + 4);

  return (
    <>
      <div className="grid gap-x-8 border-y border-white/10 sm:grid-cols-2">
        {pageItems.map((item) => {
          const Icon = ICONS[item.icon] ?? ChatCircleDots;
          const external = item.button.external || isExternalUrl(item.button.url);
          const buttonClassName =
            "inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] transition-all duration-200 hover:-translate-y-0.5 sm:w-auto";
          const buttonColor = item.buttonColor && item.buttonColor !== "#0f172a" ? item.buttonColor : "#2563eb";
          const buttonStyle = { backgroundColor: buttonColor };
          const button = external ? (
            <a
              href={item.button.url}
              target={item.button.url.startsWith("http") ? "_blank" : undefined}
              rel={item.button.url.startsWith("http") ? "noopener noreferrer" : undefined}
              className={buttonClassName}
              style={buttonStyle}
            >
              {item.button.label}
            </a>
          ) : (
            <Link href={item.button.url} className={buttonClassName} style={buttonStyle}>
              {item.button.label}
            </Link>
          );

          return (
            <div key={item.id} className="border-b border-white/10 py-5 last:border-b-0 sm:py-6">
              <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap">
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10"
                style={{ color: item.iconColor || "#38bdf8" }}
              >
                <Icon size={20} weight="duotone" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold tracking-[-0.02em] text-white">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm leading-5 text-white/58">{item.description}</p>
              </div>
              {button}
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 ? (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setPage(index)}
              className={cn(
                "min-h-10 rounded-full border px-4 text-sm font-semibold transition-all",
                page === index
                  ? "border-sky-400 bg-sky-400 text-slate-950"
                  : "border-white/12 bg-white/8 text-white hover:bg-white/12"
              )}
            >
              Página {index + 1}
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}
