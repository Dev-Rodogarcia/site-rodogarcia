"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "@/hooks/useSession";
import { admin, api, auth, site } from "@/lib/routes";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

type FormValues = z.infer<typeof schema>;

const INPUT_BASE =
  "w-full rounded-[16px] border bg-white/70 px-4 py-3.5 text-sm text-[var(--foreground)] placeholder:text-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-4 backdrop-blur-sm";

const INPUT_DEFAULT =
  `${INPUT_BASE} border-[var(--border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] focus:border-[var(--primary)]/30 focus:ring-[var(--primary)]/10`;

const INPUT_ERROR =
  `${INPUT_BASE} border-red-400/60 bg-red-50/60 focus:border-red-400/60 focus:ring-red-400/10`;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useSession();
  const nextPath = searchParams.get("next") ?? admin.root;
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    setServerError("");

    try {
      const res = await fetch(api.auth.login, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        credentials: "same-origin",
      });

      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setServerError(data.error ?? "Credenciais inválidas.");
        setIsLoading(false);
        return;
      }

      router.replace(nextPath);
    } catch {
      setServerError("Erro de conexão. Tente novamente.");
      setIsLoading(false);
    }
  }

  const setupRequired = Boolean(session?.setupRequired);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-[var(--foreground)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(56,189,248,0.16),transparent_38%),radial-gradient(circle_at_84%_26%,rgba(29,78,216,0.22),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.025)_0%,transparent_42%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:36px_36px]" />

      {/* Card */}
      <div className="relative w-full max-w-[420px]">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -right-8 h-32 w-32 rounded-full bg-blue-700/20 blur-3xl" />

        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/6 p-6 shadow-[0_32px_80px_rgba(2,6,23,0.36)] backdrop-blur-xl sm:p-8">
          {/* Inner top highlight */}
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,rgba(56,189,248,0.3)_0%,rgba(29,78,216,0.4)_100%)] text-[13px] font-bold tracking-[0.18em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]">
              RG
            </div>
            <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/62">
              Área restrita
            </span>
          </div>

          {/* Title */}
          <div className="mt-8">
            <h1 className="text-[2rem] font-bold tracking-[-0.06em] text-white sm:text-[2.25rem]">
              Entrar
            </h1>
            <p className="mt-2 text-sm leading-6 text-white/54">
              Acesse o painel interno com suas credenciais.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/54"
              >
                E-mail
              </label>
              <input
                {...register("email")}
                id="email"
                type="email"
                autoComplete="username"
                placeholder="seu@rodogarcia.com.br"
                className={errors.email ? INPUT_ERROR : INPUT_DEFAULT}
              />
              {errors.email ? (
                <p className="mt-1.5 text-xs font-medium text-red-400">{errors.email.message}</p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/54"
              >
                Senha
              </label>
              <input
                {...register("password")}
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className={errors.password ? INPUT_ERROR : INPUT_DEFAULT}
              />
              {errors.password ? (
                <p className="mt-1.5 text-xs font-medium text-red-400">
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            {serverError ? (
              <div className="rounded-[14px] border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300">
                {serverError}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="group mt-2 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[16px] bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(29,78,216,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-primary-strong)] hover:shadow-[0_22px_48px_rgba(29,78,216,0.38)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/8 pt-5 text-[12px] text-white/40">
            {setupRequired ? (
              <Link
                href={auth.register}
                className="font-medium text-white/62 transition-colors hover:text-white"
              >
                Configuração inicial
              </Link>
            ) : (
              <span>Uso interno Rodogarcia</span>
            )}

            <Link
              href={site.home}
              className="font-medium text-white/62 transition-colors hover:text-white"
            >
              ← Voltar ao site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EntrarPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
