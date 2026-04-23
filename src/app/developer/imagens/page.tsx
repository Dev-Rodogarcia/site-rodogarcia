"use client";

import { useMemo, useState } from "react";
import {
  Copy,
  ImagesSquare,
  MagicWand,
  UploadSimple,
} from "@phosphor-icons/react";
import { useApiRequest } from "@/hooks/useApiRequest";
import {
  adminResourceKeys,
  invalidateAdminResource,
  useAdminResource,
} from "@/hooks/useAdminResource";
import { useLoadMoreList } from "@/hooks/useLoadMoreList";
import { api } from "@/lib/routes";
import {
  DeveloperCard,
  DeveloperField,
  DeveloperHero,
  DeveloperLoadMore,
  DeveloperMessage,
  DeveloperPage,
  DeveloperSectionHeading,
  developerSplitLayoutClassName,
  developerInputClassName,
  developerPrimaryButtonClassName,
  developerSecondaryButtonClassName,
} from "@/components/developer/ui";

interface AdminImageRecord {
  name: string;
  url: string;
  source: "upload" | "content" | "library";
  usedInContent: boolean;
  size: number;
  references: number;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ImagensPage() {
  const { apiRequest } = useApiRequest();
  const [previewUrl, setPreviewUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploadDataUrl, setUploadDataUrl] = useState("");
  const [fromUrl, setFromUrl] = useState("");
  const [toUrl, setToUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [status, setStatus] = useState<"" | "success" | "error" | "info">("");
  const [message, setMessage] = useState("");
  const { data, loading, error, refresh } = useAdminResource<AdminImageRecord[]>({
    key: adminResourceKeys.images,
    fetcher: async (request) => {
      const response = await request<{ images?: AdminImageRecord[] }>(api.admin.images);

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
  });
  const images = data ?? [];
  const {
    visibleItems: visibleImages,
    visibleCount,
    totalCount,
    showMore,
    showAll,
  } = useLoadMoreList(images, 6);

  const summary = useMemo(
    () => ({
      total: images.length,
      uploads: images.filter((item) => item.source === "upload").length,
      used: images.filter((item) => item.usedInContent).length,
    }),
    [images]
  );

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setPreviewUrl("");
      setUploadDataUrl("");
      setFileName("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setPreviewUrl(result);
      setUploadDataUrl(result);
      setFileName(file.name);
      setStatus("info");
      setMessage(`Arquivo pronto para upload: ${file.name}`);
    };
    reader.readAsDataURL(file);
  }

  async function handleUpload() {
    if (!uploadDataUrl || !fileName) {
      setStatus("error");
      setMessage("Selecione uma imagem antes de enviar.");
      return;
    }

    setUploading(true);
    const response = await apiRequest(api.admin.images, {
      method: "POST",
      body: JSON.stringify({ fileName, dataUrl: uploadDataUrl }),
    });
    setUploading(false);

    if (!response.success) {
      setStatus("error");
      setMessage(response.error ?? "Falha ao enviar a imagem.");
      return;
    }

    setPreviewUrl("");
    setUploadDataUrl("");
    setFileName("");
    setStatus("success");
    setMessage("Imagem enviada com sucesso.");
    invalidateAdminResource([adminResourceKeys.images, adminResourceKeys.dashboard]);
    await refresh();
  }

  async function handleReplace() {
    if (!fromUrl || !toUrl) {
      setStatus("error");
      setMessage("Preencha a URL atual e a nova URL.");
      return;
    }

    setReplacing(true);
    const response = await apiRequest(api.admin.replaceImageReference, {
      method: "POST",
      body: JSON.stringify({ fromUrl, toUrl }),
    });
    setReplacing(false);

    if (!response.success) {
      setStatus("error");
      setMessage(response.error ?? "Falha ao substituir referencias.");
      return;
    }

    setStatus("success");
    setMessage("Referencias atualizadas com sucesso.");
    invalidateAdminResource([adminResourceKeys.images, adminResourceKeys.dashboard]);
    await refresh();
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setStatus("info");
      setMessage(`URL copiada: ${url}`);
    } catch {
      setStatus("error");
      setMessage("Nao foi possivel copiar a URL.");
    }
  }

  return (
    <DeveloperPage>
      <DeveloperHero
        eyebrow="Midia - Biblioteca"
        title="Upload e substituicao de imagens."
        description="A biblioteca lista os assets do /public, prioriza o que esta em uso e permite trocar links no content e no site texts."
        stats={[
          { label: "Total", value: summary.total },
          { label: "Uploads", value: summary.uploads },
          { label: "Em uso", value: summary.used },
        ]}
      />

      {loading ? (
        <div className="mt-6">
          <DeveloperMessage tone="info">Carregando biblioteca de imagens...</DeveloperMessage>
        </div>
      ) : null}

      {status ? (
        <div className="mt-6">
          <DeveloperMessage
            tone={status === "success" ? "success" : status === "error" ? "error" : "info"}
          >
            {message}
          </DeveloperMessage>
        </div>
      ) : null}

      {error ? (
        <div className="mt-6">
          <DeveloperMessage tone="error">{error}</DeveloperMessage>
        </div>
      ) : null}

      <section className={developerSplitLayoutClassName}>
        <DeveloperCard>
          <DeveloperSectionHeading
            eyebrow="Upload"
            title="Enviar nova imagem"
            description="Selecione um arquivo e envie para /public/uploads."
          />

          <div className="space-y-5">
            <DeveloperField label="Selecionar arquivo">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/avif"
                onChange={handleFileChange}
                className={developerInputClassName}
              />
            </DeveloperField>

            <div className="rounded-[24px] border border-[var(--border)] bg-white/68 p-4">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview da imagem selecionada"
                  className="aspect-[4/3] w-full rounded-[20px] object-cover"
                />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center rounded-[20px] border border-dashed border-[var(--border)] bg-white/72 text-sm text-[var(--color-muted-raw)]">
                  Selecione uma imagem para visualizar o preview.
                </div>
              )}
            </div>

            <button type="button" onClick={handleUpload} disabled={uploading} className={developerPrimaryButtonClassName}>
              <UploadSimple size={18} weight="bold" />
              {uploading ? "Enviando..." : "Upload da imagem"}
            </button>
          </div>

          <div className="mt-8 border-t border-[var(--border)] pt-8">
            <DeveloperSectionHeading
              eyebrow="Substituicao"
              title="Trocar referencias no conteudo"
              description="Atualiza caminhos de imagem em content.json e site-texts.json."
            />

            <div className="space-y-4">
              <DeveloperField label="URL atual">
                <input
                  list="image-url-options"
                  value={fromUrl}
                  onChange={(event) => setFromUrl(event.target.value)}
                  className={developerInputClassName}
                />
              </DeveloperField>

              <DeveloperField label="Nova URL">
                <input
                  list="image-url-options"
                  value={toUrl}
                  onChange={(event) => setToUrl(event.target.value)}
                  className={developerInputClassName}
                />
              </DeveloperField>

              <datalist id="image-url-options">
                {images.map((image) => (
                  <option key={image.url} value={image.url} />
                ))}
              </datalist>

              <button type="button" onClick={handleReplace} disabled={replacing} className={developerSecondaryButtonClassName}>
                <MagicWand size={16} weight="bold" />
                {replacing ? "Substituindo..." : "Substituir referencias"}
              </button>
            </div>
          </div>
        </DeveloperCard>

        <DeveloperCard>
          <DeveloperSectionHeading
            eyebrow="Biblioteca"
            title="Imagens encontradas no projeto"
            description="Lista priorizando assets em uso para facilitar manutencao do CMS."
          />

          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {visibleImages.map((image) => (
              <article
                key={image.url}
                className="overflow-hidden rounded-[20px] border border-[var(--border)] bg-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
              >
                <img
                  src={image.url}
                  alt={image.name}
                  className="aspect-[5/4] w-full object-cover"
                  loading="lazy"
                />

                <div className="p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
                      {image.source}
                    </span>
                    {image.usedInContent ? (
                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600">
                        Em uso
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-2.5 truncate text-sm font-medium text-[var(--foreground)]">
                    {image.name}
                  </p>
                  <p className="mt-1 break-all text-[11px] leading-5 text-[var(--color-muted-raw)]">
                    {image.url}
                  </p>
                  <p className="mt-1.5 text-[11px] text-[var(--color-muted-raw)]">
                    {formatBytes(image.size)} - {image.references} referencias
                  </p>

                  <div className="mt-3 grid gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setToUrl(image.url);
                        setStatus("info");
                        setMessage(`URL preenchida como destino: ${image.url}`);
                      }}
                      className={`${developerSecondaryButtonClassName} min-h-10 rounded-xl px-3 py-2 text-xs`}
                    >
                      <ImagesSquare size={16} weight="bold" />
                      Usar como destino
                    </button>
                    <button
                      type="button"
                      onClick={() => void copyUrl(image.url)}
                      className={`${developerSecondaryButtonClassName} min-h-10 rounded-xl px-3 py-2 text-xs`}
                    >
                      <Copy size={16} weight="bold" />
                      Copiar URL
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <DeveloperLoadMore
            shown={visibleCount}
            total={totalCount}
            onClick={showMore}
            onShowAll={totalCount - visibleCount > 12 ? showAll : undefined}
          />

          {!loading && images.length === 0 ? (
            <div className="mt-4">
              <DeveloperMessage tone="info">
                Nenhuma imagem foi encontrada na biblioteca atual.
              </DeveloperMessage>
            </div>
          ) : null}
        </DeveloperCard>
      </section>
    </DeveloperPage>
  );
}
