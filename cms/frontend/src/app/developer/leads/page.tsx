"use client";

import { useState } from "react";
import { CaretLeft, CaretRight, EnvelopeSimple, MagnifyingGlass, Pulse } from "@phosphor-icons/react";
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
import { cn } from "@/lib/utils";

const LEADS_PER_PAGE = 10;

interface Lead {
  id: string;
  createdAt: string;
  source: string;
  pagePath: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  sessionId?: string;
  device?: string;
  status?: string;
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

export default function LeadsPage() {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ query: "", source: "" });
  const [page, setPage] = useState(1);
  const requestPath = `${api.admin.leads}?page=${page}&pageSize=${LEADS_PER_PAGE}&q=${encodeURIComponent(appliedFilters.query)}&source=${encodeURIComponent(appliedFilters.source)}`;

  const { data, loading, error, refresh } = useAdminResource<{ leads: Lead[]; total: number; page: number; pageSize: number; sourceTotals: Record<string, number> }>({
    key: adminResourceKeys.leads(`${appliedFilters.query}:${appliedFilters.source}:${page}`),
    fetcher: async (request) => {
      const response = await request<{ leads?: Lead[]; total?: number; page?: number; pageSize?: number; sourceTotals?: Record<string, number> }>(requestPath);
      if (!response.success) {
        return { success: false, error: response.error ?? "Falha ao carregar leads." };
      }
      return {
        success: true,
        data: { leads: response.data?.leads ?? [], total: response.data?.total ?? 0, page: response.data?.page ?? 1, pageSize: response.data?.pageSize ?? LEADS_PER_PAGE, sourceTotals: response.data?.sourceTotals ?? {} },
      };
    },
  });

  const leads = data?.leads ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / LEADS_PER_PAGE));
  const sourceSummary = data?.sourceTotals ?? {};

  function applyFilters() {
    setAppliedFilters({ query, source });
    setPage(1);
  }

  return (
    <DeveloperPage>
      <DeveloperHero
        eyebrow="Leads"
        title="Base central de contatos capturados."
        description="Popup, contato, cotação e campanhas em uma lista."
        stats={[
          { label: "Total", value: total },
          { label: "Popup", value: sourceSummary["exit-intent-popup"] ?? sourceSummary["exit-intent"] ?? 0 },
          { label: "Formulários", value: (sourceSummary["contact-form"] ?? 0) + (sourceSummary["quote-form"] ?? 0) },
          { label: "Landings", value: sourceSummary["landing-b2b-form"] ?? 0 },
        ]}
      />

      {loading ? <DeveloperMessage tone="info">Carregando leads...</DeveloperMessage> : null}
      {error ? <DeveloperMessage tone="error">{error}</DeveloperMessage> : null}

      <DeveloperCard className="mt-5">
        <DeveloperSectionHeading
          eyebrow="Filtros"
          title="Pesquisa rápida"
          description="Filtre por nome, e-mail, telefone, página ou origem."
          tooltip="Busca na base unificada de leads. Exemplo: filtrar por popup ou por um e-mail específico."
          action={
            <div className="grid w-full gap-3 sm:grid-cols-[minmax(220px,1fr)_180px_auto] sm:items-end xl:w-auto">
              <DeveloperField label="Buscar">
                <input value={query} onChange={(event) => setQuery(event.target.value)} className={developerInputClassName} placeholder="nome, e-mail, telefone..." />
              </DeveloperField>
              <DeveloperField label="Origem" tooltip="Canal que gerou o lead. Exemplo: popup, contact-form ou quote-form.">
                <input value={source} onChange={(event) => setSource(event.target.value)} className={developerInputClassName} placeholder="popup, quote..." />
              </DeveloperField>
              <div className="flex gap-2 sm:pb-0.5">
                <button type="button" onClick={applyFilters} className={cn(developerSecondaryButtonClassName, "min-h-9 px-3 py-1.5 text-xs")}>
                  <MagnifyingGlass size={15} weight="bold" />
                  Filtrar
                </button>
                <button type="button" onClick={() => void refresh()} className={cn(developerSecondaryButtonClassName, "min-h-9 px-3 py-1.5 text-xs")}>
                  <Pulse size={15} weight="bold" />
                  Atualizar
                </button>
              </div>
            </div>
          }
        />
      </DeveloperCard>

      <DeveloperCard className="mt-5">
        <DeveloperSectionHeading
          eyebrow="Lista"
          title="Leads recentes"
          description="Preparado para exportação futura via os mesmos filtros."
        />
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-[0.16em] text-[var(--color-muted-raw)]">
                <th className="py-2 pr-3 font-semibold">Contato</th>
                <th className="py-2 pr-3 font-semibold">Origem</th>
                <th className="py-2 pr-3 font-semibold">Página</th>
                <th className="py-2 pr-3 font-semibold">
                  <span className="inline-flex items-center gap-1.5">
                    Sessão
                    <DeveloperTooltip content="Identificador da visita em que o lead foi capturado. Exemplo: session_abc123." />
                  </span>
                </th>
                <th className="py-2 font-semibold">Data</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-[var(--border)]/70 align-top">
                  <td className="py-3 pr-3">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                        <EnvelopeSimple size={16} weight="bold" />
                      </span>
                      <div className="min-w-[180px]">
                        <p className="font-semibold text-[var(--foreground)]">{lead.name || "Sem nome"}</p>
                        <p className="text-xs text-[var(--color-muted-raw)]">{lead.email || "-"} / {lead.phone || "-"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-[var(--foreground)]">{lead.source || "-"}</td>
                  <td className="py-3 pr-3 text-[var(--color-muted-raw)]">{lead.pagePath || "/"}</td>
                  <td className="max-w-[180px] truncate py-3 pr-3 text-xs text-[var(--color-muted-raw)]">
                    {lead.sessionId || lead.device || "-"}
                  </td>
                  <td className="py-3 text-[var(--color-muted-raw)]">{formatDateTime(lead.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && leads.length === 0 ? (
          <div className="mt-4">
            <DeveloperMessage tone="info">Nenhum lead encontrado para os filtros atuais.</DeveloperMessage>
          </div>
        ) : null}
        {total > 0 ? (
          <div className="mt-4 flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--color-muted-raw)]">Exibindo {((page - 1) * LEADS_PER_PAGE) + 1}–{Math.min(page * LEADS_PER_PAGE, total)} de {total} leads.</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className={cn(developerSecondaryButtonClassName, "min-h-9 px-3 py-1.5 text-xs")}><CaretLeft size={15} weight="bold" />Anterior</button>
              <span className="min-w-16 text-center text-xs font-semibold text-[var(--color-muted-raw)]">Página {page} de {totalPages}</span>
              <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} className={cn(developerSecondaryButtonClassName, "min-h-9 px-3 py-1.5 text-xs")}>Próxima<CaretRight size={15} weight="bold" /></button>
            </div>
          </div>
        ) : null}
      </DeveloperCard>
    </DeveloperPage>
  );
}
