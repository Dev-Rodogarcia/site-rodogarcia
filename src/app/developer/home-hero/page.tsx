"use client";

import { useMemo, useState } from "react";
import {
  ArrowsDownUp,
  CheckCircle,
  PencilSimple,
  Plus,
  Trash,
  X,
} from "@phosphor-icons/react";
import { useAdminCollection } from "@/hooks/useAdminCollection";
import { useLoadMoreList } from "@/hooks/useLoadMoreList";
import {
  DeveloperCard,
  DeveloperField,
  DeveloperHero,
  DeveloperLoadMore,
  DeveloperMessage,
  DeveloperPage,
  DeveloperSectionHeading,
  DeveloperStatusPill,
  developerSplitLayoutClassName,
  developerDangerButtonClassName,
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
  const { visibleItems, visibleCount, totalCount, showMore, showAll } = useLoadMoreList(items, 5);

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
    setSaving(true);
    setStatus("");

    const payload = {
      ...form,
      description: form.layoutMode === "full-image" ? "" : form.description,
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
    if (!window.confirm("Excluir este slide do hero?")) return;
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
        description="Configure layout, imagem responsiva, fundo de banner inteiro e botoes do carrossel sem depender do HTML legado."
        stats={[
          { label: "Slides", value: items.length },
          { label: "Botoes ativos", value: activeButtons },
        ]}
      />

      <section className={developerSplitLayoutClassName}>
        <DeveloperCard>
          <DeveloperSectionHeading
            eyebrow={editingId ? "Edicao" : "Novo slide"}
            title={editingId ? "Atualizar slide do hero" : "Cadastrar slide do hero"}
            description="O modo imagem completa desativa a descricao e pode opcionalmente centralizar os botoes sobre a arte."
          />

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <DeveloperField label="Tipo de layout" required className="sm:col-span-2">
                <div className="min-w-0 overflow-x-hidden rounded-[24px] border border-[var(--border)] bg-white/68 p-3 sm:p-4">
                  <div className="grid min-w-0 gap-3 xl:grid-cols-2">
                    {[
                      { value: "text-image" as const, label: "Texto + imagem" },
                      { value: "full-image" as const, label: "Imagem completa" },
                    ].map((option) => (
                      <label
                        key={option.value}
                        className="flex min-h-[84px] min-w-0 items-start gap-3 rounded-[20px] border border-[var(--border)] bg-white/80 px-4 py-3.5 text-sm font-medium text-[var(--foreground)]"
                      >
                        <input
                          type="radio"
                          name="hero-layout"
                          value={option.value}
                          checked={form.layoutMode === option.value}
                          onChange={() => setForm((current) => ({ ...current, layoutMode: option.value }))}
                          className="mt-1 h-4 w-4 shrink-0 accent-[var(--primary)]"
                        />
                        <span className="flex min-w-0 flex-col">
                          <span className="text-sm font-semibold tracking-[-0.02em] text-[var(--foreground)]">
                            {option.label}
                          </span>
                          <span className="mt-1 text-xs leading-5 text-[var(--color-muted-raw)]">
                            {option.value === "text-image"
                              ? "Mantem titulo, descricao e imagem lado a lado."
                              : "Destaca a arte do banner e simplifica o bloco textual."}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
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
                label="Titulo interno"
                required
                hint="Serve para identificar o slide no CMS. No modo imagem completa ele nao aparece no banner."
              >
                <input
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  maxLength={120}
                  className={developerInputClassName}
                />
              </DeveloperField>

              <DeveloperField label="Imagem principal" required hint="Aceita caminhos como /uploads/banner.webp ou /foto1.png.">
                <input
                  value={form.image}
                  onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
                  className={developerInputClassName}
                />
              </DeveloperField>
            </div>

            {form.layoutMode === "text-image" ? (
              <DeveloperField label="Descricao" required>
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
              <DeveloperField label="Imagem desktop" hint="Opcional. Se vazio, o front reutiliza a imagem principal.">
                <input
                  value={form.desktopImage}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, desktopImage: event.target.value }))
                  }
                  className={developerInputClassName}
                />
              </DeveloperField>
              <DeveloperField label="Imagem mobile" hint="Opcional. Use quando o crop do hero precisar mudar no celular.">
                <input
                  value={form.mobileImage}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, mobileImage: event.target.value }))
                  }
                  className={developerInputClassName}
                />
              </DeveloperField>
            </div>

            {form.layoutMode === "full-image" ? (
              <label className="flex min-h-14 items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/72 px-4 py-3 text-sm font-medium text-[var(--foreground)]">
                <input
                  type="checkbox"
                  checked={form.fullImageButtonsEnabled}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      fullImageButtonsEnabled: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                Centralizar botoes sobre a imagem
              </label>
            ) : null}

            {(form.layoutMode === "text-image" || form.fullImageButtonsEnabled) && (
              <div className="rounded-[26px] border border-[var(--border)] bg-white/68 p-4 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                      Botoes do slide
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-muted-raw)]">
                      Configure o CTA primario e o botao secundario sem apertar o layout.
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
                            Botao {index + 1}
                          </p>
                          <p className="text-xs text-[var(--color-muted-raw)]">
                            {index === 0 ? "CTA principal do slide" : "Acao complementar"}
                          </p>
                        </div>
                        <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
                          {index === 0 ? "Primario" : "Secundario"}
                        </span>
                      </div>

                      <DeveloperField label="Texto do botao">
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
                        <label className="flex min-h-14 items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/72 px-4 py-3 text-sm font-medium text-[var(--foreground)]">
                          <input
                            type="checkbox"
                            checked={button.enabled}
                            onChange={(event) =>
                              updateButton(index as 0 | 1, { enabled: event.target.checked })
                            }
                            className="h-4 w-4 accent-[var(--primary)]"
                          />
                          Botao ativo
                        </label>
                        {index === 0 ? (
                          <DeveloperField label="Cor do botao">
                            <input
                              type="color"
                              value={button.color || "#ffffff"}
                              onChange={(event) =>
                                updateButton(index as 0 | 1, { color: event.target.value })
                              }
                              className="h-14 w-full rounded-2xl border border-[var(--border)] bg-white/72 p-1.5"
                            />
                          </DeveloperField>
                        ) : (
                          <label className="flex min-h-14 items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/72 px-4 py-3 text-sm font-medium text-[var(--foreground)]">
                            <input
                              type="checkbox"
                              checked={button.variant === "outline"}
                              onChange={(event) =>
                                updateButton(index as 0 | 1, {
                                  variant: event.target.checked ? "outline" : "solid",
                                })
                              }
                              className="h-4 w-4 accent-[var(--primary)]"
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
                {saving ? "Salvando..." : editingId ? "Atualizar slide" : "Salvar slide"}
              </button>
              <button type="button" onClick={resetForm} className={developerSecondaryButtonClassName}>
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

          <div className="space-y-4">
            {visibleItems.map((item) => (
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
                      {item.title || "Slide sem titulo"}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--color-muted-raw)]">
                      {item.layoutMode === "full-image"
                        ? `Fundo ${item.fullImageBackgroundType === "straight" ? "reto" : "ondulado"} • ${item.fullImageButtonsEnabled ? "com botoes" : "sem botoes"}`
                        : item.description || "Sem descricao cadastrada."}
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
                    <button
                      type="button"
                      onClick={() => deleteItem(item.id)}
                      className={developerDangerButtonClassName}
                    >
                      <Trash size={16} weight="bold" />
                      Excluir
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
        </DeveloperCard>
      </section>
    </DeveloperPage>
  );
}
