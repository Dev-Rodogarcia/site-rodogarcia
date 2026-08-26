"use client";

import { Moon, Sun, List } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import { getAdminRouteContext } from "@/lib/routes";
import { DeveloperHelp } from "./ui";
import { useDeveloperPageHeader } from "./DeveloperPageHeaderContext";

interface DevTopbarProps {
  onOpenNavigation: () => void;
  darkTheme: boolean;
  onToggleTheme: () => void;
}

export default function DevTopbar({ onOpenNavigation, darkTheme, onToggleTheme }: DevTopbarProps) {
  const pathname = usePathname();
  const { session } = useSession();
  const { header } = useDeveloperPageHeader();
  const routeContext = getAdminRouteContext(pathname);
  const title = header?.title ?? routeContext.item.label;
  const eyebrow = header?.eyebrow ?? "Developer CMS";
  const description = header?.description;
  const stats = header?.stats ?? [];

  return (
    <header className="relative z-40 mx-3 mt-3 overflow-hidden rounded-lg border border-white/10 bg-slate-950/95 text-white shadow-[0_8px_24px_rgba(0,0,0,0.1)] backdrop-blur-xl sm:mx-4 sm:mt-4 lg:mx-6">
      {/* Textura visual do painel */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.15),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:32px_32px]" />
      
      {/* Efeito de profundidade e brilho do vidro */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-white/0 via-white/25 to-white/0 opacity-50" />

      <div className="relative grid gap-3 px-4 py-3 sm:px-5 lg:grid-cols-[minmax(280px,1fr)_auto] lg:items-center lg:gap-5 lg:px-6">
        <button
          type="button"
          onClick={onOpenNavigation}
          aria-label="Abrir navegação"
          className="group absolute left-4 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/90 shadow-sm backdrop-blur-md transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)] active:scale-95 sm:left-5 lg:hidden"
        >
          <List size={22} weight="bold" className="transition-transform group-hover:scale-110" />
        </button>

        <div className="min-w-0 py-0.5 pl-13 lg:pl-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300/80 sm:text-[11px]">
            {eyebrow}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="text-xl font-bold leading-tight tracking-[-0.025em] text-white drop-shadow-sm sm:text-2xl">
              {title}
            </h1>
            <DeveloperHelp label={title} kind="page" />
          </div>
          {description ? <p className="mt-1 max-w-[62ch] truncate text-xs leading-5 text-slate-300 sm:text-[13px]" title={description}>{description}</p> : null}
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2 lg:justify-end">
          <div className="flex min-w-0 flex-wrap items-stretch gap-2">
            {stats.map((stat) => (
              <div key={stat.label} className="flex h-[54px] w-fit items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-3 shadow-sm backdrop-blur-md">
                <p className="shrink-0 whitespace-nowrap text-[9px] font-semibold uppercase leading-3 tracking-[0.14em] text-slate-300">
                  {stat.label}
                </p>
                <p className="shrink-0 text-xl font-bold leading-none tracking-[-0.04em] text-sky-200">
                  {stat.value}
                </p>
              </div>
            ))}
            {header?.actions ? (
              <div className="flex items-stretch gap-2 [&>a]:min-h-[54px] [&>a]:rounded-xl [&>button]:min-h-[54px] [&>button]:rounded-xl">
                {header.actions}
              </div>
            ) : null}
          </div>
          <div className="mx-1.5 hidden h-10 w-px shrink-0 bg-white/15 min-[1600px]:block" aria-hidden="true" />
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <div className="hidden h-[54px] flex-col items-end justify-center rounded-lg border border-white/10 bg-white/5 px-3 text-right shadow-sm backdrop-blur-md transition-colors duration-200 hover:border-white/20 hover:bg-white/[0.07] min-[1600px]:flex">
              <p className="max-w-[180px] truncate text-sm font-medium text-white/95 lg:max-w-[220px]">
                {session?.user?.email ?? "Acesso interno"}
              </p>
              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.15em] text-sky-400/80">Sessão interna</p>
            </div>
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={darkTheme ? "Ativar modo claro" : "Ativar modo noturno"}
              title={darkTheme ? "Ativar modo claro" : "Ativar modo noturno"}
              className={`cms-theme-toggle inline-flex h-[54px] w-[54px] items-center justify-center rounded-full border border-white/10 bg-white/5 ${darkTheme ? "cms-theme-toggle--dark !text-amber-200" : "text-sky-200"}`}
            >
              <span key={darkTheme ? "sun" : "moon"} className="cms-theme-toggle__icon">
                {darkTheme ? <Sun size={19} weight="bold" /> : <Moon size={19} weight="bold" />}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
