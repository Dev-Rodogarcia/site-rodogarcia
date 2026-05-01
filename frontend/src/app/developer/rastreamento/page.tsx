"use client";

import { useMemo, useState } from "react";
import { ListMagnifyingGlass, Pulse } from "@phosphor-icons/react";
import {
  DeveloperCard,
  DeveloperField,
  DeveloperHero,
  DeveloperMessage,
  DeveloperPage,
  DeveloperSectionHeading,
  DeveloperTooltip,
  developerInputClassName,
  developerSecondaryButtonClassName,
} from "@/components/developer/ui";
import { adminResourceKeys, useAdminResource } from "@/hooks/useAdminResource";
import { api } from "@/lib/routes";

interface TrackingEvent {
  id: string;
  event: string;
  type?: string;
  page: string;
  source?: string;
  sessionId?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface TrackingResponse {
  events: TrackingEvent[];
  summary: {
    total: number;
    byType: Record<string, number>;
    topPages: Array<{ page: string; total: number }>;
  };
}

function formatDateTime(value?: string) {
  const parsed = Date.parse(String(value ?? ""));
  if (!Number.isFinite(parsed)) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export default function TrackingPage() {
  const [eventFilter, setEventFilter] = useState("");
  const [pageFilter, setPageFilter] = useState("");
  const [appliedKey, setAppliedKey] = useState("");
  const [eventsPage, setEventsPage] = useState(1);
  const EVENTS_PER_PAGE = 8;
  const eventPath = `${api.admin.trackingEvents}?limit=250&event=${encodeURIComponent(eventFilter)}&page=${encodeURIComponent(pageFilter)}`;
  const auditPath = `${api.admin.auditLog}?limit=120`;

  const { data, loading, error, refresh } = useAdminResource<TrackingResponse>({
    key: adminResourceKeys.tracking(appliedKey),
    fetcher: async (request) => {
      const response = await request<TrackingResponse>(eventPath);
      if (!response.success) {
        return { success: false, error: response.error ?? "Falha ao carregar eventos." };
      }
      return {
        success: true,
        data: response.data ?? { events: [], summary: { total: 0, byType: {}, topPages: [] } },
      };
    },
  });
  const { data: auditData } = useAdminResource<{ events: TrackingEvent[] }>({
    key: `${adminResourceKeys.tracking(appliedKey)}:audit`,
    fetcher: async (request) => {
      const response = await request<{ events?: TrackingEvent[] }>(auditPath);
      return response.success
        ? { success: true, data: { events: response.data?.events ?? [] } }
        : { success: false, error: response.error };
    },
  });

  const events = data?.events ?? [];
  const eventTypes = useMemo(
    () => Object.entries(data?.summary.byType ?? {}).sort((a, b) => b[1] - a[1]),
    [data?.summary.byType]
  );

  function applyFilters() {
    setAppliedKey(`${eventFilter}:${pageFilter}:${Date.now()}`);
    setEventsPage(1);
  }

  const totalEventPages = Math.max(1, Math.ceil(events.length / EVENTS_PER_PAGE));
  const pagedEvents = events.slice((eventsPage - 1) * EVENTS_PER_PAGE, eventsPage * EVENTS_PER_PAGE);

  return (
    <DeveloperPage>
      <DeveloperHero
        eyebrow="Rastreamento"
        title="Eventos, logs e auditoria."
        description="Base interna para entender comportamento, popup, cookies, leads e ações administrativas."
        stats={[
          { label: "Eventos", value: data?.summary.total ?? 0 },
          { label: "Tipos", value: eventTypes.length },
          { label: "Auditoria", value: auditData?.events.length ?? 0 },
        ]}
      />

      {loading ? <DeveloperMessage tone="info">Carregando eventos...</DeveloperMessage> : null}
      {error ? <DeveloperMessage tone="error">{error}</DeveloperMessage> : null}

      <DeveloperCard className="mt-5">
        <DeveloperSectionHeading eyebrow="Filtros" title="Consulta de eventos" />
        <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_auto_auto]">
          <DeveloperField label="Tipo">
            <input
              value={eventFilter}
              onChange={(event) => setEventFilter(event.target.value)}
              className={developerInputClassName}
              placeholder="page_view, popup..."
            />
          </DeveloperField>
          <DeveloperField
            label="Página"
            tooltip="Rota onde o evento foi capturado. Exemplos: /sobre, /contato, /servicos."
          >
            <input
              value={pageFilter}
              onChange={(event) => setPageFilter(event.target.value)}
              className={developerInputClassName}
              placeholder="/servicos"
            />
          </DeveloperField>
          <button type="button" onClick={applyFilters} className={developerSecondaryButtonClassName}>
            <ListMagnifyingGlass size={16} weight="bold" />
            Filtrar
          </button>
          <button type="button" onClick={() => void refresh()} className={developerSecondaryButtonClassName}>
            <Pulse size={16} weight="bold" />
            Atualizar métricas
          </button>
        </div>
      </DeveloperCard>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <DeveloperCard>
          <DeveloperSectionHeading
            eyebrow="Eventos"
            title="Registros recentes"
            description="Tabela compacta dos eventos normalizados e legados."
            tooltip="Eventos normalizados seguem o novo padrão do CMS. Eventos legados são registros antigos preservados para histórico."
          />
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-[0.16em] text-[var(--color-muted-raw)]">
                  <th className="py-2 pr-3 font-semibold">Evento</th>
                  <th className="py-2 pr-3 font-semibold">Página</th>
                  <th className="py-2 pr-3 font-semibold">
                    <span className="inline-flex items-center gap-1.5">
                      Origem
                      <DeveloperTooltip content="Origem indica o módulo que gerou o evento. Exemplo: popup, cookies, analytics ou lead." />
                    </span>
                  </th>
                  <th className="py-2 pr-3 font-semibold">
                    <span className="inline-flex items-center gap-1.5">
                      Sessão
                      <DeveloperTooltip content="Sessão agrupa ações de uma mesma visita anônima. Exemplo: session_abc123." />
                    </span>
                  </th>
                  <th className="py-2 font-semibold">Data</th>
                </tr>
              </thead>
              <tbody>
                {pagedEvents.map((event) => (
                  <tr key={event.id} className="border-b border-[var(--border)]/70 align-top">
                    <td className="py-3 pr-3 font-semibold text-[var(--foreground)]">{event.event}</td>
                    <td className="py-3 pr-3 text-[var(--color-muted-raw)]">{event.page}</td>
                    <td className="py-3 pr-3 text-[var(--color-muted-raw)]">{event.source || "-"}</td>
                    <td className="max-w-[180px] truncate py-3 pr-3 text-xs text-[var(--color-muted-raw)]">
                      {event.sessionId || "-"}
                    </td>
                    <td className="py-3 text-[var(--color-muted-raw)]">{formatDateTime(event.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalEventPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-4">
              <span className="text-xs text-[var(--color-muted-raw)]">
                Página {eventsPage} de {totalEventPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={eventsPage === 1}
                  onClick={() => setEventsPage((p) => p - 1)}
                  className={developerSecondaryButtonClassName}
                  style={{ opacity: eventsPage === 1 ? 0.4 : 1 }}
                >
                  ← Anterior
                </button>
                <button
                  type="button"
                  disabled={eventsPage === totalEventPages}
                  onClick={() => setEventsPage((p) => p + 1)}
                  className={developerSecondaryButtonClassName}
                  style={{ opacity: eventsPage === totalEventPages ? 0.4 : 1 }}
                >
                  Próxima →
                </button>
              </div>
            </div>
          )}
        </DeveloperCard>

        <div className="space-y-5">
          <DeveloperCard>
            <DeveloperSectionHeading
              eyebrow="Tipos"
              title="Volume por evento"
              tooltip="Conta quantas vezes cada tipo de evento aconteceu. Exemplo: page_view = 230."
            />
            <div className="space-y-2">
              {eventTypes.slice(0, 10).map(([eventName, total]) => (
                <div
                  key={eventName}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-white/76 px-3 py-2 text-sm"
                >
                  <span className="truncate font-medium">{eventName}</span>
                  <strong className="text-[var(--primary)]">{total}</strong>
                </div>
              ))}
            </div>
          </DeveloperCard>

          <DeveloperCard>
            <DeveloperSectionHeading
              eyebrow="Auditoria"
              title="Ações administrativas"
              tooltip="Registra operações importantes feitas no CMS, sem expor payloads sensíveis completos."
            />
            <div className="space-y-2">
              {(auditData?.events ?? []).slice(0, 10).map((event) => (
                <div key={event.id} className="rounded-lg border border-[var(--border)] bg-white/76 px-3 py-2">
                  <p className="text-sm font-semibold text-[var(--foreground)]">{event.event || event.type}</p>
                  <p className="text-xs text-[var(--color-muted-raw)]">{formatDateTime(event.createdAt)}</p>
                </div>
              ))}
              {(auditData?.events ?? []).length === 0 ? (
                <p className="text-sm text-[var(--color-muted-raw)]">Sem auditoria recente.</p>
              ) : null}
            </div>
          </DeveloperCard>
        </div>
      </section>
    </DeveloperPage>
  );
}
