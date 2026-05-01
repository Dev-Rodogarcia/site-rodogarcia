"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { ArrowSquareOut, ImagesSquare } from "@phosphor-icons/react";
import {
  adminResourceKeys,
  useAdminResource,
} from "@/hooks/useAdminResource";
import { admin, api } from "@/lib/routes";
import { cn } from "@/lib/utils";
import {
  DeveloperField,
  DeveloperMessage,
  developerGhostButtonClassName,
  developerInputClassName,
  developerSecondaryButtonClassName,
} from "./ui";

interface AdminImageRecord {
  name: string;
  url: string;
  source: "upload" | "content" | "library";
  usedInContent: boolean;
  size: number;
  references: number;
}

interface DeveloperImageFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  hint?: string;
  tooltip?: string;
  previewAlt?: string;
  className?: string;
}

function isPreviewableAsset(value: string) {
  return /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(value);
}

export function DeveloperImageField({
  label,
  value,
  onChange,
  required,
  hint,
  tooltip,
  previewAlt,
  className,
}: DeveloperImageFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const listId = useId();
  const { data, loading, error } = useAdminResource<AdminImageRecord[]>({
    key: adminResourceKeys.images,
    fetcher: async (request) => {
      const response = await request<{ images?: AdminImageRecord[] }>(
        api.admin.images
      );

      if (!response.success) {
        return {
          success: false,
          error: response.error ?? "Falha ao carregar imagens.",
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

  const images = useMemo(
    () =>
      [...(data ?? [])]
        .sort((a, b) => Number(b.usedInContent) - Number(a.usedInContent))
        .slice(0, 12),
    [data]
  );
  const hasPreview = value.trim().length > 0 && isPreviewableAsset(value);

  return (
    <DeveloperField
      label={label}
      required={required}
      hint={hint}
      tooltip={tooltip}
      className={className}
    >
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={developerInputClassName}
            list={listId}
            placeholder="/uploads/banner.webp"
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

        {hasPreview ? (
          <div className="overflow-hidden rounded-[18px] border border-[var(--border)] bg-white/72">
            <img
              src={value}
              alt={previewAlt ?? "Preview da imagem selecionada"}
              className="aspect-[16/9] w-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <p className="break-all border-t border-[var(--border)] px-3 py-2 text-xs leading-5 text-[var(--color-muted-raw)]">
              {value}
            </p>
          </div>
        ) : null}

        {pickerOpen ? (
          <div className="rounded-[22px] border border-[var(--border)] bg-white/72 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                Imagens recentes
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

            {!loading && images.length > 0 ? (
              <>
                <datalist id={listId}>
                  {images.map((image) => (
                    <option key={image.url} value={image.url} />
                  ))}
                </datalist>
                <div className="grid gap-2 sm:grid-cols-2">
                  {images.map((image) => (
                    <button
                      key={image.url}
                      type="button"
                      onClick={() => onChange(image.url)}
                      className={cn(
                        "group overflow-hidden rounded-[16px] border text-left transition-all hover:-translate-y-0.5",
                        value === image.url
                          ? "border-[var(--primary)] bg-[var(--primary)]/8"
                          : "border-[var(--border)] bg-white/82"
                      )}
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="aspect-[5/3] w-full object-cover"
                        loading="lazy"
                      />
                      <div className="p-2">
                        <p className="truncate text-xs font-semibold text-[var(--foreground)]">
                          {image.name}
                        </p>
                        <p className="mt-1 truncate text-[11px] text-[var(--color-muted-raw)]">
                          {image.usedInContent ? "Em uso" : image.source}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </DeveloperField>
  );
}
