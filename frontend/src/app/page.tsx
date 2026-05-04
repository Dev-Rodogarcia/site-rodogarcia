import type { Metadata } from "next";
import { fetchPublicContent } from "@/lib/api";
import type { HomePageContent } from "@/types/content";
import BrazilMapWrapper from "@/components/home/BrazilMapWrapper";
import DnaCarousel from "@/components/home/DnaCarousel";
import FinalQuoteCtaSection from "@/components/home/FinalQuoteCtaSection";
import HeroCarousel from "@/components/home/HeroCarousel";
import PostHeroInteractiveShowcase from "@/components/home/PostHeroInteractiveShowcase";
import ServiceLinesRebrand from "@/components/home/ServiceLinesRebrand";
import TestimonialsCarousel from "@/components/home/TestimonialsCarousel";
import TrackingLookupSection from "@/components/home/TrackingLookupSection";
import { external, seo, site } from "@/lib/routes";
import { buildCmsMetadata, fetchMediaSlots, mediaSlot } from "@/lib/cmsPublic";

export const dynamic = "force-dynamic";

const fallbackMetadata: Metadata = {
  title: {
    absolute: "Rodogarcia Transportes | Logistica com previsibilidade nacional",
  },
  description:
    "Rodogarcia Transportes: logistica nacional com seguranca, previsibilidade operacional e rastreabilidade em toda a jornada.",
  alternates: { canonical: seo.absoluteUrl(site.home) },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: seo.siteName,
    title: "Rodogarcia Transportes | Logistica com previsibilidade nacional",
    description:
      "Frete, distribuicao, operacoes dedicadas e rastreabilidade para empresas que precisam de consistencia em escala.",
    url: seo.absoluteUrl(site.home),
    images: [{ url: seo.absoluteUrl(seo.defaultOgImage) }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rodogarcia Transportes | Logistica com previsibilidade nacional",
    description:
      "Operacao nacional com seguranca, eficiencia e uma experiencia digital moderna para cotacao e rastreio.",
    images: [seo.absoluteUrl(seo.defaultOgImage)],
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
  return buildCmsMetadata(site.home, fallbackMetadata);
}

const EMPTY_HOME_PAGE: HomePageContent = {
  hero: { slides: [] },
  section1: { title: "", ctaLabel: "", ctaUrl: "", items: [] },
  section2: { title: "", items: [] },
  section3: {
    badge: "",
    title: "",
    description: "",
    ctaLabel: "",
    ctaUrl: "",
    cards: [],
  },
  regionalPresence: { units: [] },
  trackingCta: {
    buttons: [
      { label: "Rastrear agora", url: external.tracking, enabled: true },
      { label: "Como consultar", url: site.help, enabled: true, variant: "outline" },
    ],
  },
  socialProof: { title: "", feedbacks: [] },
};

const CERTS = [
  {
    src: "/certificados/LOGO ISO 9001.svg",
    alt: "ISO 9001",
    title: "ISO 9001",
    slot: "home.cert.iso",
  },
  {
    src: "/certificados/certificado-sassmaq.png",
    alt: "SASSMAQ",
    title: "SASSMAQ",
    slot: "home.cert.sassmaq",
  },
  {
    src: "/certificados/ecovadis.png",
    alt: "EcoVadis",
    title: "EcoVadis",
    slot: "home.cert.ecovadis",
  },
  {
    src: "/certificados/pf.png",
    alt: "Policia Federal",
    title: "Licenca PF",
    slot: "home.cert.pf",
  },
  {
    src: "/certificados/pc-sp.png",
    alt: "Policia Civil SP",
    title: "Policia Civil SP",
    slot: "home.cert.pcsp",
  },
  {
    src: "/certificados/exercito-br.png",
    alt: "Exercito Brasileiro",
    title: "Exercito Brasileiro",
    slot: "home.cert.exercito",
  },
  {
    src: "/certificados/ibama.png",
    alt: "IBAMA",
    title: "IBAMA",
    slot: "home.cert.ibama",
  },
] as const;

export default async function HomePage() {
  let homePage = EMPTY_HOME_PAGE;
  const mediaSlots = await fetchMediaSlots();

  try {
    const response = await fetchPublicContent();
    if (response.success && response.data) {
      homePage = response.data.homePage ?? EMPTY_HOME_PAGE;
    }
  } catch {
    // Se o CMS estiver indisponivel, os blocos editaveis da Home ficam ocultos.
  }

  const certs = CERTS.map((cert) => ({
    ...cert,
    src: mediaSlot(mediaSlots, cert.slot, cert.src),
  }));

  return (
    <div>
      <HeroCarousel slides={homePage.hero.slides} />
      <PostHeroInteractiveShowcase section={homePage.section1} />

      <section className="py-12 sm:py-16">
        <div className="mx-auto mb-10 flex max-w-[1440px] flex-col items-center px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/10 bg-[var(--color-primary-soft)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--primary)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
            Compliance e qualidade
          </span>
          <h2 className="hidden">
            Reconhecimento operacional que reforca seguranca e padrao.
          </h2>
          <h2 className="mt-5 text-[clamp(1.4rem,2.2vw,2rem)] font-extrabold leading-tight tracking-[-0.03em] text-[var(--foreground)]">
            Credenciais operacionais.
          </h2>
        </div>

        <div className="mx-auto max-w-[1440px] px-6">
          <div
            className="group relative overflow-hidden py-4"
            style={{ WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)" }}
          >
            <div
              className="flex w-max items-center gap-6 group-hover:[animation-play-state:paused] sm:gap-8"
              style={{ animation: "certifications-marquee 35s linear infinite" }}
              aria-label="Certificacoes e licencas operacionais"
            >
              {[...certs, ...certs].map((cert, index) => (
                <div
                  key={`${cert.title}-${index}`}
                  className="group/card flex w-[160px] shrink-0 flex-col items-center justify-center gap-4 transition-all duration-500 hover:-translate-y-1 sm:w-[190px] lg:w-[200px]"
                  aria-hidden={index >= CERTS.length ? true : undefined}
                >
                  <div className="flex h-[90px] w-full items-center justify-center rounded-[20px] bg-white shadow-[0_4px_20px_rgba(15,23,42,0.03)] ring-1 ring-slate-900/5 transition-all duration-500 group-hover/card:shadow-[0_12px_30px_rgba(29,78,216,0.08)] group-hover/card:ring-[var(--primary)]/10">
                    <img
                      src={cert.src}
                      alt={index < CERTS.length ? cert.alt : ""}
                      className="max-h-[46px] max-w-[110px] object-contain opacity-60 mix-blend-luminosity transition-all duration-500 group-hover/card:scale-[1.08] group-hover/card:opacity-100 group-hover/card:mix-blend-normal lg:max-h-[52px]"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <span className="text-[13px] font-semibold tracking-[0.02em] text-slate-400 transition-colors duration-500 group-hover/card:text-[var(--primary)]">
                    {cert.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <DnaCarousel section={homePage.section2} />
      <ServiceLinesRebrand section={homePage.section3} />

      {homePage.regionalPresence.units.length > 0 ? (
        <section className="relative overflow-hidden bg-slate-950 py-20 xl:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.15),transparent_60%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:32px_32px]" />

          <div className="relative mx-auto max-w-[1440px] px-6">
            <BrazilMapWrapper units={homePage.regionalPresence.units} />
          </div>
        </section>
      ) : null}

      <TrackingLookupSection buttons={homePage.trackingCta.buttons} />
      <TestimonialsCarousel section={homePage.socialProof} />
      <FinalQuoteCtaSection />
    </div>
  );
}
