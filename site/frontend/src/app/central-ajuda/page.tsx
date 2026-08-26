import type { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ActionLink,
  PageContainer,
  PageSection,
  PageShell,
  SectionHeader,
} from "@/components/internal/PageContent";
import { buildCmsMetadata } from "@/lib/cmsPublic";
import { fetchFooterLinksContent, toPageAction } from "@/lib/footerLinksPublic";
import { seo, site } from "@/lib/routes";
import {
  ChatCircleDots,
  Package,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";

const fallbackMetadata: Metadata = {
  title: "Central de Ajuda",
  description:
    "Encontre respostas para dúvidas sobre rastreamento, cotações, contato e serviços da Rodogarcia.",
  alternates: { canonical: seo.absoluteUrl(site.help) },
  robots: { index: true, follow: true },
};

const ICONS = {
  Package,
  ChatCircleDots,
  ShieldCheck,
} as const;

export async function generateMetadata(): Promise<Metadata> {
  return buildCmsMetadata(site.help, fallbackMetadata);
}

export default async function CentralAjudaPage() {
  const { help } = await fetchFooterLinksContent();

  return (
    <PageShell>
      <div className="relative overflow-hidden bg-slate-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.15),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:32px_32px]" />

        <section className="relative pt-20 sm:pt-24 lg:pt-28" aria-labelledby="central-ajuda-hero-title">
          <PageContainer>
            <div className="mx-auto max-w-[860px] py-10 text-center sm:py-12 lg:py-16">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200/80 backdrop-blur-sm">
                {help.hero.eyebrow}
              </span>

              <h1
                id="central-ajuda-hero-title"
                className="mx-auto mt-6 max-w-[18ch] text-[clamp(2.6rem,6vw,5rem)] font-bold leading-[0.92] tracking-[-0.05em] sm:tracking-[-0.06em]"
              >
                <span className="block bg-[linear-gradient(180deg,#a5f3fc_0%,#dbeafe_100%)] bg-clip-text text-transparent">
                  {help.hero.titleHighlight}
                </span>
                <span className="mt-1 block text-white">{help.hero.titleRest}</span>
              </h1>

              <p className="mx-auto mt-5 max-w-[44rem] text-sm leading-7 text-white/68 sm:text-base">
                {help.hero.description}
              </p>

              <div className="mt-8 grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:flex-row sm:items-center sm:justify-center">
                {help.hero.buttons.slice(0, 2).map((button, index) => (
                  <ActionLink
                    key={`${button.label}-${button.url}`}
                    action={toPageAction(button, index === 1 ? "secondary" : undefined)}
                    tone="dark"
                    className="w-full min-w-0 sm:w-auto"
                  />
                ))}
              </div>
            </div>
          </PageContainer>
        </section>
      </div>

      <PageSection>
        <PageContainer>
          <SectionHeader
            eyebrow={help.quickAccess.eyebrow}
            title={help.quickAccess.title}
            description={help.quickAccess.description}
            align="center"
          />

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {help.quickAccess.actions.map((item) => {
              const Icon = ICONS[item.icon as keyof typeof ICONS] ?? ChatCircleDots;
              return (
                <div
                  key={item.id}
                  className="group flex flex-col gap-5 border-l-2 border-[var(--primary)]/20 pl-6 transition-all duration-300 hover:border-[var(--primary)]/60"
                >
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] transition-all duration-300 group-hover:bg-[var(--primary)] group-hover:text-white">
                    <Icon size={24} weight="duotone" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--foreground)]">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-sm leading-7 text-[var(--color-muted-raw)]">
                      {item.description}
                    </p>
                  </div>
                  <ActionLink action={toPageAction(item.button, "secondary")} className="mt-auto" />
                </div>
              );
            })}
          </div>
        </PageContainer>
      </PageSection>

      <section
        className="relative overflow-hidden bg-slate-950 py-16 sm:py-20 lg:py-24"
        aria-labelledby="faq-title"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.15),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:32px_32px]" />

        <PageContainer className="relative">
          <div className="grid gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
            <div>
              <SectionHeader
                eyebrow={help.faq.eyebrow}
                title={help.faq.title}
                description={help.faq.description}
                theme="dark"
              />

              <div className="mt-10 flex flex-col gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300">
                    Telefone
                  </p>
                  <p className="mt-2 text-xl font-bold tracking-tight text-white">
                    {help.contactCard.phone}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-white/60">
                    {help.contactCard.hours}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300">
                    Guia de canais
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-7 text-white/60">
                    {help.contactCard.channelDescriptions.map((description) => (
                      <li key={description}>{description}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="lg:pt-8">
              <Accordion className="space-y-4" defaultValue={["faq-0"]}>
                {help.faq.items.map((item, index) => (
                  <AccordionItem
                    key={item.id}
                    value={`faq-${index}`}
                    className="rounded-[26px] border border-white/10 bg-white/[0.04] px-5 transition-colors duration-200 data-[open]:border-sky-300/24 data-[open]:bg-white/[0.07]"
                  >
                    <AccordionTrigger className="py-5 text-left text-base font-semibold tracking-[-0.02em] text-white hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 text-sm leading-7 text-white/62">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </PageContainer>
      </section>

      <PageSection>
        <PageContainer>
          <div className="rounded-[30px] bg-slate-950 p-6 text-white shadow-[0_24px_64px_rgba(15,23,42,0.16)] sm:p-8 lg:p-10">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200/78">
                  {help.finalSupport.eyebrow}
                </span>
                <h3 className="mt-3 text-[clamp(1.4rem,2.4vw,2rem)] font-bold leading-[1.16] tracking-[-0.03em] text-white">
                  {help.finalSupport.title}
                </h3>
                <p className="mt-4 max-w-[66ch] text-sm leading-7 text-white/64">
                  {help.finalSupport.description}
                </p>
              </div>

              <ActionLink
                action={toPageAction(help.finalSupport.button)}
                tone="dark"
                className="w-full bg-white text-[var(--foreground)] hover:bg-slate-100 sm:w-auto"
              />
            </div>
          </div>
        </PageContainer>
      </PageSection>
    </PageShell>
  );
}
