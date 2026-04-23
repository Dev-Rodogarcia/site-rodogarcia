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
    type: string;
    page: string;
    element?: string;
    timestamp: number;
    sessionId?: string;
    userId?: string;
  }>;
  stats: {
    generatedAt: string;
    metrics: {
      visitors: number;
      sessions: number;
      bounceRate: number;
      avgTimeSeconds: number;
    };
    heatmap: {
      avgScrollPercent: number;
      topClickAreas: Array<{ area: string; total: number }>;
    };
    conversions: {
      forms: number;
      downloads: number;
      leads: number;
      popupOpen: number;
      total: number;
      conversionRate: number;
    };
    eventCounts: Record<string, number>;
    eventsTable: Array<{
      id: string;
      event: string;
      page: string;
      timestamp: number;
      userId?: string;
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
  const eventsTable = stats?.stats.eventsTable ?? [];
  const {
    visibleItems: visibleTopPages,
    visibleCount: visibleTopPagesCount,
    totalCount: totalTopPagesCount,
    showMore: showMoreTopPages,
    showAll: showAllTopPages,
  } = useLoadMoreList(topPages);
  const {
    visibleItems: visibleEventEntries,
    visibleCount: visibleEventEntriesCount,
    totalCount: totalEventEntriesCount,
    showMore: showMoreEventEntries,
    showAll: showAllEventEntries,
  } = useLoadMoreList(eventEntries);
  const {
    visibleItems: visibleEventsTable,
    visibleCount: visibleEventsTableCount,
    totalCount: totalEventsTableCount,
    showMore: showMoreEventsTable,
    showAll: showAllEventsTable,
  } = useLoadMoreList(eventsTable);

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
    setStatusMessage("Configuracao de analytics salva com sucesso.");
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
        eyebrow="Automacoes - Analytics"
        title="Leitura de comportamento e configuracao."
        description="Visao adaptada ao analytics do projeto atual: stats, heatmap, auditoria e configuracoes principais."
        stats={[
          { label: "Visitantes", value: stats?.stats.metrics.visitors ?? 0 },
          { label: "Sessoes", value: stats?.stats.metrics.sessions ?? 0 },
          {
            label: "Conversao",
            value: `${(stats?.stats.conversions.conversionRate ?? 0).toFixed(1)}%`,
          },
        ]}
        actions={
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="rounded-[22px] border border-white/80 bg-white/78 px-4 py-3 shadow-[0_16px_34px_rgba(15,23,42,0.05)]">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-raw)]">
                Periodo (dias)
              </span>
              <input
                type="number"
                min={1}
                max={120}
                value={daysInput}
                onChange={(event) => setDaysInput(Number(event.target.value) || 30)}
                className="mt-2 h-10 w-24 rounded-xl border border-[var(--border)] bg-white px-3 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]/30"
              />
            </div>
            <button type="button" onClick={handleRefresh} className={developerSecondaryButtonClassName}>
              <Pulse size={16} weight="bold" />
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
          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Page views", value: stats.totalPageViews, icon: ChartBar },
              { label: "Sessoes unicas", value: stats.uniqueSessions, icon: GlobeHemisphereWest },
              {
                label: "Tempo medio",
                value: `${stats.stats.metrics.avgTimeSeconds.toFixed(0)}s`,
                icon: Pulse,
              },
              {
                label: "Scroll medio",
                value: `${stats.stats.heatmap.avgScrollPercent.toFixed(1)}%`,
                icon: Lightning,
              },
            ].map((item) => (
              <DeveloperCard key={item.label}>
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                  <item.icon size={22} weight="duotone" />
                </span>
                <div className="mt-5 text-4xl font-bold tracking-[-0.06em] text-[var(--foreground)]">
                  {item.value}
                </div>
                <div className="mt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-raw)]">
                  {item.label}
                </div>
              </DeveloperCard>
            ))}
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <DeveloperCard>
              <DeveloperSectionHeading
                eyebrow="Paginas"
                title="Top paginas do periodo"
                description={`Atualizado em ${formatDateTime(stats.stats.generatedAt)}.`}
              />

              <DeveloperListViewport className="space-y-4">
                {visibleTopPages.map((page) => {
                  const maxViews = Math.max(...stats.topPages.map((item) => item.views), 1);
                  const width = Math.round((page.views / maxViews) * 100);

                  return (
                    <div key={page.page}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-medium text-[var(--foreground)]">
                          {page.page}
                        </span>
                        <span className="text-sm font-semibold text-[var(--primary)]">
                          {page.views}
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
              </DeveloperListViewport>
              <DeveloperLoadMore
                shown={visibleTopPagesCount}
                total={totalTopPagesCount}
                onClick={showMoreTopPages}
                onShowAll={totalTopPagesCount - visibleTopPagesCount > 12 ? showAllTopPages : undefined}
              />
            </DeveloperCard>

            <DeveloperCard>
              <DeveloperSectionHeading
                eyebrow="Eventos"
                title="Contagem por tipo"
                description="Resumo dos eventos recebidos pelo analytics."
              />

              <DeveloperListViewport className="space-y-3">
                {visibleEventEntries.length > 0 ? (
                  visibleEventEntries.map(([eventName, total]) => (
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
                  <DeveloperMessage tone="info">Nenhum evento no periodo atual.</DeveloperMessage>
                )}
              </DeveloperListViewport>
              <DeveloperLoadMore
                shown={visibleEventEntriesCount}
                total={totalEventEntriesCount}
                onClick={showMoreEventEntries}
                onShowAll={
                  totalEventEntriesCount - visibleEventEntriesCount > 12
                    ? showAllEventEntries
                    : undefined
                }
              />
            </DeveloperCard>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <DeveloperCard>
              <DeveloperSectionHeading
                eyebrow="Auditoria"
                title="Eventos recentes"
                description="Ultimos registros recebidos pelo endpoint de analytics."
              />

              <DeveloperListViewport className="max-h-[680px]">
                <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted-raw)]">
                      <th className="pb-3 pr-4 font-semibold">Evento</th>
                      <th className="pb-3 pr-4 font-semibold">Pagina</th>
                      <th className="pb-3 pr-4 font-semibold">Data</th>
                      <th className="pb-3 font-semibold">Sessao</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleEventsTable.map((event) => (
                      <tr key={event.id} className="border-b border-[var(--border)]/60 align-top">
                        <td className="py-3 pr-4 text-[var(--foreground)]">{event.event}</td>
                        <td className="py-3 pr-4 text-[var(--color-muted-raw)]">{event.page}</td>
                        <td className="py-3 pr-4 text-[var(--color-muted-raw)]">
                          {formatDateTime(event.timestamp)}
                        </td>
                        <td className="py-3 text-[var(--color-muted-raw)]">
                          {event.sessionId || event.userId || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </DeveloperListViewport>
              <DeveloperLoadMore
                shown={visibleEventsTableCount}
                total={totalEventsTableCount}
                onClick={showMoreEventsTable}
                onShowAll={totalEventsTableCount - visibleEventsTableCount > 12 ? showAllEventsTable : undefined}
              />
            </DeveloperCard>

            <DeveloperCard>
              <DeveloperSectionHeading
                eyebrow="Conversoes"
                title="Resumo de resultados"
                description="Formulario, downloads, popup e taxa geral do periodo."
              />

              <div className="space-y-3">
                {[
                  { label: "Formularios", value: stats.stats.conversions.forms },
                  { label: "Downloads", value: stats.stats.conversions.downloads },
                  { label: "Leads", value: stats.stats.conversions.leads },
                  { label: "Popup open", value: stats.stats.conversions.popupOpen },
                  { label: "Total", value: stats.stats.conversions.total },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-3 rounded-[22px] border border-[var(--border)] bg-white/72 px-4 py-4"
                  >
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {item.label}
                    </span>
                    <strong className="text-[var(--primary)]">{item.value}</strong>
                  </div>
                ))}
              </div>
            </DeveloperCard>
          </section>
        </>
      ) : null}

      <section className="mt-6">
        <DeveloperCard>
          <DeveloperSectionHeading
            eyebrow="Configuracao"
            title="Consentimento e integracoes principais"
            description="Formulario enxuto para o que o projeto atual realmente usa com consistencia."
          />

          <div className="space-y-8">
            <div>
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
                <DeveloperField label="Versao do consentimento">
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
                  { key: "consentAnalytics" as const, label: "Analytics padrao" },
                  { key: "consentMarketing" as const, label: "Marketing padrao" },
                  { key: "consentPerformance" as const, label: "Performance padrao" },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex min-h-14 items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/72 px-4 py-3 text-sm font-medium text-[var(--foreground)]"
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

            <div className="grid gap-4 sm:grid-cols-2">
              <DeveloperField label="Heartbeat da sessao (segundos)">
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
              <DeveloperField label="Marcos de scroll (%)">
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
                <div
                  key={item.label}
                  className="rounded-[24px] border border-[var(--border)] bg-white/72 p-4"
                >
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

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex min-h-14 items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/72 px-4 py-3 text-sm font-medium text-[var(--foreground)]">
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
                {saving ? "Salvando..." : "Salvar configuracao"}
              </button>
              <button type="button" onClick={handleRefresh} className={developerSecondaryButtonClassName}>
                <CursorClick size={16} weight="bold" />
                Recarregar dados
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
