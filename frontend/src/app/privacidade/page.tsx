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
import { LockKey, ShieldCheck } from "@phosphor-icons/react/dist/ssr";

const fallbackMetadata: Metadata = {
  title: "Privacidade",
  description:
    "Entenda como a Rodogarcia trata os dados enviados pelos formulários e canais digitais do site.",
  alternates: { canonical: seo.absoluteUrl(site.privacy) },
  robots: { index: true, follow: true },
};

export async function generateMetadata(): Promise<Metadata> {
  return buildCmsMetadata(site.privacy, fallbackMetadata);
}

export default async function PrivacidadePage() {
  const { privacy } = await fetchFooterLinksContent();

  return (
    <PageShell>
      <div className="relative overflow-hidden bg-slate-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.15),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:32px_32px]" />

        <section className="relative pt-20 sm:pt-24 lg:pt-28" aria-labelledby="privacidade-hero-title">
          <PageContainer>
            <div className="mx-auto max-w-[860px] py-10 text-center sm:py-12 lg:py-16">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200/80 backdrop-blur-sm">
                {privacy.hero.eyebrow}
              </span>

              <h1
                id="privacidade-hero-title"
                className="mx-auto mt-6 max-w-[18ch] text-[clamp(2.6rem,6vw,5rem)] font-bold leading-[0.92] tracking-[-0.05em] sm:tracking-[-0.06em]"
              >
                <span className="block bg-[linear-gradient(180deg,#a5f3fc_0%,#dbeafe_100%)] bg-clip-text text-transparent">
                  {privacy.hero.titleHighlight}
                </span>
                <span className="mt-1 block text-white">{privacy.hero.titleRest}</span>
              </h1>

              <p className="mx-auto mt-5 max-w-[44rem] text-sm leading-7 text-white/68 sm:text-base">
                {privacy.hero.description}
              </p>
            </div>
          </PageContainer>
        </section>
      </div>

      <PageSection>
        <PageContainer>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div>
              <SectionHeader
                eyebrow="Resumo rápido"
                title="Privacidade aplicada aos canais oficiais do site."
                description="A política explica quais informações podem ser recebidas, por que elas são usadas e como o titular pode solicitar orientação."
              />
              <p className="mt-6 text-sm leading-7 text-[var(--color-muted-raw)]">
                O tratamento de dados está relacionado aos formulários de contato, cotação, carreira e demais interações feitas voluntariamente pelo usuário nos canais digitais oficiais.
              </p>
            </div>

            <aside className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--color-surface-2)] p-6">
              <ShieldCheck size={24} weight="duotone" className="text-[var(--primary)]" />
              <h3 className="font-semibold tracking-[-0.02em] text-[var(--foreground)]">
                LGPD e transparência
              </h3>
              <p className="text-sm leading-7 text-[var(--color-muted-raw)]">
                As informações são usadas para atendimento institucional e comercial, respeitando finalidade, necessidade e segurança.
              </p>
              <ActionLink
                action={toPageAction(privacy.hero.button)}
                className="mt-2 w-full"
              />
            </aside>
          </div>
        </PageContainer>
      </PageSection>

      <section className="relative overflow-hidden bg-slate-950 py-12 sm:py-16 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.15),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:32px_32px]" />

        <PageContainer className="relative">
          <SectionHeader
            eyebrow={privacy.dataSection.eyebrow}
            title={privacy.dataSection.title}
            description={privacy.dataSection.description}
            theme="dark"
            align="center"
          />

          <div className="mx-auto mt-12 max-w-3xl space-y-8">
            {privacy.dataSection.blocks.map((section) => (
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
                  <LockKey size={24} weight="duotone" />
                </span>
                <div>
                  <h2 className="text-[clamp(1.5rem,2.4vw,2.2rem)] font-bold leading-[1.2] tracking-[-0.03em] text-[var(--foreground)]">
                    {privacy.finalCta.title}
                  </h2>
                  <p className="mt-4 max-w-[64ch] text-sm leading-7 text-[var(--color-muted-raw)] sm:text-base">
                    {privacy.finalCta.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row lg:flex-col">
                {privacy.finalCta.buttons.slice(0, 2).map((button, index) => (
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
