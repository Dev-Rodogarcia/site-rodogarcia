"use client";

import { useMemo, useState } from "react";
import { DeviceMobile, Desktop, Rectangle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import {
  DeveloperCard,
  DeveloperSectionHeading,
  developerSecondaryButtonClassName,
} from "./ui";

const VIEWPORTS = [
  { key: "desktop", label: "Desktop", width: 1440, height: 900, icon: Desktop },
  { key: "tablet", label: "Tablet", width: 768, height: 900, icon: Rectangle },
  { key: "mobile", label: "Mobile", width: 390, height: 780, icon: DeviceMobile },
] as const;

export function DeveloperResponsivePreview({
  href,
  title = "Preview real",
}: {
  href: string;
  title?: string;
}) {
  const [viewportKey, setViewportKey] = useState<(typeof VIEWPORTS)[number]["key"]>("desktop");
  const [zoom, setZoom] = useState(0.72);
  const viewport = VIEWPORTS.find((item) => item.key === viewportKey) ?? VIEWPORTS[0];
  const src = useMemo(() => {
    const params = new URLSearchParams({ preview: "cms", viewport: viewport.key });
    return `${href}${href.includes("?") ? "&" : "?"}${params.toString()}`;
  }, [href, viewport.key]);

  return (
    <DeveloperCard>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <DeveloperSectionHeading
          eyebrow="Preview"
          title={title}
          description="Renderização pela rota pública, com CSS e breakpoints reais do site."
        />
        <div className="flex flex-wrap items-center gap-2">
          {VIEWPORTS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setViewportKey(item.key)}
                className={cn(
                  developerSecondaryButtonClassName,
                  "min-h-9 rounded-xl px-3 py-2 text-xs",
                  viewport.key === item.key ? "border-[var(--primary)] bg-[var(--primary)]/8 text-[var(--primary)]" : ""
                )}
              >
                <Icon size={15} weight="bold" />
                {item.label}
              </button>
            );
          })}
          <label className="flex min-h-9 items-center gap-2 rounded-xl border border-[var(--border)] bg-white/78 px-3 py-2 text-xs font-semibold text-[var(--color-muted-raw)]">
            Zoom
            <input
              type="range"
              min="0.45"
              max="1"
              step="0.05"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="w-24 accent-[var(--primary)]"
            />
            <span className="w-9 text-right text-[var(--foreground)]">{Math.round(zoom * 100)}%</span>
          </label>
        </div>
      </div>

      <div className="mt-4 rounded-[22px] border border-[var(--border)] bg-slate-950/95 p-3">
        <div className="mb-3 flex items-center justify-between gap-3 text-xs font-semibold text-white/78">
          <span>{viewport.label}</span>
          <span>{viewport.width}px</span>
        </div>
        <div className="max-h-[760px] overflow-auto rounded-[18px] bg-slate-200 p-3">
          <div
            style={{
              width: viewport.width * zoom,
              height: viewport.height * zoom,
            }}
          >
            <iframe
              title={`${title} ${viewport.label}`}
              src={src}
              width={viewport.width}
              height={viewport.height}
              className="origin-top-left rounded-[14px] border border-slate-300 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.22)]"
              style={{ transform: `scale(${zoom})` }}
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </DeveloperCard>
  );
}
