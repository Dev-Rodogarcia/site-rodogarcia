import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  InstagramLogo,
  LinkedinLogo,
  FacebookLogo,
  WhatsappLogo,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { external, site } from "@/lib/routes";

const CURRENT_YEAR = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer
      className="bg-[var(--foreground)] pt-16 pb-8 text-[var(--color-surface)]"
      id="contato"
    >
      <div className="mx-auto w-full max-w-[1200px] px-6">
        <div className="grid grid-cols-1 gap-8 border-b border-white/10 pb-12 sm:grid-cols-2 sm:gap-10 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-5 sm:col-span-2 lg:col-span-1">
            <Link href={site.home} aria-label="Rodogarcia - Página inicial">
              <Image
                src="/logo.png"
                alt="Rodogarcia"
                width={160}
                height={30}
                className="brightness-0 invert"
              />
            </Link>
            <p className="max-w-[34ch] text-sm leading-7 text-white/60">
              Estruturamos operações de transporte, distribuição e
              rastreabilidade com consistência e cobertura nacional.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={site.quote}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-primary-strong)] hover:shadow-[0_16px_36px_rgba(29,78,216,0.22)] sm:w-auto"
              >
                Receber proposta
              </Link>
              <Link
                href={site.contact}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-emerald-500 px-5 py-3 text-sm font-medium text-white shadow-[0_18px_44px_rgba(34,197,94,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-[0_22px_52px_rgba(22,163,74,0.38)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/24 sm:w-auto"
              >
                Falar com atendimento
              </Link>
            </div>
          </div>

          <FooterColumn title="Serviços">
            <FooterLink href={site.services}>Transporte rodoviario</FooterLink>
            <FooterLink href={site.services}>Distribuição e logística</FooterLink>
            <FooterLink href={site.quote}>Solicitar cotação</FooterLink>
            <FooterLink href={external.tracking} external>
              Rastrear encomenda
            </FooterLink>
            <FooterLink href={site.business}>Para empresas</FooterLink>
          </FooterColumn>

          <FooterColumn title="Empresa">
            <FooterLink href={site.home}>Início</FooterLink>
            <FooterLink href={site.about}>Sobre a Rodogarcia</FooterLink>
            <FooterLink href={site.careers}>Carreiras</FooterLink>
            <FooterLink href={site.press}>Imprensa</FooterLink>
            <FooterLink href={site.terms}>Termos de uso</FooterLink>
          </FooterColumn>

          <FooterColumn title="Recursos">
            <FooterLink href={site.help}>Central de ajuda</FooterLink>
            <FooterLink href={site.contact}>Atendimento comercial</FooterLink>
            <FooterLink href={external.commercialEmail}>E-mail comercial</FooterLink>
            <FooterLink href={external.phoneHref}>{external.phoneDisplay}</FooterLink>
          </FooterColumn>

          <FooterColumn title="Horario de atendimento">
            <li className="text-sm leading-7 text-white/60">
              <span className="font-medium text-white/80">Segunda a Sexta:</span>{" "}
              08:00 as 18:00
            </li>
            <li className="text-sm leading-7 text-white/60">
              <span className="font-medium text-white/80">Sábado:</span> 08:00 as
              12:00
            </li>
            <li className="text-sm leading-7 text-white/60">
              <span className="font-medium text-white/80">
                Domingo e Feriados:
              </span>{" "}
              Fechado
            </li>
          </FooterColumn>

          <FooterColumn
            title="Redes Sociais"
            listClassName="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-2.5"
          >
            <FooterSocialLink
              href="#"
              icon={<InstagramLogo size={16} weight="fill" />}
              label="Instagram"
            >
              Instagram
            </FooterSocialLink>
            <FooterSocialLink
              href="#"
              icon={<LinkedinLogo size={16} weight="fill" />}
              label="LinkedIn"
            >
              LinkedIn
            </FooterSocialLink>
            <FooterSocialLink
              href="#"
              icon={<FacebookLogo size={16} weight="fill" />}
              label="Facebook"
            >
              Facebook
            </FooterSocialLink>
            <FooterSocialLink
              href="#"
              icon={<WhatsappLogo size={16} weight="fill" />}
              label="WhatsApp"
            >
              WhatsApp
            </FooterSocialLink>
          </FooterColumn>
        </div>

        <div className="flex flex-col gap-3 pt-8 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>
            &copy; {CURRENT_YEAR} Rodogarcia Transportes. Todos os direitos
            reservados.
          </span>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <Link
              href={site.terms}
              className="transition-colors hover:text-white/70"
            >
              Termos de uso
            </Link>
            <Link
              href={site.privacy}
              className="transition-colors hover:text-white/70"
            >
              Privacidade
            </Link>
            <span>Agudos, SP • Cobertura nacional</span>
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

function FooterLink({
  href,
  children,
  external,
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
}) {
  if (
    external ||
    href.startsWith("http") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  ) {
    return (
      <li>
        <a
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
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
        aria-label={`${label} da Rodogarcia`}
        className="flex min-h-11 items-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-sm text-white/64 transition-colors hover:border-white/16 hover:bg-white/6 hover:text-white"
      >
        {icon}
        {children}
      </a>
    </li>
  );
}
