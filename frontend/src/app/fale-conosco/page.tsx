import type { Metadata } from "next";
import {
  ChatCircleDots,
  Clock,
  EnvelopeSimple,
  MapPinLine,
  PhoneCall,
} from "@phosphor-icons/react/dist/ssr";
import {
  ActionLink,
  PageContainer,
  PageHero,
  PageShell,
  SectionHeader,
  SurfaceCard,
  SurfaceSection,
} from "@/components/internal/PageContent";
import { fetchPublicContent } from "@/lib/api";
import { buildCmsMetadata } from "@/lib/cmsPublic";
import { seo, site } from "@/lib/routes";
import {
  getContactSiteTexts,
  toEmailHref,
  toPhoneHref,
} from "@/lib/siteTexts";

export const dynamic = "force-dynamic";

const fallbackMetadata: Metadata = {
  title: "Fale Conosco",
  description:
    "Canais oficiais de contato da Rodogarcia para atendimento comercial, suporte e alinhamentos institucionais.",
  alternates: { canonical: seo.absoluteUrl(site.contact) },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: seo.siteName,
    title: "Fale Conosco | Rodogarcia Transportes",
    description:
      "Telefone, e-mail, WhatsApp e dados oficiais da Rodogarcia em um fluxo direto de atendimento.",
    url: seo.absoluteUrl(site.contact),
    images: [{ url: seo.absoluteUrl("/foto1.png") }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fale Conosco | Rodogarcia Transportes",
    description:
      "Entre em contato com a Rodogarcia pelo canal mais adequado para sua necessidade.",
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

export async function generateMetadata(): Promise<Metadata> {
  return buildCmsMetadata(site.contact, fallbackMetadata);
}

const CHANNEL_GUIDE = [
  {
    title: "Cotacao",
    description: "Use WhatsApp ou o CTA principal para iniciar um pedido comercial.",
  },
  {
    title: "Documentos e anexos",
    description: "O e-mail continua sendo o melhor canal para briefing e materiais.",
  },
  {
    title: "Apoio rapido",
    description: "Telefone para orientacao inicial e direcionamento do atendimento.",
  },
];

export default async function FaleConoscoPage() {
  const content = await fetchPublicContent();
  const contact = getContactSiteTexts(content.data?.siteTexts);

  const channels = [
    {
      icon: PhoneCall,
      title: "Telefone",
      description: "Canal direto para orientacao inicial e alinhamento rapido.",
      detail: contact.phoneNumber,
      supporting: contact.phoneHours,
      action: {
        label: "Ligar agora",
        href: toPhoneHref(contact.phoneNumber),
        variant: "secondary" as const,
      },
      tone:
        "inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(29,78,216,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-primary-strong)]",
    },
    {
      icon: EnvelopeSimple,
      title: "E-mail comercial",
      description: "Ideal para mensagens formais, anexos e alinhamentos com contexto.",
      detail: contact.emailAddress,
      supporting: contact.emailResponse,
      action: {
        label: "Enviar e-mail",
        href: toEmailHref(contact.emailAddress),
        variant: "secondary" as const,
      },
      tone:
        "inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--foreground)] shadow-[0_14px_30px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-surface-2)]",
    },
    {
      icon: ChatCircleDots,
      title: "WhatsApp comercial",
      description: "Canal mais rapido para abrir conversa e pedir direcionamento.",
      detail: contact.whatsappLabel,
      supporting: "Resposta agil para o primeiro contato comercial.",
      action: {
        label: "Abrir WhatsApp",
        href: contact.whatsappUrl,
        external: true,
      },
      tone:
        "inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(34,197,94,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-600",
    },
  ];

  return (
    <PageShell>
      <PageHero
        eyebrow="Contato e atendimento"
        title={contact.pageTitle}
        description={contact.pageSubtitle}
        primaryAction={{
          label: "Abrir WhatsApp",
          href: contact.whatsappUrl,
          external: true,
        }}
        secondaryAction={{
          label: contact.ctaLabel,
          href: contact.ctaUrl,
          variant: "secondary",
        }}
        tone="dark"
        align="center"
      />

      <SurfaceSection contentClassName="space-y-8">
        <SectionHeader
          eyebrow="Canais principais"
          title="Escolha o canal mais adequado para cada situacao."
          description="A pagina publica agora consome os mesmos dados editados no CMS interno."
          align="center"
        />

        <div className="grid gap-4 md:grid-cols-3">
          {channels.map((item) => (
            <SurfaceCard key={item.title} className="flex h-full flex-col">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                <item.icon size={22} weight="duotone" />
              </span>
              <h2 className="mt-4 text-[1.45rem] font-semibold tracking-[-0.04em] text-[var(--foreground)]">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted-raw)]">
                {item.description}
              </p>
              <p className="mt-4 text-sm font-semibold text-[var(--foreground)]">
                {item.detail}
              </p>
              <p className="mt-2 text-sm text-[var(--color-muted-raw)]">{item.supporting}</p>
              <div className="mt-6">
                <a
                  href={item.action.href}
                  target={item.action.external ? "_blank" : undefined}
                  rel={item.action.external ? "noopener noreferrer" : undefined}
                  className={item.tone}
                >
                  {item.action.label}
                </a>
              </div>
            </SurfaceCard>
          ))}
        </div>
      </SurfaceSection>

      <section
        className="relative overflow-hidden bg-slate-950 py-12 sm:py-16 lg:py-20"
        aria-labelledby="contato-info-title"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.15),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:32px_32px]" />

        <div className="relative mx-auto w-full max-w-[1440px] px-5 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)] lg:gap-14">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/52">
                Informacoes oficiais
              </span>
              <h2
                id="contato-info-title"
                className="mt-3 text-[clamp(1.9rem,3.2vw,3rem)] font-semibold leading-[1] tracking-[-0.05em] text-white"
              >
                Canais, horario e dados da matriz.
              </h2>
              <p className="mt-4 max-w-[58ch] text-sm leading-7 text-white/62 sm:text-base">
                Tudo o que aparece aqui vem do painel administrativo, sem depender do HTML legado.
              </p>

              <div className="mt-8 border-t border-white/10">
                {[
                  {
                    label: "Telefone",
                    value: contact.phoneNumber,
                    description: contact.phoneHours,
                  },
                  {
                    label: "E-mail",
                    value: contact.emailAddress,
                    description: contact.emailResponse,
                  },
                  {
                    label: "WhatsApp",
                    value: contact.whatsappLabel,
                    description: contact.whatsappUrl,
                  },
                  {
                    label: "Endereco",
                    value: contact.addressLine,
                    description: `${contact.addressZip} - ${contact.addressCountry}`,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="grid gap-2 border-b border-white/10 py-5 sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-6"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200/78">
                      {item.label}
                    </p>
                    <div>
                      <p className="text-base font-semibold tracking-[-0.02em] text-white sm:text-[1.05rem]">
                        {item.value}
                      </p>
                      <p className="mt-1 text-sm leading-7 text-white/62">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/10 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200/78">
                  Matriz
                </p>
                <h3 className="mt-3 text-[1.2rem] font-semibold tracking-[-0.03em] text-white">
                  Rodogarcia Transportes
                </h3>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-white/62">
                  <li className="flex items-start gap-2">
                    <MapPinLine size={18} weight="duotone" className="mt-1 text-sky-300" />
                    {contact.addressLine}, CEP {contact.addressZip}
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock size={18} weight="duotone" className="mt-1 text-sky-300" />
                    {contact.phoneHours}
                  </li>
                </ul>
              </div>

              <div className="mt-8 border-t border-white/10 pt-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200/78">
                  Qual canal usar?
                </p>
                <div className="mt-4 space-y-5">
                  {CHANNEL_GUIDE.map((item) => (
                    <div
                      key={item.title}
                      className="border-b border-white/10 pb-4 last:border-b-0 last:pb-0"
                    >
                      <h3 className="text-base font-semibold tracking-[-0.02em] text-white">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm leading-7 text-white/62">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 border-t border-white/10 pt-6">
                <div className="space-y-2">
                  <p className="text-sm text-white/60">
                    <span className="font-bold text-sky-300">{"< 2h"}</span> — retorno comercial em dias úteis
                  </p>
                  <p className="text-sm text-white/60">
                    <span className="font-bold text-sky-300">Imediato</span> — WhatsApp para primeiro contato
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-14 sm:py-16 lg:py-20">
        <PageContainer>
          <div className="rounded-[30px] border border-[var(--border)] bg-white/76 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.42fr)] lg:items-center">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
                  Próximo passo
                </span>
                <h2 className="mt-3 max-w-[15ch] text-[clamp(1.8rem,3vw,2.8rem)] font-bold leading-[1.08] tracking-[-0.04em] text-[var(--foreground)] sm:max-w-[18ch]">
                  Se o objetivo já estiver claro, siga pelo canal comercial.
                </h2>
                <p className="mt-5 max-w-[62ch] text-sm leading-7 text-[var(--color-muted-raw)] sm:text-base">
                  Para cotação, atendimento ou orientação inicial, use o botão principal. Se ainda restar alguma dúvida sobre canais e rastreio, a central de ajuda continua disponível.
                </p>

                <ul className="mt-7 flex flex-wrap gap-2.5">
                  {["Dados oficiais", "Canal comercial", "Fluxo sem ruído"].map((benefit) => (
                    <li
                      key={benefit}
                      className="rounded-full border border-[var(--border)] bg-white px-3.5 py-2 text-xs font-semibold text-[var(--foreground)]/72"
                    >
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[24px] border border-[var(--border)] bg-[var(--color-surface-2)] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
                  Ação recomendada
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3 lg:flex lg:flex-col">
                  <ActionLink
                    action={{
                      label: contact.ctaLabel,
                      href: contact.ctaUrl,
                    }}
                    className="w-full min-w-0"
                  />
                  <ActionLink
                    action={{
                      label: "Central de ajuda",
                      href: site.help,
                      variant: "secondary",
                    }}
                    className="w-full min-w-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>
    </PageShell>
  );
}
