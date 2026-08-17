"use client";

import { useEffect, useState } from "react";
import { ArrowSquareOut, Eye, FloppyDisk, Plus, RocketLaunch } from "@phosphor-icons/react";
import { DeveloperCard, DeveloperField, DeveloperHero, DeveloperMessage, DeveloperPage, DeveloperSectionHeading, DeveloperStatusPill, developerInputClassName, developerPrimaryButtonClassName, developerSecondaryButtonClassName } from "@/components/developer/ui";
import { useApiRequest } from "@/hooks/useApiRequest";
import { adminResourceKeys, useAdminResource } from "@/hooks/useAdminResource";
import { api } from "@/lib/routes";
import { LandingVisualEditor } from "@/components/developer/LandingVisualEditor";

type LandingStatus = "draft" | "published" | "unpublished";
type LandingForm = {
  id?: string; name: string; slug: string; theme: { primaryColor: string; secondaryColor: string; backgroundColor: string; textColor: string; font: "system" | "space-grotesk" | "plus-jakarta" };
  analytics: { ga4MeasurementId: string; gtmContainerId: string; metaPixelId: string; googleAdsId: string };
  hero: { phone: string; email: string; logo: string; backgroundImage: string; eyebrow: string; title: string; description: string; ctaLabel: string; ctaUrl: string; highlights: Array<{ title: string; description: string }> };
  lowerSection: { title: string; description: string; ctaLabel: string; ctaUrl: string };
  status?: LandingStatus;
};

const createBlankLanding = (): LandingForm => ({
  name: "Nova campanha", slug: "nova-campanha", theme: { primaryColor: "#111111", secondaryColor: "#111111", backgroundColor: "#FFFFFF", textColor: "#111111", font: "system" },
  analytics: { ga4MeasurementId: "", gtmContainerId: "", metaPixelId: "", googleAdsId: "" },
  hero: { phone: "", email: "", logo: "", backgroundImage: "", eyebrow: "Mensagem de apoio", title: "Título principal da campanha", description: "Escreva aqui a proposta da sua landing page.", ctaLabel: "Conheça a solução", ctaUrl: "", highlights: [{ title: "Destaque 01", description: "Apresente uma informação importante." }, { title: "Destaque 02", description: "Explique um benefício para o público." }, { title: "Destaque 03", description: "Inclua outro ponto relevante." }, { title: "Destaque 04", description: "Complete a mensagem da campanha." }] },
  lowerSection: { title: "Continue a sua apresentação", description: "Esta segunda seção está pronta para receber o próximo conteúdo da campanha.", ctaLabel: "", ctaUrl: "" },
});

function labelForStatus(status?: LandingStatus) { return status === "published" ? "Publicada" : status === "unpublished" ? "Despublicada" : "Rascunho"; }

export default function LandingPagesPage() {
  const { apiRequest } = useApiRequest();
  const [form, setForm] = useState<LandingForm>(createBlankLanding);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const { data, loading, error, refresh } = useAdminResource<{ landings: LandingForm[] }>({
    key: adminResourceKeys.landings,
    fetcher: (request) => request<{ landings: LandingForm[] }>(api.admin.landings),
  });
  const landings = data?.landings ?? [];

  useEffect(() => {
    if (!form.id && landings.length > 0) setForm(landings[0]!);
  }, [form.id, landings]);

  async function save(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setMessage(null);
    const endpoint = form.id ? api.admin.landing(form.id) : api.admin.landings;
    const result = await apiRequest<{ landing: LandingForm }>(endpoint, { method: form.id ? "PUT" : "POST", body: JSON.stringify(form) });
    setSaving(false);
    if (!result.success) { setMessage({ tone: "error", text: result.error ?? "Não foi possível salvar a landing." }); return; }
    if (result.data?.landing) setForm(result.data.landing);
    setMessage({ tone: "success", text: "Landing page salva como rascunho." });
    await refresh();
  }

  async function changePublication(publish: boolean) {
    if (!form.id) { setMessage({ tone: "error", text: "Salve o rascunho antes de publicar." }); return; }
    setSaving(true); setMessage(null);
    const result = await apiRequest<{ landing: LandingForm }>(publish ? api.admin.publishLanding(form.id) : api.admin.unpublishLanding(form.id), { method: "POST" });
    setSaving(false);
    if (!result.success) { setMessage({ tone: "error", text: result.error ?? "Não foi possível alterar a publicação." }); return; }
    if (result.data?.landing) setForm(result.data.landing);
    setMessage({ tone: "success", text: publish ? "Landing page publicada." : "Landing page despublicada." });
    await refresh();
  }

  function openPreview() {
    if (form.status !== "published") {
      setMessage({ tone: "error", text: "Publique a landing para abrir a prévia navegável." });
      return;
    }
    window.open(`/${encodeURIComponent(form.slug)}`, "_blank", "noopener,noreferrer");
  }

  return <DeveloperPage>
    <DeveloperHero eyebrow="Campanhas" title="Landing Pages" description="Crie, teste e publique campanhas independentes." stats={[{ label: "Landings", value: landings.length }, { label: "Publicadas", value: landings.filter((landing) => landing.status === "published").length }]} />
    {loading ? <DeveloperMessage tone="info">Carregando campanhas...</DeveloperMessage> : null}
    {error ? <DeveloperMessage tone="error">{error}</DeveloperMessage> : null}
    {message ? <div className="mt-5"><DeveloperMessage tone={message.tone}>{message.text}</DeveloperMessage></div> : null}
    <DeveloperCard className="mt-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">Biblioteca</p><h2 className="mt-0.5 text-base font-semibold text-[var(--foreground)]">Suas campanhas</h2></div><button type="button" onClick={() => { setForm(createBlankLanding()); setMessage(null); }} className={`${developerSecondaryButtonClassName} min-h-9 px-3 py-2 text-xs`}><Plus size={16} weight="bold" />Nova</button></div>
        {landings.length === 0 && !loading ? <p className="mt-2 text-sm text-[var(--color-muted-raw)]">Nenhuma campanha criada. Use <strong className="font-semibold text-[var(--foreground)]">Nova</strong> para começar.</p> : null}
        {landings.length > 0 ? <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {landings.map((landing) => <button key={landing.id} type="button" onClick={() => { setForm(landing); setMessage(null); }} className={`min-w-52 rounded-xl border px-3 py-2 text-left transition ${form.id === landing.id ? "border-[var(--primary)] bg-[var(--primary)]/5" : "border-[var(--border)] hover:border-[var(--primary)]/40"}`}>
            <div className="flex items-center justify-between gap-2"><strong className="truncate text-sm text-[var(--foreground)]">{landing.name}</strong><DeveloperStatusPill active={landing.status === "published"} activeLabel="Publicada" inactiveLabel={labelForStatus(landing.status)} /></div>
            <p className="mt-1 truncate text-xs text-[var(--color-muted-raw)]">/{landing.slug}</p>
          </button>)}
        </div> : null}
    </DeveloperCard>
    <form onSubmit={save} className="mt-5 space-y-5">
        <LandingVisualEditor landing={form} onChange={(update) => setForm((current) => update(current))} />
        <DeveloperCard>
          <DeveloperSectionHeading eyebrow="Configuração" title={form.id ? form.name : "Nova landing"} description="A campanha fica em rascunho até você publicá-la." action={<div className="flex flex-wrap gap-2"><button type="button" onClick={openPreview} disabled={saving} className={developerSecondaryButtonClassName}><ArrowSquareOut size={16} weight="bold" />Abrir prévia</button><button type="submit" disabled={saving} className={developerSecondaryButtonClassName}><FloppyDisk size={16} weight="bold" />Salvar</button><button type="button" disabled={saving || form.status === "published"} onClick={() => void changePublication(true)} className={developerPrimaryButtonClassName}><RocketLaunch size={16} weight="bold" />Publicar</button></div>} />
          <div className="grid gap-4 md:grid-cols-2"><DeveloperField label="Nome" required helpKey="landing-pages.field.nome"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={developerInputClassName} maxLength={120} /></DeveloperField><DeveloperField label="Rota" required helpKey="landing-pages.field.rota" hint="Exemplo: campanha-distribuicao. A página será aberta em /campanha-distribuicao."><input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} className={developerInputClassName} maxLength={80} /></DeveloperField></div>
          {form.status === "published" ? <button type="button" disabled={saving} onClick={() => void changePublication(false)} className={`${developerSecondaryButtonClassName} mt-4`}><Eye size={16} weight="bold" />Despublicar</button> : null}
        </DeveloperCard>
        <DeveloperCard><DeveloperSectionHeading eyebrow="Medição" title="Analytics da campanha" description="O GA4 só carrega nesta landing depois que o visitante aceitar analytics. Os demais campos ficam prontos para uso futuro." /><div className="grid gap-4 md:grid-cols-2"><DeveloperField label="Measurement ID GA4" helpKey="landing-pages.field.ga4"><input placeholder="G-XXXXXXXXXX" value={form.analytics.ga4MeasurementId} onChange={(event) => setForm({ ...form, analytics: { ...form.analytics, ga4MeasurementId: event.target.value.toUpperCase() } })} className={developerInputClassName} /></DeveloperField><DeveloperField label="Google Tag Manager"><input placeholder="GTM-XXXX" value={form.analytics.gtmContainerId} onChange={(event) => setForm({ ...form, analytics: { ...form.analytics, gtmContainerId: event.target.value.toUpperCase() } })} className={developerInputClassName} /></DeveloperField><DeveloperField label="Meta Pixel"><input value={form.analytics.metaPixelId} onChange={(event) => setForm({ ...form, analytics: { ...form.analytics, metaPixelId: event.target.value.replace(/\D/g, "") } })} className={developerInputClassName} /></DeveloperField><DeveloperField label="Google Ads"><input placeholder="AW-XXXXXXXXX" value={form.analytics.googleAdsId} onChange={(event) => setForm({ ...form, analytics: { ...form.analytics, googleAdsId: event.target.value.toUpperCase() } })} className={developerInputClassName} /></DeveloperField></div></DeveloperCard>
    </form>
  </DeveloperPage>;
}
