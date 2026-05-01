import type { Metadata } from "next";
import Link from "next/link";
import {
  MapPinLine,
  Trophy,
  LightbulbFilament,
} from "@phosphor-icons/react/dist/ssr";
import { PageContainer, PageSection, PageShell, SectionHeader } from "@/components/internal/PageContent";
import { AboutHero } from "@/components/internal/AboutHero";
import { ValuesSection } from "@/components/internal/ValuesSection";
import { ComplianceSection } from "@/components/internal/ComplianceSection";
import { HistoryTimeline } from "@/components/internal/HistoryTimeline";
import { fetchPublicContent } from "@/lib/api";
import { buildCmsMetadata, fetchMediaSlots, mediaSlot } from "@/lib/cmsPublic";
import { seo, site } from "@/lib/routes";
import { getAboutSiteTexts } from "@/lib/siteTexts";

export const dynamic = "force-dynamic";

const fallbackMetadata: Metadata = {
  title: "Sobre a Rodogarcia",
  description:
    "Conheca a trajetoria, os valores e a estrutura que sustentam a Rodogarcia como operacao nacional de logistica.",
  alternates: { canonical: seo.absoluteUrl(site.about) },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: seo.siteName,
    title: "Sobre a Rodogarcia | Logistica com visao de longo prazo",
    description:
      "Historia, cultura, cobertura e disciplina operacional para crescer com consistencia.",
    url: seo.absoluteUrl(site.about),
    images: [{ url: seo.absoluteUrl("/caminhoneiro1.png") }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sobre a Rodogarcia | Logistica com visao de longo prazo",
    description:
      "Veja como a Rodogarcia combina experiencia operacional, capilaridade e consistencia.",
    images: [seo.absoluteUrl("/caminhoneiro1.png")],
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
  return buildCmsMetadata(site.about, fallbackMetadata);
}

const HIGHLIGHTS = [
  {
    icon: Trophy,
    title: "Disciplina operacional",
    description:
      "Prazo, previsibilidade e consistencia tratados como parte central da entrega.",
  },
  {
    icon: MapPinLine,
    title: "Cobertura estrategica",
    description:
      "Capilaridade para atender diferentes rotas sem desmontar o padrao de resposta.",
  },
  {
    icon: LightbulbFilament,
    title: "Evolucao continua",
    description:
      "Processo, tecnologia e experiencia digital melhorados sem criar ruido desnecessario.",
  },
];


export default async function SobrePage() {
  const content = await fetchPublicContent();
  const mediaSlots = await fetchMediaSlots();

  const aboutTexts = getAboutSiteTexts(content.data?.siteTexts);
  
  return (
    <PageShell>
      <AboutHero
        eyebrow={aboutTexts.tag}
        title={aboutTexts.title}
        description={aboutTexts.subtitle}
        stats={aboutTexts.stats.map((item) => ({
          value: item.number,
          label: item.description,
        }))}
        image={mediaSlot(mediaSlots, "about.hero", aboutTexts.image)}
      />

      <PageSection>
        <PageContainer>
          <SectionHeader
            eyebrow="Base da marca"
            title="Tres pilares sustentam a percepcao de confianca."
            description="A diferenca aparece na combinacao entre disciplina operacional, presenca estrategica e evolucao consistente."
            align="center"
          />

          <div className="mt-16 sm:mt-20 grid gap-6 md:grid-cols-3 md:gap-12 lg:gap-16">
            {HIGHLIGHTS.map((item, index) => (
              <div 
                key={item.title} 
                className="group relative flex flex-col border-l-4 md:border-l-2 md:hover:border-l-4 border-[var(--primary)]/20 md:border-slate-100 md:hover:border-[var(--primary)]/30 pl-6 md:pl-6 lg:pl-8 py-5 md:py-3 md:hover:py-5 pr-4 md:pr-2 md:hover:pr-4 transition-all duration-300"
              >
                {/* Fundo dinâmico (Gradient) - Ativo no mobile, invisível no desktop por padrão, ativo no hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/[0.04] to-transparent rounded-r-2xl opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10" />

                <span className="mb-3 md:mb-4 block text-[2.75rem] md:text-[2.5rem] md:group-hover:text-[2.75rem] font-bold md:font-light md:group-hover:font-bold tracking-tighter text-[var(--primary)]/80 md:text-slate-300 md:group-hover:text-[var(--primary)]/80 transition-all duration-300">
                  0{index + 1}.
                </span>
                <h3 className="text-2xl md:text-xl md:group-hover:text-2xl font-extrabold md:font-bold md:group-hover:font-extrabold tracking-[-0.04em] text-[var(--foreground)] transition-all duration-300">
                  {item.title}
                </h3>
                <p className="mt-3 text-[15px] md:text-sm md:group-hover:text-[15px] leading-8 md:leading-7 md:group-hover:leading-8 text-[var(--foreground)]/70 md:text-[var(--color-muted-raw)] md:group-hover:text-[var(--foreground)]/70 transition-all duration-300">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </PageContainer>
      </PageSection>

      <section className="relative overflow-hidden py-12 sm:py-16 lg:py-20 bg-[var(--foreground)]">
        {/* Background elements matching the premium AboutHero background */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(29,78,216,0.12),transparent_50%),radial-gradient(circle_at_100%_100%,rgba(56,189,248,0.06),transparent_40%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.025)_0%,transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.3)_1px,transparent_1px)] [background-size:40px_40px]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--primary)]/30 to-transparent opacity-80" />

        <PageContainer>
          <div className="relative space-y-8">
            <SectionHeader
              eyebrow="Historia"
              title="Crescimento com metodo, nao com improviso."
              description="Uma leitura direta da evolucao da Rodogarcia ao longo do tempo."
              theme="dark"
              align="center"
            />

            <HistoryTimeline />
          </div>
        </PageContainer>
      </section>

      <PageSection>
        <PageContainer>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="max-w-2xl">
              <SectionHeader
                eyebrow="Valores"
                title="Valores que sustentam a operacao."
                description="Mesmo com crescimento, a leitura interna continua simples: seguranca, pontualidade, respeito e excelencia."
                align="left"
              />
            </div>

            <Link
              href={site.business}
              className="inline-flex min-h-14 shrink-0 items-center justify-center rounded-full bg-[var(--foreground)] px-8 py-4 text-[13px] font-semibold uppercase tracking-[0.18em] text-white shadow-[0_12px_24px_rgba(15,23,42,0.12)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(15,23,42,0.16)] hover:bg-[var(--primary)]"
            >
              Quero ser parceiro
            </Link>
          </div>

          <ValuesSection />
        </PageContainer>
      </PageSection>

      {/* SEÇÃO COMPLIANCE WALL (Scroll Reveal Mobile + Desktop Cinematic Carousel) */}
      <ComplianceSection />

      {/* SEÇÃO CTA FINAL SIMPLIFICADA */}
      <section className="py-20 sm:py-32">
        <PageContainer>
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--primary)] mb-4">
              Próximo passo
            </span>

            <h2 className="text-[clamp(2.25rem,5vw,4rem)] font-extrabold leading-[1.05] tracking-tight text-[var(--foreground)]">
              Estruture sua operação com a Rodogarcia.
            </h2>

            <p className="mt-6 text-lg leading-relaxed text-slate-600">
              Mais previsibilidade. Sem surpresas na sua malha logística.
            </p>

            <div className="mt-10 grid w-full grid-cols-2 gap-3 sm:flex sm:items-center sm:justify-center sm:gap-5">
              <Link
                href={site.quote}
                className="group inline-flex min-h-[64px] w-full min-w-0 items-center justify-center rounded-full bg-[var(--primary)] px-4 text-[15px] font-extrabold tracking-tight text-white shadow-[0_12px_32px_rgba(2,132,199,0.25)] transition-all duration-200 hover:-translate-y-1 hover:bg-[var(--primary)]/90 hover:shadow-[0_20px_48px_rgba(2,132,199,0.35)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--primary)]/30 sm:w-auto sm:min-w-[320px] sm:px-10"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="min-w-0 truncate">Solicitar cotação agora</span>
                  <svg
                    className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>

              <Link
                href={site.contact}
                className="inline-flex min-h-[64px] w-full min-w-0 items-center justify-center rounded-full bg-slate-900 px-4 text-[15px] font-bold tracking-tight text-white shadow-[0_12px_32px_rgba(15,23,42,0.15)] transition-all duration-200 hover:-translate-y-1 hover:bg-slate-800 hover:shadow-[0_20px_48px_rgba(15,23,42,0.25)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/30 sm:w-auto sm:min-w-[240px] sm:px-10"
              >
                <span className="min-w-0 truncate">Falar com atendimento</span>
              </Link>
            </div>
          </div>
        </PageContainer>
      </section>
    </PageShell>
  );
}
