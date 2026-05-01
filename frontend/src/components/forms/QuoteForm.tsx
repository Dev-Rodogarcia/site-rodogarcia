"use client";

import { useState } from "react";
import { CheckCircle, PaperPlaneTilt } from "@phosphor-icons/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePhoneMask } from "@/hooks/usePhoneMask";
import { api } from "@/lib/routes";

const schema = z.object({
  name: z.string().min(2, "Nome obrigatório").max(80),
  company: z.string().max(120).optional(),
  email: z.string().email("E-mail inválido"),
  phone: z.string().optional(),
  origin: z.string().min(2, "Origem obrigatória").max(120),
  destination: z.string().min(2, "Destino obrigatório").max(120),
  cargoType: z.string().max(80).optional(),
  weight: z.string().max(40).optional(),
  notes: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof schema>;

const fieldClassName =
  "w-full rounded-2xl border border-[var(--border)]/70 bg-white/82 px-4 py-3.5 text-sm text-[var(--foreground)] placeholder:text-[var(--color-muted-raw)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] outline-none transition-all duration-200 focus:border-[var(--primary)]/28 focus:bg-white focus:ring-4 focus:ring-[var(--primary)]/10";

export default function QuoteForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");
  const { maskPhone } = usePhoneMask();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const phoneField = register("phone");

  async function onSubmit(values: FormValues) {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch(api.forms.quote, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setErrorMsg(data.error ?? "Erro ao enviar solicitação.");
        setStatus("error");
        return;
      }
      setStatus("success");
      reset();
    } catch {
      setErrorMsg("Erro de conexão. Tente novamente.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-[32px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.9)_0%,rgba(241,245,249,0.96)_100%)] p-8 text-center shadow-[0_24px_56px_rgba(15,23,42,0.08)]">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-600">
          <CheckCircle size={32} weight="fill" />
        </div>
        <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
          Solicitação enviada.
        </h3>
        <p className="mt-3 text-sm leading-7 text-[var(--color-muted-raw)]">
          O time comercial recebeu seus dados e retorna em até 1 dia útil.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 inline-flex items-center justify-center rounded-2xl border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition-all hover:-translate-y-0.5 hover:bg-[var(--color-surface-2)]"
        >
          Nova solicitação
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-6 rounded-[32px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.82)_0%,rgba(241,245,249,0.94)_100%)] p-6 shadow-[0_24px_56px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8"
      noValidate
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
            Briefing inicial
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
            Compartilhe os dados centrais da operação.
          </h3>
        </div>
        <div className="rounded-full border border-[var(--border)] bg-white/74 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-raw)]">
          Resposta comercial
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
            Nome <span className="text-[var(--primary)]">*</span>
          </label>
          <input
            {...register("name")}
            type="text"
            autoComplete="name"
            placeholder="Seu nome"
            className={`${fieldClassName} ${
              errors.name ? "border-red-500 focus:ring-red-500/10" : ""
            }`}
          />
          {errors.name ? <p className="mt-1 text-xs text-red-500">{errors.name.message}</p> : null}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
            Empresa
          </label>
          <input
            {...register("company")}
            type="text"
            autoComplete="organization"
            placeholder="Nome da empresa"
            className={fieldClassName}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
            E-mail <span className="text-[var(--primary)]">*</span>
          </label>
          <input
            {...register("email")}
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            className={`${fieldClassName} ${
              errors.email ? "border-red-500 focus:ring-red-500/10" : ""
            }`}
          />
          {errors.email ? (
            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
            Telefone
          </label>
          <input
            {...phoneField}
            type="tel"
            autoComplete="tel"
            placeholder="(00) 00000-0000"
            onChange={(event) => {
              maskPhone(event);
              void phoneField.onChange(event);
            }}
            className={fieldClassName}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
            Cidade de origem <span className="text-[var(--primary)]">*</span>
          </label>
          <input
            {...register("origin")}
            type="text"
            placeholder="Ex: Agudos/SP"
            className={`${fieldClassName} ${
              errors.origin ? "border-red-500 focus:ring-red-500/10" : ""
            }`}
          />
          {errors.origin ? (
            <p className="mt-1 text-xs text-red-500">{errors.origin.message}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
            Cidade de destino <span className="text-[var(--primary)]">*</span>
          </label>
          <input
            {...register("destination")}
            type="text"
            placeholder="Ex: São Paulo/SP"
            className={`${fieldClassName} ${
              errors.destination ? "border-red-500 focus:ring-red-500/10" : ""
            }`}
          />
          {errors.destination ? (
            <p className="mt-1 text-xs text-red-500">{errors.destination.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
            Tipo de carga
          </label>
          <select {...register("cargoType")} className={fieldClassName}>
            <option value="">Selecione (opcional)</option>
            <option value="Carga fracionada">Carga fracionada</option>
            <option value="Carga fechada">Carga fechada (lotação)</option>
            <option value="Carga especial">Carga especial / perigosa</option>
            <option value="Refrigerada">Refrigerada</option>
            <option value="Outro">Outro</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
            Peso estimado
          </label>
          <input
            {...register("weight")}
            type="text"
            placeholder="Ex: 500 kg"
            className={fieldClassName}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
          Observações
        </label>
        <textarea
          {...register("notes")}
          rows={4}
          placeholder="Informações adicionais sobre a carga ou operação..."
          className={`${fieldClassName} resize-none`}
        />
      </div>

      {status === "error" ? (
        <p className="rounded-2xl border border-red-500/16 bg-red-500/8 px-4 py-3 text-sm text-red-500">
          {errorMsg}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white shadow-[0_20px_44px_rgba(29,78,216,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-primary-strong)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <PaperPlaneTilt size={18} weight="bold" />
        {status === "loading" ? "Enviando..." : "Solicitar cotação"}
      </button>
    </form>
  );
}
