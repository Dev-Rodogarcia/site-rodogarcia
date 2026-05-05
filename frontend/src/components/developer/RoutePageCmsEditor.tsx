"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowSquareOut, CheckCircle, Plus, SortAscending, Trash } from "@phosphor-icons/react";
import { useApiRequest } from "@/hooks/useApiRequest";
import { DeveloperMediaField } from "@/components/developer/DeveloperMediaField";
import { DeveloperCmsAccordion } from "@/components/developer/DeveloperCmsAccordion";
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
import { api, site } from "@/lib/routes";
import { cn } from "@/lib/utils";

type PageKey = "about" | "business" | "contact" | "careers" | "quote";
type AnyRecord = Record<string, any>;

const PAGE_META: Record<PageKey, { title: string; eyebrow: string; publicHref: string; description: string }> = {
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
  labels = ["Botao 1", "Botao 2"],
  max = 2,
}: {
  buttons: AnyRecord[];
  onChange: (buttons: AnyRecord[]) => void;
  labels?: string[];
  max?: number;
}) {
  return (
    <div className={cn(panelClassName, "grid gap-5 md:grid-cols-2")}>
      {buttons.slice(0, max).map((button, index) => (
        <div key={index} className="space-y-4">
          <DeveloperSectionHeading title={labels[index] ?? `Botao ${index + 1}`} />
          <DeveloperField label="Texto" required tooltip="Texto exibido no botão. Exemplo: Solicitar cotação.">
            <input
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
          <DeveloperField label="Link" required tooltip="Use rota interna, URL externa, mailto: ou tel:.">
            <input
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
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          maxLength={maxLength}
          rows={3}
          className={`${developerInputClassName} resize-none`}
        />
      ) : (
        <input
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

      <div className="mt-5 grid gap-5">
        {pageKey === "about" ? (
          <>
            <DeveloperCard className="p-5 sm:p-6">
              <DeveloperSectionHeading eyebrow="Hero" title="Hero da Página Sobre" description="Título, descrição, dois botões e mídia principal." />
              <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void saveSection("hero", page.hero); }}>
                <div className={panelClassName}>
                  <DeveloperMediaField
                    label="Imagem ou mídia"
                    mediaType="all"
                    value={page.hero.media.src}
                    onChange={(src) => update((draft) => { draft.hero.media.src = src; })}
                    previewAlt={page.hero.media.alt}
                  />
                  <div className="mt-4">
                    <TextInput label="Texto alternativo" value={page.hero.media.alt} maxLength={160} onChange={(value) => update((draft) => { draft.hero.media.alt = value; })} />
                  </div>
                </div>
                <div className={cn(panelClassName, "grid gap-5 md:grid-cols-2")}>
                  <TextInput label="Título" value={page.hero.title} maxLength={320} onChange={(value) => update((draft) => { draft.hero.title = value; })} tooltip="Máximo visual esperado: 3 linhas." />
                  <TextInput label="Descrição" value={page.hero.description} maxLength={220} textarea onChange={(value) => update((draft) => { draft.hero.description = value; })} tooltip="Máximo visual esperado: 2 linhas." />
                </div>
                <ButtonFields buttons={page.hero.buttons} onChange={(buttons) => update((draft) => { draft.hero.buttons = buttons; })} />
                <SaveButton saving={saving === "hero"}>Salvar hero</SaveButton>
              </form>
            </DeveloperCard>
            <DeveloperCard className="p-5 sm:p-6">
              <DeveloperSectionHeading eyebrow="Governança" title="Governança e Compliance" description="Imagem, texto alternativo, título, descrição e certificado." />
              <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void saveSection("compliance", page.compliance); }}>
                <DeveloperMediaField label="Imagem principal" mediaType="image" value={page.compliance.image.src} onChange={(src) => update((draft) => { draft.compliance.image.src = src; })} previewAlt={page.compliance.image.alt} />
                <div className={cn(panelClassName, "grid gap-5 md:grid-cols-2")}>
                  <TextInput label="Texto alternativo" value={page.compliance.image.alt} maxLength={160} onChange={(value) => update((draft) => { draft.compliance.image.alt = value; })} />
                  <TextInput label="Título" value={page.compliance.title} maxLength={220} onChange={(value) => update((draft) => { draft.compliance.title = value; })} />
                  <TextInput label="Descrição" value={page.compliance.description} maxLength={320} textarea onChange={(value) => update((draft) => { draft.compliance.description = value; })} />
                  <TextInput label="Texto do certificado" value={page.compliance.certificateText} maxLength={180} onChange={(value) => update((draft) => { draft.compliance.certificateText = value; })} />
                  <DeveloperField label="Link externo do certificado">
                    <input value={page.compliance.certificateUrl ?? ""} onChange={(event) => update((draft) => { draft.compliance.certificateUrl = event.target.value; })} className={developerInputClassName} />
                  </DeveloperField>
                </div>
                <SaveButton saving={saving === "compliance"}>Salvar compliance</SaveButton>
              </form>
            </DeveloperCard>
            {renderFinalCta(page.finalCta, "finalCta")}
          </>
        ) : null}

        {pageKey === "business" ? (
          <>
            <DeveloperCard className="p-5 sm:p-6">
              <DeveloperSectionHeading eyebrow="Pronto para escalar" title="Botões editáveis" description="Somente os dois botões desta seção são editáveis." />
              <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void saveSection("scaleCta", page.scaleCta); }}>
                <ButtonFields buttons={page.scaleCta.buttons} onChange={(buttons) => update((draft) => { draft.scaleCta.buttons = buttons; })} />
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
                <ButtonFields buttons={[page.heroWhatsappButton]} labels={["Botao WhatsApp"]} max={1} onChange={(buttons) => update((draft) => { draft.heroWhatsappButton = buttons[0]; })} />
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
                  renderItem={(item, index) => (
                    <div className="space-y-5">
                      <TextInput label="Descrição curta" value={item.description} maxLength={220} textarea onChange={(value) => update((draft) => { draft.mainChannels[index].description = value; })} />
                      <ButtonFields buttons={[item.button]} labels={["Botao"]} max={1} onChange={(buttons) => update((draft) => { draft.mainChannels[index].button = buttons[0]; })} />
                    </div>
                  )}
                />
                <SaveButton saving={saving === "mainChannels"}>Salvar canais</SaveButton>
              </form>
            </DeveloperCard>
            {renderContactInfo()}
            {renderFinalCta(page.finalCta, "finalCta", true)}
          </>
        ) : null}

        {pageKey === "careers" ? (
          <>
            {renderButtonsOnly("hero", page.hero, "Hero", "Hero fixo; somente os botões são editáveis.")}
            <DeveloperCard className="p-5 sm:p-6">
              <DeveloperSectionHeading eyebrow="Cultura e benefícios" title="Foto da seção" description="Somente imagem e texto alternativo." />
              <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void saveSection("cultureImage", page.cultureImage); }}>
                <DeveloperMediaField label="Imagem" mediaType="image" value={page.cultureImage.src} onChange={(src) => update((draft) => { draft.cultureImage.src = src; })} previewAlt={page.cultureImage.alt} />
                <TextInput label="Texto alternativo" value={page.cultureImage.alt} maxLength={160} onChange={(value) => update((draft) => { draft.cultureImage.alt = value; })} />
                <SaveButton saving={saving === "cultureImage"}>Salvar foto</SaveButton>
              </form>
            </DeveloperCard>
            {renderJobs()}
            {renderButtonsOnly("directApplication", page.directApplication, "Candidatura direta", "Somente os dois botões são editáveis.")}
            {renderButtonsOnly("finalCta", page.finalCta, "CTA final", "Somente os dois botões são editáveis.")}
          </>
        ) : null}

        {pageKey === "quote" ? (
          <>
            {renderButtonsOnly("hero", page.hero, "Hero", "Hero fixo; somente os botões são editáveis.")}
            <DeveloperCard className="p-5 sm:p-6">
              <DeveloperSectionHeading eyebrow="Canais diretos" title="Dois cards fixos" description="Título, descrição e botão dos dois cards." />
              <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void saveSection("directChannels", { directChannels: page.directChannels }); }}>
                <DeveloperCmsAccordion
                  items={page.directChannels}
                  openIndex={openIndex}
                  onOpenChange={setOpenIndex}
                  getEyebrow={(_, index) => `Card fixo ${index + 1}`}
                  getTitle={(item) => item.title}
                  renderItem={(item, index) => (
                    <div className="space-y-5">
                      <div className={cn(panelClassName, "grid gap-5 md:grid-cols-2")}>
                        <TextInput label="Título" value={item.title} maxLength={220} onChange={(value) => update((draft) => { draft.directChannels[index].title = value; })} />
                        <TextInput label="Descrição" value={item.description} maxLength={220} textarea onChange={(value) => update((draft) => { draft.directChannels[index].description = value; })} />
                      </div>
                      <ButtonFields buttons={[item.button]} labels={["Botao"]} max={1} onChange={(buttons) => update((draft) => { draft.directChannels[index].button = buttons[0]; })} />
                    </div>
                  )}
                />
                <SaveButton saving={saving === "directChannels"}>Salvar canais diretos</SaveButton>
              </form>
            </DeveloperCard>
            {renderOtherChannels()}
            {renderButtonsOnly("finalCta", page.finalCta, "CTA final", "Somente os dois botões são editáveis.")}
          </>
        ) : null}
      </div>
    </DeveloperPage>
  );

  function renderButtonsOnly(sectionKey: string, section: AnyRecord, title: string, description: string) {
    return (
      <DeveloperCard className="p-5 sm:p-6">
        <DeveloperSectionHeading title={title} description={description} />
        <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); void saveSection(sectionKey, section); }}>
          <ButtonFields buttons={section.buttons} onChange={(buttons) => update((draft) => { draft[sectionKey].buttons = buttons; })} />
          <SaveButton saving={saving === sectionKey}>Salvar botões</SaveButton>
        </form>
      </DeveloperCard>
    );
  }

  function renderFinalCta(finalCta: AnyRecord, sectionKey: string, buttonsOnly = false) {
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
          <ButtonFields buttons={finalCta.buttons} onChange={(buttons) => update((draft) => { draft.finalCta.buttons = buttons; })} />
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
            openIndex={openIndex}
            onOpenChange={setOpenIndex}
            getEyebrow={(_, index) => `Item coluna 1 - ${index + 1}`}
            getTitle={(item) => item.label}
            renderItem={(item, index) => (
              <div className="grid gap-5 md:grid-cols-2">
                <TextInput label="Título" value={item.title} maxLength={90} onChange={(value) => update((draft) => { draft.info.items[index].title = value; })} />
                <TextInput label="Descrição curta" value={item.description} maxLength={220} textarea onChange={(value) => update((draft) => { draft.info.items[index].description = value; })} />
              </div>
            )}
          />
          <div className={cn(panelClassName, "grid gap-5 md:grid-cols-2")}>
            <TextInput label="Título principal do bloco" value={current.info.companyTitle} maxLength={90} onChange={(value) => update((draft) => { draft.info.companyTitle = value; })} />
            <TextInput label="Endereco" value={current.info.address} maxLength={220} textarea onChange={(value) => update((draft) => { draft.info.address = value; })} />
            <TextInput label="Horario de atendimento" value={current.info.hours} maxLength={160} onChange={(value) => update((draft) => { draft.info.hours = value; })} />
            <TextInput label="Título Qual canal usar" value={current.info.channelGuideTitle} maxLength={90} onChange={(value) => update((draft) => { draft.info.channelGuideTitle = value; })} />
            <TextInput label="Descrição Qual canal usar" value={current.info.channelGuideDescription} maxLength={220} textarea onChange={(value) => update((draft) => { draft.info.channelGuideDescription = value; })} />
            <TextInput label="Documentos e anexos" value={current.info.documentsDescription} maxLength={220} textarea onChange={(value) => update((draft) => { draft.info.documentsDescription = value; })} />
            <TextInput label="Apoio rápido" value={current.info.quickSupportDescription} maxLength={220} textarea onChange={(value) => update((draft) => { draft.info.quickSupportDescription = value; })} />
          </div>
          <DeveloperCmsAccordion
            items={current.info.indicators}
            openIndex={openIndex}
            onOpenChange={setOpenIndex}
            getEyebrow={(_, index) => `Indicador ${index + 1}`}
            getTitle={(item) => `${item.value} - ${item.description}`}
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
            renderItem={(item, index) => (
              <div className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <TextInput label="Cargo" value={item.title} maxLength={90} onChange={(value) => update((draft) => { draft.jobs[index].title = value; })} />
                  <TextInput label="Localidade" value={item.location} maxLength={90} onChange={(value) => update((draft) => { draft.jobs[index].location = value; })} />
                  <TextInput label="Tipo" value={item.type} maxLength={40} onChange={(value) => update((draft) => { draft.jobs[index].type = value; })} />
                  <TextInput label="Link candidatura" value={item.applyUrl} maxLength={600} onChange={(value) => update((draft) => { draft.jobs[index].applyUrl = value; })} />
                  <TextInput label="Descrição curta" value={item.description} maxLength={220} textarea onChange={(value) => update((draft) => { draft.jobs[index].description = value; })} />
                </div>
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
            openIndex={openIndex}
            onOpenChange={setOpenIndex}
            getEyebrow={(_, index) => `Canal ${index + 1}`}
            getTitle={(item) => item.title || "Canal sem titulo"}
            renderItem={(item, index) => (
              <div className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <DeveloperField label="Icone">
                    <select value={item.icon} onChange={(event) => update((draft) => { draft.otherChannels[index].icon = event.target.value; })} className={developerInputClassName}>
                      {QUOTE_ICON_OPTIONS.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
                    </select>
                  </DeveloperField>
                  <DeveloperColorField label="Cor do icone" value={item.iconColor} onChange={(value) => update((draft) => { draft.otherChannels[index].iconColor = value; })} />
                  <TextInput label="Título" value={item.title} maxLength={90} onChange={(value) => update((draft) => { draft.otherChannels[index].title = value; })} />
                  <TextInput label="Descrição" value={item.description} maxLength={220} textarea onChange={(value) => update((draft) => { draft.otherChannels[index].description = value; })} />
                  <DeveloperColorField label="Cor do botão" value={item.buttonColor} onChange={(value) => update((draft) => { draft.otherChannels[index].buttonColor = value; })} />
                </div>
                <ButtonFields buttons={[item.button]} labels={["Botao"]} max={1} onChange={(buttons) => update((draft) => { draft.otherChannels[index].button = buttons[0]; })} />
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
