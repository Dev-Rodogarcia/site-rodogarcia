"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowSquareOut,
  CaretLeft,
  CaretRight,
  ImagesSquare,
  MagnifyingGlassPlus,
  X,
} from "@phosphor-icons/react";
import { adminResourceKeys, useAdminResource } from "@/hooks/useAdminResource";
import { admin, api } from "@/lib/routes";
import { cn } from "@/lib/utils";
import {
  DeveloperField,
  DeveloperMessage,
  developerGhostButtonClassName,
  developerInputClassName,
  developerSecondaryButtonClassName,
} from "./ui";

export interface AdminMediaRecord {
  name: string;
  url: string;
  source: "upload" | "content" | "library";
  usedInContent: boolean;
  size: number;
  references: number;
  mediaType?: "image" | "video";
  thumbnailUrl?: string;
}

const MEDIA_PAGE_SIZE = 12;
const MEDIA_PICKER_OPEN_EVENT = "developer-media-picker:open";

interface DeveloperMediaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  hint?: string;
  tooltip?: string;
  previewAlt?: string;
  className?: string;
  mediaType?: "image" | "video" | "all";
  showPreview?: boolean;
  stackControls?: boolean;
  equalControlWidths?: boolean;
  afterControls?: ReactNode;
}

function mediaTypeFromUrl(value: string): "image" | "video" {
  return /\.(mp4|webm|ogg)$/i.test(value) ? "video" : "image";
}

function isPreviewableAsset(value: string) {
  return /\.(png|jpe?g|webp|gif|svg|avif|mp4|webm|ogg)$/i.test(value);
}

export function DeveloperMediaField({
  label,
  value,
  onChange,
  required,
  hint,
  tooltip,
  previewAlt,
  className,
  mediaType = "all",
  showPreview = true,
  stackControls = false,
  equalControlWidths = false,
  afterControls,
}: DeveloperMediaFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPage, setPickerPage] = useState(0);
  const pickerId = useId();
  const { data, loading, error } = useAdminResource<AdminMediaRecord[]>({
    key: adminResourceKeys.images,
    fetcher: async (request) => {
      const response = await request<{ images?: AdminMediaRecord[] }>(
        api.admin.images
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error ?? "Falha ao carregar mídias.",
        };
      }

      return {
        success: true,
        data: response.data?.images ?? [],
      };
    },
    staleTime: 30_000,
    enabled: pickerOpen,
  });

  const media = useMemo(
    () =>
      [...(data ?? [])]
        .filter((item) => {
          if (mediaType === "all") return true;
          return (item.mediaType ?? mediaTypeFromUrl(item.url)) === mediaType;
        })
        .sort((a, b) => Number(b.usedInContent) - Number(a.usedInContent)),
    [data, mediaType]
  );
  const trimmedValue = value.trim();
  const totalPickerPages = Math.max(1, Math.ceil(media.length / MEDIA_PAGE_SIZE));
  const currentPickerPage = Math.min(pickerPage, totalPickerPages - 1);
  const visibleMedia = media.slice(
    currentPickerPage * MEDIA_PAGE_SIZE,
    (currentPickerPage + 1) * MEDIA_PAGE_SIZE
  );

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPickerOpen(false);
    };
    const handleOtherPickerOpen = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== pickerId) setPickerOpen(false);
    };

    window.addEventListener(MEDIA_PICKER_OPEN_EVENT, handleOtherPickerOpen);
    if (!pickerOpen) {
      return () => window.removeEventListener(MEDIA_PICKER_OPEN_EVENT, handleOtherPickerOpen);
    }

    window.addEventListener("keydown", handleEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener(MEDIA_PICKER_OPEN_EVENT, handleOtherPickerOpen);
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [pickerId, pickerOpen]);

  function openPicker() {
    const selectedIndex = media.findIndex((item) => item.url === value);
    setPickerPage(selectedIndex >= 0 ? Math.floor(selectedIndex / MEDIA_PAGE_SIZE) : 0);
    window.dispatchEvent(
      new CustomEvent<string>(MEDIA_PICKER_OPEN_EVENT, { detail: pickerId })
    );
    setPickerOpen(true);
  }

  const controls = (
    <div className="space-y-3">
      <div
        className={cn(
          "grid gap-3",
          stackControls
            ? "justify-items-start"
            : equalControlWidths
              ? "sm:grid-cols-2"
              : "sm:grid-cols-[minmax(0,1fr)_auto]"
        )}
      >
        <input
          type="hidden"
          value={value}
          required={required}
          readOnly
        />
        <div
          className={cn(
            developerInputClassName,
            "flex min-h-12 items-center overflow-hidden bg-white/78 text-left"
          )}
          title={trimmedValue || "Nenhuma mídia selecionada"}
        >
          <span
            className={cn(
              "block truncate",
              trimmedValue ? "text-[var(--foreground)]" : "text-[var(--color-muted-raw)]"
            )}
          >
            {trimmedValue || "Nenhuma mídia selecionada"}
          </span>
        </div>
        <button
          type="button"
          onClick={openPicker}
          className={cn(
            developerSecondaryButtonClassName,
            "whitespace-nowrap",
            equalControlWidths && "w-full justify-center",
            stackControls && "min-w-40 justify-center"
          )}
        >
          <ImagesSquare size={16} weight="bold" />
          Biblioteca
        </button>
      </div>
      {afterControls}
      {trimmedValue && !required ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className={cn(developerGhostButtonClassName, "min-h-9 rounded-xl px-3 py-2 text-xs")}
        >
          Limpar seleção
        </button>
      ) : null}

    </div>
  );

  return (
    <>
      <DeveloperField
        label={label}
        required={required}
        hint={hint}
        tooltip={tooltip}
        className={className}
      >
        {showPreview ? (
          <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
            <div className="order-2 lg:order-1">
              <DeveloperMediaPreview value={trimmedValue} previewAlt={previewAlt} mediaType={mediaType} />
            </div>
            <div className="order-1 lg:order-2">{controls}</div>
          </div>
        ) : (
          controls
        )}
      </DeveloperField>

      {pickerOpen ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6">
          <button
            type="button"
            aria-label="Fechar biblioteca de mídias"
            className="absolute inset-0 bg-slate-950/68 backdrop-blur-[2px]"
            onClick={() => setPickerOpen(false)}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="media-picker-title"
            className="relative z-10 flex max-h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[24px] border border-white/20 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.32)] sm:max-h-[calc(100vh-3rem)]"
          >
            <header className="flex items-start justify-between gap-4 border-b border-[var(--border)] bg-slate-50/90 px-4 py-4 sm:px-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                  Biblioteca de mídia
                </p>
                <h2 id="media-picker-title" className="mt-1 text-base font-semibold text-[var(--foreground)]">
                  Escolha um arquivo
                </h2>
                <p className="mt-1 text-sm text-[var(--color-muted-raw)]">
                  {mediaType === "all" ? "Imagens e vídeos disponíveis" : `Somente ${mediaType === "image" ? "imagens" : "vídeos"}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={admin.images}
                  className={cn(developerGhostButtonClassName, "min-h-9 rounded-xl px-3 py-2 text-xs")}
                >
                  <ArrowSquareOut size={14} weight="bold" />
                  Upload
                </Link>
                <button
                  type="button"
                  onClick={() => setPickerOpen(false)}
                  className={cn(developerGhostButtonClassName, "h-9 w-9 rounded-xl p-0")}
                  aria-label="Fechar biblioteca"
                >
                  <X size={16} weight="bold" />
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              {loading ? <DeveloperMessage tone="info">Carregando biblioteca...</DeveloperMessage> : null}
              {error ? <DeveloperMessage tone="error">{error}</DeveloperMessage> : null}

              {!loading && visibleMedia.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {visibleMedia.map((item) => {
                    const itemType = item.mediaType ?? mediaTypeFromUrl(item.url);
                    return (
                      <button
                        key={item.url}
                        type="button"
                        onClick={() => {
                          onChange(item.url);
                          setPickerOpen(false);
                        }}
                        className={cn(
                          "group overflow-hidden rounded-[18px] border text-left transition-all hover:-translate-y-0.5",
                          value === item.url
                            ? "border-[var(--primary)] bg-[var(--primary)]/8 shadow-[0_10px_22px_rgba(29,78,216,0.12)]"
                            : "border-[var(--border)] bg-white hover:border-[var(--primary)]/30"
                        )}
                      >
                        {itemType === "video" ? (
                          <div className="flex h-28 items-center justify-center bg-slate-950 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                            Vídeo
                          </div>
                        ) : (
                          <img
                            src={item.thumbnailUrl || item.url}
                            alt={item.name}
                            className="h-28 w-full object-cover"
                            loading="lazy"
                          />
                        )}
                        <div className="p-3">
                          <p className="truncate text-xs font-semibold text-[var(--foreground)]">{item.name}</p>
                          <p className="mt-1 truncate text-[11px] text-[var(--color-muted-raw)]">
                            {item.usedInContent ? "Em uso" : item.source} - {itemType}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {!loading && !error && media.length === 0 ? (
                <DeveloperMessage tone="info">
                  Nenhuma mídia compatível encontrada na biblioteca.
                </DeveloperMessage>
              ) : null}
            </div>

            {!loading && !error && media.length > 0 ? (
              <footer className="flex flex-col gap-3 border-t border-[var(--border)] bg-slate-50/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-xs font-medium text-[var(--color-muted-raw)]">
                  Página {currentPickerPage + 1} de {totalPickerPages} · {media.length} mídias
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPickerPage((current) => Math.max(0, current - 1))}
                    disabled={currentPickerPage === 0}
                    className={cn(developerGhostButtonClassName, "min-h-9 rounded-xl px-3 py-2 text-xs")}
                  >
                    <CaretLeft size={14} weight="bold" />
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickerPage((current) => Math.min(totalPickerPages - 1, current + 1))}
                    disabled={currentPickerPage === totalPickerPages - 1}
                    className={cn(developerGhostButtonClassName, "min-h-9 rounded-xl px-3 py-2 text-xs")}
                  >
                    Próxima
                    <CaretRight size={14} weight="bold" />
                  </button>
                </div>
              </footer>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}

export function DeveloperMediaPreview({
  value,
  previewAlt,
  mediaType = "all",
  compact = false,
}: {
  value: string;
  previewAlt?: string;
  mediaType?: "image" | "video" | "all";
  compact?: boolean;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const trimmedValue = value.trim();
  const currentType =
    trimmedValue.length > 0 ? mediaTypeFromUrl(trimmedValue) : mediaType === "video" ? "video" : "image";
  const hasPreview = trimmedValue.length > 0 && isPreviewableAsset(trimmedValue);

  return (
    <>
      <div className={cn("rounded-[24px] border border-slate-200/80 bg-slate-50/76 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]", compact ? "p-3" : "p-4")}>
        <div className={cn("mx-auto overflow-hidden rounded-[20px] border border-[var(--border)] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.065)]", compact ? "max-w-[220px]" : "max-w-[280px]")}>
          {hasPreview ? (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="group block w-full text-left focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              <div className={cn("relative overflow-hidden bg-slate-950", compact ? "h-28" : "h-40")}>
                {currentType === "video" ? (
                  <video
                    src={trimmedValue}
                    muted
                    preload="metadata"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <img
                    src={trimmedValue}
                    alt={previewAlt ?? "Preview da mídia selecionada"}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                )}
                <span className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-full bg-slate-950/70 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm backdrop-blur">
                  <MagnifyingGlassPlus size={13} weight="bold" />
                  Ampliar
                </span>
              </div>
              <div className={cn("border-t border-[var(--border)] px-3", compact ? "py-2" : "py-2.5")}>
                <p className="text-xs font-semibold text-[var(--foreground)]">
                  Preview da mídia
                </p>
                <p className="mt-1 truncate text-[11px] text-[var(--color-muted-raw)]">
                  {trimmedValue}
                </p>
              </div>
            </button>
          ) : (
            <div className={cn("flex flex-col items-center justify-center gap-2 px-4 text-center", compact ? "h-40" : "h-52")}>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                <ImagesSquare size={21} weight="bold" />
              </span>
              <p className="text-xs font-semibold text-[var(--foreground)]">
                Nenhuma mídia selecionada
              </p>
              <p className="max-w-[22ch] text-[11px] leading-5 text-[var(--color-muted-raw)]">
                Escolha um arquivo da biblioteca.
              </p>
            </div>
          )}
        </div>
      </div>

      {hasPreview && previewOpen ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/76 p-4">
          <button
            type="button"
            aria-label="Fechar preview"
            className="absolute inset-0 cursor-default"
            onClick={() => setPreviewOpen(false)}
          />
          <div className="relative z-10 max-w-[92vw] rounded-[22px] border border-white/16 bg-white p-3 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                Preview da mídia
              </p>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className={cn(
                  developerGhostButtonClassName,
                  "min-h-9 rounded-xl px-3 py-2 text-xs"
                )}
              >
                Fechar
              </button>
            </div>
            {currentType === "video" ? (
              <video
                src={trimmedValue}
                controls
                autoPlay
                muted
                className="max-h-[78vh] max-w-[86vw] rounded-[16px] bg-slate-950 object-contain"
              />
            ) : (
              <img
                src={trimmedValue}
                alt={previewAlt ?? "Preview da mídia selecionada"}
                className="max-h-[78vh] max-w-[86vw] rounded-[16px] object-contain"
              />
            )}
            <p className="mt-3 max-w-[86vw] break-all text-xs leading-5 text-[var(--color-muted-raw)]">
              {trimmedValue}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
