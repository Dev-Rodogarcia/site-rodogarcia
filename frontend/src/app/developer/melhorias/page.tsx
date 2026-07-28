"use client";

import { useState } from "react";
import { Archive, CheckCircle, File, Image, Lightbulb, Paperclip, User, UsersThree } from "@phosphor-icons/react";
import { DeveloperCard, DeveloperHero, DeveloperMessage, DeveloperPage, DeveloperSectionHeading, developerSecondaryButtonClassName } from "@/components/developer/ui";
import { ImprovementGuidanceEditor } from "@/components/developer/ImprovementGuidanceEditor";
import { adminResourceKeys, invalidateAdminResource, useAdminResource } from "@/hooks/useAdminResource";
import { useApiRequest } from "@/hooks/useApiRequest";
import { api } from "@/lib/routes";
import { cn } from "@/lib/utils";

type ImprovementStatus = "pending" | "completed" | "archived";
interface ImprovementAttachment { id: string; name: string; mimeType: string; size: number; }
interface Improvement { id: string; createdAt: string; status: ImprovementStatus; profile: "site_user" | "employee"; name: string; email: string; phone?: string; branch?: string; area?: string; category: string; message: string; page?: string; expectedResult?: string; applicationPlace?: string; attachments?: ImprovementAttachment[]; }

const statusLabels: Record<ImprovementStatus, string> = { pending: "Pendentes", completed: "Concluídas", archived: "Arquivadas" };

function date(value: string) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)); }

export default function ImprovementsPage() {
  const [status, setStatus] = useState<ImprovementStatus>("pending");
  const { apiRequest } = useApiRequest();
  const { data, loading, error, refresh } = useAdminResource<{ improvements: Improvement[] }>({
    key: adminResourceKeys.improvements(status),
    fetcher: async (request) => {
      const response = await request<{ improvements?: Improvement[] }>(`${api.admin.improvements}?status=${status}`);
      return response.success ? { success: true, data: { improvements: response.data?.improvements ?? [] } } : { success: false, error: response.error ?? "Falha ao carregar solicitações." };
    },
  });
  const improvements = data?.improvements ?? [];

  async function updateStatus(id: string, nextStatus: ImprovementStatus) {
    const response = await apiRequest<{ improvement?: Improvement }>(`${api.admin.improvements}/${id}`, { method: "PATCH", body: JSON.stringify({ status: nextStatus }) });
    if (!response.success) return;
    invalidateAdminResource([adminResourceKeys.improvements("pending"), adminResourceKeys.improvements("completed"), adminResourceKeys.improvements("archived")]);
    await refresh();
  }

  return <DeveloperPage><DeveloperHero eyebrow="Melhoria contínua" title="Solicitações recebidas" description="Acompanhe sugestões de usuários do site e colaboradores, mantendo a triagem atualizada." stats={[{ label: statusLabels[status], value: improvements.length }]} />
    <DeveloperCard className="mt-5"><DeveloperSectionHeading eyebrow="Triagem" title="Escolha uma lista" description="Pendentes são recebidas para avaliação. Concluídas são arquivadas automaticamente após 60 dias e as arquivadas são excluídas, com seus anexos, 60 dias depois." />
      <div className="mt-4 flex flex-wrap gap-2">{(Object.keys(statusLabels) as ImprovementStatus[]).map((item) => <button type="button" key={item} onClick={() => setStatus(item)} className={cn(developerSecondaryButtonClassName, status === item && "border-[var(--primary)] bg-[var(--primary)] text-white hover:bg-[var(--color-primary-strong)] hover:text-white")}>{statusLabels[item]}</button>)}</div>
      <ImprovementGuidanceEditor />
    </DeveloperCard>
    {loading ? <div className="mt-5"><DeveloperMessage tone="info">Carregando solicitações...</DeveloperMessage></div> : null}{error ? <div className="mt-5"><DeveloperMessage tone="error">{error}</DeveloperMessage></div> : null}
    <div className="mt-5 grid gap-4 xl:grid-cols-2">{improvements.map((item) => <article key={item.id} className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold", item.profile === "employee" ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700")}>{item.profile === "employee" ? <UsersThree size={14} weight="bold" /> : <User size={14} weight="bold" />}{item.profile === "employee" ? "Colaborador" : "Usuário do site"}</span><span className="text-xs text-[var(--color-muted-raw)]">{date(item.createdAt)}</span></div><h2 className="mt-4 text-lg font-semibold tracking-[-0.03em] text-[var(--foreground)]">{item.category}</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--color-muted-raw)]">{item.message}</p>{item.expectedResult ? <p className="mt-3 border-l-2 border-[var(--primary)] pl-3 text-sm text-[var(--foreground)]"><strong>Resultado esperado:</strong> {item.expectedResult}</p> : null}{item.attachments?.length ? <div className="mt-4 border-t border-[var(--border)] pt-3"><p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--foreground)]"><Paperclip size={14} weight="bold" />Anexos ({item.attachments.length})</p><div className="mt-2 flex flex-wrap gap-2">{item.attachments.map((attachment) => { const href = `${api.admin.improvements}/${item.id}/attachments/${attachment.id}`; const image = attachment.mimeType.startsWith("image/"); return <a key={attachment.id} href={href} target="_blank" rel="noreferrer" className="group inline-flex max-w-full items-center gap-2 rounded-lg border border-[var(--border)] bg-slate-50 px-2.5 py-2 text-xs font-medium text-[var(--foreground)] hover:border-[var(--primary)]">{image ? <Image size={15} className="text-sky-600" weight="bold" /> : <File size={15} className="text-emerald-600" weight="bold" />}<span className="max-w-44 truncate">{attachment.name}</span></a>; })}</div></div> : null}<div className="mt-4 border-t border-[var(--border)] pt-3 text-xs leading-5 text-[var(--color-muted-raw)]"><p><strong className="text-[var(--foreground)]">{item.name}</strong> · {item.email}{item.phone ? ` · ${item.phone}` : ""}</p>{item.profile === "employee" ? <p>Filial: {item.branch || "-"}{item.area ? ` · Área: ${item.area}` : ""}</p> : null}{item.page ? <p>Página: {item.page}</p> : null}{item.applicationPlace ? <p>Aplicação: {item.applicationPlace}</p> : null}</div><div className="mt-4 flex flex-wrap gap-2">{item.status !== "completed" ? <button type="button" onClick={() => void updateStatus(item.id, "completed")} className={cn(developerSecondaryButtonClassName, "min-h-9 px-3 py-1.5 text-xs text-emerald-700")}><CheckCircle size={15} weight="bold" />Marcar concluída</button> : null}{item.status !== "archived" ? <button type="button" onClick={() => void updateStatus(item.id, "archived")} className={cn(developerSecondaryButtonClassName, "min-h-9 px-3 py-1.5 text-xs")}><Archive size={15} weight="bold" />Arquivar</button> : null}{item.status !== "pending" ? <button type="button" onClick={() => void updateStatus(item.id, "pending")} className={cn(developerSecondaryButtonClassName, "min-h-9 px-3 py-1.5 text-xs")}><Lightbulb size={15} weight="bold" />Voltar para pendentes</button> : null}</div></article>)}</div>
    {!loading && improvements.length === 0 ? <div className="mt-5"><DeveloperMessage tone="info">Nenhuma solicitação nesta lista.</DeveloperMessage></div> : null}
  </DeveloperPage>;
}
