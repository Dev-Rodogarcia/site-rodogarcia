"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import {
  ArrowSquareOut,
  Briefcase,
  Buildings,
  CaretLeft,
  ChartBar,
  Cookie,
  CursorClick,
  EnvelopeSimple,
  House,
  ImagesSquare,
  ListMagnifyingGlass,
  MagnifyingGlass,
  Phone,
  SignOut,
  Sparkle,
  Stack,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import { usePathname, useRouter } from "next/navigation";
import { useApiRequest } from "@/hooks/useApiRequest";
import { adminNavigationGroups, api, auth, site } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface DevSidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  expanded: boolean;
  onToggleExpanded: () => void;
}

type SidebarIcon = ComponentType<{
  size?: number;
  weight?: "duotone" | "fill" | "regular" | "bold" | "light" | "thin";
  className?: string;
}>;

const iconMap: Record<string, SidebarIcon> = {
  dashboard: House,
  home: Sparkle,
  "home-hero": Sparkle,
  "home-dna": Stack,
  feedbacks: CursorClick,
  services: Stack,
  "about-page": Buildings,
  "business-page": Buildings,
  "contact-page": Phone,
  "careers-page": Briefcase,
  "quote-page": EnvelopeSimple,
  jobs: Briefcase,
  "about-hero": Buildings,
  "contact-info": Phone,
  images: ImagesSquare,
  popup: CursorClick,
  cookies: Cookie,
  analytics: ChartBar,
  tracking: ListMagnifyingGlass,
  leads: EnvelopeSimple,
  seo: MagnifyingGlass,
  users: UsersThree,
};

function SidebarItem({
  href,
  label,
  active,
  icon: Icon,
  onClick,
  expanded,
  destructive = false,
  showTooltip,
}: {
  href?: string;
  label: string;
  active?: boolean;
  icon: SidebarIcon;
  onClick?: () => void;
  expanded: boolean;
  destructive?: boolean;
  showTooltip: boolean;
}) {
  const content = (
    <>
      <span
        className={cn(
          "inline-flex h-10 w-10 shrink-0 items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)]",
          active
            ? "text-sky-400 drop-shadow-[0_0_8px_rgba(14,165,233,0.3)]"
            : destructive
              ? "text-rose-400/80 group-hover:text-rose-300"
              : "text-slate-400 group-hover:text-slate-200"
        )}
      >
        <Icon size={expanded ? 18 : 20} weight={active ? "fill" : "duotone"} className="transition-all duration-500" />
      </span>
      <span
        className={cn(
          "min-w-0 overflow-hidden truncate whitespace-nowrap text-[13px] tracking-[0.01em] transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)]",
          expanded ? "max-w-[180px] ml-2.5 opacity-100 translate-x-0" : "max-w-0 ml-0 opacity-0 -translate-x-2",
          active ? "font-semibold text-white" : destructive ? "font-medium text-rose-300/80 group-hover:text-rose-200" : "font-medium text-slate-300 group-hover:text-white"
        )}
      >
        {label}
      </span>
      {showTooltip ? (
        <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-white opacity-0 shadow-xl transition-all duration-200 group-hover:opacity-100 lg:block">
          {label}
        </span>
      ) : null}
    </>
  );

  const className = cn(
    "group relative flex min-w-0 items-center outline-none transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] focus-visible:ring-2 focus-visible:ring-sky-500",
    "h-9 mx-2.5 rounded-lg border",
    active
      ? "border-sky-500/20 bg-sky-500/10 shadow-[0_2px_10px_rgba(14,165,233,0.08)]"
      : destructive
        ? "border-transparent hover:bg-rose-500/10"
        : "border-transparent hover:bg-white/[0.06]"
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={onClick}
        title={label}
        aria-label={label}
        className={className}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={className}
    >
      {content}
    </button>
  );
}

export default function DevSidebar({
  mobileOpen,
  onCloseMobile,
  expanded,
  onToggleExpanded,
}: DevSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { apiRequest } = useApiRequest();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await apiRequest(api.auth.logout, { method: "POST" });
    router.replace(auth.login);
  }

  function isActive(item: { href: string; exact?: boolean }) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  function renderNavigation({
    navigationExpanded,
    mobile,
  }: {
    navigationExpanded: boolean;
    mobile: boolean;
  }) {
    return (
      <div className="relative flex h-full w-full flex-col overflow-hidden">
        <div className="flex h-[62px] w-full shrink-0 items-center border-b border-white/5 transition-colors duration-500">
          <div className="flex w-full items-center justify-between px-3">
            <Link
              href={site.home}
              onClick={onCloseMobile}
              aria-label="Rodogarcia"
              className="group flex min-w-0 items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              <span
                className={cn(
                  "flex flex-col justify-center overflow-hidden whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)]",
                  navigationExpanded ? "max-w-[180px] opacity-100 translate-x-0" : "max-w-0 opacity-0 -translate-x-4"
                )}
              >
                <span className="block text-[15px] font-bold tracking-tight text-white transition-colors duration-200 group-hover:text-white/80">
                  Rodogarcia
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.15em] text-sky-400/80">
                  CMS
                </span>
              </span>
            </Link>

            <button
              type="button"
              onClick={onToggleExpanded}
              aria-label="Alternar sidebar"
              className={cn(
                "group relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] hover:bg-white/5 hover:text-white active:scale-95",
                navigationExpanded ? "bg-transparent" : "bg-white/[0.04] text-white hover:bg-white/[0.08]"
              )}
            >
              <CaretLeft 
                size={18} 
                weight="bold" 
                className={cn(
                  "transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)]",
                  navigationExpanded ? "rotate-0" : "rotate-180"
                )} 
              />
            </button>
          </div>
        </div>

        <nav
          aria-label="Navegação do painel"
          data-admin-scroll
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto py-3"
        >
            <div className={cn("flex flex-col transition-[gap] duration-500 ease-[cubic-bezier(0.2,0,0,1)]", navigationExpanded ? "gap-3" : "gap-2")}>
            {adminNavigationGroups.map((group, groupIndex) => (
              <div
                key={group.key}
                className={cn(
                  "flex w-full flex-col transition-[gap] duration-500 ease-[cubic-bezier(0.2,0,0,1)]",
                  navigationExpanded ? "gap-0.5" : "gap-1.5"
                )}
              >
                {navigationExpanded ? (
                  <p className="mx-5 mb-1 mt-1 truncate text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    {group.label}
                  </p>
                ) : null}
                {group.items.map((item) => {
                  const Icon = iconMap[item.key] ?? Stack;
                  return (
                    <SidebarItem
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      icon={Icon}
                      active={isActive(item)}
                      onClick={onCloseMobile}
                      expanded={navigationExpanded}
                      showTooltip={!navigationExpanded}
                    />
                  );
                })}
                {groupIndex < adminNavigationGroups.length - 1 ? (
                  <div
                    className={cn(
                      "rounded-full bg-white/10 transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] shrink-0",
                      navigationExpanded ? "mx-5 mt-3 h-px" : "mx-auto my-1 h-1 w-1"
                    )}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </nav>

        <div className="w-full shrink-0 border-t border-white/5 py-3">
          <div className={cn("flex w-full flex-col transition-[gap] duration-500 ease-[cubic-bezier(0.2,0,0,1)]", navigationExpanded ? "gap-1" : "gap-2")}>
            <SidebarItem
              href={site.home}
              label="Voltar ao site"
              icon={ArrowSquareOut}
              onClick={onCloseMobile}
              expanded={navigationExpanded}
              showTooltip={!navigationExpanded}
            />
            <SidebarItem
              label={loggingOut ? "Saindo..." : "Encerrar sessão"}
              icon={SignOut}
              onClick={handleLogout}
              expanded={navigationExpanded}
              destructive
              showTooltip={!navigationExpanded}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <aside
        className={cn(
          "relative hidden h-dvh shrink-0 border-r border-white/5 text-white transition-[width] duration-500 ease-[cubic-bezier(0.2,0,0,1)] lg:flex z-20 overflow-hidden",
          expanded ? "w-[230px]" : "w-[64px]"
        )}
      >
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.15),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="relative flex h-full w-full flex-col">
          {renderNavigation({ navigationExpanded: expanded, mobile: false })}
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar navegação"
            className="absolute inset-0 bg-[var(--color-overlay)] backdrop-blur-sm"
            onClick={onCloseMobile}
          />

          <aside className="relative flex h-dvh w-[280px] flex-col overflow-hidden border-r border-white/5 text-white shadow-[0_32px_80px_rgba(15,23,42,0.32)]">
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.15),transparent_60%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:32px_32px]" />

            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Fechar menu"
              className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/20 active:scale-95"
            >
              <X size={18} weight="bold" />
            </button>

            <div className="relative flex h-full flex-col">
              {renderNavigation({ navigationExpanded: true, mobile: true })}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
