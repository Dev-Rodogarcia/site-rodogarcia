"use client";

import { useState, type ChangeEvent } from "react";
import { Desktop, DeviceMobile, PencilSimple, Plus, Trash, UploadSimple, X } from "@phosphor-icons/react";

type EditorDialog = "theme" | "contacts" | "logo" | "background" | "content" | "highlights" | "lower-title" | "lower-description" | null;

type LandingPreview = {
  theme: { primaryColor: string; secondaryColor: string; backgroundColor: string; textColor: string };
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
};

export type LandingMedia = {
  id: string;
  url: string;
  kind: "image" | "video" | string;
  alt?: string;
  createdAt: string;
};

type MediaSlot = "logo" | "background";

const inputClass = "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-950 focus:ring-4 focus:ring-slate-950/10";

const dialogTitle: Record<Exclude<EditorDialog, null>, string> = {
  theme: "Cores da landing",
  contacts: "Faixa de contatos",
  logo: "Logo",
  background: "Foto de fundo",
  content: "Mensagem e botão do Hero",
  highlights: "Informações em destaque",
  "lower-title": "Título da seção",
  "lower-description": "Descrição da seção",
};

function isInternalMediaPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("\\");
}

function EditControl({ label, onClick, className = "" }: { label: string; onClick: () => void; className?: string }) {
  return <button type="button" onClick={onClick} title={label} aria-label={label} className={`absolute z-20 inline-flex size-8 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-950 shadow-md transition hover:scale-105 hover:bg-slate-950 hover:text-white focus:outline-none focus:ring-4 focus:ring-slate-950/15 ${className}`}><PencilSimple size={15} weight="bold" /></button>;
}

function LandingMediaPicker({
  slot,
  currentUrl,
  media,
  uploading,
  onSelect,
  onUpload,
  onDelete,
}: {
  slot: MediaSlot;
  currentUrl: string;
  media: LandingMedia[];
  uploading: boolean;
  onSelect: (url: string) => void;
  onUpload: (file: File) => Promise<void>;
  onDelete: (item: LandingMedia) => Promise<void>;
}) {
  const imageMedia = media.filter((item) => item.kind === "image");
  const label = slot === "logo" ? "logo" : "foto de fundo";

  async function uploadSelectedFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await onUpload(file);
  }

  return <div className="space-y-4">
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-sm font-semibold text-slate-800">Mídia própria da campanha</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">Escolha um arquivo já enviado ou envie uma imagem para esta landing. Links externos não são aceitos.</p>
      <label className={`mt-3 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-sm font-bold text-white transition hover:bg-slate-800 ${uploading ? "cursor-wait opacity-60" : ""}`}>
        <UploadSimple size={17} weight="bold" />
        {uploading ? "Enviando..." : "Enviar imagem"}
        <input type="file" accept="image/png,image/jpeg,image/webp,image/avif" disabled={uploading} onChange={(event) => void uploadSelectedFile(event)} className="sr-only" />
      </label>
    </div>

    {currentUrl && isInternalMediaPath(currentUrl) ? <div className="rounded-xl border border-[var(--primary)]/25 bg-[var(--primary)]/[0.05] p-3">
      <p className="text-xs font-semibold text-[var(--foreground)]">Selecionado para {label}</p>
      <img src={currentUrl} alt="Mídia selecionada" className="mt-2 h-24 w-full rounded-lg border border-slate-200 bg-white object-contain" />
      <button type="button" onClick={() => onSelect("")} className="mt-2 text-xs font-bold text-[var(--primary)] hover:underline">Remover desta área</button>
    </div> : null}

    <div>
      <p className="text-sm font-semibold text-slate-800">Biblioteca da campanha</p>
      {imageMedia.length === 0 ? <p className="mt-2 text-sm text-slate-500">Nenhuma imagem enviada para esta campanha ainda.</p> : <div className="mt-2 grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">
        {imageMedia.map((item) => {
          const selected = item.url === currentUrl;
          return <article key={item.id} className={`overflow-hidden rounded-xl border bg-white ${selected ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/15" : "border-slate-200"}`}>
            <button type="button" onClick={() => onSelect(item.url)} className="block w-full text-left" aria-pressed={selected}>
              <img src={item.url} alt={item.alt || "Imagem da campanha"} className="h-28 w-full bg-slate-100 object-cover" />
              <span className="block truncate px-2.5 py-2 text-xs font-semibold text-slate-700">{item.alt || "Imagem sem descrição"}</span>
            </button>
            <div className="flex items-center justify-between border-t border-slate-100 px-2.5 py-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{selected ? "Em uso" : "Selecionar"}</span>
              <button type="button" onClick={() => { if (window.confirm("Excluir este arquivo da biblioteca da campanha?")) void onDelete(item); }} className="inline-flex size-7 items-center justify-center rounded-md text-red-600 transition hover:bg-red-50" aria-label={`Excluir ${item.alt || "imagem"}`} title="Excluir arquivo">
                <Trash size={15} weight="bold" />
              </button>
            </div>
          </article>;
        })}
      </div>}
    </div>
  </div>;
}

export function LandingVisualEditor<T extends LandingPreview>({
  landing,
  media,
  uploadingMedia,
  onChange,
  onUploadMedia,
  onDeleteMedia,
}: {
  landing: T;
  media: LandingMedia[];
  uploadingMedia: boolean;
  onChange: (update: (current: T) => T) => void;
  onUploadMedia: (file: File) => Promise<void>;
  onDeleteMedia: (item: LandingMedia) => Promise<void>;
}) {
  const [mobile, setMobile] = useState(false);
  const [dialog, setDialog] = useState<EditorDialog>(null);
  const { theme, hero, lowerSection } = landing;
  const backgroundImage = isInternalMediaPath(hero.backgroundImage) ? hero.backgroundImage : "";
  const logo = isInternalMediaPath(hero.logo) ? hero.logo : "";
  const hasBackgroundImage = Boolean(backgroundImage);
  const heroTextColor = hasBackgroundImage ? "#ffffff" : theme.textColor;
  const mutedHeroText = hasBackgroundImage ? "rgba(255,255,255,.82)" : theme.textColor;
  const editHero = (patch: Partial<LandingPreview["hero"]>) => onChange((current) => ({ ...current, hero: { ...current.hero, ...patch } }));
  const editLower = (patch: Partial<LandingPreview["lowerSection"]>) => onChange((current) => ({ ...current, lowerSection: { ...current.lowerSection, ...patch } }));

  function updateHighlight(index: number, key: "title" | "description", value: string) {
    editHero({ highlights: hero.highlights.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) });
  }

  return <>
    <section className="rounded-xl border border-[var(--border)] bg-slate-100/70 p-3 shadow-[0_8px_22px_rgba(15,23,42,0.035)] sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">Editor visual</p><h2 className="mt-0.5 text-base font-semibold text-[var(--foreground)]">Use o lápis de cada bloco para editar somente aquele conteúdo</h2></div><div className="flex items-center gap-2"><button type="button" onClick={() => setDialog("theme")} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:bg-slate-50"><PencilSimple size={14} weight="bold" />Cores</button><div className="inline-flex rounded-lg border border-[var(--border)] bg-white p-1"><button type="button" onClick={() => setMobile(false)} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${!mobile ? "bg-slate-950 text-white" : "text-[var(--color-muted-raw)]"}`}><Desktop size={15} weight="bold" />Desktop</button><button type="button" onClick={() => setMobile(true)} className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${mobile ? "bg-slate-950 text-white" : "text-[var(--color-muted-raw)]"}`}><DeviceMobile size={15} weight="bold" />Mobile</button></div></div></div>
      <div className="overflow-auto rounded-lg bg-slate-200 p-2 sm:p-4"><div className={`relative mx-auto overflow-hidden rounded-md bg-white shadow-2xl transition-[width] duration-300 ${mobile ? "w-[360px] max-w-full" : "w-full"}`} style={{ color: theme.textColor, backgroundColor: theme.backgroundColor }}>
        <section className="relative min-h-[520px] overflow-hidden px-6 pb-10 sm:px-10" style={{ color: heroTextColor, backgroundColor: hasBackgroundImage ? theme.primaryColor : theme.backgroundColor, backgroundImage: hasBackgroundImage ? `linear-gradient(90deg, rgba(4,11,25,.88), rgba(4,11,25,.2)), url(${backgroundImage})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}>
          <EditControl label="Editar foto de fundo" onClick={() => setDialog("background")} className="bottom-4 right-3" />
          <div className="-mx-6 flex min-h-12 items-center gap-3 border-b px-6 py-3 text-xs sm:-mx-10 sm:w-[calc(100%+5rem)] sm:px-10" style={{ background: hasBackgroundImage ? "rgba(0,0,0,.28)" : theme.backgroundColor, borderColor: hasBackgroundImage ? "rgba(255,255,255,.22)" : "rgba(17,17,17,.16)" }}><div className="grid min-w-0 flex-1 grid-cols-2 gap-3"><span className="truncate">{hero.phone || "Telefone"}</span><span className="truncate text-right">{hero.email || "E-mail"}</span></div><button type="button" onClick={() => setDialog("contacts")} title="Editar faixa de contatos" aria-label="Editar faixa de contatos" className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-950 shadow-md transition hover:scale-105 hover:bg-slate-950 hover:text-white focus:outline-none focus:ring-4 focus:ring-slate-950/15"><PencilSimple size={15} weight="bold" /></button></div>
          <div className="relative mt-7 inline-flex min-h-12 items-center pr-11"><div>{logo ? <img src={logo} alt="Logo da landing page" className="h-12 w-auto max-w-52 object-contain object-left" /> : <><span className="block text-2xl font-black tracking-[0.08em]">SUA LOGO</span><span className="mt-1 block text-[8px] font-semibold tracking-[0.42em] opacity-60">IDENTIDADE DA CAMPANHA</span></>}</div><EditControl label="Editar logo" onClick={() => setDialog("logo")} className="right-0 top-1" /></div>
          <div className="relative mt-20 max-w-3xl pr-11"><p className="text-[11px] font-bold uppercase tracking-[0.32em]" style={{ color: mutedHeroText }}>{hero.eyebrow || "Mensagem de apoio"}</p><h3 className="mt-4 text-[clamp(1.8rem,4vw,3.7rem)] font-bold leading-[.95] tracking-[-.05em]">{hero.title || "Título principal da campanha"}</h3><p className="mt-4 max-w-xl text-sm leading-6" style={{ color: mutedHeroText }}>{hero.description || "Descreva aqui a proposta principal desta landing page."}</p>{hero.ctaLabel ? <span className="mt-6 inline-flex rounded-full px-5 py-3 text-xs font-bold" style={{ background: theme.primaryColor, color: theme.backgroundColor }}>{hero.ctaLabel}</span> : null}<EditControl label="Editar título, descrição e botão" onClick={() => setDialog("content")} className="right-0 top-0" /></div>
          <div className="relative mt-8 grid w-full gap-3 pr-11 sm:grid-cols-2 xl:grid-cols-4">{hero.highlights.map((item, index) => <article key={`${item.title}-${index}`} className="rounded-xl border p-4" style={{ borderColor: hasBackgroundImage ? "rgba(255,255,255,.56)" : "rgba(17,17,17,.2)", background: hasBackgroundImage ? "rgba(8,16,28,.5)" : theme.backgroundColor }}><strong className="block text-sm">{item.title || "Informação"}</strong><p className="mt-2 text-xs leading-5" style={{ color: mutedHeroText }}>{item.description || "Descrição da informação."}</p></article>)}<EditControl label="Editar informações em destaque" onClick={() => setDialog("highlights")} className="right-0 top-0" /></div>
        </section>
        <section className="relative px-6 py-12 sm:px-10"><p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: theme.primaryColor }}>Seção de teste</p><div className="relative mt-3 max-w-[16ch] pr-11"><h3 className="text-2xl font-bold leading-tight tracking-[-0.035em]">{lowerSection.title || "Título da seção"}</h3><EditControl label="Editar título da seção" onClick={() => setDialog("lower-title")} className="right-0 top-0" /></div><div className="relative mt-4 max-w-xl pr-11"><p className="text-sm leading-6 opacity-80">{lowerSection.description || "Descrição da seção inferior."}</p><EditControl label="Editar descrição da seção" onClick={() => setDialog("lower-description")} className="right-0 top-0" /></div></section>
        <footer className="border-t px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.14em] opacity-60">Rodogarcia Transportes</footer>
      </div></div>
    </section>
    {dialog ? <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label={dialogTitle[dialog]} onMouseDown={() => setDialog(null)}><div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7" onMouseDown={(event) => event.stopPropagation()}><div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-500">Edição rápida</p><h3 className="mt-1 text-xl font-bold text-slate-950">{dialogTitle[dialog]}</h3><p className="mt-1 text-sm text-slate-500">As alterações aparecem na prévia imediatamente. Salve a landing quando terminar.</p></div><button type="button" onClick={() => setDialog(null)} aria-label="Fechar" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} weight="bold" /></button></div>
      {dialog === "theme" ? <div className="grid gap-4 sm:grid-cols-2">{(["primaryColor", "secondaryColor", "backgroundColor", "textColor"] as const).map((key) => <label key={key} className="text-sm font-semibold text-slate-700">{({ primaryColor: "Cor dos detalhes", secondaryColor: "Cor de apoio", backgroundColor: "Fundo", textColor: "Texto" })[key]}<input type="color" value={theme[key]} onChange={(event) => onChange((current) => ({ ...current, theme: { ...current.theme, [key]: event.target.value } }))} className="mt-2 h-12 w-full cursor-pointer rounded-lg border border-slate-200 bg-white p-1" /></label>)}</div> : null}
      {dialog === "contacts" ? <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Telefone<input value={hero.phone} onChange={(event) => editHero({ phone: event.target.value })} className={inputClass} /></label><label className="text-sm font-semibold text-slate-700">E-mail<input value={hero.email} onChange={(event) => editHero({ email: event.target.value })} className={inputClass} /></label></div> : null}
      {dialog === "logo" ? <LandingMediaPicker slot="logo" currentUrl={hero.logo} media={media} uploading={uploadingMedia} onSelect={(url) => editHero({ logo: url })} onUpload={onUploadMedia} onDelete={onDeleteMedia} /> : null}
      {dialog === "background" ? <LandingMediaPicker slot="background" currentUrl={hero.backgroundImage} media={media} uploading={uploadingMedia} onSelect={(url) => editHero({ backgroundImage: url })} onUpload={onUploadMedia} onDelete={onDeleteMedia} /> : null}
      {dialog === "content" ? <div className="grid gap-4"><label className="text-sm font-semibold text-slate-700">Selo<input value={hero.eyebrow} onChange={(event) => editHero({ eyebrow: event.target.value })} className={inputClass} /></label><label className="text-sm font-semibold text-slate-700">Título<input value={hero.title} onChange={(event) => editHero({ title: event.target.value })} className={inputClass} /></label><label className="text-sm font-semibold text-slate-700">Descrição<textarea value={hero.description} onChange={(event) => editHero({ description: event.target.value })} className={`${inputClass} min-h-24 resize-y`} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Botão<input value={hero.ctaLabel} onChange={(event) => editHero({ ctaLabel: event.target.value })} className={inputClass} /></label><label className="text-sm font-semibold text-slate-700">Destino do botão<input value={hero.ctaUrl} onChange={(event) => editHero({ ctaUrl: event.target.value })} className={inputClass} /></label></div></div> : null}
      {dialog === "highlights" ? <div><p className="text-sm font-semibold text-slate-700">Informações em destaque</p><div className="mt-2 grid gap-3 sm:grid-cols-2">{hero.highlights.map((item, index) => <div key={index} className="rounded-xl border border-slate-200 p-3"><input value={item.title} onChange={(event) => updateHighlight(index, "title", event.target.value)} placeholder="Título" className={inputClass} /><textarea value={item.description} onChange={(event) => updateHighlight(index, "description", event.target.value)} placeholder="Descrição" className={`${inputClass} min-h-20 resize-y`} /></div>)}</div>{hero.highlights.length < 4 ? <button type="button" onClick={() => editHero({ highlights: [...hero.highlights, { title: "", description: "" }] })} className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-slate-950"><Plus size={16} weight="bold" />Adicionar informação</button> : null}</div> : null}
      {dialog === "lower-title" ? <label className="text-sm font-semibold text-slate-700">Título<input value={lowerSection.title} onChange={(event) => editLower({ title: event.target.value })} className={inputClass} /></label> : null}
      {dialog === "lower-description" ? <label className="text-sm font-semibold text-slate-700">Descrição<textarea value={lowerSection.description} onChange={(event) => editLower({ description: event.target.value })} className={`${inputClass} min-h-32 resize-y`} /></label> : null}
      <div className="mt-6 flex justify-end"><button type="button" onClick={() => setDialog(null)} className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-bold text-white">Concluir edição</button></div>
    </div></div> : null}
  </>;
}
