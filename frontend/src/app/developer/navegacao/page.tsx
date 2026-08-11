"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle, Plus, Trash } from "@phosphor-icons/react";
import { DeveloperCard, DeveloperField, DeveloperHero, DeveloperMessage, DeveloperPage, DeveloperSectionHeading, developerDangerButtonClassName, developerGhostButtonClassName, developerInputClassName, developerPrimaryButtonClassName, developerSecondaryButtonClassName } from "@/components/developer/ui";
import { DeveloperCmsAccordion } from "@/components/developer/DeveloperCmsAccordion";
import { useApiRequest } from "@/hooks/useApiRequest";
import { DEFAULT_HEADER_NAVIGATION } from "@/lib/headerNavigationDefaults";
import { api } from "@/lib/routes";
import type { HeaderNavigationContent, HeaderNavigationItem, NavigationHighlightTone } from "@/types/content";

const icons = [["home", "Início"], ["services", "Serviços"], ["about", "Informação"], ["business", "Empresas"], ["contact", "Contato"], ["careers", "Carreiras"], ["quote", "Cotação"], ["collections", "Coletas"], ["voice", "Sua voz"], ["improvements", "Melhoria"]] as const;
const tones: Array<[NavigationHighlightTone, string, string]> = [
  ["blue", "Azul institucional", "bg-blue-600"],
  ["emerald", "Verde", "bg-emerald-500"],
  ["amber", "Âmbar", "bg-amber-400"],
  ["violet", "Violeta", "bg-violet-500"],
];

export default function HeaderNavigationCmsPage() {
  const { apiRequest } = useApiRequest();
  const [content, setContent] = useState<HeaderNavigationContent>(DEFAULT_HEADER_NAVIGATION);
  const [saving, setSaving] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  useEffect(() => {
    apiRequest<{ headerNavigation?: HeaderNavigationContent }>(api.admin.headerNavigation).then((response) => {
      if (response.success && response.data?.headerNavigation) setContent(response.data.headerNavigation);
      else if (!response.success) setMessage({ type: "error", text: response.error ?? "Não foi possível carregar a navegação." });
    });
  }, [apiRequest]);

  const update = (index: number, patch: Partial<HeaderNavigationItem>) => setContent((current) => ({
    items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
  }));

  const moveTo = (index: number, target: number) => {
    const itemLabel = content.items[index]?.label;
    if (!itemLabel || target < 0 || target >= content.items.length || target === index) return;
    setContent((current) => {
    const items = [...current.items];
    const [item] = items.splice(index, 1);
    items.splice(target, 0, item);
    return { items: items.map((entry, itemIndex) => ({ ...entry, order: itemIndex + 1 })) };
    });
    setMessage({ type: "info", text: `“${itemLabel}” agora está na posição ${target + 1}. Salve para publicar a nova ordem.` });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const response = await apiRequest<{ headerNavigation?: HeaderNavigationContent }>(api.admin.headerNavigation, { method: "PUT", body: JSON.stringify(content) });
    setSaving(false);
    if (!response.success) return setMessage({ type: "error", text: response.error ?? "Não foi possível salvar." });
    setContent(response.data?.headerNavigation ?? content);
    setMessage({ type: "success", text: "Navegação salva. O menu lateral público já usa esta configuração." });
  };

  return <DeveloperPage>
    <DeveloperHero eyebrow="Estrutura do site" title="Navegação" description="Organize os links do menu lateral que o visitante abre pelo cabeçalho." stats={[{ label: "Itens", value: content.items.length }]} />
    <DeveloperCard>
      <DeveloperSectionHeading title="Barra de navegação" description="Defina nome, destino, grupo e destaque. Os controles Subir e Descer no cabeçalho organizam a ordem, mesmo com o item fechado." />
      {message ? <div className="mb-5" aria-live="polite"><DeveloperMessage tone={message.type}>{message.text}</DeveloperMessage></div> : null}
      <form className="space-y-4" onSubmit={save}>
        <DeveloperCmsAccordion
          items={content.items}
          openIndex={openIndex}
          onOpenChange={setOpenIndex}
          getEyebrow={(_, index) => `Item ${index + 1} · ${content.items[index]?.group === "principal" ? "Principal" : "Explorar"}`}
          getTitle={(item) => item.label || "Novo item"}
          renderActions={(item, index) => <div className="flex flex-wrap gap-2" role="group" aria-label={`Reorganizar ${item.label}`}>
            <button type="button" disabled={index === 0} className={developerGhostButtonClassName} onClick={() => moveTo(index, index - 1)}><ArrowUp size={16} /> Subir</button>
            <button type="button" disabled={index === content.items.length - 1} className={developerGhostButtonClassName} onClick={() => moveTo(index, index + 1)}><ArrowDown size={16} /> Descer</button>
            <button type="button" aria-label={`Remover ${item.label}`} disabled={content.items.length === 1} className={developerDangerButtonClassName} onClick={() => setContent((current) => ({ items: current.items.filter((_, itemIndex) => itemIndex !== index).map((entry, itemIndex) => ({ ...entry, order: itemIndex + 1 })) }))}><Trash size={16} /> Remover</button>
          </div>}
          renderItem={(item, index) => <>
          <div className="grid gap-4 md:grid-cols-2">
            <DeveloperField label="Nome" required><input required maxLength={60} value={item.label} onChange={(event) => update(index, { label: event.target.value })} className={developerInputClassName} /></DeveloperField>
            <DeveloperField label="Destino interno" required><input required pattern="/.*" maxLength={180} value={item.url} onChange={(event) => update(index, { url: event.target.value })} className={developerInputClassName} /></DeveloperField>
            <DeveloperField label="Grupo" required><select value={item.group} onChange={(event) => update(index, { group: event.target.value as HeaderNavigationItem["group"] })} className={developerInputClassName}><option value="principal">Principal</option><option value="explorar">Explorar</option></select></DeveloperField>
            <DeveloperField label="Ícone" required><select value={item.icon} onChange={(event) => update(index, { icon: event.target.value })} className={developerInputClassName}>{icons.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></DeveloperField>
            <DeveloperField label="Texto do destaque" className="md:col-span-2"><input maxLength={24} placeholder="Ex.: Novo, Destaque, Atualizado" value={item.highlightLabel ?? ""} onChange={(event) => update(index, { highlightLabel: event.target.value || undefined, highlightTone: event.target.value ? item.highlightTone ?? "blue" : undefined })} className={developerInputClassName} /></DeveloperField>
          </div>
          <div className="mt-4">
            <DeveloperField label="Cor do destaque" hint="Escolha a cor que será usada quando houver texto de destaque.">
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4" role="group" aria-label="Cor do destaque">
                {tones.map(([value, label, colorClassName]) => {
                  const selected = (item.highlightTone ?? "blue") === value;
                  return <button key={value} type="button" aria-pressed={selected} onClick={() => update(index, { highlightTone: value })} className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-left text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 ${selected ? "border-[var(--primary)] bg-[var(--color-primary-soft)] text-[var(--primary)]" : "border-[var(--border)] bg-white text-[var(--foreground)] hover:border-slate-400"}`}>
                    <span className={`h-4 w-4 shrink-0 rounded-full border border-black/10 ${colorClassName}`} aria-hidden="true" />
                    {label}
                  </button>;
                })}
              </div>
            </DeveloperField>
          </div>
          </>}
        />
        <div className="flex flex-wrap gap-3">
          <button type="button" className={developerSecondaryButtonClassName} onClick={() => setContent((current) => ({ items: [...current.items, { id: `nav-${Date.now()}`, order: current.items.length + 1, group: "explorar", label: "Novo item", url: "/", icon: "about" }] }))}><Plus size={18} /> Novo item</button>
          <button type="submit" disabled={saving} className={developerPrimaryButtonClassName}><CheckCircle size={18} />{saving ? "Salvando..." : "Salvar navegação"}</button>
        </div>
      </form>
    </DeveloperCard>
  </DeveloperPage>;
}
