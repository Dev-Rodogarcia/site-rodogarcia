"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  ArrowsDownUp,
  CheckCircle,
  PencilSimple,
  Plus,
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

interface HeroButtonForm {
  label: string;
  url: string;
  enabled: boolean;
  color: string;
  variant: "solid" | "outline";
}

interface HeroFormState {
  title: string;
  description: string;
  image: string;
  desktopImage: string;
  mobileImage: string;
  active: boolean;
  layoutMode: "text-image" | "full-image";
  fullImageButtonsEnabled: boolean;
  fullImageBackgroundType: "wavy" | "straight";
  buttons: [HeroButtonForm, HeroButtonForm];
}

interface HeroItem extends HeroFormState {
  id: string;
  order?: number;
}

const EMPTY_FORM: HeroFormState = {
  title: "",
  description: "",
  image: "",
  desktopImage: "",
  mobileImage: "",
  active: true,
  layoutMode: "text-image",
  fullImageButtonsEnabled: false,
  fullImageBackgroundType: "wavy",
  buttons: [
    { label: "", url: "", enabled: false, color: "#ffffff", variant: "solid" },
    { label: "", url: "", enabled: false, color: "", variant: "outline" },
  ],
};

function normalizeHeroItem(item: Record<string, unknown>): HeroItem {
  const rawButtons = Array.isArray(item.buttons) ? item.buttons : [];
  const firstButton = (rawButtons[0] as Record<string, unknown> | undefined) ?? {};
  const secondButton = (rawButtons[1] as Record<string, unknown> | undefined) ?? {};

  return {
    id: String(item.id ?? ""),
    order: Number(item.order ?? 0),
    title: String(item.title ?? ""),
    description: String(item.description ?? ""),
    image: String(item.image ?? ""),
    desktopImage: String(item.desktopImage ?? ""),
    mobileImage: String(item.mobileImage ?? ""),
    active: Boolean(item.active ?? true),
    layoutMode: item.layoutMode === "full-image" ? "full-image" : "text-image",
    fullImageButtonsEnabled: Boolean(item.fullImageButtonsEnabled),
    fullImageBackgroundType:
      item.fullImageBackgroundType === "straight" ? "straight" : "wavy",
    buttons: [
      {
        label: String(firstButton.label ?? ""),
        url: String(firstButton.url ?? ""),
        enabled: Boolean(firstButton.enabled),
        color: String(firstButton.color ?? "#ffffff") || "#ffffff",
        variant: firstButton.variant === "outline" ? "outline" : "solid",
      },
      {
        label: String(secondButton.label ?? ""),
        url: String(secondButton.url ?? ""),
        enabled: Boolean(secondButton.enabled),
        color: String(secondButton.color ?? ""),
        variant: secondButton.variant === "solid" ? "solid" : "outline",
      },
    ],
  };
}

export default function HomeHeroPage() {
  const { items, loading, error, createItem, updateItem, removeItem, moveItem } =
    useAdminCollection<HeroItem>("hero", { normalize: normalizeHeroItem });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<HeroFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  const activeButtons = useMemo(
    () => form.buttons.filter((button) => button.enabled).length,
    [form.buttons]
  );
  const { pages, currentPage, totalPages, nextPage, prevPage } = useCarouselPagination(items);

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setStatus("");
  }

  function editItem(item: HeroItem) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description,
      image: item.image,
      desktopImage: item.desktopImage,
      mobileImage: item.mobileImage,
      active: item.active,
      layoutMode: item.layoutMode,
      fullImageButtonsEnabled: item.fullImageButtonsEnabled,
      fullImageBackgroundType: item.fullImageBackgroundType,
      buttons: item.buttons,
    });
    setStatus("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const title = form.title.trim();
    const image = form.image.trim();
    const description = form.description.trim();

    if (!title || !image || (form.layoutMode === "text-image" && !description)) {
      setStatus("Preencha título, imagem e descrição quando o layout usar texto.");
      return;
    }

    setSaving(true);
    setStatus("");

    const payload = {
      ...form,
      title,
      image,
      desktopImage: form.desktopImage.trim(),
      mobileImage: form.mobileImage.trim(),
      description: form.layoutMode === "full-image" ? "" : description,
      buttons:
        form.layoutMode === "full-image" && !form.fullImageButtonsEnabled
          ? form.buttons.map((button) => ({ ...button, enabled: false }))
          : form.buttons,
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

  async function toggleItem(item: HeroItem) {
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

  function updateButton(index: 0 | 1, patch: Partial<HeroButtonForm>) {
    setForm((current) => {
      const nextButtons = [...current.buttons] as [HeroButtonForm, HeroButtonForm];
      nextButtons[index] = { ...nextButtons[index], ...patch };
      return { ...current, buttons: nextButtons };
    });
  }

  return (
    <DeveloperPage>
      <DeveloperHero
        eyebrow="Home • Hero"
        title="Editor completo do hero principal."
        description="Configure layout, imagem responsiva, fundo de banner inteiro e botões do carrossel sem depender do HTML legado."
        stats={[
          { label: "Slides", value: items.length },
          { label: "Botões ativos", value: activeButtons },
        ]}
      />

      <section className={developerSplitLayoutClassName}>
        <DeveloperCard>
          <DeveloperSectionHeading
            eyebrow={editingId ? "Edição" : "Novo slide"}
            title={editingId ? "Atualizar slide do hero" : "Cadastrar slide do hero"}
            description="O modo imagem completa desativa a descrição e pode opcionalmente centralizar os botões sobre a arte."
          />

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <DeveloperField label="Tipo de layout" required className="sm:col-span-2">
                <div className="grid min-w-0 gap-3 xl:grid-cols-2">
                  {[
                    { value: "text-image" as const, label: "Texto + imagem" },
                    { value: "full-image" as const, label: "Imagem completa" },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        "group flex min-h-[84px] min-w-0 cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 text-sm font-medium transition-all duration-200",
                        form.layoutMode === option.value
                          ? "border-[var(--primary)] bg-[var(--primary)]/5 shadow-[inset_0_0_0_1px_var(--primary)]"
                          : "border-[var(--border)]/80 bg-white hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      <input
                        type="radio"
                        name="hero-layout"
                        value={option.value}
                        checked={form.layoutMode === option.value}
                        onChange={() => setForm((current) => ({ ...current, layoutMode: option.value }))}
                        className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-[var(--primary)]"
                      />
                      <span className="flex min-w-0 flex-col">
                        <span className={cn(
                          "text-sm font-bold tracking-tight transition-colors",
                          form.layoutMode === option.value ? "text-[var(--primary)]" : "text-[var(--foreground)]"
                        )}>
                          {option.label}
                        </span>
                        <span className="mt-1 text-xs leading-5 text-[var(--color-muted-raw)]">
                          {option.value === "text-image"
                            ? "Mantém título, descrição e imagem lado a lado."
                            : "Destaca a arte do banner e simplifica o bloco textual."}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </DeveloperField>

              {form.layoutMode === "full-image" ? (
                <DeveloperField
                  label="Fundo do banner inteiro"
                  hint="Use reto quando a imagem precisar preencher o bloco sem o shape ondulado."
                >
                  <select
                    value={form.fullImageBackgroundType}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        fullImageBackgroundType: event.target.value as "wavy" | "straight",
                      }))
                    }
                    className={developerInputClassName}
                  >
                    <option value="wavy">Ondulado</option>
                    <option value="straight">Reto</option>
                  </select>
                </DeveloperField>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DeveloperField
                label="Título interno"
                required
                hint="Serve para identificar o slide no CMS. No modo imagem completa ele não aparece no banner."
              >
                <input
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  maxLength={120}
                  className={developerInputClassName}
                />
              </DeveloperField>

              <DeveloperImageField
                label="Imagem principal"
                required
                hint="Selecione um asset da biblioteca ou informe um caminho como /uploads/banner.webp."
                value={form.image}
                onChange={(image) => setForm((current) => ({ ...current, image }))}
                previewAlt={form.title || "Preview do slide"}
              />
            </div>

            {form.layoutMode === "text-image" ? (
              <DeveloperField label="Descrição" required>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                  maxLength={420}
                  className={`${developerInputClassName} resize-none`}
                />
              </DeveloperField>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <DeveloperImageField
                label="Imagem desktop"
                hint="Opcional. Se vazio, o front reutiliza a imagem principal."
                value={form.desktopImage}
                onChange={(desktopImage) =>
                  setForm((current) => ({ ...current, desktopImage }))
                }
                previewAlt={form.title || "Preview desktop do slide"}
              />
              <DeveloperImageField
                label="Imagem mobile"
                hint="Opcional. Use quando o crop do hero precisar mudar no celular."
                value={form.mobileImage}
                onChange={(mobileImage) =>
                  setForm((current) => ({ ...current, mobileImage }))
                }
                previewAlt={form.title || "Preview mobile do slide"}
              />
            </div>

            {form.layoutMode === "full-image" ? (
              <label className="flex min-h-[50px] cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)]/80 bg-white px-4 py-3 text-sm font-semibold text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition-all duration-200 hover:border-slate-300 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={form.fullImageButtonsEnabled}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      fullImageButtonsEnabled: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 cursor-pointer accent-[var(--primary)]"
                />
                Centralizar botões sobre a imagem
              </label>
            ) : null}

            {(form.layoutMode === "text-image" || form.fullImageButtonsEnabled) && (
              <div className="rounded-[26px] border border-[var(--border)] bg-white/68 p-4 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                      Botões do slide
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-muted-raw)]">
                      Configure o CTA primário e o botão secundário sem apertar o layout.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4">
                  {form.buttons.map((button, index) => (
                    <div
                      key={index}
                      className="flex h-full flex-col gap-4 rounded-[24px] border border-[var(--border)] bg-white/78 p-4 sm:p-5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold tracking-[-0.03em] text-[var(--foreground)]">
                            Botão {index + 1}
                          </p>
                          <p className="text-xs text-[var(--color-muted-raw)]">
                            {index === 0 ? "CTA principal do slide" : "Acao complementar"}
                          </p>
                        </div>
                        <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
                          {index === 0 ? "Primário" : "Secundário"}
                        </span>
                      </div>

                      <DeveloperField label="Texto do botão">
                        <input
                          value={button.label}
                          onChange={(event) => updateButton(index as 0 | 1, { label: event.target.value })}
                          maxLength={40}
                          className={developerInputClassName}
                        />
                      </DeveloperField>

                      <DeveloperField label="Link de destino">
                        <input
                          value={button.url}
                          onChange={(event) => updateButton(index as 0 | 1, { url: event.target.value })}
                          className={developerInputClassName}
                        />
                      </DeveloperField>

                      <div className={index === 0 ? "grid gap-4 lg:grid-cols-[minmax(0,1fr)_148px]" : "grid gap-4 lg:grid-cols-2"}>
                        <label className="flex min-h-[50px] cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)]/80 bg-white px-4 py-3 text-sm font-semibold text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition-all duration-200 hover:border-slate-300 hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={button.enabled}
                            onChange={(event) =>
                              updateButton(index as 0 | 1, { enabled: event.target.checked })
                            }
                            className="h-4 w-4 cursor-pointer accent-[var(--primary)]"
                          />
                          Botão ativo
                        </label>
                        {index === 0 ? (
                          <DeveloperField label="Cor do botão">
                            <div className="flex h-[50px] w-full items-center gap-3 rounded-xl border border-[var(--border)]/80 bg-white px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition-all duration-200 focus-within:border-[var(--primary)]/35 focus-within:ring-4 focus-within:ring-[var(--primary)]/10 hover:border-slate-300">
                              <input
                                type="color"
                                value={button.color || "#ffffff"}
                                onChange={(event) =>
                                  updateButton(index as 0 | 1, { color: event.target.value })
                                }
                                className="h-7 w-12 cursor-pointer appearance-none rounded-lg border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border [&::-webkit-color-swatch]:border-black/10"
                              />
                              <span className="text-sm font-semibold uppercase tracking-wider text-[var(--foreground)]">
                                {button.color || "#ffffff"}
                              </span>
                            </div>
                          </DeveloperField>
                        ) : (
                          <label className="flex min-h-[50px] cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)]/80 bg-white px-4 py-3 text-sm font-semibold text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition-all duration-200 hover:border-slate-300 hover:bg-slate-50">
                            <input
                              type="checkbox"
                              checked={button.variant === "outline"}
                              onChange={(event) =>
                                updateButton(index as 0 | 1, {
                                  variant: event.target.checked ? "outline" : "solid",
                                })
                              }
                              className="h-4 w-4 cursor-pointer accent-[var(--primary)]"
                            />
                            Exibir em outline
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <label className="flex min-h-[50px] cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)]/80 bg-white px-4 py-3 text-sm font-semibold text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] transition-all duration-200 hover:border-slate-300 hover:bg-slate-50">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
                className="h-4 w-4 cursor-pointer accent-[var(--primary)]"
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
            title="Lista do hero"
            description="Reordene, ative ou edite os slides sem sair desta tela."
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
                              ? `Fundo ${item.fullImageBackgroundType === "straight" ? "reto" : "ondulado"} • ${item.fullImageButtonsEnabled ? "com botões" : "sem botões"}`
                              : item.description || "Sem descrição cadastrada."}
                          </p>
                          <p className="mt-2 text-xs leading-6 text-[var(--color-muted-raw)]">
                            Imagem: {item.image || "-"} • responsivo:{" "}
                            {item.desktopImage || item.mobileImage ? "configurado" : "usa a imagem principal"}
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
                            <ArrowsDownUp size={16} weight="bold" className="rotate-180" />
                            Subir
                          </button>
                          <button
                            type="button"
                            onClick={() => move(item.id, 1)}
                            className={developerGhostButtonClassName}
                          >
                            <ArrowsDownUp size={16} weight="bold" />
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
