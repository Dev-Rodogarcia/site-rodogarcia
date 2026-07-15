"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "@/hooks/useSession";
import { api, auth, admin } from "@/lib/routes";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Informe a senha atual."),
    password: z
      .string()
      .min(10, "A senha deve ter pelo menos 10 caracteres.")
      .max(72, "A senha deve ter no máximo 72 caracteres.")
      .regex(/[a-z]/, "Inclua uma letra minúscula.")
      .regex(/[A-Z]/, "Inclua uma letra maiúscula.")
      .regex(/[0-9]/, "Inclua um número."),
    confirmPassword: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não coincidem.",
  });

type FormValues = z.infer<typeof schema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const { session, loading } = useSession();
  const [serverError, setServerError] = useState("");
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (!loading && !session?.authenticated) router.replace(auth.login);
    if (!loading && session?.authenticated && !session.user?.passwordChangeRequired) {
      router.replace(admin.root);
    }
  }, [loading, router, session?.authenticated, session?.user?.passwordChangeRequired]);

  async function onSubmit(values: FormValues) {
    if (!session?.csrfToken) return;
    setSaving(true);
    setServerError("");
    try {
      const response = await fetch(api.auth.changePassword, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": session.csrfToken,
        },
        body: JSON.stringify(values),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setServerError(data.error ?? "Não foi possível alterar a senha.");
        return;
      }
      window.location.href = admin.root;
    } catch {
      setServerError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !session?.authenticated || !session.user?.passwordChangeRequired) {
    return <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-sm font-semibold text-[var(--color-muted-raw)]">Carregando...</div>;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-10">
      <section className="w-full max-w-md rounded-[28px] border border-[var(--border)] bg-[var(--color-surface)] p-6 shadow-xl sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)]">Segurança da conta</p>
        <h1 className="mt-3 text-2xl font-bold text-[var(--foreground)]">Crie sua nova senha</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted-raw)]">Para proteger seu acesso, troque a senha temporária antes de entrar no painel.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {[['currentPassword', 'Senha atual'], ['password', 'Nova senha'], ['confirmPassword', 'Confirmar nova senha']].map(([name, label]) => (
            <label key={name} className="block text-sm font-semibold text-[var(--foreground)]">
              {label}
              <input
                type="password"
                autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'}
                className="mt-2 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-3 text-sm outline-none focus:border-[var(--primary)]"
                {...register(name as keyof FormValues)}
              />
              {errors[name as keyof FormValues] ? <span className="mt-1 block text-xs text-red-600">{errors[name as keyof FormValues]?.message}</span> : null}
            </label>
          ))}
          {serverError ? <p className="text-sm text-red-600">{serverError}</p> : null}
          <button type="submit" disabled={saving} className="w-full rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">
            {saving ? "Salvando..." : "Alterar senha e continuar"}
          </button>
        </form>
      </section>
    </main>
  );
}
