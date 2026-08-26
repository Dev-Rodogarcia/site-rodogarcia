"use client";

import { useRef, useState } from "react";
import { ArrowLeft, CheckCircle, FileArrowUp, PaperPlaneTilt, User, UsersThree, X } from "@phosphor-icons/react";
import { api } from "@/lib/routes";
import { cn } from "@/lib/utils";

export type Profile = "site_user" | "employee";
type SubmissionStatus = "idle" | "loading" | "success" | "error";

interface ImprovementFormProps {
  profile?: Profile;
  endpoint?: string;
  onSubmitted?: () => void;
  onProfileChange?: (profile: Profile | null) => void;
}

const fieldClassName = "w-full rounded-2xl border border-[var(--border)]/70 bg-white px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--color-muted-raw)] outline-none transition focus:border-[var(--primary)]/40 focus:ring-4 focus:ring-[var(--primary)]/10";
const siteCategories = [["site_suggestion", "Sugestão para o site"], ["site_problem", "Problema no site"], ["site_accessibility", "Acessibilidade"], ["site_content", "Conteúdo ou informação"]] as const;
const employeeCategories = [["process", "Melhoria de processo"], ["automation", "Automação"], ["system", "Sistema ou ferramenta"], ["operation", "Operação"], ["safety", "Segurança"], ["other", "Outro"]] as const;
const branches = ["Matriz - Agudos/SP", "Agudos/SP", "Campinas/SP", "Osasco/SP", "Castro/PR", "Curitiba/PR", "Rio de Janeiro/RJ", "Novo Hamburgo/RS", "Recife/PE", "Outro"];
const acceptedFiles = "image/png,image/jpeg,image/webp,image/avif,.csv,.xls,.xlsx";

function phoneMask(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function ImprovementForm({ profile: fixedProfile, endpoint = api.forms.improvements, onSubmitted, onProfileChange }: ImprovementFormProps) {
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(fixedProfile ?? null);
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [phone, setPhone] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const profile = fixedProfile ?? selectedProfile;
  const isEmployee = profile === "employee";
  const categories = isEmployee ? employeeCategories : siteCategories;
  const theme = isEmployee ? "emerald" : "blue";

  function changeProfile(nextProfile: Profile | null) {
    setSelectedProfile(nextProfile);
    onProfileChange?.(nextProfile);
  }

  function selectAttachments(files: FileList | null) {
    if (!files) return;
    setAttachments((current) => [...current, ...Array.from(files)].slice(0, 5));
    if (inputRef.current) inputRef.current.value = "";
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    const form = event.currentTarget;
    const payload = new FormData(form);
    payload.set("profile", profile);
    attachments.forEach((file) => payload.append("attachments", file));
    setStatus("loading");
    setMessage("");
    try {
      const data = await fetch(endpoint, { method: "POST", body: payload }).then(async (response) => {
          const body = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
          return response.ok ? { success: true, data: body } : { success: false, error: body.error };
        });
      if (!data.success) throw new Error(data.error ?? "Não foi possível enviar sua sugestão.");
      setStatus("success");
      setMessage(data.data?.message ?? "Sua sugestão foi recebida. Obrigado por contribuir.");
      form.reset();
      setAttachments([]);
      setPhone("");
      onSubmitted?.();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Não foi possível enviar sua sugestão.");
    }
  }

  if (status === "success") return <SuccessState isEmployee={isEmployee} message={message} onReset={() => { setStatus("idle"); changeProfile(fixedProfile ?? null); }} />;

  return <section data-profile={profile ?? "selection"} className={cn("h-full rounded-[32px] border p-5 shadow-[0_22px_56px_rgba(15,23,42,0.1)] transition-colors duration-500 sm:p-8", profile ? (isEmployee ? "border-emerald-200 bg-[linear-gradient(180deg,rgba(236,253,245,0.98),rgba(236,253,245,0.72))]" : "border-blue-200 bg-[linear-gradient(180deg,rgba(239,246,255,0.98),rgba(239,246,255,0.72))]") : "border-white bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(241,245,249,0.92))]")}>{!profile ? <ProfileSelector onSelect={changeProfile} /> : <div key={profile} className="animate-in fade-in-0 duration-300"><form onSubmit={submit} className="flex h-full flex-col space-y-4" noValidate>
    <FormHeading isEmployee={isEmployee} showProfileChooser={!fixedProfile} onChooseProfile={() => changeProfile(null)} />
    {!isEmployee ? <SiteUserFormFields categories={categories} /> : <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Nome" required><input name="name" required autoComplete="name" className={fieldClassName} placeholder="Seu nome" /></Field>
      <Field label="E-mail" required><input name="email" required type="email" autoComplete="email" className={fieldClassName} placeholder="voce@empresa.com" /></Field>
      <Field label="Telefone"><input name="phone" value={phone} onChange={(event) => setPhone(phoneMask(event.target.value))} type="tel" inputMode="numeric" autoComplete="tel" maxLength={15} className={fieldClassName} placeholder="(00) 00000-0000" /></Field>
    </div>
    <PublicEmployeeFields categories={categories} /></>}
    <div className="flex flex-wrap items-center justify-between gap-4"><AttachmentPicker attachments={attachments} onSelect={selectAttachments} onRemove={(index) => setAttachments((current) => current.filter((_, currentIndex) => currentIndex !== index))} inputRef={inputRef} theme={theme} /><div className="border-l border-[var(--border)] pl-4">{<SubmitButton status={status} isEmployee={isEmployee} />}</div></div>
    {status === "error" ? <p role="alert" className="rounded-2xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm text-red-600">{message}</p> : null}
  </form></div>}</section>;
}

function FormHeading({ isEmployee, showProfileChooser, onChooseProfile }: { isEmployee: boolean; showProfileChooser: boolean; onChooseProfile: () => void }) { return <div className="flex flex-wrap items-start justify-between gap-4"><div><p className={cn("text-[11px] font-bold uppercase tracking-[0.2em]", isEmployee ? "text-emerald-700" : "text-blue-700")}>{isEmployee ? "Para colaboradores" : "Para usuários do site"}</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">{isEmployee ? "O que podemos facilitar na sua rotina?" : "Como podemos melhorar o site?"}</h2></div>{showProfileChooser ? <button type="button" onClick={onChooseProfile} className={cn("inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border-2 px-3 py-2 text-xs font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 active:translate-y-0", isEmployee ? "border-emerald-600 bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700 focus-visible:ring-emerald-500/25" : "border-blue-600 bg-blue-600 shadow-blue-600/20 hover:bg-blue-700 focus-visible:ring-blue-500/25")}><ArrowLeft size={16} weight="bold" />Trocar perfil</button> : null}</div>; }
function PublicEmployeeFields({ categories }: { categories: readonly (readonly [string, string])[] }) { return <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Field label="Filial" required><select name="branch" required defaultValue="" className={fieldClassName}><option value="" disabled>Selecione a filial</option>{branches.map((branch) => <option key={branch} value={branch}>{branch}</option>)}</select></Field><Field label="Área"><input name="area" className={fieldClassName} placeholder="Ex.: Operação" /></Field><CategoryField categories={categories} /></div><div className="grid gap-4 lg:grid-cols-2 lg:items-stretch"><div className="space-y-4"><Field label="Resultado esperado"><input name="expectedResult" className={fieldClassName} placeholder="Como seria a solução ideal?" /></Field><Field label="Onde será aplicado"><input name="applicationPlace" className={fieldClassName} placeholder="Ex.: rotina de coleta" /></Field></div><Field label="Contexto e impacto" required><textarea name="message" required minLength={10} rows={5} className={`${fieldClassName} min-h-[156px] max-h-72 resize-y`} placeholder="Como é feito hoje e qual dificuldade essa melhoria resolve?" /></Field></div></>; }
function SiteUserFormFields({ categories }: { categories: readonly (readonly [string, string])[] }) { return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Field label="Nome" required><input name="name" required autoComplete="name" className={fieldClassName} placeholder="Seu nome" /></Field><Field label="E-mail" required><input name="email" required type="email" autoComplete="email" className={fieldClassName} placeholder="voce@empresa.com" /></Field><div className="order-last lg:order-none lg:row-span-2"><Field label="Conte sua sugestão ou o problema" required><textarea name="message" required minLength={10} rows={4} className={`${fieldClassName} min-h-[156px] max-h-72 resize-y`} placeholder="Descreva o que aconteceu ou o que você sugere." /></Field></div><CategoryField label="Sobre o que é?" categories={categories} /><Field label="Página do site, se souber"><input name="page" className={fieldClassName} placeholder="Ex.: /cotacao" /></Field></div>; }
function CategoryField({ categories, label = "Tipo de melhoria" }: { categories: readonly (readonly [string, string])[]; label?: string }) { return <Field label={label} required><select name="category" required defaultValue="" className={fieldClassName}><option value="" disabled>Selecione uma opção</option>{categories.map(([value, itemLabel]) => <option key={value} value={value}>{itemLabel}</option>)}</select></Field>; }
function SuccessState({ isEmployee, message, onReset }: { isEmployee: boolean; message: string; onReset: () => void }) { return <section className={cn("h-full rounded-[32px] border p-8 text-center shadow-[0_20px_52px_rgba(16,185,129,0.1)]", isEmployee ? "border-emerald-500/20 bg-emerald-50/80" : "border-blue-500/20 bg-blue-50/80")}><CheckCircle size={38} weight="fill" className={cn("mx-auto", isEmployee ? "text-emerald-600" : "text-blue-600")} /><h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">Sugestão enviada.</h2><p className="mx-auto mt-3 max-w-[48ch] text-sm leading-7 text-[var(--color-muted-raw)]">{message}</p><button type="button" onClick={onReset} className="mt-6 rounded-2xl border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)]">Enviar outra sugestão</button></section>; }
function ProfileSelector({ onSelect }: { onSelect: (profile: Profile) => void }) { return <div className="animate-in fade-in-0 slide-in-from-right-4 duration-300"><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">Primeiro, conte quem você é</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">Qual tipo de melhoria você quer compartilhar?</h2><div className="mt-6 grid gap-4 md:grid-cols-2"><ProfileCard onClick={() => onSelect("site_user")} icon={<User size={24} weight="duotone" />} title="Sou usuário do site" description="Compartilhe sugestões, problemas ou melhorias para a experiência digital." theme="blue" /><ProfileCard onClick={() => onSelect("employee")} icon={<UsersThree size={24} weight="duotone" />} title="Sou colaborador" description="Registre uma ideia para facilitar sua rotina, processo, operação ou ferramenta." theme="emerald" /></div></div>; }
function ProfileCard({ onClick, icon, title, description, theme }: { onClick: () => void; icon: React.ReactNode; title: string; description: string; theme: "blue" | "emerald" }) { const blue = theme === "blue"; return <button type="button" onClick={onClick} className={cn("group rounded-3xl border bg-white p-6 text-left transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]", blue ? "border-blue-100 hover:border-blue-400" : "border-emerald-100 hover:border-emerald-400")}><span className={cn("inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110", blue ? "bg-blue-500/10 text-blue-600" : "bg-emerald-500/10 text-emerald-600")}>{icon}</span><h3 className="mt-4 text-lg font-semibold text-[var(--foreground)]">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--color-muted-raw)]">{description}</p></button>; }
function SubmitButton({ status, isEmployee }: { status: SubmissionStatus; isEmployee: boolean }) { return <button type="submit" disabled={status === "loading"} className={cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition disabled:opacity-60", isEmployee ? "bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700" : "bg-blue-600 shadow-blue-600/20 hover:bg-blue-700")}><PaperPlaneTilt size={18} weight="bold" />{status === "loading" ? "Enviando..." : "Enviar sugestão"}</button>; }
function AttachmentPicker({ attachments, onSelect, onRemove, inputRef, theme }: { attachments: File[]; onSelect: (files: FileList | null) => void; onRemove: (index: number) => void; inputRef: React.RefObject<HTMLInputElement | null>; theme: "blue" | "emerald" }) { const blue = theme === "blue"; return <div className="min-w-0 flex-1 rounded-xl border border-dashed border-[var(--border)] bg-white/72 px-4 py-3"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-[var(--color-muted-raw)]"><span className="font-medium text-[var(--foreground)]">Anexos</span> <span>(opcional) · Fotos, CSV, XLS ou XLSX · até 5 arquivos de 8 MB.</span></p><button type="button" onClick={() => inputRef.current?.click()} className={cn("inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold", blue ? "border-blue-200 text-blue-700 hover:bg-blue-50" : "border-emerald-200 text-emerald-700 hover:bg-emerald-50")}><FileArrowUp size={16} weight="bold" />Adicionar arquivos</button><input ref={inputRef} type="file" accept={acceptedFiles} multiple className="sr-only" onChange={(event) => onSelect(event.target.files)} /></div>{attachments.length ? <ul className="mt-3 flex flex-wrap gap-2">{attachments.map((file, index) => <li key={`${file.name}-${index}`} className="inline-flex max-w-full items-center gap-2 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs text-slate-700"><span className="truncate">{file.name}</span><button type="button" aria-label={`Remover ${file.name}`} onClick={() => onRemove(index)} className="text-slate-500 hover:text-red-600"><X size={14} weight="bold" /></button></li>)}</ul> : null}</div>; }
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) { return <label className="block text-sm font-medium text-[var(--foreground)]"><span className="mb-1.5 block">{label}{required ? <span className="text-[var(--primary)]"> *</span> : null}</span>{children}</label>; }
