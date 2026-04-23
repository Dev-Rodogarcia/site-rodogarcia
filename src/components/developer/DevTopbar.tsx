"use client";

import { List } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { getAdminRouteContext } from "@/lib/routes";

interface DevTopbarProps {
  onOpenNavigation: () => void;
}

export default function DevTopbar({ onOpenNavigation }: DevTopbarProps) {
  const pathname = usePathname();
  const { session } = useSession();
  const routeContext = getAdminRouteContext(pathname);
  const isDashboard = routeContext.item.key === "dashboard";

  return (
    <header className="relative -ml-px overflow-hidden border-b border-white/10 text-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#08101f_0%,#0c1730_58%,#11213c_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-black/20" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_18%_16%,rgba(56,189,248,0.08),transparent_22%),radial-gradient(circle_at_86%_18%,rgba(59,130,246,0.1),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.3)_1px,transparent_1px)] [background-size:34px_34px]" />

      <div className="relative flex min-h-[92px] items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenNavigation}
          aria-label="Abrir navegacao"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/12 bg-white/10 text-white shadow-[0_14px_32px_rgba(2,6,23,0.18)] lg:hidden"
        >
          <List size={20} weight="bold" />
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-100/62">
            Developer CMS
          </p>
          <h1 className="mt-2 text-[1.72rem] font-bold tracking-[-0.05em] text-white">
            Painel Admin
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/58">
            <span className="font-medium text-white/76">Dashboard</span>
            {!isDashboard ? (
              <>
                <span className="text-white/34">/</span>
                <span className="font-semibold text-white">{routeContext.item.label}</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          <div className="rounded-[20px] border border-white/12 bg-white/10 px-4 py-3 text-right shadow-[0_16px_34px_rgba(2,6,23,0.16)] backdrop-blur-sm">
            <p className="max-w-[240px] truncate text-sm font-semibold text-white">
              {session?.user?.email ?? "Acesso interno"}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/50">Sessao interna</p>
          </div>
        </div>
      </div>
    </header>
  );
}
