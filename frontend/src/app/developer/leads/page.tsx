"use client";

import { useMemo, useState } from "react";
import { EnvelopeSimple, MagnifyingGlass, Pulse } from "@phosphor-icons/react";
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
  const [appliedKey, setAppliedKey] = useState("");
  const requestPath = `${api.admin.leads}?limit=300&q=${encodeURIComponent(query)}&source=${encodeURIComponent(source)}`;

  const { data, loading, error, refresh } = useAdminResource<{ leads: Lead[]; total: number }>({
    key: adminResourceKeys.leads(appliedKey),
    fetcher: async (request) => {
      const response = await request<{ leads?: Lead[]; total?: number }>(requestPath);
      if (!response.success) {
        return { success: false, error: response.error ?? "Falha ao carregar leads." };
      }
      return {
        success: true,
        data: { leads: response.data?.leads ?? [], total: response.data?.total ?? 0 },
      };
    },
  });

  const leads = data?.leads ?? [];
  const sourceSummary = useMemo(() => {
    return leads.reduce<Record<string, number>>((acc, lead) => {
      acc[lead.source || "sem-origem"] = (acc[lead.source || "sem-origem"] ?? 0) + 1;
      return acc;
    }, {});
  }, [leads]);

  function applyFilters() {
    setAppliedKey(`${query}:${source}:${Date.now()}`);
  }

  return (
    <DeveloperPage>
      <DeveloperHero
        eyebrow="Leads"
        title="Base central de contatos capturados."
        description="Popup, contato e cotação aparecem em uma lista única, com busca e origem."
        stats={[
          { label: "Total visível", value: leads.length },
          { label: "Popup", value: sourceSummary["exit-intent-popup"] ?? sourceSummary["exit-intent"] ?? 0 },
          { label: "Formulários", value: (sourceSummary["contact-form"] ?? 0) + (sourceSummary["quote-form"] ?? 0) },
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
        />
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto_auto]">
          <DeveloperField label="Buscar">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={developerInputClassName}
              placeholder="nome, e-mail, telefone..."
            />
          </DeveloperField>
          <DeveloperField
            label="Origem"
            tooltip="Canal que gerou o lead. Exemplo: popup, contact-form ou quote-form."
          >
            <input
              value={source}
              onChange={(event) => setSource(event.target.value)}
              className={developerInputClassName}
              placeholder="popup, quote..."
            />
          </DeveloperField>
          <button type="button" onClick={applyFilters} className={developerSecondaryButtonClassName}>
            <MagnifyingGlass size={16} weight="bold" />
            Filtrar
          </button>
          <button type="button" onClick={() => void refresh()} className={developerSecondaryButtonClassName}>
            <Pulse size={16} weight="bold" />
            Atualizar métricas
          </button>
        </div>
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
      </DeveloperCard>
    </DeveloperPage>
  );
}
