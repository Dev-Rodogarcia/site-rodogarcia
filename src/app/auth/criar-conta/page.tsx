"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, IdentificationCard, Key } from "@phosphor-icons/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "@/hooks/useSession";
import { admin, api, auth, site } from "@/lib/routes";

export const dynamic = "force-dynamic";

const schema = z
  .object({
    name: z.string().min(2, "Nome obrigatório").max(80),
    email: z.string().email("E-mail inválido"),
    password: z.string().min(10, "Mínimo de 10 caracteres"),
    confirmPassword: z.string(),
    setupCode: z.string().min(1, "Código de configuração obrigatório"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

const FIELD_CLASS_NAME =
  "w-full rounded-2xl border border-[var(--border)]/70 bg-white/82 px-4 py-3.5 text-sm text-[var(--foreground)] placeholder:text-[var(--color-muted-raw)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] outline-none transition-all duration-200 focus:border-[var(--primary)]/30 focus:bg-white focus:ring-4 focus:ring-[var(--primary)]/10";

const PANEL_ITEMS = [
  {
    icon: IdentificationCard,
    title: "Primeira conta admin",
    description: "Esta tela serve apenas para concluir a configuração inicial do CMS.",
  },
  {
    icon: Key,
    title: "Setup controlado",
    description: "O primeiro cadastro depende do valor definido em `ADMIN_SETUP_CODE`.",
  },
] as const;

export default function CriarContaPage() {
  const router = useRouter();
  const { session, loading } = useSession();
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const setupRequired = Boolean(session?.setupRequired);

  async function onSubmit(values: FormValues) {
    if (!setupRequired) {
      setServerError("A configuração inicial já foi concluída. Entre com um administrador.");
      return;
    }

    setIsLoading(true);
    setServerError("");

    try {
      const res = await fetch(api.auth.register, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
          confirmPassword: values.confirmPassword,
          setupCode: values.setupCode,
        }),
        credentials: "same-origin",
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setServerError(data.error ?? "Erro ao criar conta.");
        setIsLoading(false);
        return;
      }

      router.replace(admin.root);
    } catch {
      setServerError("Erro de conexão. Tente novamente.");
      setIsLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
        <div className="rounded-[28px] border border-white/80 bg-white/88 px-6 py-5 text-sm text-[var(--color-muted-raw)] shadow-[0_24px_56px_rgba(15,23,42,0.08)]">
          Verificando configuração inicial...
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_10%,rgba(6,182,212,0.14),transparent_24%),radial-gradient(circle_at_86%_12%,rgba(29,78,216,0.16),transparent_22%),linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(rgba(29,78,216,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(29,78,216,0.08)_1px,transparent_1px)] [background-size:34px_34px]" />

      <div className="relative mx-auto grid min-h-screen max-w-[1440px] grid-cols-1 gap-8 px-5 py-6 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(460px,0.98fr)] lg:gap-10 lg:px-8 lg:py-8">
        <section className="relative overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#0f172a_0%,#15233f_56%,#173765_100%)] px-6 py-7 text-white shadow-[0_28px_80px_rgba(15,23,42,0.2)] sm:px-8 sm:py-8 lg:px-10 lg:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(56,189,248,0.2),transparent_24%),radial-gradient(circle_at_82%_14%,rgba(37,99,235,0.28),transparent_26%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:36px_36px]" />

          <div className="relative flex h-full flex-col">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Link href={site.home} className="inline-flex items-center gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/12 bg-white/8 text-sm font-semibold tracking-[0.2em] text-white">
                  RG
                </span>
                <span className="text-lg font-semibold tracking-[-0.03em] text-white">
                  Rodogarcia
                </span>
              </Link>

              <span className="inline-flex rounded-full border border-white/12 bg-white/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/72">
                Setup do CMS
              </span>
            </div>

            <div className="mt-10 max-w-[620px]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200/84">
                Configuração inicial
              </p>
              <h1 className="mt-4 max-w-[11ch] text-[clamp(2.8rem,5vw,5.2rem)] font-bold leading-[0.92] tracking-[-0.07em] text-white">
                Criar a primeira conta admin.
              </h1>
              <p className="mt-5 max-w-[56ch] text-sm leading-7 text-white/68 sm:text-base">
                Finalize o setup do painel com uma conta administrativa local. Depois disso,
                o acesso público a esta página deixa de ser necessário.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {PANEL_ITEMS.map((item) => (
                <div
                  key={item.title}
                  className="rounded-[26px] border border-white/12 bg-white/8 p-4 backdrop-blur-md"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sky-200">
                    <item.icon size={22} weight="duotone" />
                  </span>
                  <h2 className="mt-4 text-lg font-semibold tracking-[-0.03em] text-white">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-white/64">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-10">
              <Link
                href={site.home}
                className="inline-flex items-center gap-2 text-sm font-semibold text-white/76 transition-colors hover:text-white"
              >
                Voltar ao site
                <ArrowUpRight size={16} weight="bold" />
              </Link>
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <div className="relative w-full overflow-hidden rounded-[34px] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(241,245,249,0.96)_100%)] p-6 shadow-[0_28px_72px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8 lg:p-10">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.12),transparent_24%),radial-gradient(circle_at_82%_18%,rgba(6,182,212,0.12),transparent_22%)]" />
            <div className="relative">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
                    Setup do CMS
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[var(--foreground)]">
                    {setupRequired ? "Criar primeira conta" : "Configuração concluída"}
                  </h2>
                </div>

                <span className="rounded-full border border-[var(--border)] bg-white/74 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-raw)]">
                  Admin
                </span>
              </div>

              <p className="mt-4 text-sm leading-7 text-[var(--color-muted-raw)]">
                {setupRequired
                  ? "Preencha os dados abaixo para ativar o primeiro acesso administrativo."
                  : "Este ambiente já possui administrador. Use a tela de login para entrar no CMS."}
              </p>

              {setupRequired ? (
                <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
                    >
                      Nome
                    </label>
                    <input
                      {...register("name")}
                      id="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Seu nome completo"
                      className={`${FIELD_CLASS_NAME} ${
                        errors.name ? "border-red-500 focus:ring-red-500/10" : ""
                      }`}
                    />
                    {errors.name ? (
                      <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                    ) : null}
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
                    >
                      E-mail
                    </label>
                    <input
                      {...register("email")}
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="seu@rodogarcia.com.br"
                      className={`${FIELD_CLASS_NAME} ${
                        errors.email ? "border-red-500 focus:ring-red-500/10" : ""
                      }`}
                    />
                    {errors.email ? (
                      <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="password"
                        className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
                      >
                        Senha
                      </label>
                      <input
                        {...register("password")}
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Mínimo de 10 caracteres"
                        className={`${FIELD_CLASS_NAME} ${
                          errors.password ? "border-red-500 focus:ring-red-500/10" : ""
                        }`}
                      />
                      {errors.password ? (
                        <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                      ) : null}
                    </div>

                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
                      >
                        Confirmar senha
                      </label>
                      <input
                        {...register("confirmPassword")}
                        id="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Repita a senha"
                        className={`${FIELD_CLASS_NAME} ${
                          errors.confirmPassword ? "border-red-500 focus:ring-red-500/10" : ""
                        }`}
                      />
                      {errors.confirmPassword ? (
                        <p className="mt-1 text-xs text-red-500">
                          {errors.confirmPassword.message}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="setupCode"
                      className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
                    >
                      Código de configuração
                    </label>
                    <input
                      {...register("setupCode")}
                      id="setupCode"
                      type="password"
                      autoComplete="off"
                      placeholder="Valor definido em ADMIN_SETUP_CODE"
                      className={`${FIELD_CLASS_NAME} ${
                        errors.setupCode ? "border-red-500 focus:ring-red-500/10" : ""
                      }`}
                    />
                    {errors.setupCode ? (
                      <p className="mt-1 text-xs text-red-500">{errors.setupCode.message}</p>
                    ) : null}
                  </div>

                  {serverError ? (
                    <p className="rounded-2xl border border-red-500/16 bg-red-500/8 px-4 py-3 text-sm text-red-500">
                      {serverError}
                    </p>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white shadow-[0_20px_44px_rgba(29,78,216,0.2)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-primary-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? "Criando conta..." : "Criar acesso"}
                  </button>
                </form>
              ) : (
                <div className="mt-8 rounded-2xl border border-amber-500/18 bg-amber-500/8 px-4 py-4 text-sm leading-7 text-[var(--foreground)]">
                  O cadastro público está desativado porque o ambiente já possui administrador.
                </div>
              )}

              <div className="mt-7 flex flex-col gap-3 border-t border-[var(--border)] pt-6 text-sm text-[var(--color-muted-raw)] sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Já tem conta?{" "}
                  <Link
                    href={auth.login}
                    className="font-semibold text-[var(--primary)] hover:underline"
                  >
                    Entrar
                  </Link>
                </p>

                <Link
                  href={site.home}
                  className="font-medium text-[var(--foreground)] transition-colors hover:text-[var(--primary)]"
                >
                  Voltar ao site
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
