"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Briefcase,
  Buildings,
  Calculator,
  ChatCircleDots,
  GearSix,
  HouseLine,
  Info,
  List,
  MagnifyingGlass,
  ShieldCheck,
  Truck,
  X,
} from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { drawerNavigation, site } from "@/lib/routes";
import { SiteSearchPanel } from "@/components/search/SiteSearchPanel";
import { useSiteSearch } from "@/components/search/SiteSearchProvider";

const DARK_HERO_ROUTES = [
  site.home,
  site.services,
  site.about,
  site.business,
  site.quote,
  site.collections,
  site.contact,
  site.careers,
  site.help,
  site.press,
  site.terms,
  site.privacy,
  site.voice,
  site.improvements,
] as const;

type MenuIcon = ComponentType<{
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  className?: string;
  "aria-hidden"?: boolean;
}>;

const MENU_ICONS: Record<string, MenuIcon> = {
  home: HouseLine,
  services: GearSix,
  about: Info,
  business: Buildings,
  contact: ChatCircleDots,
  careers: Briefcase,
  quote: Calculator,
  collections: Truck,
  voice: ShieldCheck,
};

function matchesRoute(pathname: string, href: string) {
  if (href === site.home) return pathname === site.home;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const {
    isOpen: searchOpen,
    openSearch,
    closeSearch,
    toggleSearch,
  } = useSiteSearch();
  const isHidden = useScrollDirection();
  const pathname = usePathname();
  const hasDarkHero = DARK_HERO_ROUTES.some((route) => matchesRoute(pathname, route));
  const hasSolidChrome = isScrolled || searchOpen;
  const isOverlay = !hasSolidChrome;
  const useLightChrome = isOverlay && hasDarkHero;

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;

      setIsScrolled((prev) => {
        if (!prev && scrollY > 120) return true;
        if (prev && scrollY < 60) return false;
        return prev;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  /* Ctrl+K / Cmd+K shortcut to open search */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleSearch();
        return;
      }

      if (e.key === "Escape" && searchOpen) {
        e.preventDefault();
        closeSearch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeSearch, searchOpen, toggleSearch]);

  useEffect(() => {
    closeSearch();
  }, [closeSearch, pathname]);

  useEffect(() => {
    if (drawerOpen) closeSearch();
  }, [drawerOpen, closeSearch]);

  useEffect(() => {
    if (searchOpen) setDrawerOpen(false);
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (headerRef.current?.contains(target)) return;
      closeSearch();
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [closeSearch, searchOpen]);

  const isActive = (href: string) => {
    if (href === site.home) return pathname === site.home;
    return pathname.startsWith(href);
  };

  const iconButtonClassName = [
    "p-2 rounded-full transition-colors duration-[400ms] ease-out z-10",
    useLightChrome ? "text-white hover:bg-white/10" : "text-[var(--foreground)] hover:bg-black/5",
  ].join(" ");

  const logoStateClassName = isOverlay
    ? useLightChrome
      ? "translate-y-4 scale-[1.30]"
      : "translate-y-2 scale-[1.14]"
    : "translate-y-0 scale-100";

  const quoteButtonClassName = [
    "p-2.5 rounded-full transition-all duration-[400ms] ease-out shadow-sm hover:shadow-md",
    useLightChrome
      ? "bg-white text-[var(--primary)] hover:bg-white/90 hover:-translate-y-0.5"
      : "bg-[var(--primary)] text-white hover:bg-[var(--color-primary-strong)] hover:-translate-y-0.5",
  ].join(" ");

  return (
    <>
      <header
        ref={headerRef}
        className={[
          "fixed top-0 inset-x-0 z-50",
          "transition-transform duration-[500ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          isHidden && isScrolled && !searchOpen ? "-translate-y-full pointer-events-none" : "translate-y-0",
        ].join(" ")}
        aria-label="Cabecalho do site"
      >
        <div
          className={[
            "absolute inset-0 transition-all duration-[500ms] ease-[cubic-bezier(0.16,1,0.3,1)] origin-top",
            hasSolidChrome
              ? "bg-white/94 translate-y-0 border-b border-slate-900/[0.06] opacity-100 shadow-[0_18px_60px_rgba(15,23,42,0.085)] backdrop-blur-xl"
              : "pointer-events-none -translate-y-full border-transparent bg-white/0 opacity-0 shadow-none backdrop-blur-none",
          ].join(" ")}
          aria-hidden="true"
        />

        <div className="relative mx-auto flex h-[4.5rem] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <div className="flex flex-1 justify-start">
            <button
              type="button"
              className={iconButtonClassName}
              aria-label={drawerOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={drawerOpen}
              aria-controls="site-mobile-nav"
              onClick={() => setDrawerOpen(true)}
            >
              <List size={22} weight="bold" />
            </button>
          </div>

          <Link
            href={site.home}
            className={[
              "absolute left-1/2 flex shrink-0 items-center -translate-x-1/2",
              "transition-all duration-[400ms] ease-out",
              logoStateClassName,
            ].join(" ")}
            aria-label="Rodogarcia - Pagina inicial"
            onClick={(e) => {
              if (pathname === site.home) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          >
            <Image
              src="/logo.svg"
              alt="Rodogarcia"
              width={160}
              height={30}
              priority
              className={[
                "transition-all duration-[400ms] ease-out",
                useLightChrome ? "brightness-0 invert drop-shadow-md" : "",
              ].join(" ")}
            />
          </Link>

          <div className="flex flex-1 items-center justify-end gap-0.5 sm:gap-2">
            <button
              type="button"
              id="site-search-trigger"
              className={["hidden sm:flex", iconButtonClassName].join(" ")}
              aria-label="Buscar no site (Ctrl+K)"
              title="Buscar (Ctrl+K)"
              aria-expanded={searchOpen}
              aria-controls="site-search-panel"
              onClick={openSearch}
            >
              <MagnifyingGlass size={22} weight="bold" />
            </button>
            <Link
              href={site.quote}
              className={quoteButtonClassName}
              aria-label="Solicitar cotação"
              title="Solicitar cotação"
            >
              <Calculator size={20} weight="bold" />
            </Link>
          </div>
        </div>

        <SiteSearchPanel open={searchOpen} onClose={closeSearch} />
      </header>

      <div
        className={[
          "fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-lg transition-all duration-[500ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          drawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        aria-hidden="true"
        onClick={() => setDrawerOpen(false)}
      />

      <aside
        id="site-mobile-nav"
        aria-label="Menu de navegacao"
        aria-hidden={!drawerOpen}
        className={[
          "fixed top-0 left-0 z-50 h-full w-80 max-w-[90vw] bg-white",
          "flex flex-col shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-center justify-between border-b border-black/8 px-6 py-5">
          <Image src="/logo.svg" alt="Rodogarcia" width={140} height={26} />
          <button
            type="button"
            aria-label="Fechar menu"
            className="rounded-full p-2 transition-colors hover:bg-black/5"
            onClick={() => setDrawerOpen(false)}
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-4">
          {drawerNavigation.map(({ href, label, key }) => {
            const Icon = MENU_ICONS[key] ?? Info;
            const active = isActive(href);

            return (
            <Link
              key={href}
              href={href}
              onClick={() => setDrawerOpen(false)}
              className={[
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-150",
                active
                  ? "bg-[var(--color-primary-soft)] text-[var(--primary)]"
                  : "text-[var(--foreground)] hover:bg-black/5",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
                  active
                    ? "border-[var(--primary)]/15 bg-white/70 text-[var(--primary)]"
                    : "border-slate-200/70 bg-slate-50 text-slate-500",
                ].join(" ")}
                aria-hidden="true"
              >
                <Icon size={17} weight={active ? "fill" : "duotone"} />
              </span>
              <span className="min-w-0 leading-none">{label}</span>
            </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-2 border-t border-black/8 p-4">
          <button
            type="button"
            onClick={() => { setDrawerOpen(false); openSearch(); }}
            className="w-full rounded-xl border border-black/12 px-4 py-2.5 text-left text-sm font-medium transition-colors hover:bg-black/5 flex items-center gap-2"
          >
            <MagnifyingGlass size={16} weight="bold" className="text-[var(--primary)]" aria-hidden="true" />
            Buscar no site
          </button>
          <Link
            href={site.quote}
            onClick={() => setDrawerOpen(false)}
            className="w-full rounded-xl bg-[var(--primary)] px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-strong)]"
          >
            Solicitar cotação
          </Link>
        </div>
      </aside>
    </>
  );
}
