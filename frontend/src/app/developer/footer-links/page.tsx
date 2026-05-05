"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowSquareOut, ArrowUp, CheckCircle, Plus, Trash } from "@phosphor-icons/react";
import { useApiRequest } from "@/hooks/useApiRequest";
import { api, site } from "@/lib/routes";
import { DEFAULT_FOOTER_LINKS } from "@/lib/footerLinksDefaults";
import type {
  FooterActionCard,
  FooterGlobalContent,
  FooterLinkColumn,
  FooterLinkItem,
  FooterLinksContent,
  FooterLinksHelpContent,
  FooterLinksPrivacyContent,
  FooterLinksTermsContent,
  FooterSocialLink,
  FooterTextBlock,
  PageButton,
  PageFaqItem,
} from "@/types/content";
import {
  DeveloperCard,
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
import { DeveloperCmsAccordion } from "@/components/developer/DeveloperCmsAccordion";
import { cn } from "@/lib/utils";

type SectionKey = "footer" | "terms" | "help" | "privacy";

const panelClassName =
  "rounded-[22px] border border-[var(--border)]/80 bg-slate-50/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] sm:p-5";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next.map((entry, orderIndex) => ({ ...(entry as object), order: orderIndex + 1 })) as T[];
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

function TextInput({
  label,
  value,
  onChange,
  maxLength,
  textarea,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  textarea?: boolean;
  required?: boolean;
}) {
  return (
    <DeveloperField label={label} required={required}>
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

function ButtonFields({
  button,
  onChange,
  label = "Botão",
}: {
  button: PageButton;
  onChange: (button: PageButton) => void;
  label?: string;
}) {
  return (
    <div className={cn(panelClassName, "grid gap-5 md:grid-cols-2")}>
      <TextInput label={`${label} - texto`} value={button.label} maxLength={60} onChange={(value) => onChange({ ...button, label: value })} />
      <DeveloperField label={`${label} - link`} required>
        <input value={button.url} onChange={(event) => onChange({ ...button, url: event.target.value })} className={developerInputClassName} />
      </DeveloperField>
    </div>
  );
}

function LinkItemFields({
  item,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
  extra,
}: {
  item: FooterLinkItem | FooterSocialLink;
  onChange: (item: FooterLinkItem | FooterSocialLink) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  extra?: ReactNode;
}) {
  return (
    <div className={cn(panelClassName, "space-y-4")}>
      <div className="grid gap-4 md:grid-cols-2">
        <TextInput label="Texto" value={item.label} maxLength={60} onChange={(value) => onChange({ ...item, label: value })} />
        <DeveloperField label="Link" required>
          <input value={item.url} onChange={(event) => onChange({ ...item, url: event.target.value })} className={developerInputClassName} />
        </DeveloperField>
        {extra}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onMoveUp} className={developerGhostButtonClassName}><ArrowUp size={16} weight="bold" />Subir</button>
        <button type="button" onClick={onMoveDown} className={developerGhostButtonClassName}><ArrowDown size={16} weight="bold" />Descer</button>
        <button type="button" onClick={onRemove} className={developerDangerButtonClassName}><Trash size={16} weight="bold" />Remover</button>
      </div>
    </div>
  );
}

function TextBlockEditor({
  blocks,
  onChange,
  max = 20,
  fixed = false,
  titleLabel = "Título",
  descriptionLabel = "Descrição",
}: {
  blocks: FooterTextBlock[];
  onChange: (blocks: FooterTextBlock[]) => void;
  max?: number;
  fixed?: boolean;
  titleLabel?: string;
  descriptionLabel?: string;
}) {
  return (
    <div className="space-y-4">
      {!fixed && blocks.length < max ? (
        <button
          type="button"
          onClick={() => onChange([...blocks, { id: createId("footer-block"), order: blocks.length + 1, title: "", description: "" }])}
          className={developerSecondaryButtonClassName}
        >
          <Plus size={16} weight="bold" />
          Novo bloco
        </button>
      ) : null}
      {blocks.map((block, index) => (
        <div key={block.id} className={cn(panelClassName, "space-y-4")}>
          <div className="grid gap-5 md:grid-cols-2">
            <TextInput label={titleLabel} value={block.title} maxLength={180} onChange={(value) => {
              const next = [...blocks];
              next[index] = { ...block, title: value };
              onChange(next);
            }} />
            <TextInput label={descriptionLabel} value={block.description} maxLength={700} textarea onChange={(value) => {
              const next = [...blocks];
              next[index] = { ...block, description: value };
              onChange(next);
            }} />
          </div>
          {!fixed ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => onChange(moveItem(blocks, index, -1))} className={developerGhostButtonClassName}><ArrowUp size={16} weight="bold" />Subir</button>
              <button type="button" onClick={() => onChange(moveItem(blocks, index, 1))} className={developerGhostButtonClassName}><ArrowDown size={16} weight="bold" />Descer</button>
              <button type="button" onClick={() => onChange(blocks.filter((_, blockIndex) => blockIndex !== index))} className={developerDangerButtonClassName}><Trash size={16} weight="bold" />Remover</button>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default function FooterLinksCmsPage() {
  const { apiRequest } = useApiRequest();
  const [content, setContent] = useState<FooterLinksContent>(DEFAULT_FOOTER_LINKS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<SectionKey | "">("");
  const [status, setStatus] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      const response = await apiRequest<{ footerLinks?: FooterLinksContent }>(api.admin.footerLinks);
      if (!alive) return;
      if (response.success) {
        setContent(response.data?.footerLinks ?? DEFAULT_FOOTER_LINKS);
        setStatus(null);
      } else {
        setStatus({ tone: "error", text: response.error ?? "Falha ao carregar FOOTER LINKS." });
      }
      setLoading(false);
    }

    void load();

    return () => {
      alive = false;
    };
  }, [apiRequest]);

  const stats = useMemo(
    () => [
      { label: "Colunas", value: content.footer.columns.length },
      { label: "FAQ", value: content.help.faq.items.length },
      { label: "Privacidade", value: content.privacy.dataSection.blocks.length },
    ],
    [content]
  );

  function update(mutator: (draft: FooterLinksContent) => void) {
    setContent((current) => {
      const next = clone(current);
      mutator(next);
      return next;
    });
  }

  async function saveSection(sectionKey: SectionKey, payload: FooterGlobalContent | FooterLinksTermsContent | FooterLinksHelpContent | FooterLinksPrivacyContent) {
    setSaving(sectionKey);
    setStatus(null);
    const response = await apiRequest<{ footerLinks?: FooterLinksContent }>(
      api.admin.footerLinksSection(sectionKey),
      {
        method: "PUT",
        body: JSON.stringify(payload),
      }
    );
    setSaving("");
    if (!response.success) {
      setStatus({ tone: "error", text: response.error ?? "Falha ao salvar seção." });
      return;
    }
    setContent(response.data?.footerLinks ?? content);
    setStatus({ tone: "success", text: "FOOTER LINKS salvo com sucesso." });
  }

  return (
    <DeveloperPage>
      <DeveloperHero
        eyebrow="FOOTER LINKS"
        title="Links e páginas do rodapé."
        description="Controle central do footer global, Termos de Uso, Central de Ajuda e Privacidade."
        stats={stats}
        actions={
          <Link href={site.home} className={developerSecondaryButtonClassName}>
            <ArrowSquareOut size={16} weight="bold" />
            Ver site
          </Link>
        }
      />

      {loading ? <div className="mt-5"><DeveloperMessage tone="info">Carregando...</DeveloperMessage></div> : null}
      {status ? <div className="mt-5"><DeveloperMessage tone={status.tone}>{status.text}</DeveloperMessage></div> : null}

      <div className="mt-5 grid gap-5">
        <InstitutionalPagesStep
          content={content}
          onChange={(mutator) => update(mutator)}
          onSave={saveSection}
          saving={saving}
        />
        <FooterGlobalEditor
          footer={content.footer}
          onChange={(footer) => update((draft) => { draft.footer = footer; })}
          onSave={() => saveSection("footer", content.footer)}
          saving={saving === "footer"}
        />
        <FooterSocialEditor
          footer={content.footer}
          onChange={(footer) => update((draft) => { draft.footer = footer; })}
          onSave={() => saveSection("footer", content.footer)}
          saving={saving === "footer"}
        />
      </div>
    </DeveloperPage>
  );
}

function InstitutionalPagesStep({
  content,
  onChange,
  onSave,
  saving,
}: {
  content: FooterLinksContent;
  onChange: (mutator: (draft: FooterLinksContent) => void) => void;
  onSave: (sectionKey: SectionKey, payload: FooterGlobalContent | FooterLinksTermsContent | FooterLinksHelpContent | FooterLinksPrivacyContent) => void;
  saving: SectionKey | "";
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const items = [
    { key: "terms", eyebrow: "Termos de Uso", title: "Página /termos-de-uso" },
    { key: "help", eyebrow: "Central de Ajuda", title: "Página /central-ajuda" },
    { key: "privacy", eyebrow: "Privacidade", title: "Página /privacidade" },
  ];

  return (
    <DeveloperCard className="p-5 sm:p-6">
      <DeveloperSectionHeading
        eyebrow="Etapa 1"
        title="Páginas institucionais"
        description="Edite as páginas acessadas pelo rodapé sem deixar todos os campos abertos ao mesmo tempo."
      />
      <DeveloperCmsAccordion
        items={items}
        openIndex={openIndex}
        onOpenChange={setOpenIndex}
        getEyebrow={(item) => item.eyebrow}
        getTitle={(item) => item.title}
        renderItem={(item) => {
          if (item.key === "terms") {
            return (
              <TermsEditor
                embedded
                terms={content.terms}
                onChange={(terms) => onChange((draft) => { draft.terms = terms; })}
                onSave={() => onSave("terms", content.terms)}
                saving={saving === "terms"}
              />
            );
          }

          if (item.key === "help") {
            return (
              <HelpEditor
                embedded
                help={content.help}
                onChange={(help) => onChange((draft) => { draft.help = help; })}
                onSave={() => onSave("help", content.help)}
                saving={saving === "help"}
              />
            );
          }

          return (
            <PrivacyEditor
              embedded
              privacy={content.privacy}
              onChange={(privacy) => onChange((draft) => { draft.privacy = privacy; })}
              onSave={() => onSave("privacy", content.privacy)}
              saving={saving === "privacy"}
            />
          );
        }}
      />
    </DeveloperCard>
  );
}

function FooterGlobalEditor({
  footer,
  onChange,
  onSave,
  saving,
}: {
  footer: FooterGlobalContent;
  onChange: (footer: FooterGlobalContent) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const items = [
    { key: "general", eyebrow: "Links gerais", title: "Chamadas, colunas, links institucionais e horários" },
  ];

  function updateColumn(index: number, column: FooterLinkColumn) {
    const columns = [...footer.columns];
    columns[index] = column;
    onChange({ ...footer, columns });
  }

  return (
    <DeveloperCard className="p-5 sm:p-6">
      <DeveloperSectionHeading eyebrow="Etapa 2" title="Links gerais do footer" description="Chamadas, Sua Voz, links institucionais e horários ficam agrupados em acordeão." />
      <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); onSave(); }}>
        <DeveloperCmsAccordion
          items={items}
          openIndex={openIndex}
          onOpenChange={setOpenIndex}
          getEyebrow={(item) => item.eyebrow}
          getTitle={(item) => item.title}
          renderItem={() => (
            <div className="space-y-5">
        <div className={cn(panelClassName, "grid gap-5 md:grid-cols-2")}>
          <TextInput label="Descrição" value={footer.description} maxLength={260} textarea onChange={(value) => onChange({ ...footer, description: value })} />
          <TextInput label="Texto de copyright" value={footer.copyrightText} maxLength={160} onChange={(value) => onChange({ ...footer, copyrightText: value })} />
          <TextInput label="Texto de localização" value={footer.locationText} maxLength={120} onChange={(value) => onChange({ ...footer, locationText: value })} />
          <TextInput label="Crédito" value={footer.creditText} maxLength={120} onChange={(value) => onChange({ ...footer, creditText: value })} />
          <DeveloperField label="Link do crédito" required>
            <input value={footer.creditUrl} onChange={(event) => onChange({ ...footer, creditUrl: event.target.value })} className={developerInputClassName} />
          </DeveloperField>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <ButtonFields button={footer.proposalButton} label="Receber proposta" onChange={(button) => onChange({ ...footer, proposalButton: button })} />
          <ButtonFields button={footer.supportButton} label="Falar com atendimento" onChange={(button) => onChange({ ...footer, supportButton: button })} />
        </div>

        <DeveloperSectionHeading
          title="Colunas de links"
          action={
            <button type="button" onClick={() => onChange({ ...footer, columns: [...footer.columns, { id: createId("footer-column"), order: footer.columns.length + 1, title: "Nova coluna", links: [] }] })} className={developerSecondaryButtonClassName}>
              <Plus size={16} weight="bold" />
              Nova coluna
            </button>
          }
        />
        {footer.columns.map((column, columnIndex) => (
          <div key={column.id} className={cn(panelClassName, "space-y-4")}>
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <TextInput label="Título da coluna" value={column.title} maxLength={80} onChange={(value) => updateColumn(columnIndex, { ...column, title: value })} />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => onChange({ ...footer, columns: moveItem(footer.columns, columnIndex, -1) })} className={developerGhostButtonClassName}><ArrowUp size={16} weight="bold" />Subir</button>
                <button type="button" onClick={() => onChange({ ...footer, columns: moveItem(footer.columns, columnIndex, 1) })} className={developerGhostButtonClassName}><ArrowDown size={16} weight="bold" />Descer</button>
                <button type="button" onClick={() => onChange({ ...footer, columns: footer.columns.filter((_, index) => index !== columnIndex) })} className={developerDangerButtonClassName}><Trash size={16} weight="bold" />Remover</button>
              </div>
            </div>
            <button type="button" onClick={() => updateColumn(columnIndex, { ...column, links: [...column.links, { id: createId("footer-link"), order: column.links.length + 1, label: "", url: site.home }] })} className={developerSecondaryButtonClassName}>
              <Plus size={16} weight="bold" />
              Novo link
            </button>
            {column.links.map((link, linkIndex) => (
              <LinkItemFields
                key={link.id}
                item={link}
                onChange={(item) => {
                  const links = [...column.links];
                  links[linkIndex] = item as FooterLinkItem;
                  updateColumn(columnIndex, { ...column, links });
                }}
                onMoveUp={() => updateColumn(columnIndex, { ...column, links: moveItem(column.links, linkIndex, -1) })}
                onMoveDown={() => updateColumn(columnIndex, { ...column, links: moveItem(column.links, linkIndex, 1) })}
                onRemove={() => updateColumn(columnIndex, { ...column, links: column.links.filter((_, index) => index !== linkIndex) })}
              />
            ))}
          </div>
        ))}

        <DeveloperSectionHeading
          title="Links inferiores"
          action={
            <button type="button" onClick={() => onChange({ ...footer, bottomLinks: [...footer.bottomLinks, { id: createId("footer-bottom-link"), order: footer.bottomLinks.length + 1, label: "", url: site.home }] })} className={developerSecondaryButtonClassName}>
              <Plus size={16} weight="bold" />
              Novo link inferior
            </button>
          }
        />
        {footer.bottomLinks.map((link, index) => (
          <LinkItemFields
            key={link.id}
            item={link}
            onChange={(item) => {
              const bottomLinks = [...footer.bottomLinks];
              bottomLinks[index] = item as FooterLinkItem;
              onChange({ ...footer, bottomLinks });
            }}
            onMoveUp={() => onChange({ ...footer, bottomLinks: moveItem(footer.bottomLinks, index, -1) })}
            onMoveDown={() => onChange({ ...footer, bottomLinks: moveItem(footer.bottomLinks, index, 1) })}
            onRemove={() => onChange({ ...footer, bottomLinks: footer.bottomLinks.filter((_, itemIndex) => itemIndex !== index) })}
          />
        ))}

        <div className={cn(panelClassName, "space-y-4")}>
          <TextInput label="Título dos horários" value={footer.serviceHoursTitle} maxLength={80} onChange={(value) => onChange({ ...footer, serviceHoursTitle: value })} />
          {footer.serviceHours.map((hour, index) => (
            <div key={index} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <TextInput label={`Horário ${index + 1}`} value={hour} maxLength={220} onChange={(value) => {
                const serviceHours = [...footer.serviceHours];
                serviceHours[index] = value;
                onChange({ ...footer, serviceHours });
              }} />
              <button type="button" onClick={() => onChange({ ...footer, serviceHours: footer.serviceHours.filter((_, itemIndex) => itemIndex !== index) })} className={developerDangerButtonClassName}>
                <Trash size={16} weight="bold" />
                Remover
              </button>
            </div>
          ))}
          {footer.serviceHours.length < 5 ? (
            <button type="button" onClick={() => onChange({ ...footer, serviceHours: [...footer.serviceHours, ""] })} className={developerSecondaryButtonClassName}>
              <Plus size={16} weight="bold" />
              Novo horário
            </button>
          ) : null}
        </div>

        {false ? (
        <div className={cn(panelClassName, "space-y-4")}>
          <TextInput label="Título das redes sociais" value={footer.socialTitle} maxLength={80} onChange={(value) => onChange({ ...footer, socialTitle: value })} />
          <button type="button" onClick={() => onChange({ ...footer, socialLinks: [...footer.socialLinks, { id: createId("social-link"), order: footer.socialLinks.length + 1, icon: "InstagramLogo", label: "", url: "#" }] })} className={developerSecondaryButtonClassName}>
            <Plus size={16} weight="bold" />
            Nova rede
          </button>
          {footer.socialLinks.map((link, index) => (
            <LinkItemFields
              key={link.id}
              item={link}
              onChange={(item) => {
                const socialLinks = [...footer.socialLinks];
                socialLinks[index] = item as FooterSocialLink;
                onChange({ ...footer, socialLinks });
              }}
              onMoveUp={() => onChange({ ...footer, socialLinks: moveItem(footer.socialLinks, index, -1) })}
              onMoveDown={() => onChange({ ...footer, socialLinks: moveItem(footer.socialLinks, index, 1) })}
              onRemove={() => onChange({ ...footer, socialLinks: footer.socialLinks.filter((_, itemIndex) => itemIndex !== index) })}
              extra={
                <TextInput label="Ícone" value={link.icon} maxLength={40} onChange={(value) => {
                  const socialLinks = [...footer.socialLinks];
                  socialLinks[index] = { ...link, icon: value };
                  onChange({ ...footer, socialLinks });
                }} />
              }
            />
          ))}
        </div>
        ) : null}
            </div>
          )}
        />

        <SaveButton saving={saving}>Salvar links gerais</SaveButton>
      </form>
    </DeveloperCard>
  );
}

function FooterSocialEditor({
  footer,
  onChange,
  onSave,
  saving,
}: {
  footer: FooterGlobalContent;
  onChange: (footer: FooterGlobalContent) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const items = [
    { key: "social", eyebrow: "Redes sociais", title: "Instagram, LinkedIn, Facebook e links externos" },
  ];

  return (
    <DeveloperCard className="p-5 sm:p-6">
      <DeveloperSectionHeading
        eyebrow="Etapa 3"
        title="Redes sociais"
        description="Controle os links externos do footer em uma área própria."
      />
      <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); onSave(); }}>
        <DeveloperCmsAccordion
          items={items}
          openIndex={openIndex}
          onOpenChange={setOpenIndex}
          getEyebrow={(item) => item.eyebrow}
          getTitle={(item) => item.title}
          renderItem={() => (
            <div className={cn(panelClassName, "space-y-4")}>
              <TextInput label="Título das redes sociais" value={footer.socialTitle} maxLength={80} onChange={(value) => onChange({ ...footer, socialTitle: value })} />
              <button type="button" onClick={() => onChange({ ...footer, socialLinks: [...footer.socialLinks, { id: createId("social-link"), order: footer.socialLinks.length + 1, icon: "InstagramLogo", label: "", url: "#" }] })} className={developerSecondaryButtonClassName}>
                <Plus size={16} weight="bold" />
                Nova rede
              </button>
              {footer.socialLinks.map((link, index) => (
                <LinkItemFields
                  key={link.id}
                  item={link}
                  onChange={(item) => {
                    const socialLinks = [...footer.socialLinks];
                    socialLinks[index] = item as FooterSocialLink;
                    onChange({ ...footer, socialLinks });
                  }}
                  onMoveUp={() => onChange({ ...footer, socialLinks: moveItem(footer.socialLinks, index, -1) })}
                  onMoveDown={() => onChange({ ...footer, socialLinks: moveItem(footer.socialLinks, index, 1) })}
                  onRemove={() => onChange({ ...footer, socialLinks: footer.socialLinks.filter((_, itemIndex) => itemIndex !== index) })}
                  extra={
                    <TextInput label="Ícone" value={link.icon} maxLength={40} onChange={(value) => {
                      const socialLinks = [...footer.socialLinks];
                      socialLinks[index] = { ...link, icon: value };
                      onChange({ ...footer, socialLinks });
                    }} />
                  }
                />
              ))}
            </div>
          )}
        />
        <SaveButton saving={saving}>Salvar redes sociais</SaveButton>
      </form>
    </DeveloperCard>
  );
}

function EditorShell({ embedded, children }: { embedded: boolean; children: ReactNode }) {
  if (embedded) {
    return <div className="space-y-5">{children}</div>;
  }

  return <DeveloperCard className="p-5 sm:p-6">{children}</DeveloperCard>;
}

function TermsEditor({
  terms,
  onChange,
  onSave,
  saving,
  embedded = false,
}: {
  terms: FooterLinksTermsContent;
  onChange: (terms: FooterLinksTermsContent) => void;
  onSave: () => void;
  saving: boolean;
  embedded?: boolean;
}) {
  return (
    <EditorShell embedded={embedded}>
      <DeveloperSectionHeading eyebrow="Termos de Uso" title="Página /termos-de-uso" />
      <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); onSave(); }}>
        <HeroFields hero={terms.hero} onChange={(hero) => onChange({ ...terms, hero })} />
        <div className={cn(panelClassName, "grid gap-5 md:grid-cols-2")}>
          <TextInput label="Eyebrow do resumo" value={terms.summary.eyebrow} maxLength={80} onChange={(value) => onChange({ ...terms, summary: { ...terms.summary, eyebrow: value } })} />
          <TextInput label="Título do resumo" value={terms.summary.title} maxLength={180} onChange={(value) => onChange({ ...terms, summary: { ...terms.summary, title: value } })} />
          <TextInput label="Descrição do resumo" value={terms.summary.description} maxLength={260} textarea onChange={(value) => onChange({ ...terms, summary: { ...terms.summary, description: value } })} />
          <TextInput label="Texto de apoio" value={terms.summary.body} maxLength={500} textarea onChange={(value) => onChange({ ...terms, summary: { ...terms.summary, body: value } })} />
        </div>
        <ButtonFields button={terms.summary.button} label="Botão da primeira seção" onChange={(button) => onChange({ ...terms, summary: { ...terms.summary, button } })} />
        <SectionHeaderFields section={terms.reading} onChange={(reading) => onChange({ ...terms, reading: { ...terms.reading, ...reading } })} />
        <TextBlockEditor blocks={terms.reading.blocks} onChange={(blocks) => onChange({ ...terms, reading: { ...terms.reading, blocks } })} />
        <FinalCtaFields finalCta={terms.finalCta} onChange={(finalCta) => onChange({ ...terms, finalCta })} />
        <SaveButton saving={saving}>Salvar Termos</SaveButton>
      </form>
    </EditorShell>
  );
}

function HelpEditor({
  help,
  onChange,
  onSave,
  saving,
  embedded = false,
}: {
  help: FooterLinksHelpContent;
  onChange: (help: FooterLinksHelpContent) => void;
  onSave: () => void;
  saving: boolean;
  embedded?: boolean;
}) {
  return (
    <EditorShell embedded={embedded}>
      <DeveloperSectionHeading eyebrow="Central de Ajuda" title="Página /central-ajuda" />
      <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); onSave(); }}>
        <HeroFields hero={help.hero} onChange={(hero) => onChange({ ...help, hero: { ...help.hero, ...hero } })} buttons onButtonsChange={(buttons) => onChange({ ...help, hero: { ...help.hero, buttons } })} />
        <SectionHeaderFields section={help.quickAccess} onChange={(quickAccess) => onChange({ ...help, quickAccess: { ...help.quickAccess, ...quickAccess } })} />
        {help.quickAccess.actions.map((action, index) => (
          <ActionCardFields
            key={action.id}
            action={action}
            label={`Ação rápida ${index + 1}`}
            onChange={(nextAction) => {
              const actions = [...help.quickAccess.actions];
              actions[index] = nextAction;
              onChange({ ...help, quickAccess: { ...help.quickAccess, actions } });
            }}
          />
        ))}
        <div className={cn(panelClassName, "grid gap-5 md:grid-cols-2")}>
          <TextInput label="Telefone" value={help.contactCard.phone} maxLength={80} onChange={(value) => onChange({ ...help, contactCard: { ...help.contactCard, phone: value } })} />
          <TextInput label="Horário" value={help.contactCard.hours} maxLength={180} onChange={(value) => onChange({ ...help, contactCard: { ...help.contactCard, hours: value } })} />
          {help.contactCard.channelDescriptions.slice(0, 3).map((description, index) => (
            <TextInput key={index} label={`Descrição de canal ${index + 1}`} value={description} maxLength={220} textarea onChange={(value) => {
              const channelDescriptions = [...help.contactCard.channelDescriptions];
              channelDescriptions[index] = value;
              onChange({ ...help, contactCard: { ...help.contactCard, channelDescriptions } });
            }} />
          ))}
        </div>
        <SectionHeaderFields section={help.faq} onChange={(faq) => onChange({ ...help, faq: { ...help.faq, ...faq } })} />
        <FaqEditor items={help.faq.items} onChange={(items) => onChange({ ...help, faq: { ...help.faq, items } })} />
        <div className={cn(panelClassName, "grid gap-5 md:grid-cols-2")}>
          <TextInput label="Eyebrow do suporte final" value={help.finalSupport.eyebrow} maxLength={80} onChange={(value) => onChange({ ...help, finalSupport: { ...help.finalSupport, eyebrow: value } })} />
          <TextInput label="Título do suporte final" value={help.finalSupport.title} maxLength={180} onChange={(value) => onChange({ ...help, finalSupport: { ...help.finalSupport, title: value } })} />
          <TextInput label="Descrição do suporte final" value={help.finalSupport.description} maxLength={260} textarea onChange={(value) => onChange({ ...help, finalSupport: { ...help.finalSupport, description: value } })} />
        </div>
        <ButtonFields button={help.finalSupport.button} label="Botão de suporte" onChange={(button) => onChange({ ...help, finalSupport: { ...help.finalSupport, button } })} />
        <SaveButton saving={saving}>Salvar Central de Ajuda</SaveButton>
      </form>
    </EditorShell>
  );
}

function PrivacyEditor({
  privacy,
  onChange,
  onSave,
  saving,
  embedded = false,
}: {
  privacy: FooterLinksPrivacyContent;
  onChange: (privacy: FooterLinksPrivacyContent) => void;
  onSave: () => void;
  saving: boolean;
  embedded?: boolean;
}) {
  return (
    <EditorShell embedded={embedded}>
      <DeveloperSectionHeading eyebrow="Privacidade" title="Página /privacidade" />
      <form className="space-y-5" onSubmit={(event) => { event.preventDefault(); onSave(); }}>
        <HeroFields hero={privacy.hero} onChange={(hero) => onChange({ ...privacy, hero: { ...privacy.hero, ...hero } })} button={privacy.hero.button} onButtonChange={(button) => onChange({ ...privacy, hero: { ...privacy.hero, button } })} />
        <SectionHeaderFields section={privacy.dataSection} onChange={(dataSection) => onChange({ ...privacy, dataSection: { ...privacy.dataSection, ...dataSection } })} />
        <TextBlockEditor blocks={privacy.dataSection.blocks} max={5} onChange={(blocks) => onChange({ ...privacy, dataSection: { ...privacy.dataSection, blocks } })} />
        <FinalCtaFields finalCta={privacy.finalCta} onChange={(finalCta) => onChange({ ...privacy, finalCta })} />
        <SaveButton saving={saving}>Salvar Privacidade</SaveButton>
      </form>
    </EditorShell>
  );
}

function HeroFields({
  hero,
  onChange,
  button,
  onButtonChange,
  buttons,
  onButtonsChange,
}: {
  hero: { eyebrow: string; titleHighlight: string; titleRest: string; description: string };
  onChange: (hero: { eyebrow: string; titleHighlight: string; titleRest: string; description: string }) => void;
  button?: PageButton;
  onButtonChange?: (button: PageButton) => void;
  buttons?: boolean;
  onButtonsChange?: (buttons: PageButton[]) => void;
}) {
  const heroButtons = "buttons" in hero ? (hero as { buttons?: PageButton[] }).buttons ?? [] : [];
  return (
    <div className="space-y-5">
      <div className={cn(panelClassName, "grid gap-5 md:grid-cols-2")}>
        <TextInput label="Eyebrow" value={hero.eyebrow} maxLength={80} onChange={(value) => onChange({ ...hero, eyebrow: value })} />
        <TextInput label="Título em destaque" value={hero.titleHighlight} maxLength={90} onChange={(value) => onChange({ ...hero, titleHighlight: value })} />
        <TextInput label="Título complementar" value={hero.titleRest} maxLength={90} onChange={(value) => onChange({ ...hero, titleRest: value })} />
        <TextInput label="Descrição" value={hero.description} maxLength={260} textarea onChange={(value) => onChange({ ...hero, description: value })} />
      </div>
      {button && onButtonChange ? <ButtonFields button={button} label="Botão do hero" onChange={onButtonChange} /> : null}
      {buttons && onButtonsChange ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {heroButtons.slice(0, 2).map((item, index) => (
            <ButtonFields
              key={index}
              button={item}
              label={`Botão do hero ${index + 1}`}
              onChange={(nextButton) => {
                const next = [...heroButtons];
                next[index] = nextButton;
                onButtonsChange(next);
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SectionHeaderFields({
  section,
  onChange,
}: {
  section: { eyebrow: string; title: string; description: string };
  onChange: (section: { eyebrow: string; title: string; description: string }) => void;
}) {
  return (
    <div className={cn(panelClassName, "grid gap-5 md:grid-cols-3")}>
      <TextInput label="Eyebrow" value={section.eyebrow} maxLength={80} onChange={(value) => onChange({ ...section, eyebrow: value })} />
      <TextInput label="Título" value={section.title} maxLength={220} onChange={(value) => onChange({ ...section, title: value })} />
      <TextInput label="Descrição" value={section.description} maxLength={280} textarea onChange={(value) => onChange({ ...section, description: value })} />
    </div>
  );
}

function FinalCtaFields({
  finalCta,
  onChange,
}: {
  finalCta: { title: string; description: string; buttons: PageButton[] };
  onChange: (finalCta: { title: string; description: string; buttons: PageButton[] }) => void;
}) {
  return (
    <div className="space-y-5">
      <div className={cn(panelClassName, "grid gap-5 md:grid-cols-2")}>
        <TextInput label="Título CTA final" value={finalCta.title} maxLength={180} onChange={(value) => onChange({ ...finalCta, title: value })} />
        <TextInput label="Descrição CTA final" value={finalCta.description} maxLength={320} textarea onChange={(value) => onChange({ ...finalCta, description: value })} />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {finalCta.buttons.slice(0, 2).map((button, index) => (
          <ButtonFields
            key={index}
            button={button}
            label={`Botão final ${index + 1}`}
            onChange={(nextButton) => {
              const buttons = [...finalCta.buttons];
              buttons[index] = nextButton;
              onChange({ ...finalCta, buttons });
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ActionCardFields({
  action,
  label,
  onChange,
}: {
  action: FooterActionCard;
  label: string;
  onChange: (action: FooterActionCard) => void;
}) {
  return (
    <div className={cn(panelClassName, "space-y-5")}>
      <DeveloperSectionHeading title={label} />
      <div className="grid gap-5 md:grid-cols-3">
        <TextInput label="Ícone" value={action.icon} maxLength={40} onChange={(value) => onChange({ ...action, icon: value })} />
        <TextInput label="Título" value={action.title} maxLength={180} onChange={(value) => onChange({ ...action, title: value })} />
        <TextInput label="Descrição" value={action.description} maxLength={260} textarea onChange={(value) => onChange({ ...action, description: value })} />
      </div>
      <ButtonFields button={action.button} label="Botão" onChange={(button) => onChange({ ...action, button })} />
    </div>
  );
}

function FaqEditor({
  items,
  onChange,
}: {
  items: PageFaqItem[];
  onChange: (items: PageFaqItem[]) => void;
}) {
  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={item.id} className={cn(panelClassName, "grid gap-5 md:grid-cols-2")}>
          <TextInput label={`Pergunta fixa ${index + 1}`} value={item.question} maxLength={180} onChange={(value) => {
            const next = [...items];
            next[index] = { ...item, question: value };
            onChange(next);
          }} />
          <TextInput label="Resposta" value={item.answer} maxLength={320} textarea onChange={(value) => {
            const next = [...items];
            next[index] = { ...item, answer: value };
            onChange(next);
          }} />
        </div>
      ))}
    </div>
  );
}
