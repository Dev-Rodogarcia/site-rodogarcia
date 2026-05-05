"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { ArrowSquareOut, ImagesSquare, MagnifyingGlassPlus } from "@phosphor-icons/react";
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
}: DeveloperMediaFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const listId = useId();
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
        .sort((a, b) => Number(b.usedInContent) - Number(a.usedInContent))
        .slice(0, 12),
    [data, mediaType]
  );
  const trimmedValue = value.trim();

  const controls = (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={developerInputClassName}
          list={listId}
          placeholder={mediaType === "video" ? "/uploads/video.mp4" : "/uploads/midia.webp"}
        />
        <button
          type="button"
          onClick={() => setPickerOpen((current) => !current)}
          className={cn(developerSecondaryButtonClassName, "whitespace-nowrap")}
        >
          <ImagesSquare size={16} weight="bold" />
          Biblioteca
        </button>
      </div>

      {pickerOpen ? (
        <div className="rounded-[22px] border border-slate-200/86 bg-slate-50/76 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
              Midias recentes
            </p>
            <Link
              href={admin.images}
              className={cn(
                developerGhostButtonClassName,
                "min-h-9 rounded-xl px-3 py-2 text-xs"
              )}
            >
              <ArrowSquareOut size={14} weight="bold" />
              Upload
            </Link>
          </div>

          {loading ? (
            <DeveloperMessage tone="info">Carregando biblioteca...</DeveloperMessage>
          ) : null}
          {error ? <DeveloperMessage tone="error">{error}</DeveloperMessage> : null}

          {!loading && media.length > 0 ? (
            <>
              <datalist id={listId}>
                {media.map((item) => (
                  <option key={item.url} value={item.url} />
                ))}
              </datalist>
              <div className="grid gap-2 sm:grid-cols-3">
                {media.map((item) => {
                  const itemType = item.mediaType ?? mediaTypeFromUrl(item.url);
                  return (
                    <button
                      key={item.url}
                      type="button"
                      onClick={() => onChange(item.url)}
                      className={cn(
                        "group overflow-hidden rounded-[16px] border text-left transition-all hover:-translate-y-0.5",
                        value === item.url
                          ? "border-[var(--primary)] bg-[var(--primary)]/8"
                          : "border-[var(--border)] bg-white/82"
                      )}
                    >
                      {itemType === "video" ? (
                        <div className="flex h-20 items-center justify-center bg-slate-950 text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                          Video
                        </div>
                      ) : (
                        <img
                          src={item.thumbnailUrl || item.url}
                          alt={item.name}
                          className="h-20 w-full object-cover"
                          loading="lazy"
                        />
                      )}
                      <div className="p-2">
                        <p className="truncate text-xs font-semibold text-[var(--foreground)]">
                          {item.name}
                        </p>
                        <p className="mt-1 truncate text-[11px] text-[var(--color-muted-raw)]">
                          {item.usedInContent ? "Em uso" : item.source} - {itemType}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  return (
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
          <div className="order-1 lg:order-2">
            {controls}
          </div>
        </div>
      ) : (
        controls
      )}
    </DeveloperField>
  );
}

export function DeveloperMediaPreview({
  value,
  previewAlt,
  mediaType = "all",
}: {
  value: string;
  previewAlt?: string;
  mediaType?: "image" | "video" | "all";
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const trimmedValue = value.trim();
  const currentType =
    trimmedValue.length > 0 ? mediaTypeFromUrl(trimmedValue) : mediaType === "video" ? "video" : "image";
  const hasPreview = trimmedValue.length > 0 && isPreviewableAsset(trimmedValue);

  return (
    <>
      <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/76 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
        <div className="mx-auto max-w-[280px] overflow-hidden rounded-[20px] border border-[var(--border)] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.065)]">
          {hasPreview ? (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="group block w-full text-left focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              <div className="relative h-40 overflow-hidden bg-slate-950">
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
              <div className="border-t border-[var(--border)] px-3 py-2.5">
                <p className="text-xs font-semibold text-[var(--foreground)]">
                  Preview da mídia
                </p>
                <p className="mt-1 truncate text-[11px] text-[var(--color-muted-raw)]">
                  {trimmedValue}
                </p>
              </div>
            </button>
          ) : (
            <div className="flex h-52 flex-col items-center justify-center gap-2 px-4 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-400">
                <ImagesSquare size={21} weight="bold" />
              </span>
              <p className="text-xs font-semibold text-[var(--foreground)]">
                Nenhuma mídia selecionada
              </p>
              <p className="max-w-[22ch] text-[11px] leading-5 text-[var(--color-muted-raw)]">
                Escolha um arquivo da biblioteca ou informe uma URL valida.
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
