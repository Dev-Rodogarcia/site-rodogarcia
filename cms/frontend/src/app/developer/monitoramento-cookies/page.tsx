"use client";

import { useMemo, useState } from "react";
import { CaretLeft, CaretRight, Cookie, MagnifyingGlass, Pulse } from "@phosphor-icons/react";
import {
  DeveloperCard,
  DeveloperField,
  DeveloperHero,
  DeveloperMessage,
  DeveloperPage,
  DeveloperSectionHeading,
  developerInputClassName,
  developerSecondaryButtonClassName,
} from "@/components/developer/ui";
import { adminResourceKeys, useAdminResource } from "@/hooks/useAdminResource";
import { api } from "@/lib/routes";
import { cn } from "@/lib/utils";

const CONSENTS_PER_PAGE = 10;

interface CookieConsentLog {
  at: string;
  action: string;
  version?: string;
}

interface CookieConsentRecord {
  id: string;
  createdAt: string;
  decision: "accepted" | "rejected" | "custom" | "partial" | "revoked";
  status: string;
  version: number;
  consentTextVersion: string;
  categories: Record<string, boolean>;
  userAgent: string;
  device: string;
  approximateLocation?: string;
  ipMasked?: string;
  scriptsLoaded?: string[];
  scriptsFailed?: string[];
  logs?: CookieConsentLog[];
}

interface CookieConsentResponse {
  consents: CookieConsentRecord[];
  total: number;
  page: number;
  pageSize: number;
}

function formatDateTime(value?: string) {
  const parsed = Date.parse(String(value ?? ""));
  if (!Number.isFinite(parsed)) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export default function CookieMonitoringPage() {
  const [status, setStatus] = useState("");
  const [device, setDevice] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ status: "", device: "" });
  const [page, setPage] = useState(1);
  const requestPath = `${api.admin.cookieConsents}?page=${page}&pageSize=${CONSENTS_PER_PAGE}&status=${encodeURIComponent(appliedFilters.status)}&device=${encodeURIComponent(appliedFilters.device)}`;

  const { data, loading, error, refresh } = useAdminResource<CookieConsentResponse>({
    key: adminResourceKeys.cookieConsents(`${appliedFilters.status}:${appliedFilters.device}:${page}`),
    fetcher: async (request) => {
      const response = await request<CookieConsentResponse>(requestPath);
      if (!response.success) {
        return {
          success: false,
          error: response.error ?? "Falha ao carregar consentimentos.",
        };
      }
      return {
        success: true,
        data: response.data ?? { consents: [], total: 0, page: 1, pageSize: CONSENTS_PER_PAGE },
      };
    },
  });

  const consents = data?.consents ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / CONSENTS_PER_PAGE));
  const summary = useMemo(() => {
    return consents.reduce(
      (acc, item) => {
        acc.total += 1;
        acc[item.decision] = (acc[item.decision] ?? 0) + 1;
        return acc;
      },
      { total: 0 } as Record<string, number>
    );
  }, [consents]);

  function applyFilters() {
    setAppliedFilters({ status, device });
    setPage(1);
  }

  return (
    <DeveloperPage>
      <DeveloperHero
        eyebrow="LGPD - Monitoramento"
        title="Monitoramento de Cookies e Consentimento"
        description="Aceites, recusas e preferências."
        stats={[
          { label: "Total", value: total },
          { label: "Aceitos na página", value: summary.accepted ?? 0 },
          { label: "Recusados na página", value: summary.rejected ?? 0 },
        ]}
      />

      {loading ? <DeveloperMessage tone="info">Carregando consentimentos...</DeveloperMessage> : null}
      {error ? <DeveloperMessage tone="error">{error}</DeveloperMessage> : null}

      <DeveloperCard className="mt-5 p-4 sm:p-5">
        <DeveloperSectionHeading
          eyebrow="Filtros"
          title="Consulta de consentimentos"
          description="Filtre por status e tipo de dispositivo sem expor IP completo."
          action={
            <div className="grid w-full gap-3 sm:grid-cols-[minmax(150px,180px)_minmax(150px,180px)_auto] sm:items-end xl:w-auto">
              <DeveloperField label="Status">
                <select value={status} onChange={(event) => setStatus(event.target.value)} className={developerInputClassName}>
                  <option value="">Todos</option>
                  <option value="accepted">Aceito</option>
                  <option value="rejected">Recusado</option>
                  <option value="partial">Parcial</option>
                  <option value="revoked">Revogado</option>
                </select>
              </DeveloperField>
              <DeveloperField label="Dispositivo">
                <select value={device} onChange={(event) => setDevice(event.target.value)} className={developerInputClassName}>
                  <option value="">Todos</option>
                  <option value="desktop">Desktop</option>
                  <option value="mobile">Mobile</option>
                  <option value="tablet">Tablet</option>
                </select>
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
          eyebrow="Registros"
          title="Consentimentos recentes"
          description="Inclui versão aceita, categorias, scripts carregados e IP mascarado."
        />
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-[0.16em] text-[var(--color-muted-raw)]">
                <th className="py-2 pr-4 font-semibold">Consentimento</th>
                <th className="py-2 pr-4 font-semibold">Categorias</th>
                <th className="py-2 pr-4 font-semibold">Scripts</th>
                <th className="py-2 pr-4 font-semibold">Dispositivo</th>
                <th className="py-2 font-semibold">Data</th>
              </tr>
            </thead>
            <tbody>
              {consents.map((consent) => (
                <tr key={consent.id} className="border-b border-[var(--border)]/70 align-top">
                  <td className="py-3 pr-4">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                        <Cookie size={16} weight="bold" />
                      </span>
                      <div>
                        <p className="font-semibold text-[var(--foreground)]">{consent.decision}</p>
                        <p className="mt-1 text-xs text-[var(--color-muted-raw)]">
                          v{consent.consentTextVersion || consent.version} - {consent.ipMasked || "IP mascarado"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-xs text-[var(--color-muted-raw)]">
                    {Object.entries(consent.categories ?? {})
                      .map(([key, value]) => `${key}: ${value ? "sim" : "não"}`)
                      .join(" / ") || "-"}
                  </td>
                  <td className="py-3 pr-4 text-xs text-[var(--color-muted-raw)]">
                    <p>OK: {(consent.scriptsLoaded ?? []).join(", ") || "-"}</p>
                    <p>Falha: {(consent.scriptsFailed ?? []).join(", ") || "-"}</p>
                  </td>
                  <td className="max-w-[260px] py-3 pr-4 text-xs text-[var(--color-muted-raw)]">
                    <p className="font-semibold text-[var(--foreground)]">{consent.device || "-"}</p>
                    <p className="mt-1 truncate" title={consent.userAgent}>{consent.userAgent || "-"}</p>
                  </td>
                  <td className="py-3 text-[var(--color-muted-raw)]">{formatDateTime(consent.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && consents.length === 0 ? (
          <div className="mt-4">
            <DeveloperMessage tone="info">Nenhum consentimento encontrado.</DeveloperMessage>
          </div>
        ) : null}
        {totalPages > 1 ? (
          <div className="mt-4 flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--color-muted-raw)]">
              Exibindo {((page - 1) * CONSENTS_PER_PAGE) + 1}–{Math.min(page * CONSENTS_PER_PAGE, total)} de {total} consentimentos.
            </p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className={cn(developerSecondaryButtonClassName, "min-h-9 px-3 py-1.5 text-xs")}>
                <CaretLeft size={15} weight="bold" />
                Anterior
              </button>
              <span className="min-w-16 text-center text-xs font-semibold text-[var(--color-muted-raw)]">Página {page} de {totalPages}</span>
              <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} className={cn(developerSecondaryButtonClassName, "min-h-9 px-3 py-1.5 text-xs")}>
                Próxima
                <CaretRight size={15} weight="bold" />
              </button>
            </div>
          </div>
        ) : null}
      </DeveloperCard>
    </DeveloperPage>
  );
}
