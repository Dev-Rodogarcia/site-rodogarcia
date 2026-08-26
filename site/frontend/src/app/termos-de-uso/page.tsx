import type { Metadata } from "next";
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
import { Info } from "@phosphor-icons/react/dist/ssr";

const fallbackMetadata: Metadata = {
  title: "Termos de Uso",
  description:
    "Leia os termos de uso do site da Rodogarcia e entenda o escopo das informações e formulários disponíveis.",
  alternates: { canonical: seo.absoluteUrl(site.terms) },
  robots: { index: true, follow: true },
};

export async function generateMetadata(): Promise<Metadata> {
  return buildCmsMetadata(site.terms, fallbackMetadata);
}

export default async function TermosDeUsoPage() {
  const { terms } = await fetchFooterLinksContent();

  return (
    <PageShell>
      <div className="relative overflow-hidden bg-slate-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.15),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:32px_32px]" />

        <section className="relative pt-20 sm:pt-24 lg:pt-28" aria-labelledby="termos-hero-title">
          <PageContainer>
            <div className="mx-auto max-w-[860px] py-10 text-center sm:py-12 lg:py-16">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200/80 backdrop-blur-sm">
                {terms.hero.eyebrow}
              </span>

              <h1
                id="termos-hero-title"
                className="mx-auto mt-6 max-w-[18ch] text-[clamp(2.6rem,6vw,5rem)] font-bold leading-[0.92] tracking-[-0.05em] sm:tracking-[-0.06em]"
              >
                <span className="block bg-[linear-gradient(180deg,#a5f3fc_0%,#dbeafe_100%)] bg-clip-text text-transparent">
                  {terms.hero.titleHighlight}
                </span>
                <span className="mt-1 block text-white">{terms.hero.titleRest}</span>
              </h1>

              <p className="mx-auto mt-5 max-w-[44rem] text-sm leading-7 text-white/68 sm:text-base">
                {terms.hero.description}
              </p>
            </div>
          </PageContainer>
        </section>
      </div>

      <PageSection>
        <PageContainer>
          <div className="mx-auto max-w-[920px]">
            <div className="rounded-[30px] border border-[var(--border)] bg-white/72 p-6 shadow-[0_18px_46px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-8 lg:p-10">
              <SectionHeader
                eyebrow={terms.summary.eyebrow}
                title={terms.summary.title}
                description={terms.summary.description}
              />
              <p className="mt-6 text-sm leading-7 text-[var(--color-muted-raw)]">
                {terms.summary.body}
              </p>
              <ActionLink
                action={toPageAction(terms.summary.button)}
                className="mt-7 w-full sm:w-auto"
              />
            </div>
          </div>
        </PageContainer>
      </PageSection>

      <section className="relative overflow-hidden bg-slate-950 py-12 sm:py-16 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.15),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:32px_32px]" />

        <PageContainer className="relative">
          <SectionHeader
            eyebrow={terms.reading.eyebrow}
            title={terms.reading.title}
            description={terms.reading.description}
            theme="dark"
            align="center"
          />

          <div className="mx-auto mt-12 max-w-3xl space-y-8">
            {terms.reading.blocks.map((section) => (
              <div key={section.id} className="border-b border-white/10 pb-8 last:border-b-0 last:pb-0">
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">
                  {section.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/62">
                  {section.description}
                </p>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>

      <PageSection>
        <PageContainer>
          <div className="mx-auto max-w-[980px] rounded-[30px] border border-[var(--border)] bg-white/72 p-6 shadow-[0_22px_56px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="flex gap-5">
                <span className="mt-1 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                  <Info size={24} weight="duotone" />
                </span>
                <div>
                  <h2 className="text-[clamp(1.5rem,2.4vw,2.2rem)] font-bold leading-[1.2] tracking-[-0.03em] text-[var(--foreground)]">
                    {terms.finalCta.title}
                  </h2>
                  <p className="mt-4 max-w-[64ch] text-sm leading-7 text-[var(--color-muted-raw)] sm:text-base">
                    {terms.finalCta.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row lg:flex-col">
                {terms.finalCta.buttons.slice(0, 2).map((button, index) => (
                  <ActionLink
                    key={`${button.label}-${button.url}`}
                    action={toPageAction(button, index === 1 ? "secondary" : undefined)}
                    className="w-full min-w-0 sm:w-auto lg:w-full"
                  />
                ))}
              </div>
            </div>
          </div>
        </PageContainer>
      </PageSection>
    </PageShell>
  );
}
