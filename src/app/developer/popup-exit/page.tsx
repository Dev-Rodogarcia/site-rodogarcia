"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowSquareOut,
  CheckCircle,
  CursorClick,
  EnvelopeSimple,
  Pulse,
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
  DeveloperListViewport,
  DeveloperLoadMore,
  DeveloperMessage,
  DeveloperPage,
  DeveloperSectionHeading,
  developerSplitLayoutClassName,
  developerInputClassName,
  developerPrimaryButtonClassName,
  developerSecondaryButtonClassName,
} from "@/components/developer/ui";

interface PopupConfig {
  enabled: boolean;
  title: string;
  description: string;
  enableName: boolean;
  enableEmail: boolean;
  enablePhone: boolean;
  buttonText: string;
  closeText: string;
  successMessage: string;
  delaySeconds: number;
  cooldownHours: number;
  maxShowsPerSession: number;
  mobileScrollTrigger: boolean;
  mobileBackButtonTrigger: boolean;
}

interface PopupEvent {
  id: string;
  createdAt: string;
  event: string;
  pagePath: string;
  sessionId?: string;
}

interface PopupAnalytics {
  totals: Record<string, number>;
  conversionRate: number;
  topPages: Array<{ pagePath: string; total: number }>;
  last7Days: {
    events: number;
    shown: number;
    submitted: number;
  };
}

interface PopupLead {
  id: string;
  createdAt: string;
  pagePath?: string;
  name?: string;
  email?: string;
  phone?: string;
}

const DEFAULT_CONFIG: PopupConfig = {
  enabled: true,
  title: "Antes de sair...",
  description: "Receba uma proposta personalizada para sua operacao logistica.",
  enableName: true,
  enableEmail: true,
  enablePhone: true,
  buttonText: "Receber proposta",
  closeText: "Fechar",
  successMessage: "Recebemos seus dados. Em breve entraremos em contato.",
  delaySeconds: 10,
  cooldownHours: 24,
  maxShowsPerSession: 1,
  mobileScrollTrigger: true,
  mobileBackButtonTrigger: true,
};

interface PopupResourceData {
  config: PopupConfig;
  analytics: PopupAnalytics | null;
  events: PopupEvent[];
  leads: PopupLead[];
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export default function PopupExitPage() {
  const { apiRequest } = useApiRequest();
  const [config, setConfig] = useState<PopupConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"" | "success" | "error">("");
  const [statusMessage, setStatusMessage] = useState("");
  const {
    data: resourceData,
    loading,
    error,
    refresh,
  } = useAdminResource<PopupResourceData>({
    key: adminResourceKeys.popup,
    fetcher: async (request) => {
      const [configResponse, eventsResponse, leadsResponse] = await Promise.all([
        request<{ config?: Partial<PopupConfig> }>(api.popup.config),
        request<{ events?: PopupEvent[]; analytics?: PopupAnalytics }>(
          `${api.popup.events}?days=30`
        ),
        request<{ leads?: PopupLead[] }>(api.popup.leads),
      ]);

      if (!configResponse.success || !eventsResponse.success || !leadsResponse.success) {
        return {
          success: false,
          error:
            configResponse.error ??
            eventsResponse.error ??
            leadsResponse.error ??
            "Falha ao carregar o popup.",
        };
      }

      return {
        success: true,
        data: {
          config: { ...DEFAULT_CONFIG, ...configResponse.data?.config },
          analytics: eventsResponse.data?.analytics ?? null,
          events: eventsResponse.data?.events ?? [],
          leads: leadsResponse.data?.leads ?? [],
        },
      };
    },
  });
  const analytics = resourceData?.analytics ?? null;
  const events = resourceData?.events ?? [];
  const leads = resourceData?.leads ?? [];

  useEffect(() => {
    if (!resourceData) return;
    setConfig(resourceData.config);
  }, [resourceData]);

  const {
    visibleItems: visibleLeads,
    visibleCount: visibleLeadsCount,
    totalCount: totalLeadsCount,
    showMore: showMoreLeads,
    showAll: showAllLeads,
  } = useLoadMoreList(leads);
  const {
    visibleItems: visibleEvents,
    visibleCount: visibleEventsCount,
    totalCount: totalEventsCount,
    showMore: showMoreEvents,
    showAll: showAllEvents,
  } = useLoadMoreList(events);
  const popupTopPages = analytics?.topPages ?? [];
  const {
    visibleItems: visiblePopupTopPages,
    visibleCount: visiblePopupTopPagesCount,
    totalCount: totalPopupTopPagesCount,
    showMore: showMorePopupTopPages,
    showAll: showAllPopupTopPages,
  } = useLoadMoreList(popupTopPages);
  const leadsLast7Days = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return leads.filter((lead) => Date.parse(lead.createdAt) >= sevenDaysAgo).length;
  }, [leads]);

  async function handleSave() {
    setSaving(true);
    setStatus("");
    setStatusMessage("");

    const response = await apiRequest(api.popup.config, {
      method: "POST",
      body: JSON.stringify(config),
    });

    setSaving(false);

    if (!response.success) {
      setStatus("error");
      setStatusMessage(response.error ?? "Falha ao salvar o popup.");
      return;
    }

    invalidateAdminResource([adminResourceKeys.popup, adminResourceKeys.dashboard]);
    setStatus("success");
    setStatusMessage("Configuracao do popup salva com sucesso.");
    await refresh();
  }

  function setValue<K extends keyof PopupConfig>(key: K, value: PopupConfig[K]) {
    setConfig((current) => ({ ...current, [key]: value }));
  }

  return (
    <DeveloperPage>
      <DeveloperHero
        eyebrow="Automacoes - Exit popup"
        title="Configuracao e analise do popup de saida."
        description="O modulo agora usa as APIs reais do app atual para texto, exibicao, eventos e leads capturados."
        stats={[
          { label: "Popup exibido", value: analytics?.totals.popup_shown ?? 0 },
          { label: "Conversao", value: `${(analytics?.conversionRate ?? 0).toFixed(1)}%` },
          { label: "Leads", value: leads.length },
        ]}
        actions={
          <button
            type="button"
            onClick={() => window.open("/?popup_test=1", "_blank", "noopener,noreferrer")}
            className={developerSecondaryButtonClassName}
          >
            <ArrowSquareOut size={16} weight="bold" />
            Testar popup
          </button>
        }
      />

      {loading ? (
        <div className="mt-6">
          <DeveloperMessage tone="info">Carregando configuracao do popup...</DeveloperMessage>
        </div>
      ) : null}

      {status === "error" ? (
        <div className="mt-6">
          <DeveloperMessage tone="error">{statusMessage}</DeveloperMessage>
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
            eyebrow="Formulario principal"
            title="Configurar comportamento do popup"
            description="Edite texto, campos visiveis, limites de exibicao e gatilhos mobile."
          />

          <div className="space-y-5">
            <label className="flex min-h-14 items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/72 px-4 py-3 text-sm font-medium text-[var(--foreground)]">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(event) => setValue("enabled", event.target.checked)}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              Popup ativo
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <DeveloperField label="Titulo" required>
                <input
                  value={config.title}
                  onChange={(event) => setValue("title", event.target.value)}
                  maxLength={80}
                  className={developerInputClassName}
                />
              </DeveloperField>
              <DeveloperField label="Texto do botao" required>
                <input
                  value={config.buttonText}
                  onChange={(event) => setValue("buttonText", event.target.value)}
                  maxLength={40}
                  className={developerInputClassName}
                />
              </DeveloperField>
            </div>

            <DeveloperField label="Descricao" required>
              <textarea
                rows={3}
                value={config.description}
                onChange={(event) => setValue("description", event.target.value)}
                maxLength={220}
                className={`${developerInputClassName} resize-none`}
              />
            </DeveloperField>

            <div className="grid gap-4 sm:grid-cols-2">
              <DeveloperField label="Texto de fechar">
                <input
                  value={config.closeText}
                  onChange={(event) => setValue("closeText", event.target.value)}
                  maxLength={24}
                  className={developerInputClassName}
                />
              </DeveloperField>
              <DeveloperField label="Mensagem de sucesso">
                <input
                  value={config.successMessage}
                  onChange={(event) => setValue("successMessage", event.target.value)}
                  maxLength={160}
                  className={developerInputClassName}
                />
              </DeveloperField>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <DeveloperField label="Delay (seg)">
                <input
                  type="number"
                  min={0}
                  value={config.delaySeconds}
                  onChange={(event) =>
                    setValue("delaySeconds", Number(event.target.value) || 0)
                  }
                  className={developerInputClassName}
                />
              </DeveloperField>
              <DeveloperField label="Cooldown (h)">
                <input
                  type="number"
                  min={0}
                  value={config.cooldownHours}
                  onChange={(event) =>
                    setValue("cooldownHours", Number(event.target.value) || 0)
                  }
                  className={developerInputClassName}
                />
              </DeveloperField>
              <DeveloperField label="Exibicoes por sessao">
                <input
                  type="number"
                  min={0}
                  value={config.maxShowsPerSession}
                  onChange={(event) =>
                    setValue("maxShowsPerSession", Number(event.target.value) || 0)
                  }
                  className={developerInputClassName}
                />
              </DeveloperField>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[24px] border border-[var(--border)] bg-white/68 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                  Campos do formulario
                </p>
                <div className="mt-4 space-y-3">
                  {[
                    { key: "enableName" as const, label: "Nome" },
                    { key: "enableEmail" as const, label: "E-mail" },
                    { key: "enablePhone" as const, label: "Telefone" },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-3 text-sm text-[var(--foreground)]">
                      <input
                        type="checkbox"
                        checked={config[item.key]}
                        onChange={(event) => setValue(item.key, event.target.checked)}
                        className="h-4 w-4 accent-[var(--primary)]"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-[var(--border)] bg-white/68 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                  Gatilhos mobile
                </p>
                <div className="mt-4 space-y-3">
                  {[
                    {
                      key: "mobileScrollTrigger" as const,
                      label: "Scroll rapido ao topo",
                    },
                    {
                      key: "mobileBackButtonTrigger" as const,
                      label: "Botao voltar",
                    },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-3 text-sm text-[var(--foreground)]">
                      <input
                        type="checkbox"
                        checked={config[item.key]}
                        onChange={(event) => setValue(item.key, event.target.checked)}
                        className="h-4 w-4 accent-[var(--primary)]"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={handleSave} disabled={saving} className={developerPrimaryButtonClassName}>
                <CheckCircle size={18} weight="bold" />
                {saving ? "Salvando..." : "Salvar configuracao"}
              </button>
              <button type="button" onClick={() => void refresh()} className={developerSecondaryButtonClassName}>
                <Pulse size={16} weight="bold" />
                Atualizar metricas
              </button>
            </div>

            {status === "success" ? (
              <DeveloperMessage tone="success">
                {statusMessage}
              </DeveloperMessage>
            ) : null}
          </div>
        </DeveloperCard>

        <div className="grid gap-6">
          <DeveloperCard>
            <DeveloperSectionHeading
              eyebrow="Analise"
              title="Leitura de desempenho"
              description="Volume de exibicao, envio e paginas onde vale otimizar primeiro."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  label: "Popup exibido",
                  value: analytics?.totals.popup_shown ?? 0,
                  icon: Pulse,
                },
                {
                  label: "Popup enviado",
                  value: analytics?.totals.popup_submitted ?? 0,
                  icon: CursorClick,
                },
                {
                  label: "Eventos 7 dias",
                  value: analytics?.last7Days.events ?? 0,
                  icon: Pulse,
                },
                {
                  label: "Leads 7 dias",
                  value: leadsLast7Days,
                  icon: EnvelopeSimple,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[24px] border border-[var(--border)] bg-white/72 px-4 py-4"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                    <item.icon size={18} weight="duotone" />
                  </span>
                  <p className="mt-4 text-3xl font-bold tracking-[-0.05em] text-[var(--foreground)]">
                    {item.value}
                  </p>
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-raw)]">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[24px] border border-[var(--border)] bg-white/72 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                Top paginas do popup
              </p>
              <DeveloperListViewport className="mt-3 max-h-[320px] space-y-2">
                {visiblePopupTopPages.length ? (
                  visiblePopupTopPages.map((item) => (
                    <div
                      key={item.pagePath}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-3 text-sm"
                    >
                      <span className="truncate text-[var(--foreground)]">{item.pagePath}</span>
                      <strong className="text-[var(--primary)]">{item.total}</strong>
                    </div>
                  ))
                ) : (
                    <p className="text-sm text-[var(--color-muted-raw)]">
                      Sem eventos suficientes no periodo atual.
                    </p>
                  )}
              </DeveloperListViewport>
              <DeveloperLoadMore
                shown={visiblePopupTopPagesCount}
                total={totalPopupTopPagesCount}
                onClick={showMorePopupTopPages}
                onShowAll={
                  totalPopupTopPagesCount - visiblePopupTopPagesCount > 12
                    ? showAllPopupTopPages
                    : undefined
                }
              />
            </div>
          </DeveloperCard>

          <DeveloperCard className="flex min-h-0 flex-col">
            <DeveloperSectionHeading
              eyebrow="Leads recentes"
              title="Ultimos contatos capturados"
              description="Lista curta para acompanhamento comercial sem sair do painel."
            />

            <DeveloperListViewport className="space-y-3">
              {visibleLeads.length > 0 ? (
                visibleLeads.map((lead) => (
                  <article
                    key={lead.id}
                    className="rounded-[22px] border border-[var(--border)] bg-white/72 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[var(--foreground)]">
                        {lead.name || "Lead sem nome"}
                      </p>
                      <span className="text-xs text-[var(--color-muted-raw)]">
                        {formatDateTime(lead.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-[var(--color-muted-raw)]">
                      {lead.email || "-"} - {lead.phone || "-"}
                    </p>
                    <p className="text-xs text-[var(--color-muted-raw)]">
                      Origem: {lead.pagePath || "/"}
                    </p>
                  </article>
                ))
              ) : (
                <DeveloperMessage tone="info">
                  Nenhum lead capturado ainda para o popup.
                </DeveloperMessage>
              )}
            </DeveloperListViewport>
            <DeveloperLoadMore
              shown={visibleLeadsCount}
              total={totalLeadsCount}
              onClick={showMoreLeads}
              onShowAll={totalLeadsCount - visibleLeadsCount > 12 ? showAllLeads : undefined}
            />
          </DeveloperCard>

          <DeveloperCard className="flex min-h-0 flex-col">
            <DeveloperSectionHeading
              eyebrow="Eventos recentes"
              title="Auditoria rapida"
              description="Ultimos eventos recebidos pelo endpoint do popup."
            />

            <DeveloperListViewport className="space-y-3">
              {visibleEvents.length > 0 ? (
                visibleEvents.map((event) => (
                  <article
                    key={event.id}
                    className="rounded-[22px] border border-[var(--border)] bg-white/72 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
                        {event.event}
                      </span>
                      <span className="text-xs text-[var(--color-muted-raw)]">
                        {formatDateTime(event.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--color-muted-raw)]">
                      Pagina: {event.pagePath || "/"}
                    </p>
                    <p className="text-xs text-[var(--color-muted-raw)]">
                      Sessao: {event.sessionId || "-"}
                    </p>
                  </article>
                ))
              ) : (
                <DeveloperMessage tone="info">Nenhum evento registrado ainda.</DeveloperMessage>
              )}
            </DeveloperListViewport>
            <DeveloperLoadMore
              shown={visibleEventsCount}
              total={totalEventsCount}
              onClick={showMoreEvents}
              onShowAll={totalEventsCount - visibleEventsCount > 12 ? showAllEvents : undefined}
            />
          </DeveloperCard>
        </div>
      </section>
    </DeveloperPage>
  );
}
