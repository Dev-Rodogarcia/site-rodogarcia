import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardText,
  EnvelopeSimple,
  PhoneCall,
  WhatsappLogo,
} from "@phosphor-icons/react/dist/ssr";
import {
  ActionLink,
  PageContainer,
  PageSection,
  PageShell,
  SectionHeader,
} from "@/components/internal/PageContent";
import { external, seo, site } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Cotação",
  description:
    "Solicite sua cotação de transporte direto pelo WhatsApp ou pelo formulário oficial da Rodogarcia.",
  alternates: { canonical: seo.absoluteUrl(site.quote) },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: seo.siteName,
    title: "Cotação | Rodogarcia Transportes",
    description:
      "Abra sua solicitação comercial pelo canal certo, com a mesma clareza visual da Home.",
    url: seo.absoluteUrl(site.quote),
    images: [{ url: seo.absoluteUrl("/foto1.png") }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cotação | Rodogarcia Transportes",
    description:
      "Página de cotação com WhatsApp direto e formulário integrado ao fluxo comercial.",
    images: [seo.absoluteUrl("/foto1.png")],
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};

const WHATSAPP_CHANNELS = [
  {
    tag: "Carga fracionada",
    title: "Distribuição e volumes menores",
    description:
      "Canal ideal para distribuição e volumes com maior frequência de embarque. Resposta ágil, direto com o time de cotação.",
    href: external.whatsappQuoteFractional,
    label: "Abrir WhatsApp — Fracionado",
  },
  {
    tag: "Carga fechada",
    title: "Lotação e operações especiais",
    description:
      "Melhor opção para lotação, projetos de maior volume e operações com requisito técnico específico.",
    href: external.whatsappQuoteFull,
    label: "Abrir WhatsApp — Lotação",
  },
];

const CONTACT_OPTIONS = [
  {
    icon: WhatsappLogo,
    title: "WhatsApp comercial",
    description: "Canal mais rápido para abrir conversa e pedir cotação.",
    action: { label: "Abrir WhatsApp", href: external.whatsappCommercial, external: true },
    accent: "text-emerald-500",
    accentBg: "bg-emerald-500/10",
    btnClass:
      "inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(34,197,94,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-600",
  },
  {
    icon: PhoneCall,
    title: "Telefone",
    description: `Ligue para ${external.phoneDisplay} e fale direto com o atendimento.`,
    action: { label: "Ligar agora", href: external.phoneHref, external: true },
    accent: "text-sky-500",
    accentBg: "bg-sky-500/10",
    btnClass:
      "inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-white/80 px-6 text-sm font-semibold text-[var(--foreground)] shadow-[0_14px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-surface-2)]",
  },
  {
    icon: EnvelopeSimple,
    title: "E-mail comercial",
    description: "Ideal para mensagens formais, briefings e envio de documentos.",
    action: { label: "Enviar e-mail", href: external.commercialEmail, external: true },
    accent: "text-[var(--primary)]",
    accentBg: "bg-[var(--primary)]/10",
    btnClass:
      "inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-white/80 px-6 text-sm font-semibold text-[var(--foreground)] shadow-[0_14px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-surface-2)]",
  },
  {
    icon: ClipboardText,
    title: "Formulário completo",
    description: "Prefere detalhar a carga por escrito? Preencha o formulário estruturado.",
    action: { label: "Abrir formulário", href: site.contact, external: false },
    accent: "text-slate-500",
    accentBg: "bg-slate-500/10",
    btnClass:
      "inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-white/80 px-6 text-sm font-semibold text-[var(--foreground)] shadow-[0_14px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-surface-2)]",
  },
];

const FINAL_CTA_POINTS = [
  "Contato institucional para demandas ainda em definição.",
  "Direcionamento rápido para o canal comercial adequado.",
  "Apoio inicial sem depender de formulário extenso.",
  "Central de ajuda disponível para dúvidas operacionais.",
];

export default function CotacaoPage() {
  return (
    <PageShell>
      {/* HERO — azul escuro, padrão /servicos */}
      <div className="relative overflow-hidden bg-[var(--foreground)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.1),transparent_40%),radial-gradient(circle_at_78%_14%,rgba(56,189,248,0.06),transparent_24%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.025)_0%,transparent_40%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:36px_36px]" />

        <section className="relative pt-20 sm:pt-24 lg:pt-28" aria-labelledby="cotacao-hero-title">
          <PageContainer>
            <div className="mx-auto max-w-[920px] py-10 text-center sm:py-12 lg:py-16">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200/80 backdrop-blur-sm">
                Solicitar proposta
              </span>

              <h1
                id="cotacao-hero-title"
                className="mx-auto mt-6 max-w-[16ch] text-[clamp(3rem,8vw,6rem)] font-bold leading-[0.9] tracking-[-0.05em] sm:max-w-[18ch] sm:tracking-[-0.07em]"
              >
                <span className="block bg-[linear-gradient(180deg,#a5f3fc_0%,#dbeafe_100%)] bg-clip-text text-transparent">
                  Cotação rápida,
                </span>
                <span className="mt-1 block text-white">pelo canal certo.</span>
              </h1>

              <p className="mx-auto mt-5 max-w-[42rem] text-sm leading-7 text-white/68 sm:text-base">
                Escolha o caminho mais direto: WhatsApp para resposta ágil, telefone para orientação, ou e-mail para detalhes formais.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <ActionLink
                  action={{
                    label: "Falar no WhatsApp",
                    href: external.whatsappCommercial,
                    external: true,
                  }}
                  tone="dark"
                />
                <ActionLink
                  action={{
                    label: "Ver contato completo",
                    href: site.contact,
                    variant: "secondary",
                  }}
                  tone="dark"
                />
              </div>
            </div>
          </PageContainer>
        </section>
      </div>

      {/* SEÇÃO 2 — clara: canais WhatsApp por tipo de carga */}
      <PageSection>
        <PageContainer>
          <SectionHeader
            eyebrow="WhatsApp comercial"
            title="Dois canais diretos para iniciar sua cotação agora."
            description="Escolha o canal conforme o tipo de carga. O time comercial responde com agilidade em ambos."
            align="center"
          />

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {WHATSAPP_CHANNELS.map((item) => (
              <div
                key={item.title}
                className="flex flex-col gap-4 border-b border-[var(--border)] pb-8 last:border-b-0 md:border-b-0 md:border-l md:pb-0 md:pl-8"
              >
                <span className="inline-flex w-fit items-center rounded-full bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600">
                  {item.tag}
                </span>
                <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
                  {item.title}
                </h3>
                <p className="text-sm leading-7 text-[var(--color-muted-raw)]">
                  {item.description}
                </p>
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 text-sm font-semibold text-white shadow-[0_16px_40px_rgba(34,197,94,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-[0_22px_48px_rgba(34,197,94,0.32)]"
                >
                  <WhatsappLogo size={18} weight="fill" />
                  {item.label}
                </a>
              </div>
            ))}
          </div>
        </PageContainer>
      </PageSection>

      {/* SEÇÃO 3 — azul escuro: todos os canais de contato */}
      <section className="relative overflow-hidden py-12 sm:py-16 lg:py-20">
        {/* Mesmo fundo do hero dark */}
        <div className="pointer-events-none absolute inset-0 bg-[var(--foreground)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.1),transparent_40%),radial-gradient(circle_at_78%_14%,rgba(56,189,248,0.06),transparent_24%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.025)_0%,transparent_40%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:36px_36px]" />

        <PageContainer>
          <div className="relative space-y-12">
            <SectionHeader
              eyebrow="Outros canais"
              title="Mais formas de falar com o time comercial."
              description="Prefere ligar, enviar e-mail ou preencher um formulário? Escolha o canal mais adequado."
              theme="dark"
              align="center"
            />

            <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-4">
              {CONTACT_OPTIONS.map((item) => (
                <div key={item.title} className="flex flex-col gap-4">
                  <span
                    className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${item.accentBg} ${item.accent}`}
                  >
                    <item.icon size={22} weight="duotone" />
                  </span>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold tracking-[-0.02em] text-white">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-7 text-white/58">{item.description}</p>
                  </div>
                  {item.action.external ? (
                    <a
                      href={item.action.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={item.btnClass}
                    >
                      {item.action.label}
                    </a>
                  ) : (
                    <Link href={item.action.href} className={item.btnClass}>
                      {item.action.label}
                      <ArrowRight size={16} weight="bold" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </PageContainer>
      </section>

      {/* CTA FINAL */}
      <section
        className="relative overflow-hidden py-16 sm:py-20 lg:py-24"
        aria-labelledby="cotacao-cta-final-title"
      >
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.62)_0%,rgba(241,245,249,0.94)_52%,rgba(255,255,255,0.72)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(29,78,216,0.08),transparent_20%),radial-gradient(circle_at_84%_24%,rgba(6,182,212,0.1),transparent_22%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.22] [background-image:linear-gradient(rgba(29,78,216,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(29,78,216,0.08)_1px,transparent_1px)] [background-size:34px_34px]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--primary)]/16 to-transparent" />

        <PageContainer>
          <div className="relative grid gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:items-end lg:gap-16">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
                Se quiser alinhar antes
              </span>
              <h2
                id="cotacao-cta-final-title"
                className="mt-3 max-w-[14ch] text-[clamp(2.2rem,4.3vw,4rem)] font-bold leading-[0.98] tracking-[-0.05em] text-[var(--foreground)]"
              >
                Também atendemos por contato institucional.
              </h2>
              <p className="mt-5 max-w-[60ch] text-sm leading-7 text-[var(--color-muted-raw)] sm:text-base">
                Se a demanda ainda estiver no começo, você pode seguir para contato geral ou abrir a central de ajuda sem sair do mesmo fluxo.
              </p>

              <ul className="mt-10 grid gap-4 sm:grid-cols-2">
                {FINAL_CTA_POINTS.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 border-b border-[var(--border)] pb-4 last:border-b-0 sm:last:border-b sm:odd:last:border-b-0"
                  >
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]" />
                    <span className="text-sm leading-7 text-[var(--color-muted-raw)]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-4 lg:border-l lg:border-[var(--border)] lg:pl-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                Próximo passo
              </p>
              <p className="max-w-[34ch] text-sm leading-7 text-[var(--color-muted-raw)]">
                Escolha o canal mais confortável para abrir a conversa. Os dois CTAs continuam grandes, diretos e prontos para fechamento da jornada.
              </p>

              <Link
                href={site.contact}
                className="group inline-flex min-h-[64px] w-full items-center justify-center rounded-full bg-[var(--primary)] px-8 text-[15px] font-extrabold tracking-tight text-white shadow-[0_12px_32px_rgba(2,132,199,0.25)] transition-all duration-200 hover:-translate-y-1 hover:bg-[var(--color-primary-strong)] hover:shadow-[0_20px_48px_rgba(2,132,199,0.35)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--primary)]/30"
              >
                <span className="flex items-center gap-3">
                  Abrir contato
                  <ArrowRight size={18} weight="bold" className="transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </Link>

              <Link
                href={site.help}
                className="group inline-flex min-h-[64px] w-full items-center justify-center rounded-full bg-slate-900 px-8 text-[15px] font-bold tracking-tight text-white shadow-[0_12px_32px_rgba(15,23,42,0.15)] transition-all duration-200 hover:-translate-y-1 hover:bg-slate-800 hover:shadow-[0_20px_48px_rgba(15,23,42,0.25)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/30"
              >
                <span className="flex items-center gap-3">
                  Central de ajuda
                  <ArrowRight size={18} weight="bold" className="transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </Link>
            </div>
          </div>
        </PageContainer>
      </section>
    </PageShell>
  );
}
