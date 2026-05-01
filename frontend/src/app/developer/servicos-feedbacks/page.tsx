"use client";

import { useState } from "react";
import {
  CheckCircle,
  PencilSimple,
  Plus,
  SortAscending,
  Star,
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

interface FeedbackFormState {
  name: string;
  role: string;
  company: string;
  testimonial: string;
  photo: string;
  rating: number;
  highlight: string;
  resultadoIcon: string;
  active: boolean;
}

interface FeedbackItem extends FeedbackFormState {
  id: string;
  order?: number;
}

const EMPTY_FORM: FeedbackFormState = {
  name: "",
  role: "",
  company: "",
  testimonial: "",
  photo: "",
  rating: 5,
  highlight: "",
  resultadoIcon: "",
  active: true,
};

function normalizeFeedback(item: Record<string, unknown>): FeedbackItem {
  return {
    id: String(item.id ?? ""),
    order: Number(item.order ?? 0),
    name: String(item.name ?? item.nome ?? ""),
    role: String(item.role ?? ""),
    company: String(item.company ?? item.empresa ?? ""),
    testimonial: String(item.testimonial ?? item.comment ?? item.texto ?? ""),
    photo: String(item.photo ?? item.image ?? ""),
    rating: Math.min(5, Math.max(1, Number(item.rating ?? item.nota ?? 5))),
    highlight: String(item.highlight ?? item.resultadoTexto ?? ""),
    resultadoIcon: String(item.resultadoIcon ?? ""),
    active: Boolean(item.active ?? item.ativo ?? true),
  };
}

export default function FeedbacksPage() {
  const { items, loading, error, createItem, updateItem, removeItem, moveItem } =
    useAdminCollection<FeedbackItem>("feedbacks", { normalize: normalizeFeedback });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FeedbackFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const { pages, currentPage, totalPages, nextPage, prevPage } = useCarouselPagination(items, 2);

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setStatus("");
  }

  function editItem(item: FeedbackItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      role: item.role,
      company: item.company,
      testimonial: item.testimonial,
      photo: item.photo,
      rating: item.rating,
      highlight: item.highlight,
      resultadoIcon: item.resultadoIcon,
      active: item.active,
    });
    setStatus("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (
      !form.name.trim() ||
      !form.role.trim() ||
      !form.company.trim() ||
      !form.testimonial.trim()
    ) {
      setStatus("Preencha nome, cargo, empresa e depoimento antes de salvar.");
      return;
    }

    setSaving(true);
    setStatus("");

    const payload: Record<string, unknown> = {
      ...form,
      name: form.name.trim(),
      role: form.role.trim(),
      company: form.company.trim(),
      testimonial: form.testimonial.trim(),
      photo: form.photo.trim(),
      highlight: form.highlight.trim(),
      resultadoIcon: form.resultadoIcon.trim(),
    };

    const response = editingId
      ? await updateItem(editingId, payload)
      : await createItem(payload);

    setSaving(false);

    if (!response.success) {
      setStatus(response.error ?? "Falha ao salvar o feedback.");
      return;
    }

    setStatus("Feedback salvo com sucesso.");
    resetForm();
  }

  async function toggleItem(item: FeedbackItem) {
    const response = await updateItem(item.id, {
      ...item,
      active: !item.active,
    });
    if (!response.success) {
      setStatus(response.error ?? "Falha ao atualizar o feedback.");
    }
  }

  async function deleteItem(id: string) {
    const response = await removeItem(id);
    if (!response.success) {
      setStatus(response.error ?? "Falha ao excluir o feedback.");
    }
  }

  async function move(id: string, direction: -1 | 1) {
    const response = await moveItem(id, direction);
    if (!response.success && response.error !== "Movimento invalido.") {
      setStatus(response.error ?? "Falha ao reordenar o feedback.");
    }
  }

  return (
    <DeveloperPage>
      <DeveloperHero
        eyebrow="Serviços • Feedbacks"
        title="Gerencie os depoimentos do CMS."
        description="O módulo foi refeito com ordenação, avaliação, destaque opcional e compatibilidade com os dados legados do storage."
        stats={[
          { label: "Feedbacks", value: items.length },
          { label: "Ativos", value: items.filter((item) => item.active).length },
        ]}
      />

      <section className={developerSplitLayoutClassName}>
        <DeveloperCard>
          <DeveloperSectionHeading
            eyebrow={editingId ? "Edição" : "Novo feedback"}
            title={editingId ? "Atualizar feedback" : "Cadastrar feedback"}
            description="Edite nome, empresa, depoimento, logo e avaliacao sem tocar na estrutura visual publica."
          />

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <DeveloperField label="Nome" required>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  maxLength={80}
                  className={developerInputClassName}
                />
              </DeveloperField>
              <DeveloperField label="Cargo" required>
                <input
                  value={form.role}
                  onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                  maxLength={80}
                  className={developerInputClassName}
                />
              </DeveloperField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DeveloperField label="Empresa" required>
                <input
                  value={form.company}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, company: event.target.value }))
                  }
                  maxLength={120}
                  className={developerInputClassName}
                />
              </DeveloperField>
              <DeveloperImageField
                label="Logo ou foto"
                hint="Use um asset da biblioteca, por exemplo /feedbacks/logo.png ou /uploads/arquivo.webp."
                value={form.photo}
                onChange={(photo) => setForm((current) => ({ ...current, photo }))}
                previewAlt={form.name || "Preview do feedback"}
              />
            </div>

            <DeveloperField label="Depoimento" required>
              <textarea
                rows={5}
                value={form.testimonial}
                onChange={(event) =>
                  setForm((current) => ({ ...current, testimonial: event.target.value }))
                }
                maxLength={800}
                className={`${developerInputClassName} resize-none`}
              />
            </DeveloperField>

            <div className="grid gap-4 sm:grid-cols-3">
              <DeveloperField label="Avaliacao">
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={form.rating}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      rating: Math.min(5, Math.max(1, Number(event.target.value) || 1)),
                    }))
                  }
                  className={developerInputClassName}
                />
              </DeveloperField>
              <DeveloperField label="Badge opcional" hint='Ex.: "Cliente desde 2021"'>
                <input
                  value={form.highlight}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, highlight: event.target.value }))
                  }
                  maxLength={120}
                  className={developerInputClassName}
                />
              </DeveloperField>
              <DeveloperField label="Icone opcional" hint='Ex.: "ph-shield-check"'>
                <input
                  value={form.resultadoIcon}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, resultadoIcon: event.target.value }))
                  }
                  maxLength={40}
                  className={developerInputClassName}
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
              Feedback ativo
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
                title="Limpa os campos do formulário sem apagar feedbacks salvos."
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
            eyebrow="Feedbacks cadastrados"
            title="Lista social proof"
            description="Ordene os depoimentos e controle o que fica visível no carrossel."
            action={
              <button type="button" onClick={resetForm} className={developerSecondaryButtonClassName}>
                <Plus size={16} weight="bold" />
                Novo feedback
              </button>
            }
          />

          {loading ? <DeveloperMessage tone="info">Carregando feedbacks...</DeveloperMessage> : null}
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
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-600">
                            <Star size={12} weight="fill" />
                            {item.rating}/5
                          </span>
                        </div>

                        <div>
                          <h3 className="text-xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
                            {item.name}
                          </h3>
                          <p className="mt-1 text-sm text-[var(--color-muted-raw)]">
                            {item.role} • {item.company}
                          </p>
                          <p className="mt-3 text-sm leading-7 text-[var(--color-muted-raw)]">
                            {item.testimonial}
                          </p>
                          {item.highlight ? (
                            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
                              {item.highlight}
                            </p>
                          ) : null}
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
                            title={item.active ? "Desativa este feedback no site público." : "Ativa este feedback no site público."}
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
