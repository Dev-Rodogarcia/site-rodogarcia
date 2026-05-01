"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "@/hooks/useSession";
import { admin, api, site } from "@/lib/routes";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

type FormValues = z.infer<typeof schema>;

const INPUT_BASE =
  "w-full rounded-[16px] border bg-[var(--color-surface)] px-4 py-3.5 text-sm text-[var(--foreground)] placeholder:text-slate-400 outline-none transition-all duration-200 focus:bg-[var(--color-surface-strong)] focus:ring-4 backdrop-blur-sm";

const INPUT_DEFAULT =
  `${INPUT_BASE} border-[var(--border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] focus:border-[var(--primary)]/30 focus:ring-[var(--primary)]/10`;

const INPUT_ERROR =
  `${INPUT_BASE} border-red-400/60 bg-red-50/60 focus:border-red-400/60 focus:ring-red-400/10`;

function resolveAdminNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return admin.root;
  }
  if (value === admin.root || value.startsWith(admin.prefix)) {
    return value;
  }
  return admin.root;
}

function LoginForm() {

  const searchParams = useSearchParams();
  const { session, loading } = useSession();
  const nextPath = resolveAdminNextPath(searchParams.get("next"));
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
      });

      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error ?? "Credenciais inválidas.");
        setIsLoading(false);
        return;
      }

      // Usa reload completo para garantir que layouts e hooks leiam o cookie HTTP-only atualizado.
      window.location.href = nextPath;
    } catch {
      setServerError("Erro de conexão. Tente novamente.");
      setIsLoading(false);
    }
  }



  useEffect(() => {
    // So redireciona apos o fetch de sessao confirmar o cookie HTTP-only.
    if (!loading && session?.authenticated) {
      window.location.href = nextPath;
    }
  }, [nextPath, session?.authenticated, loading]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--background)] px-4 py-10 sm:px-6">
      {/* Background gradients/blur */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(56,189,248,0.12),transparent_38%),radial-gradient(circle_at_84%_26%,rgba(29,78,216,0.14),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(15,23,42,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.1)_1px,transparent_1px)] [background-size:36px_36px] dark:opacity-[0.06] dark:[background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)]" />

      {/* Card */}
      <div className="relative w-full max-w-[420px] z-10">
        <div className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-[var(--color-surface)] p-6 shadow-xl backdrop-blur-2xl sm:p-8">
          
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <span className="rounded-full border border-[var(--border)] bg-[var(--color-surface-2)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-raw)]">
              Acesso Restrito
            </span>
          </div>

          {/* Title */}
          <div className="mt-8">
            <h1 className="text-[2rem] font-bold tracking-[-0.06em] text-[var(--foreground)] sm:text-[2.25rem]">
              Entrar no painel
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted-raw)]">
              Acesse sua conta para acompanhar operações e solicitações.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-raw)]"
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
              {errors.email && (
                <p className="mt-1.5 text-xs font-medium text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-raw)]"
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
              {errors.password && (
                <p className="mt-1.5 text-xs font-medium text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {serverError && (
              <div className="rounded-[14px] border border-red-400/20 bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-400/10 dark:text-red-300">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="group mt-2 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[16px] bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--primary-foreground)] shadow-[0_16px_40px_rgba(29,78,216,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-primary-strong)] hover:shadow-[0_22px_48px_rgba(29,78,216,0.38)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-6 flex items-center justify-between gap-4 border-t border-[var(--border)] pt-5 text-[12px] text-[var(--color-muted-raw)]">
            <Link
              href={site.home}
              className="font-medium hover:text-[var(--foreground)] transition-colors"
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
