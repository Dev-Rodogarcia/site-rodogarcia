"use client";

import { useState } from "react";
import {
  CheckCircle,
  PencilSimple,
  Plus,
  SortAscending,
  Trash,
  X,
} from "@phosphor-icons/react";
import { useAdminCollection } from "@/hooks/useAdminCollection";
import { useCarouselPagination } from "@/hooks/useCarouselPagination";
import { DeveloperConfirmButton } from "@/components/developer/DeveloperConfirmButton";
import { DeveloperImageField } from "@/components/developer/DeveloperImageField";
import {
  DeveloperCard,
  DeveloperField,
  DeveloperHero,
  DeveloperCarouselPagination,
  DeveloperMessage,
  DeveloperPage,
  DeveloperSectionHeading,
  DeveloperStatusPill,
  developerSplitLayoutClassName,
  developerGhostButtonClassName,
  developerInputClassName,
  developerPrimaryButtonClassName,
  developerSecondaryButtonClassName,
} from "@/components/developer/ui";

interface DnaFormState {
  title: string;
  text: string;
  image: string;
  video: string;
  desktopImage: string;
  mobileImage: string;
  desktopVideo: string;
  mobileVideo: string;
  active: boolean;
  layoutMode: "text-image" | "full-image";
}

interface DnaItem extends DnaFormState {
  id: string;
  order?: number;
}

const EMPTY_FORM: DnaFormState = {
  title: "",
  text: "",
  image: "",
  video: "",
  desktopImage: "",
  mobileImage: "",
  desktopVideo: "",
  mobileVideo: "",
  active: true,
  layoutMode: "text-image",
};

function normalizeDnaItem(item: Record<string, unknown>): DnaItem {
  return {
    id: String(item.id ?? ""),
    order: Number(item.order ?? 0),
    title: String(item.title ?? ""),
    text: String(item.text ?? ""),
    image: String(item.image ?? ""),
    video: String(item.video ?? ""),
    desktopImage: String(item.desktopImage ?? ""),
    mobileImage: String(item.mobileImage ?? ""),
    desktopVideo: String(item.desktopVideo ?? ""),
    mobileVideo: String(item.mobileVideo ?? ""),
    active: Boolean(item.active ?? true),
    layoutMode: item.layoutMode === "full-image" ? "full-image" : "text-image",
  };
}

export default function HomeDnaPage() {
  const { items, loading, error, createItem, updateItem, removeItem, moveItem } =
    useAdminCollection<DnaItem>("dna", { normalize: normalizeDnaItem });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DnaFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const { pages, currentPage, totalPages, nextPage, prevPage } = useCarouselPagination(items);

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setStatus("");
  }

  function editItem(item: DnaItem) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      text: item.text,
      image: item.image,
      video: item.video,
      desktopImage: item.desktopImage,
      mobileImage: item.mobileImage,
      desktopVideo: item.desktopVideo,
      mobileVideo: item.mobileVideo,
      active: item.active,
      layoutMode: item.layoutMode,
    });
    setStatus("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const title = form.title.trim();
    const image = form.image.trim();
    const video = form.video.trim();
    const text = form.text.trim();

    if (!title && !image && !video) {
      setStatus("Preencha ao menos titulo, imagem ou video.");
      return;
    }

    if (title && !image && !video) {
      setStatus("Preencha imagem ou video quando houver titulo.");
      return;
    }

    if (form.layoutMode === "text-image" && title && !text) {
      setStatus("Preencha o texto quando o layout usar texto.");
      return;
    }

    setSaving(true);
    setStatus("");

    const payload = {
      ...form,
      title,
      image,
      video,
      desktopImage: form.desktopImage.trim(),
      mobileImage: form.mobileImage.trim(),
      desktopVideo: form.desktopVideo.trim(),
      mobileVideo: form.mobileVideo.trim(),
      text: form.layoutMode === "full-image" ? "" : text,
    };

    const response = editingId
      ? await updateItem(editingId, payload)
      : await createItem(payload);

    setSaving(false);

    if (!response.success) {
      setStatus(response.error ?? "Falha ao salvar o slide.");
      return;
    }

    setStatus("Slide salvo com sucesso.");
    resetForm();
  }

  async function toggleItem(item: DnaItem) {
    const response = await updateItem(item.id, { ...item, active: !item.active });
    if (!response.success) {
      setStatus(response.error ?? "Falha ao atualizar o slide.");
    }
  }

  async function deleteItem(id: string) {
    const response = await removeItem(id);
    if (!response.success) {
      setStatus(response.error ?? "Falha ao excluir o slide.");
    }
  }

  async function move(id: string, direction: -1 | 1) {
    const response = await moveItem(id, direction);
    if (!response.success && response.error !== "Movimento invalido.") {
      setStatus(response.error ?? "Falha ao reordenar o slide.");
    }
  }

  return (
    <DeveloperPage>
      <DeveloperHero
        eyebrow="Home • DNA"
        title="Editor da faixa DNA da empresa."
        description="Mantenha o bloco institucional da home com os mesmos modos de layout e imagens responsivas da versão estática."
        stats={[
          { label: "Slides", value: items.length },
          { label: "Ativos", value: items.filter((item) => item.active).length },
        ]}
      />

      <section className={developerSplitLayoutClassName}>
        <DeveloperCard>
          <DeveloperSectionHeading
            eyebrow={editingId ? "Edição" : "Novo slide"}
            title={editingId ? "Atualizar slide do DNA" : "Cadastrar slide do DNA"}
            description="No modo imagem completa o texto fica oculto, mantendo apenas a arte no carrossel."
          />

          <form className="space-y-5" onSubmit={handleSubmit}>
            <DeveloperField label="Tipo de layout" required>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { value: "text-image" as const, label: "Texto + imagem" },
                  { value: "full-image" as const, label: "Imagem completa" },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex min-h-14 items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/72 px-4 py-3 text-sm font-medium text-[var(--foreground)]"
                  >
                    <input
                      type="radio"
                      name="dna-layout"
                      checked={form.layoutMode === option.value}
                      onChange={() => setForm((current) => ({ ...current, layoutMode: option.value }))}
                      className="h-4 w-4 accent-[var(--primary)]"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </DeveloperField>

            <div className="grid gap-4 sm:grid-cols-2">
              <DeveloperField label="Título interno">
                <input
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  maxLength={120}
                  className={developerInputClassName}
                />
              </DeveloperField>
              <DeveloperImageField
                label="Imagem principal"
                value={form.image}
                onChange={(image) => setForm((current) => ({ ...current, image }))}
                previewAlt={form.title || "Preview do slide DNA"}
              />
            </div>

            <DeveloperField
              label="Video principal"
              hint="Opcional. Use um caminho publico como /caminhoes1.mp4; quando preenchido, o video tem prioridade sobre a imagem."
            >
              <input
                value={form.video}
                onChange={(event) =>
                  setForm((current) => ({ ...current, video: event.target.value }))
                }
                className={developerInputClassName}
                placeholder="/uploads/video.mp4"
              />
            </DeveloperField>

            {form.layoutMode === "text-image" ? (
              <DeveloperField label="Texto" required>
                <textarea
                  rows={4}
                  value={form.text}
                  onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))}
                  maxLength={420}
                  className={`${developerInputClassName} resize-none`}
                />
              </DeveloperField>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <DeveloperImageField
                label="Imagem desktop"
                hint="Opcional. Reaproveita a imagem principal se ficar vazio."
                value={form.desktopImage}
                onChange={(desktopImage) =>
                  setForm((current) => ({ ...current, desktopImage }))
                }
                previewAlt={form.title || "Preview desktop do DNA"}
              />
              <DeveloperImageField
                label="Imagem mobile"
                hint="Opcional. Use quando o crop precisar ser diferente."
                value={form.mobileImage}
                onChange={(mobileImage) =>
                  setForm((current) => ({ ...current, mobileImage }))
                }
                previewAlt={form.title || "Preview mobile do DNA"}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DeveloperField
                label="Video desktop"
                hint="Opcional. Reaproveita o video principal se ficar vazio."
              >
                <input
                  value={form.desktopVideo}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      desktopVideo: event.target.value,
                    }))
                  }
                  className={developerInputClassName}
                  placeholder="/uploads/video-desktop.mp4"
                />
              </DeveloperField>
              <DeveloperField
                label="Video mobile"
                hint="Opcional. Use quando o recorte mobile precisar ser diferente."
              >
                <input
                  value={form.mobileVideo}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      mobileVideo: event.target.value,
                    }))
                  }
                  className={developerInputClassName}
                  placeholder="/uploads/video-mobile.mp4"
                />
              </DeveloperField>
            </div>

            <label className="flex min-h-14 items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/72 px-4 py-3 text-sm font-medium text-[var(--foreground)]">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              Slide ativo
            </label>

            {status ? (
              <DeveloperMessage tone={status.includes("sucesso") ? "success" : "error"}>
                {status}
              </DeveloperMessage>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="submit" disabled={saving} className={developerPrimaryButtonClassName}>
                <CheckCircle size={18} weight="bold" />
                {saving ? "Salvando..." : "Salvar configuração"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                title="Limpa os campos do formulário sem apagar slides salvos."
                className={developerSecondaryButtonClassName}
              >
                <X size={18} weight="bold" />
                Limpar
              </button>
            </div>
          </form>
        </DeveloperCard>

        <DeveloperCard>
          <DeveloperSectionHeading
            eyebrow="Slides cadastrados"
            title="Lista do DNA"
            description="Ordene os cards e ajuste rapidamente o que já está publicado."
            action={
              <button type="button" onClick={resetForm} className={developerSecondaryButtonClassName}>
                <Plus size={16} weight="bold" />
                Novo slide
              </button>
            }
          />

          {loading ? <DeveloperMessage tone="info">Carregando slides...</DeveloperMessage> : null}
          {error ? <DeveloperMessage tone="error">{error}</DeveloperMessage> : null}

          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)]"
              style={{ transform: `translateX(-${currentPage * 100}%)` }}
            >
              {pages.map((page, pageIndex) => (
                <div key={pageIndex} className="w-full shrink-0 space-y-4">
                  {page.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-[24px] border border-[var(--border)] bg-white/72 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-raw)]">
                            Ordem {item.order ?? 0}
                          </span>
                          <DeveloperStatusPill active={item.active} />
                          <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
                            {item.layoutMode === "full-image" ? "Imagem completa" : "Texto + imagem"}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
                            {item.title || "Slide sem título"}
                          </h3>
                          <p className="mt-2 text-sm leading-7 text-[var(--color-muted-raw)]">
                            {item.layoutMode === "full-image"
                              ? "Slide visual sem bloco de texto."
                              : item.text || "Sem texto cadastrado."}
                          </p>
                          <p className="mt-2 text-xs leading-6 text-[var(--color-muted-raw)]">
                            Imagem: {item.image || "-"} • responsivo:{" "}
                            {item.desktopImage || item.mobileImage ? "configurado" : "usa a imagem principal"}
                          </p>
                          <p className="mt-1 text-xs leading-6 text-[var(--color-muted-raw)]">
                            Video: {item.video || "-"} - responsivo:{" "}
                            {item.desktopVideo || item.mobileVideo ? "configurado" : "usa o video principal"}
                          </p>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          <button
                            type="button"
                            onClick={() => editItem(item)}
                            className={developerSecondaryButtonClassName}
                          >
                            <PencilSimple size={16} weight="bold" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleItem(item)}
                            title={item.active ? "Desativa este slide no site público." : "Ativa este slide no site público."}
                            className={developerGhostButtonClassName}
                          >
                            <CheckCircle size={16} weight="bold" />
                            {item.active ? "Desativar" : "Ativar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => move(item.id, -1)}
                            className={developerGhostButtonClassName}
                          >
                            <SortAscending size={16} weight="bold" />
                            Subir
                          </button>
                          <button
                            type="button"
                            onClick={() => move(item.id, 1)}
                            className={developerGhostButtonClassName}
                          >
                            <SortAscending size={16} weight="bold" className="rotate-180" />
                            Descer
                          </button>
                          <DeveloperConfirmButton
                            message="Confirmar exclusão"
                            onConfirm={() => deleteItem(item.id)}
                          >
                            <Trash size={16} weight="bold" />
                            Excluir
                          </DeveloperConfirmButton>
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
        </DeveloperCard>
      </section>
    </DeveloperPage>
  );
}
