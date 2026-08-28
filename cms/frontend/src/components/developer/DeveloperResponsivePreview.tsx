"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { DeviceMobile, Desktop, Rectangle, SquaresFour } from "@phosphor-icons/react";
import { type AppPath } from "@/lib/routes";
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

const CMS_PREVIEW_QUERY = "cms";
type ViewportKey = (typeof VIEWPORTS)[number]["key"];
type PreviewMode = ViewportKey | "all";
const PREVIEW_OPTIONS = [{ key: "all", label: "Todos", icon: SquaresFour }, ...VIEWPORTS] as const;

export function DeveloperResponsivePreview({
  href,
  title = "Preview real",
  anchor,
  revision,
  showConsent = false,
  showExitPopup = false,
}: {
  href: AppPath;
  title?: string;
  anchor?: string;
  revision?: number;
  /** Mantém o banner de cookies visível no iframe para editar LGPD. */
  showConsent?: boolean;
  /** Mantém o popup de saída aberto no iframe sem registrar eventos ou leads. */
  showExitPopup?: boolean;
}) {
  const [previewMode, setPreviewMode] = useState<PreviewMode>("all");
  const [zoom, setZoom] = useState(0.72);
  const previewSurfaceRef = useRef<HTMLDivElement>(null);
  const [previewSurfaceWidth, setPreviewSurfaceWidth] = useState(0);
  const previewViewports = useMemo(
    () => (previewMode === "all" ? VIEWPORTS : VIEWPORTS.filter((item) => item.key === previewMode)),
    [previewMode]
  );
  const singleViewport = previewViewports[0] ?? VIEWPORTS[0];
  const allModeAspectRatio = previewViewports
    .map((viewport) => viewport.width / viewport.height)
    .reduce((total, ratio) => total + ratio, 0);
  const allModeFitHeight = previewSurfaceWidth
    ? Math.min(760, (previewSurfaceWidth - 24 - (previewViewports.length - 1) * 16) / allModeAspectRatio)
    : 760;
  const maxZoom =
    previewMode === "all" || !previewSurfaceWidth
      ? 1
      : Math.min(1, (previewSurfaceWidth - 24) / singleViewport.width, 760 / singleViewport.height);
  const appliedZoom = Math.min(zoom, maxZoom);
  const allModePreviewHeight = Math.min(760 * appliedZoom, allModeFitHeight);

  function getViewportZoom(viewport: (typeof VIEWPORTS)[number]) {
    return previewMode === "all" ? allModePreviewHeight / viewport.height : appliedZoom;
  }
  function getPreviewSrc(viewportKey: ViewportKey) {
    const params = new URLSearchParams({
      preview: CMS_PREVIEW_QUERY,
      viewport: viewportKey,
    });
    if (revision !== undefined) {
      params.set("revision", String(revision));
    }
    if (showConsent) {
      params.set("consent-preview", "1");
    }
    if (showExitPopup) {
      params.set("popup-preview", "1");
    }
    const path = `${href}${href.includes("?") ? "&" : "?"}${params.toString()}${anchor ? `#${anchor}` : ""}`;
    return path;
  }

  useEffect(() => {
    const previewSurface = previewSurfaceRef.current;
    if (!previewSurface) return;

    const updateSurfaceWidth = () => setPreviewSurfaceWidth(previewSurface.clientWidth);
    const resizeObserver = new ResizeObserver(updateSurfaceWidth);
    resizeObserver.observe(previewSurface);
    updateSurfaceWidth();

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <DeveloperCard>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <DeveloperSectionHeading
          eyebrow="Preview"
          title={title}
          description="Renderização pela rota pública, com CSS e breakpoints reais do site."
        />
        <div className="flex flex-wrap items-center gap-2">
          {PREVIEW_OPTIONS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setPreviewMode(item.key)}
                className={cn(
                  developerSecondaryButtonClassName,
                  "min-h-9 rounded-xl px-3 py-2 text-xs",
                  previewMode === item.key ? "border-[var(--primary)] bg-[var(--primary)]/8 text-[var(--primary)]" : ""
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
              max={Math.max(0.45, maxZoom)}
              step="0.05"
              value={appliedZoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="w-24 accent-[var(--primary)]"
            />
            <span className="w-9 text-right text-[var(--foreground)]">{Math.round(appliedZoom * 100)}%</span>
          </label>
        </div>
      </div>

      <div ref={previewSurfaceRef} className="mt-4 rounded-[22px] border border-[var(--border)] bg-slate-950/95 p-3">
        <div className={cn(previewMode === "all" ? "flex items-start gap-4" : "flex justify-center")}>
          {previewViewports.map((viewport) => {
            const viewportZoom = getViewportZoom(viewport);

            return (
            <section key={viewport.key} className="shrink-0">
            <div className="mb-3 flex items-center justify-between gap-3 text-xs font-semibold text-white/78">
              <span>{viewport.label}</span>
              <span>{viewport.width}px</span>
            </div>
            <div className="max-h-[760px] overflow-hidden overscroll-contain rounded-xl">
              <div
                style={{
                  width: viewport.width * viewportZoom,
                  height: viewport.height * viewportZoom,
                }}
              >
                <iframe
                  title={`${title} ${viewport.label}`}
                  src={getPreviewSrc(viewport.key)}
                  width={viewport.width}
                  height={viewport.height}
                  className="origin-top-left rounded-xl shadow-[0_20px_60px_rgba(15,23,42,0.22)]"
                  style={{ transform: `scale(${viewportZoom})` }}
                  loading="lazy"
                />
              </div>
            </div>
            </section>
            );
          })}
        </div>
      </div>
    </DeveloperCard>
  );
}
