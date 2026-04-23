"use client";

import { useState, type ComponentType } from "react";
import Link from "next/link";
import {
  ArrowSquareOut,
  Briefcase,
  Buildings,
  CaretLeft,
  CaretRight,
  ChartBar,
  CursorClick,
  House,
  ImagesSquare,
  Phone,
  SignOut,
  Sparkle,
  Stack,
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
  "home-hero": Sparkle,
  "home-dna": Stack,
  feedbacks: CursorClick,
  jobs: Briefcase,
  "about-hero": Buildings,
  "contact-info": Phone,
  images: ImagesSquare,
  popup: CursorClick,
  analytics: ChartBar,
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
          "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-transparent transition-all duration-300",
          active
            ? "bg-white/10 text-white"
            : destructive
              ? "bg-red-500/8 text-rose-100 group-hover:bg-red-500/14 group-hover:text-white"
              : "bg-white/[0.06] text-white/72 group-hover:bg-white/10 group-hover:text-white"
        )}
      >
        <Icon size={20} weight={active ? "fill" : "duotone"} />
      </span>
      <span
        className={cn(
          "min-w-0 overflow-hidden whitespace-nowrap text-sm font-medium tracking-[-0.02em] transition-all duration-300",
          expanded
            ? "max-w-[180px] translate-x-0 opacity-100"
            : "max-w-0 -translate-x-2 opacity-0"
        )}
      >
        {label}
      </span>
      {showTooltip ? (
        <span className="pointer-events-none absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-xl border border-white/10 bg-slate-950/92 px-3 py-2 text-xs font-semibold text-white opacity-0 shadow-[0_18px_36px_rgba(2,6,23,0.3)] transition-all duration-200 group-hover:opacity-100 lg:block">
          {label}
        </span>
      ) : null}
    </>
  );

  const className = cn(
    "group relative flex h-[52px] w-full items-center rounded-[20px] border backdrop-blur-sm transition-all duration-300",
    expanded ? "justify-start gap-3 px-3" : "justify-center px-0",
    active
      ? "border-white/20 bg-white/12 text-white shadow-[0_24px_48px_rgba(3,7,18,0.26)]"
      : destructive
        ? "border-transparent text-rose-100/90 hover:border-red-500/18 hover:bg-red-500/12 hover:text-white"
        : "border-transparent text-white/70 hover:border-white/10 hover:bg-white/8 hover:text-white"
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
      <div className="relative flex h-full flex-col">
        <div
          className={cn(
            "border-b border-white/10",
            navigationExpanded
              ? "px-3 py-4 space-y-4"
              : "flex min-h-[112px] flex-col items-center justify-center gap-2.5 px-2 py-3.5"
          )}
        >
          <div
            className={cn(
              "flex items-center gap-3",
              navigationExpanded ? "justify-between" : "w-full justify-center pl-1"
            )}
          >
            <Link
              href={site.home}
              onClick={onCloseMobile}
              aria-label="Rodogarcia"
              className={cn(
                "group flex min-w-0 items-center gap-3 rounded-[22px] transition-all duration-300",
                navigationExpanded ? "pr-3" : "w-11 justify-center self-center translate-x-1"
              )}
            >
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] border border-white/14 bg-white/10 text-sm font-semibold tracking-[0.22em] text-white shadow-[0_18px_40px_rgba(2,6,23,0.28)] transition-all duration-200 group-hover:bg-white/16">
                RG
              </span>
              <span
                className={cn(
                  "overflow-hidden transition-all duration-300",
                  navigationExpanded ? "max-w-[160px] opacity-100" : "max-w-0 opacity-0"
                )}
              >
                <span className="block text-sm font-semibold tracking-[-0.03em] text-white">
                  Rodogarcia
                </span>
                <span className="block text-[11px] uppercase tracking-[0.2em] text-white/52">
                  Developer CMS
                </span>
              </span>
            </Link>

            {navigationExpanded && !mobile ? (
              <button
                type="button"
                onClick={onToggleExpanded}
                aria-label="Minimizar sidebar"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/12 bg-white/10 text-white transition-all duration-300 hover:bg-white/16"
              >
                <CaretLeft size={18} weight="bold" />
              </button>
            ) : null}
          </div>

          {!navigationExpanded && !mobile ? (
            <button
              type="button"
              onClick={onToggleExpanded}
              aria-label="Expandir sidebar"
              className="inline-flex h-10 w-10 self-center items-center justify-center rounded-2xl border border-white/12 bg-white/10 text-white transition-all duration-300 hover:bg-white/16"
            >
              <CaretRight size={18} weight="bold" />
            </button>
          ) : null}
        </div>

        <nav
          aria-label="Navegacao do painel"
          data-admin-scroll
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2 py-4"
        >
          <div className={cn(navigationExpanded ? "space-y-5" : "flex flex-col items-center gap-2")}>
            {adminNavigationGroups.map((group, groupIndex) => (
              <div
                key={group.key}
                className={cn(
                  navigationExpanded ? "space-y-2" : "flex w-full flex-col items-center gap-2"
                )}
              >
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
                      "rounded-full bg-white/10",
                      navigationExpanded ? "mx-2 h-px" : "mx-auto my-1 h-4 w-px"
                    )}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </nav>

        <div className="border-t border-white/10 px-2 py-4">
          <div className="space-y-2">
            <SidebarItem
              href={site.home}
              label="Voltar ao site"
              icon={ArrowSquareOut}
              onClick={onCloseMobile}
              expanded={navigationExpanded}
              showTooltip={!navigationExpanded}
            />
            <SidebarItem
              label={loggingOut ? "Saindo..." : "Encerrar sessao"}
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
          "relative hidden h-dvh shrink-0 border-r border-white/10 text-white transition-[width] duration-300 ease-out lg:flex",
          expanded ? "w-[268px]" : "w-[72px]"
        )}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#08101f_0%,#0c1730_58%,#11213c_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-black/20" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(56,189,248,0.1),transparent_22%),radial-gradient(circle_at_84%_14%,rgba(59,130,246,0.12),transparent_24%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.28)_1px,transparent_1px)] [background-size:34px_34px]" />
        <div className="relative h-full w-full backdrop-blur-[1px]">
          {renderNavigation({ navigationExpanded: expanded, mobile: false })}
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar navegacao"
            className="absolute inset-0 bg-[var(--color-overlay)] backdrop-blur-sm"
            onClick={onCloseMobile}
          />

          <aside className="relative h-dvh w-[280px] overflow-hidden border-r border-white/10 text-white shadow-[0_32px_80px_rgba(15,23,42,0.32)]">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,#08101f_0%,#0c1730_58%,#11213c_100%)]" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-black/20" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(56,189,248,0.1),transparent_22%),radial-gradient(circle_at_84%_14%,rgba(59,130,246,0.12),transparent_24%)]" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.28)_1px,transparent_1px)] [background-size:34px_34px]" />

            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Fechar menu"
              className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/12 bg-white/10 text-white shadow-[0_14px_32px_rgba(2,6,23,0.18)]"
            >
              <X size={18} weight="bold" />
            </button>

            <div className="relative h-full backdrop-blur-[1px]">
              {renderNavigation({ navigationExpanded: true, mobile: true })}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
