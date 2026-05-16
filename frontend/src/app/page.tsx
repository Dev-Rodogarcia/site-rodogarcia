import type { Metadata } from "next";
import { fetchPublicContent } from "@/lib/api";
import type { HomePageContent } from "@/types/content";
import BrazilMapWrapper from "@/components/home/BrazilMapWrapper";
import OperationsCarousel from "@/components/home/OperationsCarousel";
import FinalQuoteCtaSection from "@/components/home/FinalQuoteCtaSection";
import HeroCarousel from "@/components/home/HeroCarousel";
import PostHeroInteractiveShowcase from "@/components/home/PostHeroInteractiveShowcase";
import QuickActionsSection from "@/components/home/QuickActionsSection";
import ServiceLinesRebrand from "@/components/home/ServiceLinesRebrand";
import TestimonialsCarousel from "@/components/home/TestimonialsCarousel";
import TrackingLookupSection from "@/components/home/TrackingLookupSection";
import { external, seo, site } from "@/lib/routes";
import { buildCmsMetadata, fetchMediaSlots, mediaSlot } from "@/lib/cmsPublic";

export const dynamic = "force-dynamic";

const fallbackMetadata: Metadata = {
  title: {
    absolute: "Rodogarcia Transportes | Logística com previsibilidade nacional",
  },
  description:
    "Rodogarcia Transportes: logística nacional com segurança, previsibilidade operacional e rastreabilidade em toda a jornada.",
  alternates: { canonical: seo.absoluteUrl(site.home) },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: seo.siteName,
    title: "Rodogarcia Transportes | Logística com previsibilidade nacional",
    description:
      "Frete, distribuição, operações dedicadas e rastreabilidade para empresas que precisam de consistência em escala.",
    url: seo.absoluteUrl(site.home),
    images: [{ url: seo.absoluteUrl(seo.defaultOgImage) }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rodogarcia Transportes | Logística com previsibilidade nacional",
    description:
      "Operação nacional com segurança, eficiência e uma experiência digital moderna para cotação e rastreio.",
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
  quickActions: [
    { id: "qa-taxas", order: 1, label: "Taxas", href: "", icon: "FilePdf", type: "download", enabled: true, downloadFile: "" },
    { id: "qa-cotacao", order: 2, label: "Cotação", href: site.quote, icon: "Calculator", type: "link", enabled: true },
    { id: "qa-rastreamento", order: 3, label: "Rastreamento", href: external.tracking, icon: "MagnifyingGlass", type: "external", enabled: true },
    { id: "qa-coleta", order: 4, label: "Solicitar Coleta", href: site.contact, icon: "Truck", type: "link", enabled: true },
    { id: "qa-cidades", order: 5, label: "Cidades", href: "#mapa-regional", icon: "MapPin", type: "modal", enabled: true },
    { id: "qa-whatsapp", order: 6, label: "WhatsApp", href: external.whatsappCommercial, icon: "WhatsappLogo", type: "external", enabled: true },
    { id: "qa-telefone", order: 7, label: "Telefone", href: external.phoneHref, icon: "Phone", type: "external", enabled: true },
    { id: "qa-email", order: 8, label: "E-mail", href: external.commercialEmail, icon: "Envelope", type: "external", enabled: true },
  ],
};

function withRequiredRatesAction(actions: NonNullable<HomePageContent["quickActions"]>) {
  const ratesFallback = EMPTY_HOME_PAGE.quickActions?.find((action) => action.id === "qa-taxas");
  if (!ratesFallback) return actions;
  const ratesIndex = actions.findIndex((action) => {
    const label = action.label
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    return action.id === "qa-taxas" || label.includes("taxas");
  });
  if (ratesIndex >= 0) {
    return actions.map((action, index) =>
      index === ratesIndex
        ? {
            ...action,
            type: "download" as const,
            enabled: true,
            order: action.order ?? index + 1,
          }
        : action
    );
  }
  return [ratesFallback, ...actions].map((action, index) => ({
    ...action,
    order: action.order ?? index + 1,
  }));
}

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
    // Se o CMS estiver indisponível, os blocos editáveis da Home ficam ocultos.
  }

  const certs = CERTS.map((cert) => ({
    ...cert,
    src: mediaSlot(mediaSlots, cert.slot, cert.src),
  }));

  return (
    <div>
      <HeroCarousel slides={homePage.hero.slides} />
      <QuickActionsSection
        actions={withRequiredRatesAction(
          homePage.quickActions && homePage.quickActions.length > 0
            ? homePage.quickActions
            : (EMPTY_HOME_PAGE.quickActions ?? [])
        )}
      />
      <PostHeroInteractiveShowcase section={homePage.section1} />

      <section className="py-12 sm:py-16">
        <div className="mx-auto mb-10 flex max-w-[1440px] flex-col items-center px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/10 bg-[var(--color-primary-soft)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--primary)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
            Compliance e qualidade
          </span>
          <h2 className="hidden">
            Reconhecimento operacional que reforça segurança e padrão.
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
              aria-label="Certificações e licenças operacionais"
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

      <OperationsCarousel section={homePage.section2} />
      <ServiceLinesRebrand section={homePage.section3} />

      {homePage.regionalPresence.units.length > 0 ? (
        <section id="mapa-regional" className="relative overflow-hidden bg-slate-950 py-20 xl:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.15),transparent_60%)]" />
          <div className="decorative-grid absolute inset-0" data-theme="dark" />

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
