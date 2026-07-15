"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowSquareOut, CheckCircle, Plus, SortAscending, Trash } from "@phosphor-icons/react";
import { useApiRequest } from "@/hooks/useApiRequest";
import { DeveloperMediaField, DeveloperMediaPreview } from "@/components/developer/DeveloperMediaField";
import { DeveloperCmsAccordion } from "@/components/developer/DeveloperCmsAccordion";
import { DeveloperResponsivePreview } from "@/components/developer/DeveloperResponsivePreview";
import {
  DeveloperCard,
  DeveloperColorField,
  DeveloperField,
  DeveloperHero,
  DeveloperMessage,
  DeveloperPage,
  DeveloperSectionHeading,
  developerDangerButtonClassName,
  developerGhostButtonClassName,
  developerInputClassName,
  developerPrimaryButtonClassName,
  developerSecondaryButtonClassName,
} from "@/components/developer/ui";
import { api, site, type AppPath } from "@/lib/routes";
import { cn } from "@/lib/utils";

type PageKey = "about" | "business" | "contact" | "careers" | "quote";
type AnyRecord = Record<string, any>;

const PAGE_META: Record<
  PageKey,
  { title: string; eyebrow: string; publicHref: AppPath; description: string }
> = {
  about: {
    eyebrow: "Página Sobre",
    title: "Página Sobre.",
    publicHref: site.about,
    description: "Hero, governanca/compliance e CTA final da rota /sobre.",
  },
  business: {
    eyebrow: "Página Para Empresas",
    title: "Página Para Empresas.",
    publicHref: site.business,
    description: "Apenas botões do CTA de escala e FAQ da rota /para-empresas.",
  },
  contact: {
    eyebrow: "Página Fale Conosco",
    title: "Página Fale Conosco.",
    publicHref: site.contact,
    description: "Canais, blocos informativos e CTAs da rota /fale-conosco.",
  },
  careers: {
    eyebrow: "Página Trabalhe Conosco",
    title: "Página Trabalhe Conosco.",
    publicHref: site.careers,
    description: "Botões, imagem de cultura, vagas e CTAs da rota /trabalhe-conosco.",
  },
  quote: {
    eyebrow: "Página Cotação",
    title: "Página Cotação.",
    publicHref: site.quote,
    description: "Botões, canais diretos, outros canais e CTA final da rota /cotacao.",
  },
};

const QUOTE_ICON_OPTIONS = [
  "WhatsappLogo",
  "PhoneCall",
  "EnvelopeSimple",
  "ClipboardText",
  "ChatCircleDots",
  "Headset",
  "MapPinLine",
  "Truck",
];

const panelClassName =
  "rounded-[22px] border border-[var(--border)]/80 bg-slate-50/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] sm:p-5";

const priorityPanelClassName =
  "rounded-[22px] border border-[#93c5fd] bg-[linear-gradient(135deg,rgba(219,234,254,0.82)_0%,rgba(239,246,255,0.8)_54%,rgba(248,251,255,0.9)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_10px_24px_rgba(29,78,216,0.08)] ring-1 ring-[var(--primary)]/7 sm:p-5";

const editableSectionClassName =
  "rounded-[24px] border border-slate-200 bg-slate-50/86 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.045)] sm:p-5";

const aboutSections = [
  { key: "hero", label: "Hero", description: "Abertura da página" },
  { key: "compliance", label: "Governança", description: "Compliance e certificado" },
  { key: "finalCta", label: "CTA final", description: "Encerramento e ações" },
] as const;

type AboutSectionKey = (typeof aboutSections)[number]["key"];

function clonePage<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function CountHint({ value, maxLength }: { value: string; maxLength: number }) {
  return (
    <span className="mt-1 block text-[11px] text-[var(--color-muted-raw)]">
      {String(value ?? "").length}/{maxLength} caracteres
    </span>
  );
}

function SaveButton({ saving, children }: { saving: boolean; children: string }) {
  return (
    <button type="submit" disabled={saving} className={developerPrimaryButtonClassName}>
      <CheckCircle size={18} weight="bold" />
      {saving ? "Salvando..." : children}
    </button>
  );
}

function ButtonFields({
  buttons,
  onChange,
  labels = ["Botão 1", "Botão 2"],
  max = 2,
  mutedSurface = false,
  singleButtonInline = false,
  helpKey,
}: {
  buttons: AnyRecord[];
  onChange: (buttons: AnyRecord[]) => void;
  labels?: string[];
  max?: number;
  mutedSurface?: boolean;
  singleButtonInline?: boolean;
  helpKey?: string;
}) {
  return (
    <div
      className={cn(
        panelClassName,
        "grid gap-5 md:grid-cols-2",
        mutedSurface && "border-slate-300/85 bg-slate-100/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]"
      )}
    >
      {buttons.slice(0, max).map((button, index) => (
        <div
          key={index}
          className={cn(
            singleButtonInline && buttons.length === 1
              ? "grid gap-x-5 gap-y-3 md:col-span-2 md:grid-cols-2"
              : "space-y-4"
          )}
        >
          <div className={singleButtonInline && buttons.length === 1 ? "md:col-span-2" : undefined}>
            {singleButtonInline && buttons.length === 1 ? (
              <p className="text-base font-semibold tracking-[-0.015em] text-[var(--foreground)] sm:text-lg">
                {labels[index] ?? `Botão ${index + 1}`}
              </p>
            ) : (
              <DeveloperSectionHeading title={labels[index] ?? `Botão ${index + 1}`} />
            )}
          </div>
          <DeveloperField label="Texto" required helpKey={helpKey ? `${helpKey}-texto` : undefined}>
            <input
              required
              value={button.label ?? ""}
              onChange={(event) => {
                const next = [...buttons];
                next[index] = { ...button, label: event.target.value };
                onChange(next);
              }}
              maxLength={40}
              className={developerInputClassName}
            />
            <CountHint value={button.label ?? ""} maxLength={40} />
          </DeveloperField>
          <DeveloperField label="Link" required helpKey={helpKey ? `${helpKey}-link` : undefined}>
            <input
              required
              value={button.url ?? ""}
              onChange={(event) => {
                const next = [...buttons];
                next[index] = { ...button, url: event.target.value };
                onChange(next);
              }}
              className={developerInputClassName}
            />
          </DeveloperField>
        </div>
      ))}
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  maxLength,
  textarea,
  tooltip,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  textarea?: boolean;
  tooltip?: string;
}) {
  return (
    <DeveloperField label={label} required tooltip={tooltip}>
      {textarea ? (
        <textarea
          required
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          maxLength={maxLength}
          rows={3}
          className={`${developerInputClassName} resize-none`}
        />
      ) : (
        <input
          required
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          maxLength={maxLength}
          className={developerInputClassName}
        />
      )}
      <CountHint value={value ?? ""} maxLength={maxLength} />
    </DeveloperField>
  );
}

export function RoutePageCmsEditor({ pageKey }: { pageKey: PageKey }) {
  const meta = PAGE_META[pageKey];
  const { apiRequest } = useApiRequest();
  const [page, setPage] = useState<AnyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [status, setStatus] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [contactInfoOpenIndex, setContactInfoOpenIndex] = useState<number | null>(0);
  const [quoteDirectChannelsOpenIndex, setQuoteDirectChannelsOpenIndex] = useState<number | null>(null);
  const [quoteOtherChannelsOpenIndex, setQuoteOtherChannelsOpenIndex] = useState<number | null>(null);
  const [activeAboutSection, setActiveAboutSection] = useState<AboutSectionKey>("hero");
  const [previewRevision, setPreviewRevision] = useState(0);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      const response = await apiRequest<{ page?: AnyRecord }>(api.admin.page(pageKey));
      if (!alive) return;
      if (response.success) {
        setPage(response.data?.page ?? null);
        setStatus(null);
      } else {
        setStatus({ tone: "error", text: response.error ?? "Falha ao carregar página." });
      }
      setLoading(false);
    }
    void load();
    return () => {
      alive = false;
    };
  }, [apiRequest, pageKey]);

  const summary = useMemo(() => {
    if (!page) return { sections: 0, items: 0 };
    return {
      sections: Object.keys(page).length,
      items:
        (page.faq?.items?.length ?? 0) +
        (page.jobs?.length ?? 0) +
        (page.otherChannels?.length ?? 0) +
        (page.mainChannels?.length ?? 0),
    };
  }, [page]);

  function update(mutator: (draft: AnyRecord) => void) {
    setPage((current) => {
      if (!current) return current;
      const next = clonePage(current);
      mutator(next);
      return next;
    });
  }

  async function saveSection(sectionKey: string, payload: unknown) {
    setSaving(sectionKey);
    setStatus(null);
    const response = await apiRequest<{ page?: AnyRecord }>(
      api.admin.pageSection(pageKey, sectionKey),
      {
        method: "PUT",
        body: JSON.stringify(payload),
      }
    );
    setSaving("");
    if (!response.success) {
      setStatus({ tone: "error", text: response.error ?? "Falha ao salvar bloco." });
      return;
    }
    setPage(response.data?.page ?? page);
    setPreviewRevision((revision) => revision + 1);
    setStatus({ tone: "success", text: "Bloco salvo com sucesso." });
  }

  function moveArrayItem(path: string, index: number, direction: -1 | 1) {
    update((draft) => {
      const list = draft[path] as AnyRecord[];
      const target = index + direction;
      if (!Array.isArray(list) || target < 0 || target >= list.length) return;
      const [item] = list.splice(index, 1);
      list.splice(target, 0, item);
      list.forEach((entry, orderIndex) => {
        entry.order = orderIndex + 1;
      });
    });
  }

  if (!page) {
    return (
      <DeveloperPage>
        <DeveloperHero eyebrow={meta.eyebrow} title={meta.title} description={meta.description} />
        {loading ? <div className="mt-5"><DeveloperMessage tone="info">Carregando...</DeveloperMessage></div> : null}
        {status ? <div className="mt-5"><DeveloperMessage tone={status.tone}>{status.text}</DeveloperMessage></div> : null}
      </DeveloperPage>
    );
  }

  return (
    <DeveloperPage>
      <DeveloperHero
        eyebrow={meta.eyebrow}
        title={meta.title}
        description={meta.description}
        stats={[
          { label: "Secoes", value: summary.sections },
          { label: "Itens", value: summary.items },
        ]}
        actions={
          <Link href={meta.publicHref} className={developerSecondaryButtonClassName}>
            <ArrowSquareOut size={16} weight="bold" />
            Ver página
          </Link>
        }
      />

      {loading ? <div className="mt-5"><DeveloperMessage tone="info">Carregando...</DeveloperMessage></div> : null}
      {status ? <div className="mt-5"><DeveloperMessage tone={status.tone}>{status.text}</DeveloperMessage></div> : null}
      <div className="mt-5">
        <DeveloperResponsivePreview
          href={meta.publicHref}
          title={`Preview ${meta.title.replace(/\.$/, "")}`}
          revision={previewRevision}
        />
      </div>

      <div className="mt-5 grid gap-5">
        {pageKey === "about" ? (
          <>
            <DeveloperCard id="about-sections" className="p-5 sm:p-6">
              <DeveloperSectionHeading
                eyebrow="Edição por seção"
                title="Página Sobre"
                description="Selecione uma seção fixa para editar seu conteúdo com mais foco."
              />

              <div className="grid gap-2 rounded-[22px] border border-[var(--border)]/80 bg-white/70 p-2 sm:grid-cols-3">
                {aboutSections.map((section) => {
                  const isActive = section.key === activeAboutSection;
                  return (
                    <button
                      key={section.key}
                      type="button"
                      onClick={() => setActiveAboutSection(section.key)}
                      className={cn(
                        "rounded-[18px] border px-4 py-3 text-left transition-all duration-200",
                        "hover:-translate-y-0.5 hover:border-[var(--primary)]/35 hover:bg-white",
                        isActive
                          ? "border-[var(--primary)]/38 bg-[linear-gradient(145deg,rgba(255,255,255,0.96)_0%,rgba(219,234,254,0.9)_100%)] shadow-[0_14px_34px_rgba(29,78,216,0.12)]"
                          : "border-transparent bg-transparent text-[var(--color-muted-raw)]"
                      )}
                    >
                      <span className="block text-[11px] font-semibold uppercase tracking-[0.16em]">Seção fixa</span>
                      <span className="mt-1 block text-sm font-semibold text-[var(--foreground)]">{section.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-[var(--color-muted-raw)]">{section.description}</span>
                    </button>
                  );
                })}
              </div>

              {activeAboutSection === "hero" ? renderAboutHero() : null}
              {activeAboutSection === "compliance" ? renderAboutCompliance() : null}
              {activeAboutSection === "finalCta" ? renderAboutFinalCta() : null}
            </DeveloperCard>
          </>
        ) : null}

        {pageKey === "business" ? (
          <>
            <DeveloperCard className="p-5 sm:p-6">
              <DeveloperSectionHeading eyebrow="Pronto para escalar" title="Botões editáveis" description="Somente os dois botões desta seção são editáveis." />
              <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void saveSection("scaleCta", page.scaleCta); }}>
                <ButtonFields buttons={page.scaleCta.buttons} onChange={(buttons) => update((draft) => { draft.scaleCta.buttons = buttons; })} mutedSurface />
                <SaveButton saving={saving === "scaleCta"}>Salvar botões</SaveButton>
              </form>
            </DeveloperCard>
            {renderFaq(page.faq, "faq", 4)}
          </>
        ) : null}

        {pageKey === "contact" ? (
          <>
            <DeveloperCard className="p-5 sm:p-6">
              <DeveloperSectionHeading eyebrow="Hero" title="Botão WhatsApp" description="Hero fixo; somente este botão é editável." />
              <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void saveSection("hero", { heroWhatsappButton: page.heroWhatsappButton }); }}>
                <ButtonFields buttons={[page.heroWhatsappButton]} labels={["Botão WhatsApp"]} max={1} mutedSurface singleButtonInline helpKey="hero-whatsapp" onChange={(buttons) => update((draft) => { draft.heroWhatsappButton = buttons[0]; })} />
                <SaveButton saving={saving === "hero"}>Salvar hero</SaveButton>
              </form>
            </DeveloperCard>
            <DeveloperCard className="p-5 sm:p-6">
              <DeveloperSectionHeading eyebrow="Canais principais" title="Cards fixos" description="Títulos fixos; edite descrição e botão." />
              <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void saveSection("mainChannels", { mainChannels: page.mainChannels }); }}>
                <DeveloperCmsAccordion
                  items={page.mainChannels}
                  openIndex={openIndex}
                  onOpenChange={setOpenIndex}
                  getEyebrow={(_, index) => `Canal fixo ${index + 1}`}
                  getTitle={(item) => item.title}
                  variant="services"
                  renderItem={(item, index) => (
                    <div className="space-y-5">
                      <TextInput label="Descrição curta" value={item.description} maxLength={220} textarea onChange={(value) => update((draft) => { draft.mainChannels[index].description = value; })} />
                      <ButtonFields buttons={[item.button]} labels={["Botão"]} max={1} singleButtonInline onChange={(buttons) => update((draft) => { draft.mainChannels[index].button = buttons[0]; })} />
                    </div>
                  )}
                />
                <SaveButton saving={saving === "mainChannels"}>Salvar canais</SaveButton>
              </form>
            </DeveloperCard>
            {renderContactInfo()}
            {renderFinalCta(page.finalCta, "finalCta", true, true)}
          </>
        ) : null}

        {pageKey === "careers" ? (
          <>
            {renderButtonsOnly("hero", page.hero, "Hero", "Hero fixo; somente os botões são editáveis.", true)}
            <DeveloperCard className="p-5 sm:p-6">
              <DeveloperSectionHeading eyebrow="Cultura e benefícios" title="Foto da seção" description="Somente imagem e texto alternativo." />
              <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void saveSection("cultureImage", page.cultureImage); }}>
                <div className="rounded-[22px] border border-slate-200 bg-slate-50/76 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
                  <div className="grid gap-4 xl:grid-cols-[250px_minmax(0,1fr)] xl:items-start">
                    <DeveloperMediaPreview value={page.cultureImage.src} previewAlt={page.cultureImage.alt} mediaType="image" compact />
                  <div className="space-y-4">
                    <DeveloperMediaField label="Imagem" mediaType="image" required value={page.cultureImage.src} onChange={(src) => update((draft) => { draft.cultureImage.src = src; })} previewAlt={page.cultureImage.alt} showPreview={false} />
                    <TextInput label="Texto alternativo" value={page.cultureImage.alt} maxLength={160} onChange={(value) => update((draft) => { draft.cultureImage.alt = value; })} />
                  </div>
                  </div>
                  <div className="mt-4 flex justify-end border-t border-slate-200/80 pt-4">
                    <SaveButton saving={saving === "cultureImage"}>Salvar foto</SaveButton>
                  </div>
                </div>
              </form>
            </DeveloperCard>
            {renderJobs()}
            {renderButtonsOnly("directApplication", page.directApplication, "Candidatura direta", "Somente os dois botões são editáveis.", true)}
            {renderButtonsOnly("finalCta", page.finalCta, "CTA final", "Somente os dois botões são editáveis.", true)}
          </>
        ) : null}

        {pageKey === "quote" ? (
          <>
            {renderButtonsOnly("hero", page.hero, "Hero", "Hero fixo; somente os botões são editáveis.", true)}
            <DeveloperCard className="p-5 sm:p-6">
              <DeveloperSectionHeading eyebrow="Canais diretos" title="Dois cards fixos" description="Título, descrição e botão dos dois cards." />
              <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void saveSection("directChannels", { directChannels: page.directChannels }); }}>
                <DeveloperCmsAccordion
                  items={page.directChannels}
                  openIndex={quoteDirectChannelsOpenIndex}
                  onOpenChange={setQuoteDirectChannelsOpenIndex}
                  getEyebrow={(_, index) => `Card fixo ${index + 1}`}
                  getTitle={(item) => item.title}
                  variant="services"
                  renderItem={(item, index) => (
                    <div className="space-y-4">
                      <div className={cn(panelClassName, "grid gap-4 md:grid-cols-2")}>
                        <TextInput label="Título" value={item.title} maxLength={220} onChange={(value) => update((draft) => { draft.directChannels[index].title = value; })} />
                        <TextInput label="Descrição" value={item.description} maxLength={220} textarea onChange={(value) => update((draft) => { draft.directChannels[index].description = value; })} />
                      </div>
                      <ButtonFields buttons={[item.button]} labels={["Botão"]} max={1} singleButtonInline onChange={(buttons) => update((draft) => { draft.directChannels[index].button = buttons[0]; })} />
                    </div>
                  )}
                />
                <SaveButton saving={saving === "directChannels"}>Salvar canais diretos</SaveButton>
              </form>
            </DeveloperCard>
            {renderOtherChannels()}
            {renderButtonsOnly("finalCta", page.finalCta, "CTA final", "Somente os dois botões são editáveis.", true)}
          </>
        ) : null}
      </div>
    </DeveloperPage>
  );

  function renderAboutHero() {
    if (!page) return null;
    const current = page;
    return (
      <article className={cn(editableSectionClassName, "mt-5")}>
        <div className="mb-5 rounded-[18px] border border-[var(--primary)]/16 bg-[linear-gradient(135deg,rgba(219,234,254,0.62)_0%,rgba(255,255,255,0.86)_70%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">Seção fixa 1</p>
          <h3 className="mt-1 text-base font-semibold text-[var(--foreground)]">Hero</h3>
          <p className="mt-1 text-sm leading-6 text-[var(--color-muted-raw)]">Mídia, chamada principal e botões exibidos na abertura de /sobre.</p>
        </div>
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void saveSection("hero", current.hero); }}>
          <div className={priorityPanelClassName}>
            <p className="mb-3 text-sm font-semibold text-[var(--foreground)]">Mídia principal <span className="text-[var(--primary)]">*</span></p>
            <div className="grid gap-4 xl:grid-cols-[minmax(220px,0.62fr)_minmax(0,1.9fr)] xl:items-start">
              <DeveloperMediaPreview value={current.hero.media.src} previewAlt={current.hero.media.alt} mediaType="image" compact />
              <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
                <DeveloperMediaField
                  label="Arquivo selecionado"
                  mediaType="image"
                  required
                  value={current.hero.media.src}
                  onChange={(src) => update((draft) => { draft.hero.media.src = src; })}
                  previewAlt={current.hero.media.alt}
                  showPreview={false}
                  equalControlWidths
                />
                <TextInput label="Texto alternativo" value={current.hero.media.alt} maxLength={160} onChange={(value) => update((draft) => { draft.hero.media.alt = value; })} />
              </div>
            </div>
          </div>
          <div className={cn(priorityPanelClassName, "grid gap-5 md:grid-cols-2")}>
            <TextInput label="Título" value={current.hero.title} maxLength={320} onChange={(value) => update((draft) => { draft.hero.title = value; })} tooltip="Máximo visual esperado: 3 linhas." />
            <TextInput label="Descrição" value={current.hero.description} maxLength={220} textarea onChange={(value) => update((draft) => { draft.hero.description = value; })} tooltip="Máximo visual esperado: 2 linhas." />
          </div>
          <ButtonFields buttons={current.hero.buttons} onChange={(buttons) => update((draft) => { draft.hero.buttons = buttons; })} mutedSurface />
          <SaveButton saving={saving === "hero"}>Salvar hero</SaveButton>
        </form>
      </article>
    );
  }

  function renderAboutCompliance() {
    if (!page) return null;
    const current = page;
    return (
      <article className={cn(editableSectionClassName, "mt-5")}>
        <div className="mb-5 rounded-[18px] border border-[var(--primary)]/16 bg-[linear-gradient(135deg,rgba(219,234,254,0.62)_0%,rgba(255,255,255,0.86)_70%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">Seção fixa 2</p>
          <h3 className="mt-1 text-base font-semibold text-[var(--foreground)]">Governança</h3>
          <p className="mt-1 text-sm leading-6 text-[var(--color-muted-raw)]">Conteúdo da seção de governança e compliance exibida em /sobre.</p>
        </div>
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void saveSection("compliance", current.compliance); }}>
          <div className={priorityPanelClassName}>
            <p className="mb-3 text-sm font-semibold text-[var(--foreground)]">Imagem principal <span className="text-[var(--primary)]">*</span></p>
            <div className="grid gap-4 xl:grid-cols-[minmax(220px,0.62fr)_minmax(0,1.9fr)] xl:items-start">
              <DeveloperMediaPreview value={current.compliance.image.src} previewAlt={current.compliance.image.alt} mediaType="image" compact />
              <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
                <DeveloperMediaField label="Arquivo selecionado" mediaType="image" required value={current.compliance.image.src} onChange={(src) => update((draft) => { draft.compliance.image.src = src; })} previewAlt={current.compliance.image.alt} showPreview={false} equalControlWidths />
                <TextInput label="Texto alternativo" value={current.compliance.image.alt} maxLength={160} onChange={(value) => update((draft) => { draft.compliance.image.alt = value; })} />
              </div>
            </div>
          </div>
          <div className={cn(priorityPanelClassName, "grid gap-5 md:grid-cols-2")}>
            <TextInput label="Título" value={current.compliance.title} maxLength={220} onChange={(value) => update((draft) => { draft.compliance.title = value; })} />
            <TextInput label="Descrição" value={current.compliance.description} maxLength={320} textarea onChange={(value) => update((draft) => { draft.compliance.description = value; })} />
          </div>
          <div className={cn(panelClassName, "grid gap-5 border-slate-300/85 bg-slate-100/90 md:grid-cols-2")}>
            <TextInput label="Texto do certificado" value={current.compliance.certificateText} maxLength={180} onChange={(value) => update((draft) => { draft.compliance.certificateText = value; })} />
            <DeveloperField label="Link externo do certificado">
              <input value={current.compliance.certificateUrl ?? ""} onChange={(event) => update((draft) => { draft.compliance.certificateUrl = event.target.value; })} className={developerInputClassName} />
            </DeveloperField>
          </div>
          <SaveButton saving={saving === "compliance"}>Salvar governança</SaveButton>
        </form>
      </article>
    );
  }

  function renderAboutFinalCta() {
    if (!page) return null;
    const current = page;
    return (
      <article className={cn(editableSectionClassName, "mt-5 border-[#93c5fd] bg-[linear-gradient(135deg,rgba(219,234,254,0.55)_0%,rgba(248,251,255,0.9)_65%)] ring-1 ring-[var(--primary)]/7")}>
        <div className="mb-5 rounded-[18px] border border-[var(--primary)]/16 bg-white/82 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">Seção fixa 3</p>
          <h3 className="mt-1 text-base font-semibold text-[var(--foreground)]">CTA final</h3>
          <p className="mt-1 text-sm leading-6 text-[var(--color-muted-raw)]">Chamada de encerramento e os dois caminhos de ação de /sobre.</p>
        </div>
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); void saveSection("finalCta", current.finalCta); }}>
          <div className={cn(priorityPanelClassName, "grid gap-5 md:grid-cols-2")}>
            <TextInput label="Título" value={current.finalCta.title} maxLength={320} onChange={(value) => update((draft) => { draft.finalCta.title = value; })} />
            <TextInput label="Descrição" value={current.finalCta.description} maxLength={220} textarea onChange={(value) => update((draft) => { draft.finalCta.description = value; })} />
          </div>
          <ButtonFields buttons={current.finalCta.buttons} onChange={(buttons) => update((draft) => { draft.finalCta.buttons = buttons; })} mutedSurface />
          <SaveButton saving={saving === "finalCta"}>Salvar CTA final</SaveButton>
        </form>
      </article>
    );
  }

  function renderButtonsOnly(
    sectionKey: string,
    section: AnyRecord,
    title: string,
    description: string,
    highlightButtons = false
  ) {
    return (
      <DeveloperCard className="p-5 sm:p-6">
        <DeveloperSectionHeading title={title} description={description} />
        <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void saveSection(sectionKey, section); }}>
          <ButtonFields buttons={section.buttons} onChange={(buttons) => update((draft) => { draft[sectionKey].buttons = buttons; })} mutedSurface={highlightButtons} />
          <SaveButton saving={saving === sectionKey}>Salvar botões</SaveButton>
        </form>
      </DeveloperCard>
    );
  }

  function renderFinalCta(
    finalCta: AnyRecord,
    sectionKey: string,
    buttonsOnly = false,
    highlightButtons = false
  ) {
    return (
      <DeveloperCard className="p-5 sm:p-6">
        <DeveloperSectionHeading eyebrow="CTA final" title="CTA final" description={buttonsOnly ? "Texto fixo; somente botões editáveis." : "Título, descrição e botões."} />
        <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void saveSection(sectionKey, finalCta); }}>
          {!buttonsOnly ? (
            <div className={cn(panelClassName, "grid gap-5 md:grid-cols-2")}>
              <TextInput label="Título" value={finalCta.title} maxLength={320} onChange={(value) => update((draft) => { draft.finalCta.title = value; })} />
              <TextInput label="Descrição" value={finalCta.description} maxLength={220} textarea onChange={(value) => update((draft) => { draft.finalCta.description = value; })} />
            </div>
          ) : null}
          <ButtonFields buttons={finalCta.buttons} onChange={(buttons) => update((draft) => { draft.finalCta.buttons = buttons; })} mutedSurface={highlightButtons} />
          <SaveButton saving={saving === sectionKey}>Salvar CTA</SaveButton>
        </form>
      </DeveloperCard>
    );
  }

  function renderFaq(faq: AnyRecord, sectionKey: string, count: number) {
    return (
      <DeveloperCard className="p-5 sm:p-6">
        <DeveloperSectionHeading eyebrow="FAQ" title="Perguntas frequentes" description="Perguntas fixas em accordion; salvar tudo no final." />
        <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void saveSection(sectionKey, faq); }}>
          <TextInput label="Título principal" value={faq.title} maxLength={120} onChange={(value) => update((draft) => { draft.faq.title = value; })} />
          <DeveloperCmsAccordion
            items={faq.items.slice(0, count)}
            openIndex={openIndex}
            onOpenChange={setOpenIndex}
            getEyebrow={(_, index) => `Pergunta fixa ${index + 1}`}
            getTitle={(item) => item.question || "Pergunta sem texto"}
            variant={pageKey === "business" ? "services" : "default"}
            renderItem={(item, index) => (
              <div className="grid gap-5 md:grid-cols-2">
                <TextInput label="Pergunta" value={item.question} maxLength={180} onChange={(value) => update((draft) => { draft.faq.items[index].question = value; })} />
                <TextInput label="Resposta" value={item.answer} maxLength={320} textarea onChange={(value) => update((draft) => { draft.faq.items[index].answer = value; })} />
              </div>
            )}
          />
          <SaveButton saving={saving === sectionKey}>Salvar FAQ</SaveButton>
        </form>
      </DeveloperCard>
    );
  }

  function renderContactInfo() {
    if (!page) return null;
    const current = page;
    return (
      <DeveloperCard className="p-5 sm:p-6">
        <DeveloperSectionHeading eyebrow="Informações oficiais" title="Canais, horários e estrutura" description="Blocos exibidos na seção escura de contato." />
        <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void saveSection("info", current.info); }}>
          <DeveloperCmsAccordion
            items={current.info.items}
            openIndex={contactInfoOpenIndex}
            onOpenChange={setContactInfoOpenIndex}
            getEyebrow={(_, index) => `Item coluna 1 - ${index + 1}`}
            getTitle={(item) => item.label}
            variant="services"
            renderItem={(item, index) => (
              <div className="grid gap-5 md:grid-cols-2">
                <TextInput label="Título" value={item.title} maxLength={90} onChange={(value) => update((draft) => { draft.info.items[index].title = value; })} />
                <TextInput label="Descrição curta" value={item.description} maxLength={220} textarea onChange={(value) => update((draft) => { draft.info.items[index].description = value; })} />
              </div>
            )}
          />
          <DeveloperCmsAccordion
            items={[current.info]}
            openIndex={contactInfoOpenIndex}
            onOpenChange={setContactInfoOpenIndex}
            indexOffset={current.info.items.length}
            getEyebrow={() => "Informações principais"}
            getTitle={() => current.info.companyTitle || "Título principal do bloco"}
            variant="services"
            renderItem={() => (
              <div className="grid gap-5 md:grid-cols-2 md:items-start">
                <div className="space-y-5">
                  <TextInput label="Título principal do bloco" value={current.info.companyTitle} maxLength={90} onChange={(value) => update((draft) => { draft.info.companyTitle = value; })} />
                  <TextInput label="Horário de atendimento" value={current.info.hours} maxLength={160} onChange={(value) => update((draft) => { draft.info.hours = value; })} />
                  <TextInput label="Título Qual canal usar" value={current.info.channelGuideTitle} maxLength={90} onChange={(value) => update((draft) => { draft.info.channelGuideTitle = value; })} />
                  <TextInput label="Descrição Qual canal usar" value={current.info.channelGuideDescription} maxLength={220} textarea onChange={(value) => update((draft) => { draft.info.channelGuideDescription = value; })} />
                </div>
                <div className="space-y-5">
                  <TextInput label="Endereço" value={current.info.address} maxLength={220} textarea onChange={(value) => update((draft) => { draft.info.address = value; })} />
                  <TextInput label="Documentos e anexos" value={current.info.documentsDescription} maxLength={220} textarea onChange={(value) => update((draft) => { draft.info.documentsDescription = value; })} />
                  <TextInput label="Apoio rápido" value={current.info.quickSupportDescription} maxLength={220} textarea onChange={(value) => update((draft) => { draft.info.quickSupportDescription = value; })} />
                </div>
              </div>
            )}
          />
          <DeveloperCmsAccordion
            items={current.info.indicators}
            openIndex={contactInfoOpenIndex}
            onOpenChange={setContactInfoOpenIndex}
            indexOffset={current.info.items.length + 1}
            getEyebrow={(_, index) => `Indicador ${index + 1}`}
            getTitle={(item) => `${item.value} - ${item.description}`}
            variant="services"
            renderItem={(item, index) => (
              <div className="grid gap-5 md:grid-cols-2">
                <TextInput label="Valor" value={item.value} maxLength={40} onChange={(value) => update((draft) => { draft.info.indicators[index].value = value; })} />
                <TextInput label="Descrição" value={item.description} maxLength={140} onChange={(value) => update((draft) => { draft.info.indicators[index].description = value; })} />
              </div>
            )}
          />
          <SaveButton saving={saving === "info"}>Salvar informacoes</SaveButton>
        </form>
      </DeveloperCard>
    );
  }

  function renderJobs() {
    if (!page) return null;
    const current = page;
    return (
      <DeveloperCard id="jobs" className="p-5 sm:p-6">
        <DeveloperSectionHeading
          eyebrow="Oportunidades abertas"
          title="Vagas"
          description="Crie, remova e ordene as vagas publicadas. O site mostra 3 por página."
          action={
            <button
              type="button"
              className={developerSecondaryButtonClassName}
              onClick={() => update((draft) => {
                draft.jobs.push({
                  id: newId("career-job"),
                  order: draft.jobs.length + 1,
                  title: "",
                  location: "",
                  type: "CLT",
                  description: "",
                  applyUrl: site.careers,
                  active: true,
                });
              })}
            >
              <Plus size={16} weight="bold" />
              Nova vaga
            </button>
          }
        />
        <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void saveSection("jobs", { jobs: current.jobs }); }}>
          <DeveloperCmsAccordion
            items={current.jobs}
            openIndex={openIndex}
            onOpenChange={setOpenIndex}
            getEyebrow={(_, index) => `Vaga ${index + 1}`}
            getTitle={(item) => item.title || "Vaga sem cargo"}
            variant="services"
            renderItem={(item, index) => (
              <div className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <TextInput label="Cargo" value={item.title} maxLength={90} onChange={(value) => update((draft) => { draft.jobs[index].title = value; })} />
                  <TextInput label="Localidade" value={item.location} maxLength={90} onChange={(value) => update((draft) => { draft.jobs[index].location = value; })} />
                  <TextInput label="Tipo" value={item.type} maxLength={40} onChange={(value) => update((draft) => { draft.jobs[index].type = value; })} />
                  <TextInput label="Link candidatura" value={item.applyUrl} maxLength={600} onChange={(value) => update((draft) => { draft.jobs[index].applyUrl = value; })} />
                  <TextInput label="Descrição curta" value={item.description} maxLength={220} textarea onChange={(value) => update((draft) => { draft.jobs[index].description = value; })} />
                </div>
                <label className="inline-flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[var(--foreground)]">
                  <input
                    type="checkbox"
                    checked={item.active !== false}
                    onChange={(event) => update((draft) => { draft.jobs[index].active = event.target.checked; })}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  Vaga publicada
                </label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={developerGhostButtonClassName} onClick={() => moveArrayItem("jobs", index, -1)}><SortAscending size={16} weight="bold" />Subir</button>
                  <button type="button" className={developerGhostButtonClassName} onClick={() => moveArrayItem("jobs", index, 1)}><SortAscending size={16} weight="bold" className="rotate-180" />Descer</button>
                  <button type="button" className={developerDangerButtonClassName} onClick={() => update((draft) => { draft.jobs.splice(index, 1); })}><Trash size={16} weight="bold" />Remover</button>
                </div>
              </div>
            )}
          />
          <SaveButton saving={saving === "jobs"}>Salvar vagas</SaveButton>
        </form>
      </DeveloperCard>
    );
  }

  function renderOtherChannels() {
    if (!page) return null;
    const current = page;
    return (
      <DeveloperCard className="p-5 sm:p-6">
        <DeveloperSectionHeading
          eyebrow="Outros canais"
          title="Cards dinamicos"
          description="Crie, remova e ordene canais. O site mostra 4 por página."
          action={
            <button
              type="button"
              className={developerSecondaryButtonClassName}
              onClick={() => update((draft) => {
                draft.otherChannels.push({
                  id: newId("quote-channel"),
                  order: draft.otherChannels.length + 1,
                  icon: "ChatCircleDots",
                  iconColor: "#38bdf8",
                  title: "",
                  description: "",
                  button: { label: "Abrir canal", url: site.contact },
                  buttonColor: "#0f172a",
                  active: true,
                });
              })}
            >
              <Plus size={16} weight="bold" />
              Novo canal
            </button>
          }
        />
        <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void saveSection("otherChannels", { otherChannels: current.otherChannels }); }}>
          <DeveloperCmsAccordion
            items={current.otherChannels}
            openIndex={quoteOtherChannelsOpenIndex}
            onOpenChange={setQuoteOtherChannelsOpenIndex}
            getEyebrow={(_, index) => `Canal ${index + 1}`}
            getTitle={(item) => item.title || "Canal sem titulo"}
            variant="services"
            renderItem={(item, index) => (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <DeveloperField label="Icone">
                    <select value={item.icon} onChange={(event) => update((draft) => { draft.otherChannels[index].icon = event.target.value; })} className={developerInputClassName}>
                      {QUOTE_ICON_OPTIONS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
                    </select>
                  </DeveloperField>
                  <DeveloperColorField label="Cor do icone" value={item.iconColor} onChange={(value) => update((draft) => { draft.otherChannels[index].iconColor = value; })} />
                  <TextInput label="Título" value={item.title} maxLength={90} onChange={(value) => update((draft) => { draft.otherChannels[index].title = value; })} />
                  <TextInput label="Descrição" value={item.description} maxLength={220} textarea onChange={(value) => update((draft) => { draft.otherChannels[index].description = value; })} />
                  <DeveloperColorField label="Cor do botão" value={item.buttonColor} className="md:col-span-2" onChange={(value) => update((draft) => { draft.otherChannels[index].buttonColor = value; })} />
                </div>
                <ButtonFields buttons={[item.button]} labels={["Botão"]} max={1} singleButtonInline onChange={(buttons) => update((draft) => { draft.otherChannels[index].button = buttons[0]; })} />
                <label className="inline-flex min-h-11 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[var(--foreground)]">
                  <input
                    type="checkbox"
                    checked={item.active !== false}
                    onChange={(event) => update((draft) => { draft.otherChannels[index].active = event.target.checked; })}
                    className="h-4 w-4 accent-[var(--primary)]"
                  />
                  Canal publicado
                </label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={developerGhostButtonClassName} onClick={() => moveArrayItem("otherChannels", index, -1)}><SortAscending size={16} weight="bold" />Subir</button>
                  <button type="button" className={developerGhostButtonClassName} onClick={() => moveArrayItem("otherChannels", index, 1)}><SortAscending size={16} weight="bold" className="rotate-180" />Descer</button>
                  <button type="button" className={developerDangerButtonClassName} onClick={() => update((draft) => { draft.otherChannels.splice(index, 1); })}><Trash size={16} weight="bold" />Remover</button>
                </div>
              </div>
            )}
          />
          <SaveButton saving={saving === "otherChannels"}>Salvar outros canais</SaveButton>
        </form>
      </DeveloperCard>
    );
  }
}
