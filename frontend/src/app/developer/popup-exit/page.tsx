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
import { useCarouselPagination } from "@/hooks/useCarouselPagination";
import { api } from "@/lib/routes";
import { DeveloperImageField } from "@/components/developer/DeveloperImageField";
import {
  DeveloperCard,
  DeveloperField,
  DeveloperHero,
  DeveloperCarouselPagination,
  DeveloperMessage,
  DeveloperPage,
  DeveloperSectionHeading,
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
  badgeText?: string;
  image?: string;
  delaySeconds: number;
  cooldownHours: number;
  maxShowsPerSession: number;
  mobileScrollTrigger: boolean;
  mobileBackButtonTrigger: boolean;
  desktop?: {
    title?: string;
    description?: string;
    image?: string;
  };
  mobile?: {
    title?: string;
    description?: string;
    image?: string;
    sheetTitle?: string;
  };
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
  description: "Receba uma proposta personalizada para sua operação logística.",
  enableName: true,
  enableEmail: true,
  enablePhone: true,
  buttonText: "Receber proposta",
  closeText: "Fechar",
  successMessage: "Recebemos seus dados. Em breve entraremos em contato.",
  badgeText: "Oferta especial",
  image: "",
  delaySeconds: 10,
  cooldownHours: 24,
  maxShowsPerSession: 1,
  mobileScrollTrigger: true,
  mobileBackButtonTrigger: true,
  desktop: {
    title: "Antes de sair...",
    description: "Receba uma proposta personalizada para sua operação logística.",
    image: "",
  },
  mobile: {
    title: "Fale com a Rodogarcia",
    description: "Deixe seu contato para retorno rápido pelo celular.",
    image: "",
    sheetTitle: "Atendimento rápido",
  },
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
          config: {
            ...DEFAULT_CONFIG,
            ...configResponse.data?.config,
            desktop: {
              ...DEFAULT_CONFIG.desktop,
              ...(configResponse.data?.config?.desktop ?? {}),
            },
            mobile: {
              ...DEFAULT_CONFIG.mobile,
              ...(configResponse.data?.config?.mobile ?? {}),
            },
          },
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
    pages: leadsPages,
    currentPage: leadsPage,
    totalPages: leadsTotalPages,
    nextPage: nextLeadsPage,
    prevPage: prevLeadsPage,
  } = useCarouselPagination(leads, 4);

  const {
    pages: eventsPages,
    currentPage: eventsPage,
    totalPages: eventsTotalPages,
    nextPage: nextEventsPage,
    prevPage: prevEventsPage,
  } = useCarouselPagination(events, 4);

  const popupTopPages = analytics?.topPages ?? [];
  const {
    pages: topPagesPages,
    currentPage: topPagesPage,
    totalPages: topPagesTotalPages,
    nextPage: nextTopPagesPage,
    prevPage: prevTopPagesPage,
  } = useCarouselPagination(popupTopPages, 4);

  const leadsLast7Days = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return leads.filter((lead) => Date.parse(lead.createdAt) >= sevenDaysAgo).length;
  }, [leads]);

  async function handleSave() {
    if (!config.title.trim() || !config.description.trim() || !config.buttonText.trim()) {
      setStatus("error");
      setStatusMessage("Preencha título, descrição e texto do botão antes de salvar.");
      return;
    }

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
    setStatusMessage("Configuração do popup salva com sucesso.");
    await refresh();
  }

  function setValue<K extends keyof PopupConfig>(key: K, value: PopupConfig[K]) {
    setConfig((current) => ({ ...current, [key]: value }));
  }

  return (
    <DeveloperPage>
      <DeveloperHero
        eyebrow="Automações - Exit popup"
        title="Configuração e análise do popup de saída."
        description="O módulo agora usa as APIs reais do app atual para texto, exibição, eventos e leads capturados."
        stats={[
          { label: "Popup exibido", value: analytics?.totals.popup_shown ?? 0 },
          { label: "Conversão", value: `${(analytics?.conversionRate ?? 0).toFixed(1)}%` },
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
          <DeveloperMessage tone="info">Carregando configuração do popup...</DeveloperMessage>
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

      <div className="mt-8 flex flex-col gap-6">

        {/* Card 1 — Status */}
          <DeveloperCard>
            <DeveloperSectionHeading
              eyebrow="Status"
              title="Ativação do popup"
              description="Ligue ou desligue o popup de saída sem apagar as configurações salvas."
              tooltip="Controla a publicação do popup no site. Exemplo: desligue temporariamente sem perder textos e imagens."
            />
            <label className="flex min-h-14 items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/72 px-4 py-3 text-sm font-medium text-[var(--foreground)]">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(event) => setValue("enabled", event.target.checked)}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              Popup ativo
            </label>
          </DeveloperCard>

          {/* Card 2 — Textos */}
          <DeveloperCard>
            <DeveloperSectionHeading
              eyebrow="Conteúdo"
              title="Textos do popup"
              description="Título, descrição, botão de envio, fechar e mensagem de confirmação."
            />
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <DeveloperField label="Título" required>
                  <input
                    value={config.title}
                    onChange={(event) => setValue("title", event.target.value)}
                    maxLength={80}
                    className={developerInputClassName}
                  />
                </DeveloperField>
                <DeveloperField label="Texto do botão" required>
                  <input
                    value={config.buttonText}
                    onChange={(event) => setValue("buttonText", event.target.value)}
                    maxLength={40}
                    className={developerInputClassName}
                  />
                </DeveloperField>
              </div>

              <DeveloperField label="Descrição" required>
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
              <div className="grid gap-4 sm:grid-cols-2">
                <DeveloperField label="Badge">
                  <input
                    value={config.badgeText ?? ""}
                    onChange={(event) => setValue("badgeText", event.target.value)}
                    maxLength={40}
                    className={developerInputClassName}
                  />
                </DeveloperField>
                <DeveloperImageField
                  label="Imagem padrão"
                  value={config.image ?? ""}
                  onChange={(image) => setValue("image", image)}
                />
              </div>
            </div>
          </DeveloperCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <DeveloperCard>
              <DeveloperSectionHeading
                eyebrow="Desktop"
                title="Layout específico"
                description="Textos e imagem usados em telas maiores."
              />
              <div className="space-y-4">
                <DeveloperField label="Título desktop">
                  <input
                    value={config.desktop?.title ?? ""}
                    onChange={(event) =>
                      setConfig((current) => ({
                        ...current,
                        desktop: { ...current.desktop, title: event.target.value },
                      }))
                    }
                    className={developerInputClassName}
                  />
                </DeveloperField>
                <DeveloperField label="Descrição desktop">
                  <textarea
                    rows={3}
                    value={config.desktop?.description ?? ""}
                    onChange={(event) =>
                      setConfig((current) => ({
                        ...current,
                        desktop: { ...current.desktop, description: event.target.value },
                      }))
                    }
                    className={`${developerInputClassName} resize-none`}
                  />
                </DeveloperField>
                <DeveloperImageField
                  label="Imagem desktop"
                  value={config.desktop?.image ?? ""}
                  onChange={(image) =>
                    setConfig((current) => ({
                      ...current,
                      desktop: { ...current.desktop, image },
                    }))
                  }
                />
              </div>
            </DeveloperCard>

            <DeveloperCard>
              <DeveloperSectionHeading
                eyebrow="Mobile"
                title="UX própria para celular"
                description="Usa texto, imagem e folha inferior adaptados."
                tooltip="Configuração exclusiva do popup em celulares, com layout próprio em formato de folha inferior."
              />
              <div className="space-y-4">
                <DeveloperField label="Título mobile">
                  <input
                    value={config.mobile?.title ?? ""}
                    onChange={(event) =>
                      setConfig((current) => ({
                        ...current,
                        mobile: { ...current.mobile, title: event.target.value },
                      }))
                    }
                    className={developerInputClassName}
                  />
                </DeveloperField>
                <DeveloperField label="Descrição mobile">
                  <textarea
                    rows={3}
                    value={config.mobile?.description ?? ""}
                    onChange={(event) =>
                      setConfig((current) => ({
                        ...current,
                        mobile: { ...current.mobile, description: event.target.value },
                      }))
                    }
                    className={`${developerInputClassName} resize-none`}
                  />
                </DeveloperField>
                <DeveloperField label="Título da folha mobile">
                  <input
                    value={config.mobile?.sheetTitle ?? ""}
                    onChange={(event) =>
                      setConfig((current) => ({
                        ...current,
                        mobile: { ...current.mobile, sheetTitle: event.target.value },
                      }))
                    }
                    className={developerInputClassName}
                  />
                </DeveloperField>
                <DeveloperImageField
                  label="Imagem mobile"
                  value={config.mobile?.image ?? ""}
                  onChange={(image) =>
                    setConfig((current) => ({
                      ...current,
                      mobile: { ...current.mobile, image },
                    }))
                  }
                />
              </div>
            </DeveloperCard>
          </div>

          {/* Card 3 — Exibição */}
          <DeveloperCard>
            <DeveloperSectionHeading
              eyebrow="Exibição"
              title="Limites e temporizadores"
              description="Controle delay de ativação, intervalo de reexibição e limite por sessão."
              tooltip="Define quando o popup aparece e evita repetição excessiva na mesma sessão."
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <DeveloperField
                label="Delay (seg)"
                tooltip="Tempo mínimo antes de liberar o popup. Exemplo: 10 segundos após carregar a página."
              >
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
              <DeveloperField
                label="Cooldown (h)"
                tooltip="Intervalo para não mostrar novamente ao mesmo visitante. Exemplo: 24 horas."
              >
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
              <DeveloperField
                label="Exibições por sessão"
                tooltip="Limite de vezes que o popup pode aparecer durante uma visita. Exemplo: 1."
              >
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
          </DeveloperCard>

          {/* Card 4 — Campos + Gatilhos lado a lado */}
          <div className="grid gap-6 sm:grid-cols-2">
            <DeveloperCard>
              <DeveloperSectionHeading
                eyebrow="Formulário"
                title="Campos visíveis"
              />
              <div className="space-y-3">
                {[
                  { key: "enableName" as const, label: "Nome" },
                  { key: "enableEmail" as const, label: "E-mail" },
                  { key: "enablePhone" as const, label: "Telefone" },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex min-h-11 items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/72 px-4 py-2.5 text-sm font-medium text-[var(--foreground)]"
                  >
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
            </DeveloperCard>

            <DeveloperCard>
              <DeveloperSectionHeading
                eyebrow="Mobile"
                title="Gatilhos mobile"
              />
              <div className="space-y-3">
                {[
                  { key: "mobileScrollTrigger" as const, label: "Scroll rápido ao topo" },
                  { key: "mobileBackButtonTrigger" as const, label: "Botão voltar" },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex min-h-11 items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/72 px-4 py-2.5 text-sm font-medium text-[var(--foreground)]"
                  >
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
            </DeveloperCard>
          </div>

          {/* Card 5 — Ações */}
          <DeveloperCard>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                  Salvar
                </p>
                <p className="mt-1 text-sm text-[var(--color-muted-raw)]">
                  Aplica todas as alterações feitas nos campos acima.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className={developerPrimaryButtonClassName}
                >
                  <CheckCircle size={18} weight="bold" />
                  {saving ? "Salvando..." : "Salvar configuração"}
                </button>
                <button
                  type="button"
                  onClick={() => void refresh()}
                  className={developerSecondaryButtonClassName}
                >
                  <Pulse size={16} weight="bold" />
                  Atualizar métricas
                </button>
              </div>
            </div>
            {status === "success" ? (
              <div className="mt-4">
                <DeveloperMessage tone="success">{statusMessage}</DeveloperMessage>
              </div>
            ) : null}
          </DeveloperCard>


        {/* Card — Análise */}
          <DeveloperCard>
            <DeveloperSectionHeading
              eyebrow="Análise"
              title="Leitura de desempenho"
              description="Volume de exibição, envio e páginas onde vale otimizar primeiro."
              tooltip="Compare popup exibido vs enviado para medir conversão. Exemplo: 100 exibidos e 8 enviados = 8%."
            />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Popup exibido", value: analytics?.totals.popup_shown ?? 0, icon: Pulse },
                { label: "Popup enviado", value: analytics?.totals.popup_submitted ?? 0, icon: CursorClick },
                { label: "Eventos 7 dias", value: analytics?.last7Days.events ?? 0, icon: Pulse },
                { label: "Leads 7 dias", value: leadsLast7Days, icon: EnvelopeSimple },
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
                Top páginas do popup
              </p>
              <div className="mt-3 overflow-hidden">
                <div
                  className="flex transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)]"
                  style={{ transform: `translateX(-${topPagesPage * 100}%)` }}
                >
                  {topPagesPages.map((page, index) => (
                    <div key={index} className="w-full shrink-0 space-y-2">
                      {page.length > 0 ? (
                        page.map((item) => (
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
                          Sem eventos suficientes no período atual.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <DeveloperCarouselPagination
                currentPage={topPagesPage}
                totalPages={topPagesTotalPages}
                onNext={nextTopPagesPage}
                onPrev={prevTopPagesPage}
              />
            </div>
          </DeveloperCard>

        {/* Cards Leads + Eventos lado a lado em telas grandes */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* Card — Leads */}
          <DeveloperCard>
            <DeveloperSectionHeading
              eyebrow="Leads recentes"
              title="Últimos contatos capturados"
              description="Lista curta para acompanhamento comercial sem sair do painel."
            />
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)]"
                style={{ transform: `translateX(-${leadsPage * 100}%)` }}
              >
                {leadsPages.map((page, index) => (
                  <div key={index} className="w-full shrink-0 space-y-3">
                    {page.length > 0 ? (
                      page.map((lead) => (
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
                  </div>
                ))}
              </div>
            </div>
            <DeveloperCarouselPagination
              currentPage={leadsPage}
              totalPages={leadsTotalPages}
              onNext={nextLeadsPage}
              onPrev={prevLeadsPage}
            />
          </DeveloperCard>

          {/* Card — Eventos */}
          <DeveloperCard>
            <DeveloperSectionHeading
              eyebrow="Eventos recentes"
              title="Auditoria rápida"
              description="Últimos eventos recebidos pelo endpoint do popup."
              tooltip="Mostra eventos do popup para rastrear exibição, envio e sessão sem abrir o módulo de rastreamento."
            />
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)]"
                style={{ transform: `translateX(-${eventsPage * 100}%)` }}
              >
                {eventsPages.map((page, index) => (
                  <div key={index} className="w-full shrink-0 space-y-3">
                    {page.length > 0 ? (
                      page.map((event) => (
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
                            Página: {event.pagePath || "/"}
                          </p>
                          <p className="text-xs text-[var(--color-muted-raw)]">
                            Sessão: {event.sessionId || "-"}
                          </p>
                        </article>
                      ))
                    ) : (
                      <DeveloperMessage tone="info">Nenhum evento registrado ainda.</DeveloperMessage>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <DeveloperCarouselPagination
              currentPage={eventsPage}
              totalPages={eventsTotalPages}
              onNext={nextEventsPage}
              onPrev={prevEventsPage}
            />
          </DeveloperCard>
        </div>

      </div>
    </DeveloperPage>
  );
}
