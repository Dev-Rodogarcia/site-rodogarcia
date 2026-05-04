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
      <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
        {pageItems.map((item) => {
          const Icon = ICONS[item.icon] ?? ChatCircleDots;
          const external = item.button.external || isExternalUrl(item.button.url);
          const buttonClassName =
            "inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl px-6 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(15,23,42,0.16)] transition-all duration-200 hover:-translate-y-0.5";
          const buttonStyle = { backgroundColor: item.buttonColor || "#0f172a" };
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
            <div key={item.id} className="flex flex-col gap-4">
              <span
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10"
                style={{ color: item.iconColor || "#38bdf8" }}
              >
                <Icon size={22} weight="duotone" />
              </span>
              <div className="flex-1">
                <h3 className="text-base font-semibold tracking-[-0.02em] text-white">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-sm leading-7 text-white/58">{item.description}</p>
              </div>
              {button}
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
