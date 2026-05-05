"use client";

import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FacebookLogo,
  InstagramLogo,
  LinkedinLogo,
  WhatsappLogo,
} from "@phosphor-icons/react";
import type { FooterGlobalContent, FooterLinksContent } from "@/types/content";
import { DEFAULT_FOOTER_LINKS } from "@/lib/footerLinksDefaults";
import { cn } from "@/lib/utils";
import { site } from "@/lib/routes";

const CURRENT_YEAR = new Date().getFullYear();

const SOCIAL_ICONS: Record<
  string,
  ComponentType<{ size?: number; weight?: "fill" | "duotone" | "regular" | "bold" }>
> = {
  InstagramLogo,
  LinkedinLogo,
  FacebookLogo,
  WhatsappLogo,
};

function ordered<T extends { order?: number }>(items: T[] = []) {
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function SiteFooter() {
  const [footer, setFooter] = useState<FooterGlobalContent>(DEFAULT_FOOTER_LINKS.footer);

  useEffect(() => {
    let alive = true;

    async function loadFooterLinks() {
      try {
        const response = await fetch("/api/public/content", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { footerLinks?: FooterLinksContent };
        if (alive && data.footerLinks?.footer) {
          setFooter(data.footerLinks.footer);
        }
      } catch {
        // Keep the static fallback visible if the public API is unavailable.
      }
    }

    void loadFooterLinks();

    return () => {
      alive = false;
    };
  }, []);

  const columns = useMemo(() => ordered(footer.columns), [footer.columns]);
  const socialLinks = useMemo(() => ordered(footer.socialLinks), [footer.socialLinks]);
  const bottomLinks = useMemo(() => ordered(footer.bottomLinks), [footer.bottomLinks]);

  return (
    <footer
      className="relative overflow-hidden bg-slate-950 pt-16 pb-8 text-[var(--color-surface)]"
      id="contato"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.15),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="relative mx-auto w-full max-w-[1200px] px-6">
        <div className="grid grid-cols-1 gap-8 border-b border-white/10 pb-12 sm:grid-cols-2 sm:gap-10 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-5 sm:col-span-2 lg:col-span-1">
            <Link href={site.home} aria-label="Rodogarcia - Página inicial">
              <Image
                src="/logo.svg"
                alt="Rodogarcia"
                width={160}
                height={30}
                className="brightness-0 invert"
              />
            </Link>
            <p className="max-w-[34ch] text-sm leading-7 text-white/60">
              {footer.description}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <FooterButton href={footer.proposalButton.url} className="bg-[var(--primary)] font-semibold hover:bg-[var(--color-primary-strong)] hover:shadow-[0_16px_36px_rgba(29,78,216,0.22)]">
                {footer.proposalButton.label}
              </FooterButton>
              <FooterButton href={footer.supportButton.url} className="bg-emerald-500 font-medium shadow-[0_18px_44px_rgba(34,197,94,0.35)] hover:bg-emerald-600 hover:shadow-[0_22px_52px_rgba(22,163,74,0.38)] focus-visible:ring-emerald-500/24">
                {footer.supportButton.label}
              </FooterButton>
            </div>
          </div>

          {columns.map((column) => (
            <FooterColumn key={column.id} title={column.title}>
              {ordered(column.links).map((link) => (
                <FooterLink key={link.id} href={link.url} external={link.external}>
                  {link.label}
                </FooterLink>
              ))}
            </FooterColumn>
          ))}

          <FooterColumn title={footer.serviceHoursTitle}>
            {footer.serviceHours.map((hour) => (
              <li key={hour} className="text-sm leading-7 text-white/60">
                {hour}
              </li>
            ))}
          </FooterColumn>

          <FooterColumn
            title={footer.socialTitle}
            listClassName="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-2.5"
          >
            {socialLinks.map((link) => {
              const Icon = SOCIAL_ICONS[link.icon] ?? InstagramLogo;
              return (
                <FooterSocialLink
                  key={link.id}
                  href={link.url}
                  icon={<Icon size={16} weight="fill" />}
                  label={link.label}
                >
                  {link.label}
                </FooterSocialLink>
              );
            })}
          </FooterColumn>
        </div>

        <div className="flex flex-col gap-3 pt-8 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>
            &copy; {CURRENT_YEAR} {footer.copyrightText}
          </span>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            {bottomLinks.map((link) => (
              <FooterInlineLink key={link.id} href={link.url} external={link.external}>
                {link.label}
              </FooterInlineLink>
            ))}
            <span>{footer.locationText}</span>
            <span>
              <a
                href={footer.creditUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-white/56 transition-colors hover:text-white/80"
              >
                {footer.creditText}
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
  className,
  listClassName,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  listClassName?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-white/10 pt-6 sm:border-t-0 sm:pt-0",
        className
      )}
    >
      <h3 className="text-xs font-semibold uppercase tracking-widest text-white/40">
        {title}
      </h3>
      <ul className={cn("flex flex-col gap-2.5", listClassName)}>{children}</ul>
    </div>
  );
}

function isExternalHref(href: string, external?: boolean) {
  return (
    external ||
    href.startsWith("http") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  );
}

function FooterButton({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const buttonClassName = cn(
    "inline-flex min-h-12 w-full items-center justify-center rounded-full px-5 py-3 text-sm text-white transition-all duration-200 hover:-translate-y-0.5 sm:w-auto",
    className
  );

  if (isExternalHref(href)) {
    return (
      <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined} className={buttonClassName}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={buttonClassName}>
      {children}
    </Link>
  );
}

function FooterLink({
  href,
  children,
  external,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  if (isExternalHref(href, external)) {
    return (
      <li>
        <a
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
          className="block py-0.5 text-sm leading-7 text-white/60 transition-colors hover:text-white"
        >
          {children}
        </a>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={href}
        className="block py-0.5 text-sm leading-7 text-white/60 transition-colors hover:text-white"
      >
        {children}
      </Link>
    </li>
  );
}

function FooterInlineLink({
  href,
  children,
  external,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  const className = "transition-colors hover:text-white/70";

  if (isExternalHref(href, external)) {
    return (
      <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined} className={className}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function FooterSocialLink({
  href,
  icon,
  label,
  children,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <li>
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        aria-label={`${label} da Rodogarcia`}
        className="flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-sm text-white/64 transition-colors hover:border-white/16 hover:bg-white/6 hover:text-white"
      >
        {icon}
        {children}
      </a>
    </li>
  );
}
