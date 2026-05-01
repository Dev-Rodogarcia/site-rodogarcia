"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useCarouselPagination } from "@/hooks/useCarouselPagination";
import { api } from "@/lib/routes";
import {
  DeveloperCard,
  DeveloperField,
  DeveloperHero,
  DeveloperCarouselPagination,
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
  format?: string;
  uploadedAt?: string;
  originalSize?: number;
  optimizedSize?: number;
  thumbnailUrl?: string;
}

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
] as const;
const MEDIA_SLOT_LABELS: Record<string, string> = {
  "home.hero.default": "Home - Hero padrão",
  "home.showcase.quote": "Home - Showcase cotacao",
  "home.showcase.tracking": "Home - Showcase rastreio",
  "home.showcase.coverage": "Home - Showcase cobertura",
  "home.services.distribution.video": "Home - Servicos distribuicao video",
  "home.services.distribution.poster": "Home - Servicos distribuicao poster",
  "home.services.indoor.video": "Home - Servicos indoor video",
  "home.services.indoor.poster": "Home - Servicos indoor poster",
  "home.services.special.video": "Home - Servicos cargas especiais video",
  "home.services.special.poster": "Home - Servicos cargas especiais poster",
  "home.cert.iso": "Home - Certificado ISO",
  "home.cert.sassmaq": "Home - Certificado SASSMAQ",
  "home.cert.ecovadis": "Home - Certificado EcoVadis",
  "home.cert.pf": "Home - Licenca PF",
  "home.cert.pcsp": "Home - Policia Civil SP",
  "home.cert.exercito": "Home - Exercito Brasileiro",
  "home.cert.ibama": "Home - IBAMA",
  "services.hero": "Serviços - Hero/OG",
  "services.module.distribution": "Servicos - Distribuicao imagem",
  "services.module.indoor": "Servicos - Indoor imagem",
  "services.module.special": "Servicos - Cargas especiais imagem",
  "about.hero": "Sobre - Hero",
  "business.hero": "Empresas - Hero/OG",
  "careers.hero": "Carreiras - Hero/OG",
  "careers.culture": "Carreiras - Cultura/beneficios",
  "contact.og": "Contato - OG",
  "popup.desktop": "Popup - Desktop",
  "popup.mobile": "Popup - Mobile",
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ImagensPage() {
  const { apiRequest } = useApiRequest();
  const [previewUrl, setPreviewUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [fromUrl, setFromUrl] = useState("");
  const [toUrl, setToUrl] = useState("");
  const [slots, setSlots] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [savingSlots, setSavingSlots] = useState(false);
  const [status, setStatus] = useState<"" | "success" | "error" | "info">("");
  const [message, setMessage] = useState("");
  const { data, loading, error, refresh } = useAdminResource<{
    images: AdminImageRecord[];
    slots: Record<string, string>;
  }>({
    key: adminResourceKeys.mediaManager,
    fetcher: async (request) => {
      const [imagesResponse, slotsResponse] = await Promise.all([
        request<{ images?: AdminImageRecord[] }>(api.admin.images),
        request<{ slots?: Record<string, string> }>(api.admin.mediaSlots),
      ]);

      if (!imagesResponse.success || !slotsResponse.success) {
        return {
          success: false,
          error:
            imagesResponse.error ??
            slotsResponse.error ??
            "Falha ao carregar imagens.",
        };
      }

      return {
        success: true,
        data: {
          images: imagesResponse.data?.images ?? [],
          slots: slotsResponse.data?.slots ?? {},
        },
      };
    },
  });
  const images = data?.images ?? [];
  const { pages, currentPage, totalPages, nextPage, prevPage } = useCarouselPagination(images, 6);

  const summary = useMemo(
    () => ({
      total: images.length,
      uploads: images.filter((item) => item.source === "upload").length,
      used: images.filter((item) => item.usedInContent).length,
    }),
    [images]
  );

  useEffect(() => {
    if (data?.slots) setSlots(data.slots);
  }, [data?.slots]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setPreviewUrl("");
      setUploadFile(null);
      setFileName("");
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
      setPreviewUrl("");
      setUploadFile(null);
      setFileName("");
      setStatus("error");
      setMessage("Formato não suportado. Use PNG, JPG, WebP ou AVIF.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setPreviewUrl("");
      setUploadFile(null);
      setFileName("");
      setStatus("error");
      setMessage("Imagem acima de 8 MB. Reduza o arquivo antes de enviar.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setPreviewUrl(result);
      setUploadFile(file);
      setFileName(file.name);
      setStatus("info");
      setMessage(`Arquivo pronto para upload: ${file.name}`);
    };
    reader.readAsDataURL(file);
  }

  async function handleUpload() {
    if (!uploadFile || !fileName) {
      setStatus("error");
      setMessage("Selecione uma imagem antes de enviar.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("image", uploadFile);
    const response = await apiRequest(api.admin.images, {
      method: "POST",
      body: formData,
    });
    setUploading(false);

    if (!response.success) {
      setStatus("error");
      setMessage(response.error ?? "Falha ao enviar a imagem.");
      return;
    }

    setPreviewUrl("");
    setUploadFile(null);
    setFileName("");
    setStatus("success");
    setMessage("Imagem enviada e otimizada com sucesso.");
    invalidateAdminResource([adminResourceKeys.images, adminResourceKeys.mediaManager, adminResourceKeys.dashboard]);
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
      setMessage(response.error ?? "Falha ao substituir referências.");
      return;
    }

    setStatus("success");
    setMessage("Referências atualizadas com sucesso.");
    invalidateAdminResource([adminResourceKeys.images, adminResourceKeys.mediaManager, adminResourceKeys.dashboard]);
    await refresh();
  }

  async function handleSaveSlots() {
    setSavingSlots(true);
    const response = await apiRequest(api.admin.mediaSlots, {
      method: "POST",
      body: JSON.stringify(slots),
    });
    setSavingSlots(false);

    if (!response.success) {
      setStatus("error");
      setMessage(response.error ?? "Falha ao salvar slots de mídia.");
      return;
    }

    setStatus("success");
    setMessage("Slots de mídia salvos com sucesso.");
    invalidateAdminResource([adminResourceKeys.images, adminResourceKeys.mediaManager, adminResourceKeys.mediaSlots, adminResourceKeys.dashboard]);
    await refresh();
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setStatus("info");
      setMessage(`URL copiada: ${url}`);
    } catch {
      setStatus("error");
      setMessage("Não foi possível copiar a URL.");
    }
  }

  return (
    <DeveloperPage>
      <DeveloperHero
        eyebrow="Mídia - Biblioteca"
        title="Biblioteca, otimização e slots de imagens."
        description="Envie imagens otimizadas, substitua referências e controle slots usados pelo site."
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
            title="Enviar e otimizar imagem"
            description="O backend valida o arquivo, gera WebP otimizado e thumbnail."
            tooltip="A imagem enviada é validada, otimizada e registrada com tamanho, formato e data de upload."
          />

          <div className="space-y-5">
            <DeveloperField label="Selecionar arquivo">
              <input
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
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
              {uploading ? "Otimizando..." : "Enviar e otimizar"}
            </button>
          </div>

          <div className="mt-8 border-t border-[var(--border)] pt-8">
            <DeveloperSectionHeading
              eyebrow="Substituição"
              title="Trocar referências no conteúdo"
              description="Atualiza caminhos de imagem em content.json e site-texts.json."
              tooltip="Substitui uma URL antiga por outra nos conteúdos do CMS. Exemplo: trocar /old.png por /uploads/new.webp."
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

              <button
                type="button"
                onClick={handleReplace}
                disabled={replacing}
                title="Substitui referências de imagem nos conteúdos do CMS."
                className={developerSecondaryButtonClassName}
              >
                <MagicWand size={16} weight="bold" />
                {replacing ? "Substituindo..." : "Substituir referências"}
              </button>
            </div>
          </div>

          <div className="mt-6 border-t border-[var(--border)] pt-6">
            <DeveloperSectionHeading
              eyebrow="Slots"
              title="Imagens controladas pelo CMS"
              description="O site usa fallback quando um slot fica vazio."
              tooltip="Slots conectam uma imagem da biblioteca a uma área do site. Exemplo: Popup - Mobile usa a imagem no popup de celular."
            />

            <div className="space-y-3">
              {Object.entries(MEDIA_SLOT_LABELS).map(([slotKey, label]) => (
                <DeveloperField key={slotKey} label={label}>
                  <input
                    list="image-url-options"
                    value={slots[slotKey] ?? ""}
                    onChange={(event) =>
                      setSlots((current) => ({ ...current, [slotKey]: event.target.value }))
                    }
                    className={developerInputClassName}
                    placeholder="/uploads/imagem.webp"
                  />
                </DeveloperField>
              ))}

              <button
                type="button"
                onClick={handleSaveSlots}
                disabled={savingSlots}
                className={developerPrimaryButtonClassName}
              >
                <MagicWand size={16} weight="bold" />
                {savingSlots ? "Salvando..." : "Salvar configuração"}
              </button>
            </div>
          </div>
        </DeveloperCard>

        <DeveloperCard>
          <DeveloperSectionHeading
            eyebrow="Biblioteca"
            title="Imagens encontradas no projeto"
            description="Lista priorizando assets em uso para facilitar manutenção do CMS."
          />

          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)]"
              style={{ transform: `translateX(-${currentPage * 100}%)` }}
            >
              {pages.map((page, index) => (
                <div key={index} className="w-full shrink-0 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                  {page.map((image) => (
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
                          {formatBytes(image.optimizedSize ?? image.size)} - {image.format ?? "asset"} - {image.references} refs
                        </p>
                        {image.uploadedAt ? (
                          <p className="mt-1 text-[11px] text-[var(--color-muted-raw)]">
                            Upload: {new Date(image.uploadedAt).toLocaleDateString("pt-BR")}
                          </p>
                        ) : null}

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
              ))}
            </div>
          </div>

          <DeveloperCarouselPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onNext={nextPage}
            onPrev={prevPage}
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
