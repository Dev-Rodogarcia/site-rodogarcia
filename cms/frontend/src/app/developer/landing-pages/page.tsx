"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowSquareOut, Eye, FloppyDisk, Plus, RocketLaunch } from "@phosphor-icons/react";
import { LandingVisualEditor, type LandingMedia } from "@/components/developer/LandingVisualEditor";
import {
  DeveloperCard,
  DeveloperField,
  DeveloperHero,
  DeveloperMessage,
  DeveloperPage,
  DeveloperSectionHeading,
  DeveloperStatusPill,
  developerInputClassName,
  developerPrimaryButtonClassName,
  developerSecondaryButtonClassName,
} from "@/components/developer/ui";
import { useApiRequest } from "@/hooks/useApiRequest";
import { adminResourceKeys, invalidateAdminResource, useAdminResource } from "@/hooks/useAdminResource";
import { api, siteUrl } from "@/lib/routes";

type LandingStatus = "draft" | "published" | "unpublished";

type LandingForm = {
  id?: string;
  name: string;
  slug: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    font: "system" | "space-grotesk" | "plus-jakarta";
  };
  analytics: {
    ga4MeasurementId: string;
    gtmContainerId: string;
    metaPixelId: string;
    googleAdsId: string;
  };
  seo: {
    title: string;
    description: string;
    index: boolean;
  };
  hero: {
    phone: string;
    email: string;
    logo: string;
    backgroundImage: string;
    eyebrow: string;
    title: string;
    description: string;
    ctaLabel: string;
    ctaUrl: string;
    highlights: Array<{ title: string; description: string }>;
  };
  lowerSection: { title: string; description: string; ctaLabel: string; ctaUrl: string };
  status?: LandingStatus;
};

type LandingMediaListResponse = { media?: LandingMedia[] };

const createBlankLanding = (): LandingForm => ({
  name: "Nova campanha",
  slug: "nova-campanha",
  theme: { primaryColor: "#111111", secondaryColor: "#111111", backgroundColor: "#FFFFFF", textColor: "#111111", font: "system" },
  analytics: { ga4MeasurementId: "", gtmContainerId: "", metaPixelId: "", googleAdsId: "" },
  seo: { title: "", description: "", index: true },
  hero: {
    phone: "",
    email: "",
    logo: "",
    backgroundImage: "",
    eyebrow: "Mensagem de apoio",
    title: "Título principal da campanha",
    description: "Escreva aqui a proposta da sua landing page.",
    ctaLabel: "Conheça a solução",
    ctaUrl: "",
    highlights: [
      { title: "Destaque 01", description: "Apresente uma informação importante." },
      { title: "Destaque 02", description: "Explique um benefício para o público." },
      { title: "Destaque 03", description: "Inclua outro ponto relevante." },
      { title: "Destaque 04", description: "Complete a mensagem da campanha." },
    ],
  },
  lowerSection: { title: "Continue a sua apresentação", description: "Esta segunda seção está pronta para receber o próximo conteúdo da campanha.", ctaLabel: "", ctaUrl: "" },
});

function normalizeLanding(landing: LandingForm): LandingForm {
  const blank = createBlankLanding();
  return {
    ...blank,
    ...landing,
    theme: { ...blank.theme, ...landing.theme },
    analytics: { ...blank.analytics, ...landing.analytics },
    seo: { ...blank.seo, ...landing.seo },
    hero: {
      ...blank.hero,
      ...landing.hero,
      highlights: landing.hero?.highlights?.length ? landing.hero.highlights : blank.hero.highlights,
    },
    lowerSection: { ...blank.lowerSection, ...landing.lowerSection },
  };
}

function labelForStatus(status?: LandingStatus) {
  return status === "published" ? "Publicada" : status === "unpublished" ? "Despublicada" : "Rascunho";
}

export default function LandingPagesPage() {
  const { apiRequest } = useApiRequest();
  const [form, setForm] = useState<LandingForm>(createBlankLanding);
  const [creatingNew, setCreatingNew] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [openingPreview, setOpeningPreview] = useState(false);
  const { data, loading, error, refresh } = useAdminResource<{ landings: LandingForm[] }>({
    key: adminResourceKeys.landings,
    fetcher: (request) => request<{ landings: LandingForm[] }>(api.admin.landings),
  });
  const { data: mediaData, loading: mediaLoading, error: mediaError, refresh: refreshMedia } = useAdminResource<LandingMediaListResponse>({
    key: "admin:landing-media",
    fetcher: (request) => request<LandingMediaListResponse>(api.admin.landingMedia),
  });
  const landings = useMemo(() => data?.landings?.map(normalizeLanding) ?? [], [data?.landings]);
  const media = mediaData?.media ?? [];

  useEffect(() => {
    if (!creatingNew && !form.id && landings.length > 0) setForm(landings[0]!);
  }, [creatingNew, form.id, landings]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const endpoint = form.id ? api.admin.landing(form.id) : api.admin.landings;
    const result = await apiRequest<{ landing: LandingForm }>(endpoint, {
      method: form.id ? "PUT" : "POST",
      body: JSON.stringify(form),
    });
    setSaving(false);

    if (!result.success) {
      setMessage({ tone: "error", text: result.error ?? "Não foi possível salvar a landing." });
      return;
    }

    if (result.data?.landing) setForm(normalizeLanding(result.data.landing));
    setCreatingNew(false);
    setMessage({ tone: "success", text: "Landing page salva como rascunho. Agora você pode abrir a prévia privada." });
    invalidateAdminResource(adminResourceKeys.landings);
    await refresh();
  }

  async function changePublication(publish: boolean) {
    if (!form.id) {
      setMessage({ tone: "error", text: "Salve o rascunho antes de publicar." });
      return;
    }

    setSaving(true);
    setMessage(null);
    const result = await apiRequest<{ landing: LandingForm }>(
      publish ? api.admin.publishLanding(form.id) : api.admin.unpublishLanding(form.id),
      { method: "POST" },
    );
    setSaving(false);

    if (!result.success) {
      setMessage({ tone: "error", text: result.error ?? "Não foi possível alterar a publicação." });
      return;
    }

    if (result.data?.landing) setForm(normalizeLanding(result.data.landing));
    setMessage({ tone: "success", text: publish ? "Landing page publicada." : "Landing page despublicada." });
    invalidateAdminResource(adminResourceKeys.landings);
    await refresh();
  }

  async function openPreview() {
    if (!form.id) {
      setMessage({ tone: "error", text: "Salve o rascunho antes de abrir a prévia." });
      return;
    }

    setOpeningPreview(true);
    setMessage(null);
    const result = await apiRequest<{ previewPath: string }>(api.admin.landingPreview(form.id));
    setOpeningPreview(false);

    if (!result.success || !result.data?.previewPath) {
      setMessage({ tone: "error", text: result.error ?? "Não foi possível gerar a prévia privada." });
      return;
    }

    window.open(siteUrl(result.data.previewPath), "_blank", "noopener,noreferrer");
  }

  async function uploadMedia(file: File) {
    setUploadingMedia(true);
    setMessage(null);
    const body = new FormData();
    body.append("file", file);
    const result = await apiRequest<{ media: LandingMedia }>(api.admin.landingMedia, { method: "POST", body });
    setUploadingMedia(false);

    if (!result.success) {
      setMessage({ tone: "error", text: result.error ?? "Não foi possível enviar a imagem." });
      return;
    }

    invalidateAdminResource("admin:landing-media");
    await refreshMedia();
    setMessage({ tone: "success", text: "Imagem enviada para a biblioteca da campanha. Selecione-a para usar no logo ou fundo." });
  }

  async function deleteMedia(item: LandingMedia) {
    const result = await apiRequest(api.admin.landingMediaItem(item.id), { method: "DELETE" });
    if (!result.success) {
      setMessage({ tone: "error", text: result.error ?? "Não foi possível excluir a imagem." });
      return;
    }

    setForm((current) => ({
      ...current,
      hero: {
        ...current.hero,
        logo: current.hero.logo === item.url ? "" : current.hero.logo,
        backgroundImage: current.hero.backgroundImage === item.url ? "" : current.hero.backgroundImage,
      },
    }));
    invalidateAdminResource("admin:landing-media");
    await refreshMedia();
    setMessage({ tone: "success", text: "Imagem removida da biblioteca. Salve a landing se ela estava em uso." });
  }

  return <DeveloperPage>
    <DeveloperHero eyebrow="Campanhas" title="Landing Pages" description="Crie, revise em prévia privada e publique campanhas independentes." stats={[{ label: "Landings", value: landings.length }, { label: "Publicadas", value: landings.filter((landing) => landing.status === "published").length }, { label: "Mídias", value: media.length }]} />
    {loading ? <DeveloperMessage tone="info">Carregando campanhas...</DeveloperMessage> : null}
    {error ? <DeveloperMessage tone="error">{error}</DeveloperMessage> : null}
    {mediaLoading ? <div className="mt-3"><DeveloperMessage tone="info">Carregando biblioteca da campanha...</DeveloperMessage></div> : null}
    {mediaError ? <div className="mt-3"><DeveloperMessage tone="error">{mediaError}</DeveloperMessage></div> : null}
    {message ? <div className="mt-5"><DeveloperMessage tone={message.tone}>{message.text}</DeveloperMessage></div> : null}

    <DeveloperCard className="mt-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">Biblioteca</p><h2 className="mt-0.5 text-base font-semibold text-[var(--foreground)]">Suas campanhas</h2></div><button type="button" onClick={() => { setCreatingNew(true); setForm(createBlankLanding()); setMessage(null); }} className={`${developerSecondaryButtonClassName} min-h-9 px-3 py-2 text-xs`}><Plus size={16} weight="bold" />Nova</button></div>
      {landings.length === 0 && !loading ? <p className="mt-2 text-sm text-[var(--color-muted-raw)]">Nenhuma campanha criada. Use <strong className="font-semibold text-[var(--foreground)]">Nova</strong> para começar.</p> : null}
      {landings.length > 0 ? <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {landings.map((landing) => <button key={landing.id} type="button" onClick={() => { setCreatingNew(false); setForm(landing); setMessage(null); }} className={`min-w-52 rounded-xl border px-3 py-2 text-left transition ${form.id === landing.id ? "border-[var(--primary)] bg-[var(--primary)]/5" : "border-[var(--border)] hover:border-[var(--primary)]/40"}`}>
          <div className="flex items-center justify-between gap-2"><strong className="truncate text-sm text-[var(--foreground)]">{landing.name}</strong><DeveloperStatusPill active={landing.status === "published"} activeLabel="Publicada" inactiveLabel={labelForStatus(landing.status)} /></div>
          <p className="mt-1 truncate text-xs text-[var(--color-muted-raw)]">/{landing.slug}</p>
        </button>)}
      </div> : null}
    </DeveloperCard>

    <form onSubmit={save} className="mt-5 space-y-5">
      <LandingVisualEditor landing={form} media={media} uploadingMedia={uploadingMedia} onChange={(update) => setForm((current) => update(current))} onUploadMedia={uploadMedia} onDeleteMedia={deleteMedia} />
      <DeveloperCard>
        <DeveloperSectionHeading eyebrow="Configuração" title={form.id ? form.name : "Nova landing"} description="A campanha fica em rascunho até você publicar. Salve antes de abrir a prévia privada." action={<div className="flex flex-wrap gap-2"><button type="button" onClick={() => void openPreview()} disabled={saving || openingPreview} className={developerSecondaryButtonClassName}><ArrowSquareOut size={16} weight="bold" />{openingPreview ? "Abrindo..." : "Abrir prévia"}</button><button type="submit" disabled={saving} className={developerSecondaryButtonClassName}><FloppyDisk size={16} weight="bold" />Salvar</button><button type="button" disabled={saving || form.status === "published"} onClick={() => void changePublication(true)} className={developerPrimaryButtonClassName}><RocketLaunch size={16} weight="bold" />Publicar</button></div>} />
        <div className="grid gap-4 md:grid-cols-2"><DeveloperField label="Nome" required helpKey="landing-pages.field.nome"><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={developerInputClassName} maxLength={120} /></DeveloperField><DeveloperField label="Rota" required helpKey="landing-pages.field.rota" hint="Exemplo: campanha-distribuicao. A página será aberta em /campanha-distribuicao."><input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} className={developerInputClassName} maxLength={80} /></DeveloperField></div>
        {form.status === "published" ? <button type="button" disabled={saving} onClick={() => void changePublication(false)} className={`${developerSecondaryButtonClassName} mt-4`}><Eye size={16} weight="bold" />Despublicar</button> : null}
      </DeveloperCard>

      <DeveloperCard>
        <DeveloperSectionHeading eyebrow="Busca" title="SEO da campanha" description="Defina como a campanha aparece no Google e se ela pode ser indexada. A prévia privada nunca entra em resultados de busca." />
        <div className="grid gap-4 md:grid-cols-2"><DeveloperField label="Título SEO" helpKey="landing-pages.field.seo-title" hint="Se ficar vazio, a landing usa o título principal do Hero."><input value={form.seo.title} onChange={(event) => setForm({ ...form, seo: { ...form.seo, title: event.target.value } })} className={developerInputClassName} maxLength={70} /></DeveloperField><DeveloperField label="Descrição SEO" helpKey="landing-pages.field.seo-description" hint="Resumo curto usado por buscadores e compartilhamentos."><textarea value={form.seo.description} onChange={(event) => setForm({ ...form, seo: { ...form.seo, description: event.target.value } })} className={`${developerInputClassName} min-h-24 resize-y`} maxLength={180} /></DeveloperField></div>
        <DeveloperField label="Indexação" helpKey="landing-pages.field.seo-index" hint="Campanhas de teste podem permanecer fora dos resultados de busca."><label className="flex min-h-10 items-center gap-3 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold"><input type="checkbox" checked={form.seo.index} onChange={(event) => setForm({ ...form, seo: { ...form.seo, index: event.target.checked } })} className="size-4 accent-[var(--primary)]" />Permitir que buscadores indexem esta campanha publicada</label></DeveloperField>
      </DeveloperCard>

      <DeveloperCard><DeveloperSectionHeading eyebrow="Medição" title="Analytics da campanha" description="O GA4 só carrega nesta landing depois que o visitante aceitar analytics. Os demais campos ficam prontos para uso futuro." /><div className="grid gap-4 md:grid-cols-2"><DeveloperField label="Measurement ID GA4" helpKey="landing-pages.field.ga4"><input placeholder="G-XXXXXXXXXX" value={form.analytics.ga4MeasurementId} onChange={(event) => setForm({ ...form, analytics: { ...form.analytics, ga4MeasurementId: event.target.value.toUpperCase() } })} className={developerInputClassName} /></DeveloperField><DeveloperField label="Google Tag Manager"><input placeholder="GTM-XXXX" value={form.analytics.gtmContainerId} onChange={(event) => setForm({ ...form, analytics: { ...form.analytics, gtmContainerId: event.target.value.toUpperCase() } })} className={developerInputClassName} /></DeveloperField><DeveloperField label="Meta Pixel"><input value={form.analytics.metaPixelId} onChange={(event) => setForm({ ...form, analytics: { ...form.analytics, metaPixelId: event.target.value.replace(/\D/g, "") } })} className={developerInputClassName} /></DeveloperField><DeveloperField label="Google Ads"><input placeholder="AW-XXXXXXXXX" value={form.analytics.googleAdsId} onChange={(event) => setForm({ ...form, analytics: { ...form.analytics, googleAdsId: event.target.value.toUpperCase() } })} className={developerInputClassName} /></DeveloperField></div></DeveloperCard>
    </form>
  </DeveloperPage>;
}
