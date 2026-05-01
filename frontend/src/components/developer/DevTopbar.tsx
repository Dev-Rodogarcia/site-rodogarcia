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
    <header className="relative z-40 mx-3 mt-3 overflow-hidden rounded-lg border border-white/10 bg-slate-950/95 text-white shadow-[0_8px_24px_rgba(0,0,0,0.1)] backdrop-blur-xl sm:mx-4 sm:mt-4 lg:mx-6">
      {/* Padrão DNA fornecido */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.15),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:32px_32px]" />
      
      {/* Efeito de profundidade e brilho do vidro */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-white/0 via-white/25 to-white/0 opacity-50" />

      <div className="relative flex min-h-[62px] items-center gap-3 px-4 py-3 sm:px-5 lg:gap-4 lg:px-6">
        <button
          type="button"
          onClick={onOpenNavigation}
          aria-label="Abrir navegação"
          className="group inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/90 shadow-sm backdrop-blur-md transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] active:scale-95 lg:hidden"
        >
          <List size={22} weight="bold" className="transition-transform group-hover:scale-110" />
        </button>

        <div className="flex min-w-0 flex-1 flex-col justify-center py-1">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300/80 sm:text-[11px]">
            Developer CMS
          </p>
          <h1 className="text-2xl font-bold leading-tight tracking-[-0.02em] text-white drop-shadow-sm sm:text-[1.75rem]">
            Painel Admin
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs sm:text-[13px]">
            <span className="font-medium text-slate-300">Dashboard</span>
            {!isDashboard ? (
              <>
                <span className="text-slate-500">/</span>
                <span className="font-semibold text-white drop-shadow-sm">{routeContext.item.label}</span>
              </>
            ) : null}
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-3 sm:flex">
          <div className="flex flex-col items-end justify-center rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-right shadow-sm backdrop-blur-md transition-colors duration-200 hover:border-white/20 hover:bg-white/[0.07]">
            <p className="max-w-[200px] truncate text-sm font-medium text-white/95 lg:max-w-[240px]">
              {session?.user?.email ?? "Acesso interno"}
            </p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-sky-400/80">
              Sessão interna
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
