"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle,
  PencilSimple,
  Plus,
  Stack,
  Trash,
  X,
} from "@phosphor-icons/react";
import { useApiRequest } from "@/hooks/useApiRequest";
import { adminResourceKeys, invalidateAdminResource } from "@/hooks/useAdminResource";
import { useLoadMoreList } from "@/hooks/useLoadMoreList";
import { api } from "@/lib/routes";
import {
  DeveloperLoadMore,
} from "@/components/developer/ui";

export interface FieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "checkbox" | "select" | "number";
  options?: string[];
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
}

interface EntityManagerProps {
  entity: string;
  title: string;
  description?: string;
  fields: FieldDef[];
  itemLabel: (item: Record<string, unknown>) => string;
  itemMeta?: (item: Record<string, unknown>) => string;
}

type Item = Record<string, unknown> & { id: string; active?: boolean };

function emptyForm(fields: FieldDef[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.type === "checkbox") out[field.key] = true;
    else if (field.type === "number") out[field.key] = 0;
    else out[field.key] = "";
  }
  return out;
}

const FIELD_CLASS_NAME =
  "w-full rounded-2xl border border-[var(--border)]/70 bg-white/82 px-4 py-3.5 text-sm text-[var(--foreground)] placeholder:text-[var(--color-muted-raw)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] outline-none transition-all duration-200 focus:border-[var(--primary)]/30 focus:bg-white focus:ring-4 focus:ring-[var(--primary)]/10";

export default function EntityManager({
  entity,
  title,
  description,
  fields,
  itemLabel,
  itemMeta,
}: EntityManagerProps) {
  const { apiRequest } = useApiRequest();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>(emptyForm(fields));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { visibleItems, visibleCount, totalCount, showMore, showAll } = useLoadMoreList(items);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await apiRequest<{ items?: Item[] }>(api.admin.entity(entity));
    if (res.success && res.data?.items) {
      setItems(res.data.items);
    } else {
      setError(res.error ?? "Erro ao carregar dados.");
    }
    setLoading(false);
  }, [apiRequest, entity]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm(fields));
    setFormError("");
    setShowForm(true);
  }

  function openEdit(item: Item) {
    setEditingId(item.id);
    const nextForm: Record<string, unknown> = {};
    for (const field of fields) {
      nextForm[field.key] =
        item[field.key] ?? (field.type === "checkbox" ? true : field.type === "number" ? 0 : "");
    }
    setForm(nextForm);
    setFormError("");
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setFormError("");
  }

  async function handleSave() {
    setSaving(true);
    setFormError("");
    const res = editingId
      ? await apiRequest(api.admin.entityItem(entity, editingId), {
          method: "PUT",
          body: JSON.stringify(form),
        })
      : await apiRequest(api.admin.entity(entity), {
          method: "POST",
          body: JSON.stringify(form),
        });

    setSaving(false);

    if (!res.success) {
      setFormError(res.error ?? "Erro ao salvar.");
      return;
    }

    invalidateAdminResource(adminResourceKeys.dashboard);
    setShowForm(false);
    setEditingId(null);
    void load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este item?")) return;
    setDeletingId(id);
    await apiRequest(api.admin.entityItem(entity, id), { method: "DELETE" });
    invalidateAdminResource(adminResourceKeys.dashboard);
    setDeletingId(null);
    void load();
  }

  function setField(key: string, value: unknown) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="w-full px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <section className="relative overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.78)_0%,rgba(241,245,249,0.94)_100%)] px-5 py-6 shadow-[0_20px_50px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:px-6 sm:py-7 lg:px-8 lg:py-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_16%,rgba(29,78,216,0.11),transparent_24%),radial-gradient(circle_at_84%_14%,rgba(6,182,212,0.1),transparent_24%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(29,78,216,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(29,78,216,0.08)_1px,transparent_1px)] [background-size:34px_34px]" />

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-[860px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
              Gestao de conteudo
            </p>
            <h1 className="mt-4 text-[clamp(2.2rem,4vw,4rem)] font-bold leading-[0.96] tracking-[-0.06em] text-[var(--foreground)]">
              {title}
            </h1>
            {description ? (
              <p className="mt-4 max-w-[68ch] text-sm leading-7 text-[var(--color-muted-raw)] sm:text-base">
                {description}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="rounded-[22px] border border-white/80 bg-white/78 px-4 py-3 shadow-[0_16px_34px_rgba(15,23,42,0.05)] backdrop-blur-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-raw)]">
                Total de itens
              </div>
              <div className="mt-2 text-3xl font-bold tracking-[-0.06em] text-[var(--foreground)]">
                {items.length}
              </div>
            </div>

            {!showForm ? (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white shadow-[0_20px_44px_rgba(15,23,42,0.16)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--primary)]"
              >
                <Plus size={18} weight="bold" />
                Novo item
              </button>
            ) : null}
          </div>
        </div>
      </section>

      {showForm ? (
        <section className="mt-6 overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.86)_0%,rgba(241,245,249,0.96)_100%)] p-6 shadow-[0_24px_56px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
                {editingId ? "Edicao" : "Novo cadastro"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
                {editingId ? "Editar item" : "Adicionar item"}
              </h2>
            </div>

            <button
              type="button"
              onClick={cancelForm}
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-muted-raw)] transition-colors hover:text-[var(--foreground)]"
            >
              <X size={16} weight="bold" />
              Fechar
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <div
                key={field.key}
                className={field.type === "textarea" ? "sm:col-span-2" : undefined}
              >
                <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                  {field.label}
                  {field.required ? <span className="ml-1 text-[var(--primary)]">*</span> : null}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    rows={4}
                    value={String(form[field.key] ?? "")}
                    onChange={(event) => setField(field.key, event.target.value)}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    className={`${FIELD_CLASS_NAME} resize-none`}
                  />
                ) : field.type === "checkbox" ? (
                  <label className="inline-flex min-h-14 items-center gap-3 rounded-2xl border border-[var(--border)]/70 bg-white/82 px-4 py-3 text-sm font-medium text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
                    <input
                      type="checkbox"
                      checked={Boolean(form[field.key])}
                      onChange={(event) => setField(field.key, event.target.checked)}
                      className="h-4 w-4 rounded accent-[var(--primary)]"
                    />
                    Ativo
                  </label>
                ) : field.type === "select" ? (
                  <select
                    value={String(form[field.key] ?? "")}
                    onChange={(event) => setField(field.key, event.target.value)}
                    className={FIELD_CLASS_NAME}
                  >
                    {field.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={String(form[field.key] ?? "")}
                    onChange={(event) =>
                      setField(
                        field.key,
                        field.type === "number" ? Number(event.target.value) : event.target.value
                      )
                    }
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    className={FIELD_CLASS_NAME}
                  />
                )}
              </div>
            ))}
          </div>

          {formError ? (
            <p className="mt-5 rounded-2xl border border-red-500/16 bg-red-500/8 px-4 py-3 text-sm text-red-500">
              {formError}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white shadow-[0_20px_44px_rgba(29,78,216,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-primary-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle size={18} weight="bold" />
              {saving ? "Salvando..." : "Salvar alteracoes"}
            </button>

            <button
              type="button"
              onClick={cancelForm}
              className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-white px-6 py-3 text-sm font-medium text-[var(--foreground)] transition-all hover:-translate-y-0.5 hover:bg-[var(--color-surface-2)]"
            >
              Cancelar
            </button>
          </div>
        </section>
      ) : null}

      <section className="mt-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <Stack size={22} weight="duotone" />
          </span>
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
              Itens cadastrados
            </h2>
            <p className="text-sm text-[var(--color-muted-raw)]">
              Edite, revise ou remova entradas sem sair do mesmo fluxo.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[30px] border border-white/80 bg-white/82 px-6 py-10 text-center text-sm text-[var(--color-muted-raw)] shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
            Carregando itens...
          </div>
        ) : error ? (
          <div className="rounded-[30px] border border-red-500/16 bg-red-500/8 px-6 py-6 text-sm text-red-500">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[30px] border border-white/80 bg-white/82 px-6 py-10 text-center shadow-[0_18px_44px_rgba(15,23,42,0.06)]">
            <p className="text-base font-medium text-[var(--foreground)]">
              Nenhum item cadastrado ainda.
            </p>
            <p className="mt-2 text-sm leading-7 text-[var(--color-muted-raw)]">
              Crie o primeiro registro para iniciar a gestao desta area.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[var(--color-primary-strong)]"
            >
              <Plus size={16} weight="bold" />
              Novo item
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleItems.map((item, index) => (
              <article
                key={item.id}
                className="rounded-[30px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.84)_0%,rgba(241,245,249,0.96)_100%)] p-5 shadow-[0_20px_48px_rgba(15,23,42,0.06)] sm:p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-[var(--border)] bg-white/72 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-raw)]">
                        Item {index + 1}
                      </span>
                      {typeof item.active === "boolean" ? (
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                            item.active
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-[var(--color-surface-2)] text-[var(--color-muted-raw)]"
                          }`}
                        >
                          {item.active ? "Ativo" : "Inativo"}
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-4 truncate text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
                      {itemLabel(item)}
                    </h3>
                    {itemMeta ? (
                      <p className="mt-2 text-sm leading-7 text-[var(--color-muted-raw)]">
                        {itemMeta(item)}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-all hover:-translate-y-0.5 hover:bg-[var(--color-surface-2)]"
                    >
                      <PencilSimple size={16} weight="bold" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/8 px-4 py-2.5 text-sm font-medium text-red-500 transition-all hover:-translate-y-0.5 hover:bg-red-500/12 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash size={16} weight="bold" />
                      {deletingId === item.id ? "Removendo..." : "Remover"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <DeveloperLoadMore
          shown={visibleCount}
          total={totalCount}
          onClick={showMore}
          onShowAll={totalCount - visibleCount > 12 ? showAll : undefined}
        />
      </section>
    </div>
  );
}
