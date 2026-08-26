import type { Metadata } from "next";
import {
  ChatCircleDots,
  CheckCircle,
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
  SemanticLink,
  SectionHeader,
  SurfaceCard,
  SurfaceSection,
} from "@/components/internal/PageContent";
import { fetchPublicContent } from "@/lib/api";
import { buildCmsMetadata } from "@/lib/cmsPublic";
import { external, seo, site } from "@/lib/routes";
import type { ContactPageContent } from "@/types/content";

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
    images: [{ url: seo.absoluteUrl("/foto1.webp") }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fale Conosco | Rodogarcia Transportes",
    description:
      "Entre em contato com a Rodogarcia pelo canal mais adequado para sua necessidade.",
    images: [seo.absoluteUrl("/foto1.webp")],
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

const FALLBACK_CONTACT_PAGE: ContactPageContent = {
  heroWhatsappButton: {
    label: "Abrir WhatsApp",
    url: external.whatsappCommercial,
    external: true,
  },
  mainChannels: [
    {
      id: "phone",
      order: 1,
      title: "Telefone",
      description: "Canal direto para orientação inicial e alinhamento rápido.",
      button: { label: "Ligar agora", url: external.phoneHref, external: true },
    },
    {
      id: "email",
      order: 2,
      title: "E-mail comercial",
      description: "Ideal para mensagens formais, anexos e alinhamentos com contexto.",
      button: { label: "Enviar e-mail", url: external.commercialEmail, external: true },
    },
    {
      id: "whatsapp",
      order: 3,
      title: "WhatsApp comercial",
      description: "Canal mais rápido para abrir conversa e pedir direcionamento.",
      button: { label: "Abrir WhatsApp", url: external.whatsappCommercial, external: true },
    },
  ],
  info: {
    items: [
      { id: "phone", order: 1, label: "Telefone", title: external.phoneDisplay, description: "segunda a sexta, das 8h as 18h" },
      { id: "email", order: 2, label: "E-mail", title: external.commercialEmailAddress, description: "conforme ordem de atendimento" },
      { id: "whatsapp", order: 3, label: "WhatsApp", title: "atendimento Rodogarcia", description: external.whatsappCommercial },
      { id: "address", order: 4, label: "Endereço", title: "Rua Pedro Carmine Deo, 156, Agudos - SP", description: "CEP 17123-210 - Brasil" },
    ],
    companyTitle: "Rodogarcia Transportes",
    address: "Rua Pedro Carmine Deo, 156, Agudos - SP, CEP 17123-210",
    hours: "segunda a sexta, das 8h as 18h",
    channelGuideTitle: "Qual canal usar?",
    channelGuideDescription: "Use WhatsApp para cotações e e-mail para briefings com anexos.",
    documentsDescription: "O e-mail continua sendo o melhor canal para briefing, documentos e materiais.",
    quickSupportDescription: "Telefone para orientação inicial e direcionamento do atendimento.",
    indicators: [
      { id: "commercial-return", order: 1, value: "< 2h", description: "retorno comercial em dias úteis" },
      { id: "whatsapp-return", order: 2, value: "Imediato", description: "WhatsApp para primeiro contato" },
    ],
  },
  finalCta: {
    buttons: [
      { label: "Solicitar cotação", url: site.quote },
      { label: "Central de ajuda", url: site.help },
    ],
  },
};

export default async function FaleConoscoPage() {
  const content = await fetchPublicContent();
  const contactPage = content.data?.contactPage ?? FALLBACK_CONTACT_PAGE;
  const channelIcons = [PhoneCall, EnvelopeSimple, ChatCircleDots];
  const channelTones = [
    "inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(29,78,216,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-primary-strong)]",
    "inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-white px-6 py-3 text-sm font-semibold text-[var(--foreground)] shadow-[0_14px_30px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-surface-2)]",
    "inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(34,197,94,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-600",
  ];
  const channels = contactPage.mainChannels.map((item, index) => ({
    ...item,
    icon: channelIcons[index] ?? ChatCircleDots,
    tone: channelTones[index] ?? channelTones[1],
  }));

  return (
    <PageShell>
      <PageHero
        eyebrow="Contato e atendimento"
        title="Fale com a Rodogarcia"
        description="Estamos prontos para apoiar cotações, suporte operacional e orientações gerais."
        primaryAction={{
          label: contactPage.heroWhatsappButton.label,
          href: contactPage.heroWhatsappButton.url,
          external: contactPage.heroWhatsappButton.external,
        }}
        tone="dark"
        align="center"
      />

      <SurfaceSection contentClassName="space-y-8">
        <SectionHeader
          eyebrow="Canais principais"
          title="Escolha o canal mais adequado para cada situação."
          description="Escolha o canal mais adequado para sua necessidade e fale com a equipe Rodogarcia."
          align="center"
        />

        <div className="grid gap-4 min-[1200px]:grid-cols-3">
          {channels.map((item) => (
            <SurfaceCard
              key={item.title}
              className="flex h-full flex-col [&>div.relative]:flex [&>div.relative]:h-full [&>div.relative]:flex-col"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                <item.icon size={22} weight="duotone" />
              </span>
              <h2 className="mt-4 text-[1.45rem] font-semibold tracking-[-0.04em] text-[var(--foreground)]">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted-raw)]">
                {item.description}
              </p>
              <div className="mt-6 min-[1200px]:mt-auto min-[1200px]:pt-6">
                <SemanticLink
                  href={item.button.url}
                  external={item.button.external}
                  className={item.tone}
                >
                  {item.button.label}
                </SemanticLink>
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
                Informações oficiais
              </span>
              <h2
                id="contato-info-title"
                className="mt-3 text-[clamp(1.9rem,3.2vw,3rem)] font-semibold leading-[1] tracking-[-0.05em] text-white"
              >
                Canais, horário e dados da matriz.
              </h2>
              <p className="mt-4 max-w-[58ch] text-sm leading-7 text-white/62 sm:text-base">
                Canais oficiais reunidos para agilizar seu atendimento comercial e operacional.
              </p>

              <div className="mt-8 border-t border-white/10">
                {contactPage.info.items.map((item) => (
                  <div
                    key={item.label}
                    className="grid gap-2 border-b border-white/10 py-5 sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-6"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200/78">
                      {item.label}
                    </p>
                    <div>
                      <p className="text-base font-semibold tracking-[-0.02em] text-white sm:text-[1.05rem]">
                        {item.title}
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
                  {contactPage.info.companyTitle}
                </h3>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-white/62">
                  <li className="flex items-start gap-2">
                    <MapPinLine size={18} weight="duotone" className="mt-1 text-sky-300" />
                    {contactPage.info.address}
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock size={18} weight="duotone" className="mt-1 text-sky-300" />
                    {contactPage.info.hours}
                  </li>
                </ul>
              </div>

              <div className="mt-8 border-t border-white/10 pt-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200/78">
                  {contactPage.info.channelGuideTitle}
                </p>
                <div className="mt-4 space-y-5">
                  {[
                    {
                      title: contactPage.info.channelGuideTitle,
                      description: contactPage.info.channelGuideDescription,
                    },
                    {
                      title: "Documentos e anexos",
                      description: contactPage.info.documentsDescription,
                    },
                    {
                      title: "Apoio rápido",
                      description: contactPage.info.quickSupportDescription,
                    },
                  ].map((item) => (
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
                  {contactPage.info.indicators.map((indicator) => (
                    <p key={indicator.id} className="text-sm text-white/60">
                      <span className="font-bold text-sky-300">{indicator.value}</span> - {indicator.description}
                    </p>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-14 sm:py-16 lg:py-20">
        <PageContainer>
          <div className="flex flex-col items-center justify-between gap-12 rounded-[2rem] border border-[var(--border)] bg-white/60 p-8 shadow-sm backdrop-blur-md lg:flex-row lg:p-12 xl:p-16">
            <div className="flex max-w-2xl flex-col items-start text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/10 bg-[var(--primary)]/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--primary)] backdrop-blur-sm">
                Próximo passo
              </span>
              <h2 className="mt-6 text-[clamp(2rem,3.5vw,2.8rem)] font-extrabold leading-[1.08] tracking-[-0.04em] text-[var(--foreground)]">
                Se o objetivo já estiver claro, siga pelo canal comercial.
              </h2>
              <p className="mt-5 text-[15px] leading-8 text-[var(--color-muted-raw)] sm:text-base">
                Para cotação, atendimento ou orientação inicial, use o botão principal. Se ainda restar alguma dúvida sobre canais e rastreio, a central de ajuda continua disponível.
              </p>

              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
                {["Dados oficiais", "Canal comercial", "Fluxo sem ruído"].map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]/80"
                  >
                    <CheckCircle size={18} weight="fill" className="text-[var(--primary)]" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid w-full shrink-0 grid-cols-1 gap-3 sm:flex sm:flex-row sm:gap-4 lg:w-auto lg:flex-col">
              <ActionLink
                action={{
                  label: contactPage.finalCta.buttons[0]?.label || "Solicitar cotação",
                  href: contactPage.finalCta.buttons[0]?.url || site.quote,
                  external: contactPage.finalCta.buttons[0]?.external,
                }}
                className="min-h-[64px] w-full min-w-0 shadow-[0_12px_32px_rgba(29,78,216,0.22)] sm:min-w-[260px]"
              />
              <ActionLink
                action={{
                  label: contactPage.finalCta.buttons[1]?.label || "Central de ajuda",
                  href: contactPage.finalCta.buttons[1]?.url || site.help,
                  external: contactPage.finalCta.buttons[1]?.external,
                  variant: "secondary",
                }}
                className="min-h-[64px] w-full min-w-0 border-transparent bg-slate-900 text-[15px] text-white shadow-[0_12px_32px_rgba(15,23,42,0.15)] hover:bg-slate-800 hover:text-white hover:shadow-[0_20px_48px_rgba(15,23,42,0.25)] focus-visible:ring-slate-900/30 sm:min-w-[260px]"
              />
            </div>
          </div>
        </PageContainer>
      </section>
    </PageShell>
  );
}
