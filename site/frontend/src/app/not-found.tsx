import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Página não encontrada",
  description: "A página solicitada não está disponível no site da Rodogarcia.",
  robots: { index: false, follow: true },
};

/** Mantém a navegação institucional quando uma rota pública não existe. */
export default function NotFound() {
  return (
    <section className="relative isolate overflow-hidden bg-slate-950 px-5 py-20 text-white sm:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_12%,rgba(14,165,233,0.23),transparent_34%),radial-gradient(circle_at_84%_78%,rgba(29,78,216,0.26),transparent_36%)]" />
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-extrabold tracking-[0.22em] text-sky-200">ERRO 404</p>
        <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-[-0.05em] sm:text-6xl">
          Esta rota não existe.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-pretty text-base leading-7 text-white/70 sm:text-lg">
          O endereço pode ter mudado ou estar incorreto. Volte ao início ou encontre o atendimento que precisa.
        </p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href={site.home}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-sky-400 px-6 text-sm font-extrabold text-slate-950 transition-colors hover:bg-sky-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200/35"
          >
            Ir para o início
          </Link>
          <Link
            href={site.quote}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 px-6 text-sm font-bold text-white transition-colors hover:border-white/55 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
          >
            Solicitar cotação
          </Link>
        </div>
      </div>
    </section>
  );
}
