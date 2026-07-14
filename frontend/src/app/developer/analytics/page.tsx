"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChartBar,
  CheckCircle,
  CursorClick,
  GlobeHemisphereWest,
  Lightning,
  Pulse,
} from "@phosphor-icons/react";
import { useApiRequest } from "@/hooks/useApiRequest";
import {
  adminResourceKeys,
  invalidateAdminResource,
  useAdminResource,
} from "@/hooks/useAdminResource";
import { useCarouselPagination } from "@/hooks/useCarouselPagination";
import { api } from "@/lib/routes";
import { cn } from "@/lib/utils";
import {
  DeveloperCard,
  DeveloperField,
  DeveloperHero,
  DeveloperCarouselPagination,
  DeveloperMessage,
  DeveloperPage,
  DeveloperSectionHeading,
  DeveloperTooltip,
  developerInputClassName,
  developerPrimaryButtonClassName,
  developerSecondaryButtonClassName,
} from "@/components/developer/ui";

interface StatsResponse {
  totalPageViews: number;
  uniqueSessions: number;
  topPages: Array<{ page: string; views: number }>;
  recentEvents: Array<{
    id: string;
    event?: string;
    type: string;
    page: string;
    element?: string;
    timestamp: number;
    sessionId?: string;
  }>;
  stats: {
    generatedAt?: string;
    metrics: {
      visitors?: number;
      sessions: number;
      bounceRate?: number;
      avgTimeSeconds?: number;
      averageSessionDuration?: number;
      pageViews?: number;
    };
    heatmap?: {
      avgScrollPercent: number;
      topClickAreas: Array<{ area: string; total: number }>;
    };
    conversions: {
      forms: number;
      downloads: number;
      leads: number;
      popupOpen: number;
      total?: number;
      conversionRate?: number;
    };
    eventCounts: Record<string, number>;
    eventsTable?: Array<{
      id: string;
      event: string;
      page: string;
      timestamp: number;
      sessionId?: string;
    }>;
  };
}

interface ConfigForm {
  siteUrl: string;
  consentVersion: number;
  bannerEnabled: boolean;
  trackingEnabled: boolean;
  consentAnalytics: boolean;
  consentMarketing: boolean;
  consentPerformance: boolean;
  heartbeatSeconds: number;
  scrollMilestones: string;
  ga4Enabled: boolean;
  ga4MeasurementId: string;
  clarityEnabled: boolean;
  clarityProjectId: string;
  sentryEnabled: boolean;
  sentryDsn: string;
  enableSearchConsole: boolean;
  propertyUrl: string;
  sitemapUrl: string;
}

const DEFAULT_FORM: ConfigForm = {
  siteUrl: "",
  consentVersion: 1,
  bannerEnabled: true,
  trackingEnabled: true,
  consentAnalytics: true,
  consentMarketing: false,
  consentPerformance: false,
  heartbeatSeconds: 30,
  scrollMilestones: "25,50,75,100",
  ga4Enabled: false,
  ga4MeasurementId: "",
  clarityEnabled: false,
  clarityProjectId: "",
  sentryEnabled: false,
  sentryDsn: "",
  enableSearchConsole: false,
  propertyUrl: "",
  sitemapUrl: "/sitemap.xml",
};

interface AnalyticsResourceData {
  stats: StatsResponse | null;
  form: ConfigForm;
}

function hydrateForm(config: Record<string, unknown> | undefined): ConfigForm {
  const consent = (config?.consent as Record<string, unknown> | undefined) ?? {};
  const categories = (consent.categories as Record<string, unknown> | undefined) ?? {};
  const tracking = (config?.tracking as Record<string, unknown> | undefined) ?? {};
  const providers = (config?.providers as Record<string, unknown> | undefined) ?? {};
  const seo = (config?.seo as Record<string, unknown> | undefined) ?? {};
  const ga4 = (providers.ga4 as Record<string, unknown> | undefined) ?? {};
  const clarity = (providers.clarity as Record<string, unknown> | undefined) ?? {};
  const sentry = (providers.sentry as Record<string, unknown> | undefined) ?? {};

  return {
    siteUrl: String(config?.siteUrl ?? ""),
    consentVersion: Number(consent.version ?? 1),
    bannerEnabled: Boolean(consent.bannerEnabled ?? true),
    trackingEnabled: Boolean(tracking.enabled ?? true),
    consentAnalytics: Boolean(categories.analytics ?? true),
    consentMarketing: Boolean(categories.marketing ?? false),
    consentPerformance: Boolean(categories.performance ?? false),
    heartbeatSeconds: Number(tracking.heartbeatSeconds ?? 30),
    scrollMilestones: Array.isArray(tracking.scrollMilestones)
      ? tracking.scrollMilestones.join(",")
      : DEFAULT_FORM.scrollMilestones,
    ga4Enabled: Boolean(ga4.enabled),
    ga4MeasurementId: String(ga4.measurementId ?? ""),
    clarityEnabled: Boolean(clarity.enabled),
    clarityProjectId: String(clarity.projectId ?? ""),
    sentryEnabled: Boolean(sentry.enabled),
    sentryDsn: String(sentry.dsn ?? ""),
    enableSearchConsole: Boolean(seo.enableSearchConsole ?? false),
    propertyUrl: String(seo.propertyUrl ?? ""),
    sitemapUrl: String(seo.sitemapUrl ?? DEFAULT_FORM.sitemapUrl),
  };
}

function buildPayload(form: ConfigForm) {
  const scrollMilestones = form.scrollMilestones
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0 && item <= 100);

  return {
    siteUrl: form.siteUrl,
    consent: {
      bannerEnabled: form.bannerEnabled,
      version: Math.max(1, Math.round(form.consentVersion || 1)),
      categories: {
        analytics: form.consentAnalytics,
        marketing: form.consentMarketing,
        performance: form.consentPerformance,
      },
    },
    tracking: {
      enabled: form.trackingEnabled,
      heartbeatSeconds: Math.max(10, Math.round(form.heartbeatSeconds || 30)),
      scrollMilestones: [...new Set(scrollMilestones)].sort((a, b) => a - b),
    },
    providers: {
      ga4: {
        enabled: form.ga4Enabled,
        measurementId: form.ga4MeasurementId,
      },
      clarity: {
        enabled: form.clarityEnabled,
        projectId: form.clarityProjectId,
      },
      sentry: {
        enabled: form.sentryEnabled,
        dsn: form.sentryDsn,
      },
    },
    seo: {
      enableSearchConsole: form.enableSearchConsole,
      propertyUrl: form.propertyUrl,
      sitemapUrl: form.sitemapUrl,
    },
  };
}

function formatDateTime(value?: string | number) {
  if (!value) return "-";
  const parsed = typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(parsed)) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export default function AnalyticsPage() {
  const { apiRequest } = useApiRequest();
  const [daysInput, setDaysInput] = useState(30);
  const [appliedDays, setAppliedDays] = useState(30);
  const [eventFilter, setEventFilter] = useState("");
  const [pageFilter, setPageFilter] = useState("");
  const [form, setForm] = useState<ConfigForm>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"" | "success" | "error">("");
  const [statusMessage, setStatusMessage] = useState("");
  const {
    data: resourceData,
    loading,
    error,
    refresh,
  } = useAdminResource<AnalyticsResourceData>({
    key: adminResourceKeys.analytics(appliedDays),
    fetcher: async (request) => {
      const [configResponse, statsResponse] = await Promise.all([
        request<{ config?: Record<string, unknown> }>(api.analytics.config),
        request<StatsResponse>(`${api.analytics.stats}?days=${appliedDays}`),
      ]);

      if (!configResponse.success || !statsResponse.success) {
        return {
          success: false,
          error:
            configResponse.error ??
            statsResponse.error ??
            "Falha ao carregar analytics.",
        };
      }

      return {
        success: true,
        data: {
          form: hydrateForm(configResponse.data?.config),
          stats: statsResponse.data ?? null,
        },
      };
    },
  });
  const stats = resourceData?.stats ?? null;
  const metrics = stats?.stats.metrics;
  const conversions = stats?.stats.conversions;
  const heatmap = stats?.stats.heatmap;
  const visitors = metrics?.visitors ?? stats?.uniqueSessions ?? 0;
  const sessions = metrics?.sessions ?? stats?.uniqueSessions ?? 0;
  const avgTimeSeconds = metrics?.avgTimeSeconds ?? metrics?.averageSessionDuration ?? 0;
  const avgScrollPercent = heatmap?.avgScrollPercent ?? 0;
  const conversionRate = conversions?.conversionRate ?? 0;
  const totalConversions =
    conversions?.total ??
    ((conversions?.forms ?? 0) +
      (conversions?.downloads ?? 0) +
      (conversions?.leads ?? 0) +
      (conversions?.popupOpen ?? 0));
  const conversionEntries = [
    { label: "Formulários", value: conversions?.forms ?? 0 },
    { label: "Downloads", value: conversions?.downloads ?? 0 },
    { label: "Leads", value: conversions?.leads ?? 0 },
    { label: "Popup exibido", value: conversions?.popupOpen ?? 0 },
    { label: "Total", value: totalConversions },
  ];

  useEffect(() => {
    if (!resourceData) return;
    setForm(resourceData.form);
  }, [resourceData]);

  const eventEntries = useMemo(
    () =>
      stats?.stats.eventCounts
        ? Object.entries(stats.stats.eventCounts).sort(
            (left, right) => Number(right[1]) - Number(left[1])
          )
        : [],
    [stats]
  );
  const topPages = stats?.topPages ?? [];
  const eventsTable =
    stats?.stats.eventsTable ??
    stats?.recentEvents.map((event) => ({
      ...event,
      event: event.event ?? event.type,
    })) ??
    [];
  const filteredEventsTable = eventsTable.filter((event) => {
    const eventMatches = eventFilter
      ? event.event.toLowerCase().includes(eventFilter.toLowerCase())
      : true;
    const pageMatches = pageFilter
      ? event.page.toLowerCase().includes(pageFilter.toLowerCase())
      : true;
    return eventMatches && pageMatches;
  });
  const {
    pages: topPagesPages,
    currentPage: topPagesPage,
    totalPages: topPagesTotalPages,
    nextPage: nextTopPagesPage,
    prevPage: prevTopPagesPage,
  } = useCarouselPagination(topPages, 5);
  const {
    pages: eventEntriesPages,
    currentPage: eventEntriesPage,
    totalPages: eventEntriesTotalPages,
    nextPage: nextEventEntriesPage,
    prevPage: prevEventEntriesPage,
  } = useCarouselPagination(eventEntries, 5);
  const {
    pages: eventsTablePages,
    currentPage: eventsTablePage,
    totalPages: eventsTableTotalPages,
    nextPage: nextEventsTablePage,
    prevPage: prevEventsTablePage,
  } = useCarouselPagination(filteredEventsTable, 5);
  const {
    pages: conversionPages,
    currentPage: conversionPage,
    totalPages: conversionTotalPages,
    nextPage: nextConversionPage,
    prevPage: prevConversionPage,
  } = useCarouselPagination(conversionEntries, 5);

  async function handleSave() {
    setSaving(true);
    setStatus("");
    setStatusMessage("");

    const response = await apiRequest(api.analytics.config, {
      method: "POST",
      body: JSON.stringify(buildPayload(form)),
    });

    setSaving(false);

    if (!response.success) {
      setStatus("error");
      setStatusMessage(response.error ?? "Falha ao salvar analytics.");
      return;
    }

    invalidateAdminResource(adminResourceKeys.analytics(appliedDays));
    setStatus("success");
    setStatusMessage("Configuração de analytics salva com sucesso.");
    await refresh();
  }

  function handleRefresh() {
    setStatus("");
    setStatusMessage("");
    if (daysInput !== appliedDays) {
      setAppliedDays(daysInput);
      return;
    }
    void refresh();
  }

  function setValue<K extends keyof ConfigForm>(key: K, value: ConfigForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <DeveloperPage>
      <DeveloperHero
        eyebrow="Automações - Analytics"
        title="Leitura de comportamento e configuração."
        description="Visão adaptada ao analytics do projeto atual: estatísticas, heatmap, auditoria e configurações principais."
        stats={[
          { label: "Visitantes", value: visitors },
          { label: "Sessões", value: sessions },
          {
            label: "Conversão",
            value: `${conversionRate.toFixed(1)}%`,
          },
        ]}
        actions={
          <div className="flex items-stretch gap-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2 shadow-[0_6px_14px_rgba(15,23,42,0.03)]">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-raw)]">
                Período (dias)
              </span>
              <input
                type="number"
                min={1}
                max={120}
                value={daysInput}
                onChange={(event) => setDaysInput(Number(event.target.value) || 30)}
                className="mt-1.5 h-8 w-20 rounded-lg border border-[var(--border)] bg-white px-2.5 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]/30"
              />
            </div>
            <button type="button" onClick={handleRefresh} className={cn(developerSecondaryButtonClassName, "min-h-[76px] px-4 py-2 text-xs")}>
              <Pulse size={15} weight="bold" />
              Atualizar
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="mt-6">
          <DeveloperMessage tone="info">Carregando dados de analytics...</DeveloperMessage>
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

      {stats ? (
        <>
          <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Page views", value: stats.totalPageViews, icon: ChartBar },
              { label: "Sessões únicas", value: stats.uniqueSessions, icon: GlobeHemisphereWest },
              {
                label: "Tempo médio",
                value: `${avgTimeSeconds.toFixed(0)}s`,
                icon: Pulse,
              },
              {
                label: "Scroll médio",
                value: `${avgScrollPercent.toFixed(1)}%`,
                icon: Lightning,
              },
            ].map((item) => (
              <DeveloperCard key={item.label} className="flex items-center gap-3 p-4 sm:p-4">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                  <item.icon size={18} weight="duotone" />
                </span>
                <div className="min-w-0">
                  <div className="text-2xl font-bold leading-none tracking-[-0.05em] text-[var(--foreground)]">{item.value}</div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-raw)]">{item.label}</div>
                </div>
              </DeveloperCard>
            ))}
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <DeveloperCard className="flex h-full flex-col p-5 sm:p-6">
              <DeveloperSectionHeading
                eyebrow="Páginas"
                title="Top páginas do período"
                description={`Atualizado em ${formatDateTime(stats.stats.generatedAt ?? Date.now())}.`}
                tooltip="Eventos por página mostra quais rotas receberam mais visualizações no período. Exemplo: /servicos com 120 views."
              />

              <div className="flex-1 overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)]"
                  style={{ transform: `translateX(-${topPagesPage * 100}%)` }}
                >
                  {topPagesPages.map((page, index) => (
                    <div key={index} className="w-full shrink-0 space-y-4">
                      {page.map((pageData) => {
                        const maxViews = Math.max(...stats.topPages.map((item) => item.views), 1);
                        const width = Math.round((pageData.views / maxViews) * 100);

                        return (
                          <div key={pageData.page}>
                            <div className="flex items-center justify-between gap-3">
                              <span className="truncate text-sm font-medium text-[var(--foreground)]">
                                {pageData.page}
                              </span>
                              <span className="text-sm font-semibold text-[var(--primary)]">
                                {pageData.views}
                              </span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                              <div
                                className="h-2 rounded-full bg-[linear-gradient(90deg,#1d4ed8_0%,#06b6d4_100%)]"
                                style={{ width: `${width}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-auto"><DeveloperCarouselPagination currentPage={topPagesPage} totalPages={topPagesTotalPages} onNext={nextTopPagesPage} onPrev={prevTopPagesPage} compact /></div>
            </DeveloperCard>

            <DeveloperCard className="flex h-full flex-col p-5 sm:p-6">
              <DeveloperSectionHeading
                eyebrow="Eventos"
                title="Contagem por tipo"
                description="Resumo dos eventos recebidos pelo analytics."
                tooltip="Volume por evento soma quantas vezes cada ação aconteceu. Exemplo: page_view, popup_submit ou cta_click."
              />

              <div className="flex-1 overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)]"
                  style={{ transform: `translateX(-${eventEntriesPage * 100}%)` }}
                >
                  {eventEntriesPages.map((page, index) => (
                    <div key={index} className="w-full shrink-0 space-y-3">
                      {page.length > 0 ? (
                        page.map(([eventName, total]) => (
                          <div
                            key={eventName}
                            className="flex items-center justify-between gap-3 rounded-[22px] border border-[var(--border)] bg-white/72 px-4 py-4"
                          >
                            <span className="truncate text-sm font-medium text-[var(--foreground)]">
                              {eventName}
                            </span>
                            <strong className="text-[var(--primary)]">{total}</strong>
                          </div>
                        ))
                      ) : (
                        <DeveloperMessage tone="info">Nenhum evento no período atual.</DeveloperMessage>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-auto"><DeveloperCarouselPagination currentPage={eventEntriesPage} totalPages={eventEntriesTotalPages} onNext={nextEventEntriesPage} onPrev={prevEventEntriesPage} compact /></div>
            </DeveloperCard>
          </section>

          <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <DeveloperCard className="flex h-full flex-col p-5 sm:p-6">
              <DeveloperSectionHeading
                eyebrow="Auditoria"
                title="Eventos recentes"
                description="Últimos registros recebidos pelo endpoint de analytics."
                tooltip="Registros recentes combinam eventos normalizados e legados. Exemplo: page_view em /contato com sessão anon-123."
              />

              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <DeveloperField
                  label="Filtrar tipo"
                  tooltip="Filtra pelo nome do evento. Exemplo: page_view, cta_click ou popup_submit."
                >
                  <input
                    value={eventFilter}
                    onChange={(event) => setEventFilter(event.target.value)}
                    className={developerInputClassName}
                    placeholder="page_view, cta_click..."
                  />
                </DeveloperField>
                <DeveloperField
                  label="Filtrar página"
                  tooltip="Filtra pela rota da página onde o evento aconteceu. Exemplo: /servicos."
                >
                  <input
                    value={pageFilter}
                    onChange={(event) => setPageFilter(event.target.value)}
                    className={developerInputClassName}
                    placeholder="/servicos"
                  />
                </DeveloperField>
              </div>

              <div className="flex-1 overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)]"
                  style={{ transform: `translateX(-${eventsTablePage * 100}%)` }}
                >
                  {eventsTablePages.map((page, index) => (
                    <div key={index} className="w-full shrink-0">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                          <thead>
                            <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted-raw)]">
                              <th className="pb-3 pr-4 font-semibold">Evento</th>
                              <th className="pb-3 pr-4 font-semibold">Página</th>
                              <th className="pb-3 pr-4 font-semibold">Data</th>
                              <th className="pb-3 font-semibold">
                                <span className="inline-flex items-center gap-1.5">
                                  Sessão
                                  <DeveloperTooltip content="Sessão identifica uma visita anônima durante a navegação. Exemplo: session_abc123." />
                                </span>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {page.map((event) => (
                              <tr key={event.id} className="border-b border-[var(--border)]/60 align-top">
                                <td className="py-3 pr-4 text-[var(--foreground)]">{event.event}</td>
                                <td className="py-3 pr-4 text-[var(--color-muted-raw)]">{event.page}</td>
                                <td className="py-3 pr-4 text-[var(--color-muted-raw)]">
                                  {formatDateTime(event.timestamp)}
                                </td>
                                <td className="py-3 text-[var(--color-muted-raw)]">
                                  {event.sessionId || "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-auto"><DeveloperCarouselPagination currentPage={eventsTablePage} totalPages={eventsTableTotalPages} onNext={nextEventsTablePage} onPrev={prevEventsTablePage} compact /></div>
            </DeveloperCard>

            <DeveloperCard className="flex h-full flex-col p-5 sm:p-6">
              <DeveloperSectionHeading
                eyebrow="Conversões"
                title="Resumo de resultados"
                description="Formulários, downloads, popup e taxa geral do período."
                tooltip="Conversão é uma ação de valor. Exemplo: formulário enviado, lead criado ou popup enviado."
              />

              <div className="flex flex-1 overflow-hidden">
                <div className="flex w-full transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)]" style={{ transform: `translateX(-${conversionPage * 100}%)` }}>
                  {conversionPages.map((conversionItems, index) => (
                    <div key={index} className="flex w-full shrink-0 flex-col justify-between gap-3">
                      {conversionItems.map((item) => <div key={item.label} className="flex items-center justify-between gap-3 rounded-[18px] border border-[var(--border)] bg-slate-50/80 px-4 py-3"><span className="text-sm font-medium text-[var(--foreground)]">{item.label}</span><strong className="text-[var(--primary)]">{item.value}</strong></div>)}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-auto"><DeveloperCarouselPagination currentPage={conversionPage} totalPages={conversionTotalPages} onNext={nextConversionPage} onPrev={prevConversionPage} compact /></div>
            </DeveloperCard>
          </section>
        </>
      ) : null}

      <section className="mt-6">
        <DeveloperCard className="p-5 sm:p-6">
          <DeveloperSectionHeading
            eyebrow="Configuração"
            title="Consentimento e integrações principais"
            description="Formulário enxuto para o que o projeto atual realmente usa com consistência."
            tooltip="Essas opções controlam coleta, consentimento e provedores externos usados pelo analytics."
          />

          <div className="space-y-5">
            <div className="rounded-[20px] border border-[#bfdbfe] bg-[linear-gradient(135deg,rgba(239,246,255,0.9),rgba(255,255,255,0.95))] p-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                Base e consentimento
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <DeveloperField label="URL base do site">
                  <input
                    value={form.siteUrl}
                    onChange={(event) => setValue("siteUrl", event.target.value)}
                    className={developerInputClassName}
                  />
                </DeveloperField>
                <DeveloperField
                  label="Versão do consentimento"
                  tooltip="Versão usada para pedir novo aceite quando a política muda. Exemplo: aumente de 1 para 2 após alterar categorias."
                >
                  <input
                    type="number"
                    min={1}
                    value={form.consentVersion}
                    onChange={(event) =>
                      setValue("consentVersion", Number(event.target.value) || 1)
                    }
                    className={developerInputClassName}
                  />
                </DeveloperField>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  { key: "bannerEnabled" as const, label: "Banner ativo" },
                  { key: "trackingEnabled" as const, label: "Tracking ativo" },
                  { key: "consentAnalytics" as const, label: "Analytics padrão" },
                  { key: "consentMarketing" as const, label: "Marketing padrão" },
                  { key: "consentPerformance" as const, label: "Performance padrão" },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex min-h-12 items-center gap-3 rounded-xl border border-white bg-white/92 px-3.5 py-2.5 text-sm font-medium text-[var(--foreground)] shadow-[0_5px_12px_rgba(29,78,216,0.04)]"
                  >
                    <input
                      type="checkbox"
                      checked={form[item.key]}
                      onChange={(event) => setValue(item.key, event.target.checked)}
                      className="h-4 w-4 accent-[var(--primary)]"
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 rounded-[20px] border border-slate-200 bg-slate-50/72 p-4 sm:grid-cols-2 sm:p-5">
              <DeveloperField
                label="Heartbeat da sessão (segundos)"
                tooltip="Intervalo para registrar que a sessão continua ativa. Exemplo: 30 segundos gera leituras regulares de permanência."
              >
                <input
                  type="number"
                  min={10}
                  value={form.heartbeatSeconds}
                  onChange={(event) =>
                    setValue("heartbeatSeconds", Number(event.target.value) || 30)
                  }
                  className={developerInputClassName}
                />
              </DeveloperField>
              <DeveloperField
                label="Marcos de scroll (%)"
                tooltip="Percentuais em que o sistema registra profundidade de leitura. Exemplo: 25,50,75,100."
              >
                <input
                  value={form.scrollMilestones}
                  onChange={(event) => setValue("scrollMilestones", event.target.value)}
                  className={developerInputClassName}
                />
              </DeveloperField>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {[
                {
                  enabledKey: "ga4Enabled" as const,
                  fieldKey: "ga4MeasurementId" as const,
                  label: "GA4",
                  fieldLabel: "Measurement ID",
                },
                {
                  enabledKey: "clarityEnabled" as const,
                  fieldKey: "clarityProjectId" as const,
                  label: "Clarity",
                  fieldLabel: "Project ID",
                },
                {
                  enabledKey: "sentryEnabled" as const,
                  fieldKey: "sentryDsn" as const,
                  label: "Sentry",
                  fieldLabel: "DSN",
                },
              ].map((item) => (
                <div key={item.label} className={cn("rounded-[20px] border p-4 shadow-[0_6px_16px_rgba(15,23,42,0.035)]", form[item.enabledKey] ? "border-[#93c5fd] bg-[#eff6ff]" : "border-slate-200 bg-slate-50/82")}>
                  <label className="flex items-center gap-3 text-sm font-medium text-[var(--foreground)]">
                    <input
                      type="checkbox"
                      checked={form[item.enabledKey]}
                      onChange={(event) =>
                        setValue(item.enabledKey, event.target.checked)
                      }
                      className="h-4 w-4 accent-[var(--primary)]"
                    />
                    {item.label}
                  </label>

                  <div className="mt-4">
                    <DeveloperField label={item.fieldLabel}>
                      <input
                        value={form[item.fieldKey]}
                        onChange={(event) =>
                          setValue(item.fieldKey, event.target.value)
                        }
                        className={developerInputClassName}
                      />
                    </DeveloperField>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 rounded-[20px] border border-slate-200 bg-slate-50/72 p-4 sm:grid-cols-2 sm:p-5">
              <label className="flex min-h-12 items-center gap-3 rounded-xl border border-white bg-white/92 px-3.5 py-2.5 text-sm font-medium text-[var(--foreground)] shadow-[0_5px_12px_rgba(15,23,42,0.04)]">
                <input
                  type="checkbox"
                  checked={form.enableSearchConsole}
                  onChange={(event) =>
                    setValue("enableSearchConsole", event.target.checked)
                  }
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                Search Console ativo
              </label>
              <DeveloperField label="Property URL">
                <input
                  value={form.propertyUrl}
                  onChange={(event) => setValue("propertyUrl", event.target.value)}
                  className={developerInputClassName}
                />
              </DeveloperField>
            </div>

            <DeveloperField label="Sitemap URL">
              <input
                value={form.sitemapUrl}
                onChange={(event) => setValue("sitemapUrl", event.target.value)}
                className={developerInputClassName}
              />
            </DeveloperField>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={handleSave} disabled={saving} className={developerPrimaryButtonClassName}>
                <CheckCircle size={18} weight="bold" />
                {saving ? "Salvando..." : "Salvar configuração"}
              </button>
              <button type="button" onClick={handleRefresh} className={developerSecondaryButtonClassName}>
                <CursorClick size={16} weight="bold" />
                Atualizar métricas
              </button>
            </div>

            {status === "success" ? (
              <DeveloperMessage tone="success">
                {statusMessage}
              </DeveloperMessage>
            ) : null}
          </div>
        </DeveloperCard>
      </section>
    </DeveloperPage>
  );
}
