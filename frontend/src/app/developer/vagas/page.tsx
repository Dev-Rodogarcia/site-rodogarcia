"use client";

import { useState } from "react";
import {
  Briefcase,
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

interface JobFormState {
  title: string;
  status: string;
  location: string;
  workType: string;
  contractType: string;
  description: string;
  applyUrl: string;
  featured: boolean;
  active: boolean;
}

interface JobItem extends JobFormState {
  id: string;
  order?: number;
}

const EMPTY_FORM: JobFormState = {
  title: "",
  status: "Disponivel",
  location: "",
  workType: "Presencial",
  contractType: "Integral",
  description: "",
  applyUrl: "/trabalhe-conosco#candidatura",
  featured: true,
  active: true,
};

const STATUS_OPTIONS = ["Novo", "Disponivel", "Encerrado"] as const;
const WORK_TYPE_OPTIONS = ["Presencial", "Remoto", "Hibrido"] as const;
const CONTRACT_OPTIONS = [
  "Integral",
  "Meio período",
  "CLT",
  "PJ",
  "Temporario",
  "Estágio",
] as const;

function normalizeJob(item: Record<string, unknown>): JobItem {
  return {
    id: String(item.id ?? ""),
    order: Number(item.order ?? 0),
    title: String(item.title ?? item.titulo ?? ""),
    status: String(item.status ?? "Disponivel"),
    location: String(item.location ?? item.local ?? ""),
    workType: String(item.workType ?? "Presencial"),
    contractType: String(item.contractType ?? item.tipo ?? ""),
    description: String(item.description ?? item.descricao ?? ""),
    applyUrl: String(item.applyUrl ?? ""),
    featured: Boolean(item.featured),
    active: Boolean(item.active ?? item.ativo ?? true),
  };
}

export default function VagasPage() {
  const { items, loading, error, createItem, updateItem, removeItem, moveItem } =
    useAdminCollection<JobItem>("vagas", { normalize: normalizeJob });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<JobFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const { pages, currentPage, totalPages, nextPage, prevPage } = useCarouselPagination(items, 2);

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setStatus("");
  }

  function editItem(item: JobItem) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      status: item.status || "Disponivel",
      location: item.location,
      workType: item.workType || "Presencial",
      contractType: item.contractType || "Integral",
      description: item.description,
      applyUrl: item.applyUrl || "/trabalhe-conosco#candidatura",
      featured: item.featured,
      active: item.active,
    });
    setStatus("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (
      !form.title.trim() ||
      !form.location.trim() ||
      !form.contractType.trim() ||
      !form.description.trim() ||
      !form.applyUrl.trim()
    ) {
      setStatus("Preencha título, localização, contrato, descrição e link antes de salvar.");
      return;
    }

    setSaving(true);
    setStatus("");

    const payload: Record<string, unknown> = {
      ...form,
      title: form.title.trim(),
      status: form.status.trim(),
      location: form.location.trim(),
      workType: form.workType.trim(),
      contractType: form.contractType.trim(),
      description: form.description.trim(),
      applyUrl: form.applyUrl.trim(),
    };

    const response = editingId
      ? await updateItem(editingId, payload)
      : await createItem(payload);

    setSaving(false);

    if (!response.success) {
      setStatus(response.error ?? "Falha ao salvar a vaga.");
      return;
    }

    resetForm();
    setStatus("Vaga salva com sucesso.");
  }

  async function toggleItem(item: JobItem) {
    const response = await updateItem(item.id, {
      ...item,
      active: !item.active,
    });

    if (!response.success) {
      setStatus(response.error ?? "Falha ao atualizar a vaga.");
    }
  }

  async function deleteItem(id: string) {
    const response = await removeItem(id);
    if (!response.success) {
      setStatus(response.error ?? "Falha ao excluir a vaga.");
    }
  }

  async function move(id: string, direction: -1 | 1) {
    const response = await moveItem(id, direction);
    if (!response.success && response.error !== "Movimento invalido.") {
      setStatus(response.error ?? "Falha ao reordenar a vaga.");
    }
  }

  return (
    <DeveloperPage>
      <DeveloperHero
        eyebrow="Conteúdo - Vagas"
        title="Editor completo das vagas em destaque."
        description="A tela foi refeita para combinar com o CMS estavel da raiz, mas agora salvando no storage React/Next do projeto atual."
        stats={[
          { label: "Vagas", value: items.length },
          {
            label: "Em destaque",
            value: items.filter((item) => item.active && item.featured).length,
          },
        ]}
      />

      <section className={developerSplitLayoutClassName}>
        <DeveloperCard className="flex min-h-0 flex-col">
          <DeveloperSectionHeading
            eyebrow={editingId ? "Edição" : "Nova vaga"}
            title={editingId ? "Atualizar vaga" : "Cadastrar vaga"}
            description="Crie, destaque e reordene oportunidades sem depender do HTML antigo."
          />

          <form className="space-y-5" onSubmit={handleSubmit}>
            <DeveloperField label="Título da vaga" required>
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                maxLength={120}
                className={developerInputClassName}
              />
            </DeveloperField>

            <div className="grid gap-4 sm:grid-cols-2">
              <DeveloperField label="Status" required>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, status: event.target.value }))
                  }
                  className={developerInputClassName}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </DeveloperField>

              <DeveloperField label="Localizacao" required>
                <input
                  value={form.location}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, location: event.target.value }))
                  }
                  maxLength={120}
                  className={developerInputClassName}
                />
              </DeveloperField>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <DeveloperField label="Tipo de trabalho" required>
                <select
                  value={form.workType}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, workType: event.target.value }))
                  }
                  className={developerInputClassName}
                >
                  {WORK_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </DeveloperField>

              <DeveloperField label="Tipo de contrato" required>
                <select
                  value={form.contractType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      contractType: event.target.value,
                    }))
                  }
                  className={developerInputClassName}
                >
                  {CONTRACT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </DeveloperField>
            </div>

            <DeveloperField label="Descrição" required>
              <textarea
                rows={5}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                maxLength={600}
                className={`${developerInputClassName} resize-none`}
              />
            </DeveloperField>

            <DeveloperField
              label="Link de candidatura"
              required
              hint="Use um caminho interno como /trabalhe-conosco#candidatura ou uma URL externa."
            >
              <input
                value={form.applyUrl}
                onChange={(event) =>
                  setForm((current) => ({ ...current, applyUrl: event.target.value }))
                }
                className={developerInputClassName}
              />
            </DeveloperField>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex min-h-14 items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/72 px-4 py-3 text-sm font-medium text-[var(--foreground)]">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      featured: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                Marcar como destaque
              </label>

              <label className="flex min-h-14 items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/72 px-4 py-3 text-sm font-medium text-[var(--foreground)]">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, active: event.target.checked }))
                  }
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                Vaga ativa
              </label>
            </div>

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
                title="Limpa os campos do formulário sem apagar vagas salvas."
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
            eyebrow="Vagas cadastradas"
            title="Lista publicada"
            description="Ative, reordene e edite as oportunidades que alimentam a página de carreiras."
            action={
              <button type="button" onClick={resetForm} className={developerSecondaryButtonClassName}>
                <Plus size={16} weight="bold" />
                Nova vaga
              </button>
            }
          />

          {loading ? <DeveloperMessage tone="info">Carregando vagas...</DeveloperMessage> : null}
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
                          {item.featured ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-600">
                              <Star size={12} weight="fill" />
                              Destaque
                            </span>
                          ) : null}
                          <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
                            {item.status || "Disponivel"}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
                            {item.title || "Vaga sem título"}
                          </h3>
                          <p className="mt-1 text-sm text-[var(--color-muted-raw)]">
                            {item.location || "Local a definir"} - {item.workType || "Tipo a definir"} -{" "}
                            {item.contractType || "Contrato a definir"}
                          </p>
                          <p className="mt-3 text-sm leading-7 text-[var(--color-muted-raw)]">
                            {item.description || "Sem descrição cadastrada."}
                          </p>
                          <p className="mt-2 text-xs leading-6 text-[var(--color-muted-raw)]">
                            Link: {item.applyUrl || "-"}
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
                            title={item.active ? "Desativa esta vaga no site público." : "Ativa esta vaga no site público."}
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

          {!loading && items.length === 0 ? (
            <div className="mt-4 rounded-[24px] border border-dashed border-[var(--border)] bg-white/60 px-4 py-8 text-center">
              <Briefcase size={28} weight="duotone" className="mx-auto text-[var(--primary)]" />
              <p className="mt-3 text-sm font-medium text-[var(--foreground)]">
                Nenhuma vaga cadastrada ainda.
              </p>
              <p className="mt-2 text-sm text-[var(--color-muted-raw)]">
                Crie a primeira vaga para alimentar a página de carreiras.
              </p>
            </div>
          ) : null}
        </DeveloperCard>
      </section>
    </DeveloperPage>
  );
}
