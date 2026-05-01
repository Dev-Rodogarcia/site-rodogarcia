"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Cookie, Pulse } from "@phosphor-icons/react";
import {
  DeveloperCard,
  DeveloperField,
  DeveloperHero,
  DeveloperMessage,
  DeveloperPage,
  DeveloperSectionHeading,
  DeveloperTooltip,
  developerInputClassName,
  developerPrimaryButtonClassName,
  developerSecondaryButtonClassName,
} from "@/components/developer/ui";
import { useApiRequest } from "@/hooks/useApiRequest";
import {
  adminResourceKeys,
  invalidateAdminResource,
  useAdminResource,
} from "@/hooks/useAdminResource";
import { api } from "@/lib/routes";

interface ConsentCategory {
  key: string;
  label: string;
  description: string;
  required: boolean;
  enabledByDefault: boolean;
}

interface ConsentSettings {
  enabled: boolean;
  version: number;
  title: string;
  description: string;
  acceptAllLabel: string;
  rejectLabel: string;
  preferencesLabel: string;
  saveLabel: string;
  style: string;
  behavior: {
    requireExplicitChoice: boolean;
    blockAnalyticsUntilConsent: boolean;
    reopenOnVersionChange: boolean;
  };
  desktop: { position: string; compact: boolean };
  mobile: { position: string; compact: boolean };
  categories: ConsentCategory[];
}

const DEFAULT_SETTINGS: ConsentSettings = {
  enabled: true,
  version: 1,
  title: "Usamos cookies para melhorar sua experiência",
  description: "Utilizamos cookies necessários e, com sua permissão, cookies de analytics e marketing.",
  acceptAllLabel: "Aceitar todos",
  rejectLabel: "Recusar opcionais",
  preferencesLabel: "Preferências",
  saveLabel: "Salvar preferências",
  style: "floating",
  behavior: {
    requireExplicitChoice: true,
    blockAnalyticsUntilConsent: true,
    reopenOnVersionChange: true,
  },
  desktop: { position: "bottom-right", compact: true },
  mobile: { position: "bottom-sheet", compact: false },
  categories: [],
};

export default function CookiesPage() {
  const { apiRequest } = useApiRequest();
  const [form, setForm] = useState<ConsentSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"" | "success" | "error">("");
  const [message, setMessage] = useState("");

  const { data, loading, error, refresh } = useAdminResource<ConsentSettings>({
    key: adminResourceKeys.consent,
    fetcher: async (request) => {
      const response = await request<{ settings?: ConsentSettings }>(api.admin.consentSettings);
      if (!response.success) {
        return { success: false, error: response.error ?? "Falha ao carregar cookies." };
      }
      return { success: true, data: { ...DEFAULT_SETTINGS, ...response.data?.settings } };
    },
  });

  useEffect(() => {
    if (data) setForm({ ...DEFAULT_SETTINGS, ...data });
  }, [data]);

  async function handleSave() {
    setSaving(true);
    setStatus("");
    setMessage("");
    const response = await apiRequest(api.admin.consentSettings, {
      method: "POST",
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!response.success) {
      setStatus("error");
      setMessage(response.error ?? "Falha ao salvar LGPD/cookies.");
      return;
    }
    invalidateAdminResource([adminResourceKeys.consent, adminResourceKeys.dashboard]);
    setStatus("success");
    setMessage("Configuração de LGPD/cookies salva com sucesso.");
    await refresh();
  }

  function updateCategory(index: number, patch: Partial<ConsentCategory>) {
    setForm((current) => ({
      ...current,
      categories: current.categories.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      ),
    }));
  }

  return (
    <DeveloperPage>
      <DeveloperHero
        eyebrow="LGPD / Cookies"
        title="Consentimento com controle desktop e mobile."
        description="Configure textos, labels, categorias e comportamento do banner usado no site público."
        stats={[
          { label: "Categorias", value: form.categories.length },
          { label: "Versão", value: form.version },
          { label: "Status", value: form.enabled ? "Ativo" : "Inativo" },
        ]}
      />

      {loading ? <DeveloperMessage tone="info">Carregando configuração...</DeveloperMessage> : null}
      {error ? <DeveloperMessage tone="error">{error}</DeveloperMessage> : null}
      {status ? (
        <div className="mt-4">
          <DeveloperMessage tone={status === "success" ? "success" : "error"}>{message}</DeveloperMessage>
        </div>
      ) : null}

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <DeveloperCard>
          <DeveloperSectionHeading
            eyebrow="Conteúdo"
            title="Banner e comportamento"
            description="O texto principal e os botões aparecem no desktop e no mobile."
            tooltip="Configura o banner público de consentimento. Exemplo: texto, botões, categorias e quando reabrir."
          />
          <div className="grid gap-4 lg:grid-cols-2">
            <DeveloperField label="Título">
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                className={developerInputClassName}
              />
            </DeveloperField>
            <DeveloperField
              label="Versão"
              tooltip="Número da política atual. Aumente quando mudar texto, categorias ou comportamento. Exemplo: de 1 para 2."
            >
              <input
                type="number"
                min={1}
                value={form.version}
                onChange={(event) =>
                  setForm((current) => ({ ...current, version: Number(event.target.value) || 1 }))
                }
                className={developerInputClassName}
              />
            </DeveloperField>
          </div>
          <div className="mt-4">
            <DeveloperField
              label="Descrição"
              tooltip="Texto principal exibido no banner. Exemplo: explique cookies necessários e opcionais em uma frase curta."
            >
              <textarea
                rows={3}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                className={`${developerInputClassName} resize-none`}
              />
            </DeveloperField>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-4">
            {[
              ["acceptAllLabel", "Aceitar"],
              ["rejectLabel", "Recusar"],
              ["preferencesLabel", "Preferências"],
              ["saveLabel", "Salvar"],
            ].map(([key, label]) => (
              <DeveloperField key={key} label={label}>
                <input
                  value={String(form[key as keyof ConsentSettings] ?? "")}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, [key]: event.target.value }))
                  }
                  className={developerInputClassName}
                />
              </DeveloperField>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                key: "enabled",
                label: "Banner ativo",
                tooltip: "Liga ou desliga o banner no site público. Exemplo: mantenha ativo para coletar consentimento.",
              },
              {
                key: "requireExplicitChoice",
                label: "Exigir escolha",
                tooltip: "Obrigar o visitante a aceitar, recusar ou personalizar antes de considerar o consentimento resolvido.",
              },
              {
                key: "blockAnalyticsUntilConsent",
                label: "Bloquear analytics",
                tooltip: "Impede eventos de analytics até o aceite da categoria correspondente.",
              },
              {
                key: "reopenOnVersionChange",
                label: "Reabrir por versão",
                tooltip: "Mostra o banner novamente quando a versão da política aumentar.",
              },
            ].map((item) => {
              const checked =
                item.key === "enabled"
                  ? form.enabled
                  : Boolean(form.behavior[item.key as keyof ConsentSettings["behavior"]]);
              return (
                <label
                  key={item.key}
                  className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white/76 px-3 py-2 text-sm font-medium"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) =>
                      item.key === "enabled"
                        ? setForm((current) => ({ ...current, enabled: event.target.checked }))
                        : setForm((current) => ({
                            ...current,
                            behavior: { ...current.behavior, [item.key]: event.target.checked },
                          }))
                    }
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  <span className="inline-flex items-center gap-1.5">
                    {item.label}
                    <DeveloperTooltip content={item.tooltip} />
                  </span>
                </label>
              );
            })}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <DeveloperField
              label="Posição no desktop"
              tooltip="Define onde o banner aparece em telas grandes. Exemplo: bottom-right para canto inferior direito."
            >
              <select
                value={form.desktop.position}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    desktop: { ...current.desktop, position: event.target.value },
                  }))
                }
                className={developerInputClassName}
              >
                <option value="bottom-right">bottom-right</option>
                <option value="bottom-left">bottom-left</option>
                <option value="bottom-full">bottom-full</option>
              </select>
            </DeveloperField>
            <DeveloperField
              label="Posição no mobile"
              tooltip="Define a experiência em celulares. Exemplo: bottom-sheet abre como painel inferior."
            >
              <select
                value={form.mobile.position}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    mobile: { ...current.mobile, position: event.target.value },
                  }))
                }
                className={developerInputClassName}
              >
                <option value="bottom-sheet">bottom-sheet</option>
                <option value="center-modal">center-modal</option>
              </select>
            </DeveloperField>
          </div>

          <div className="mt-5">
            <DeveloperSectionHeading
              eyebrow="Categorias"
              title="Tipos de cookies"
              tooltip="Categorias controlam quais recursos podem rodar após o aceite. Exemplo: necessário, analytics e marketing."
            />
            <div className="grid gap-3 lg:grid-cols-2">
              {form.categories.map((category, index) => (
                <div key={category.key} className="rounded-lg border border-[var(--border)] bg-white/76 p-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <DeveloperField label="Label">
                      <input
                        value={category.label}
                        onChange={(event) => updateCategory(index, { label: event.target.value })}
                        className={developerInputClassName}
                      />
                    </DeveloperField>
                    <DeveloperField
                      label="Chave"
                      tooltip="Identificador técnico da categoria. Exemplo: analytics, marketing ou necessary."
                    >
                      <input
                        value={category.key}
                        onChange={(event) => updateCategory(index, { key: event.target.value })}
                        className={developerInputClassName}
                      />
                    </DeveloperField>
                  </div>
                  <div className="mt-3">
                    <DeveloperField
                      label="Descrição"
                      tooltip="Explica o objetivo da categoria para o visitante. Exemplo: medir acessos e melhorar páginas."
                    >
                      <input
                        value={category.description}
                        onChange={(event) => updateCategory(index, { description: event.target.value })}
                        className={developerInputClassName}
                      />
                    </DeveloperField>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={category.required}
                        onChange={(event) => updateCategory(index, { required: event.target.checked })}
                        className="h-4 w-4 accent-[var(--primary)]"
                      />
                      <span className="inline-flex items-center gap-1.5">
                        Obrigatório
                        <DeveloperTooltip content="Categoria obrigatória não pode ser desligada. Exemplo: cookies necessários para segurança." />
                      </span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={category.enabledByDefault}
                        onChange={(event) =>
                          updateCategory(index, { enabledByDefault: event.target.checked })
                        }
                        className="h-4 w-4 accent-[var(--primary)]"
                      />
                      <span className="inline-flex items-center gap-1.5">
                        Ativo por padrão
                        <DeveloperTooltip content="Define se a categoria opcional vem pré-selecionada antes da escolha do visitante." />
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={developerPrimaryButtonClassName}
            >
              <CheckCircle size={18} weight="bold" />
              {saving ? "Salvando..." : "Salvar configuração"}
            </button>
            <button type="button" onClick={() => void refresh()} className={developerSecondaryButtonClassName}>
              <Pulse size={16} weight="bold" />
              Atualizar métricas
            </button>
          </div>
        </DeveloperCard>

        <DeveloperCard>
          <DeveloperSectionHeading eyebrow="Preview" title="Desktop e mobile" />
          <div className="rounded-lg border border-[var(--border)] bg-slate-950 p-4 text-white">
            <Cookie size={24} weight="duotone" className="text-sky-300" />
            <h3 className="mt-3 text-lg font-semibold">{form.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">{form.description}</p>
            <div className="mt-4 grid gap-2">
              {form.categories.map((category) => (
                <div key={category.key} className="rounded-lg bg-white/8 px-3 py-2">
                  <p className="text-sm font-semibold">{category.label}</p>
                  <p className="text-xs leading-5 text-slate-400">{category.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-lg bg-sky-500 px-3 py-2 text-xs font-bold">
                {form.acceptAllLabel}
              </span>
              <span className="rounded-lg border border-white/20 px-3 py-2 text-xs font-bold">
                {form.rejectLabel}
              </span>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-[var(--border)] bg-white/76 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
              Mobile
            </p>
            <p className="mt-2 text-sm text-[var(--color-muted-raw)]">
              Renderiza como {form.mobile.position}, com botões empilhados e categorias em lista.
            </p>
          </div>
        </DeveloperCard>
      </section>
    </DeveloperPage>
  );
}
