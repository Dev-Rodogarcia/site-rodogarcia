import type { Metadata } from "next";
import { preparePublicContent, readContentData } from "@/lib/content";
import type { DnaSlide, Feedback, HeroSlide } from "@/types/content";
import BrazilMapWrapper from "@/components/home/BrazilMapWrapper";
import DnaCarousel from "@/components/home/DnaCarousel";
import FinalQuoteCtaSection from "@/components/home/FinalQuoteCtaSection";
import HeroCarousel from "@/components/home/HeroCarousel";
import PostHeroInteractiveShowcase from "@/components/home/PostHeroInteractiveShowcase";
import ServiceLinesRebrand from "@/components/home/ServiceLinesRebrand";
import TestimonialsCarousel from "@/components/home/TestimonialsCarousel";
import TrackingLookupSection from "@/components/home/TrackingLookupSection";
import { seo, site } from "@/lib/routes";

export const metadata: Metadata = {
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

const POST_HERO_SHOWCASE_ITEMS = [
  {
    title: "Cotação sem fricção",
    description:
      "Fluxo comercial mais direto, com resposta clara para operações que precisam avançar sem ruído.",
    image: {
      src: "/Animação_de_Conversa_Sem_Manipulação_de_Objetos.mp4",
      alt: "Operação logística Rodogarcia",
    },
  },
  {
    title: "Rastreio com contexto",
    description:
      "Visibilidade da carga com leitura operacional para acompanhar a jornada além do status básico.",
    image: {
      src: "/Vídeo_de_Operação_Gerado.mp4",
      alt: "Acompanhamento operacional de carga Rodogarcia",
    },
  },
  {
    title: "Cobertura que sustenta escala",
    description:
      "Capilaridade nacional e consistência de execução para operações que crescem em volume e complexidade.",
    image: {
      src: "/caminhoneiro.mp4",
      alt: "Motorista Rodogarcia em operação",
    },
  },
];

const CERTS = [
  {
    src: "/certificados/LOGO ISO 9001.svg",
    alt: "ISO 9001",
    title: "ISO 9001",
  },
  {
    src: "/certificados/certificado-sassmaq.png",
    alt: "SASSMAQ",
    title: "SASSMAQ",
  },
  {
    src: "/certificados/ecovadis.png",
    alt: "EcoVadis",
    title: "EcoVadis",
  },
  {
    src: "/certificados/pf.png",
    alt: "Polícia Federal",
    title: "Licença PF",
  },
  {
    src: "/certificados/pc-sp.png",
    alt: "Polícia Civil SP",
    title: "Polícia Civil SP",
  },
  {
    src: "/certificados/exercito-br.png",
    alt: "Exército Brasileiro",
    title: "Exército Brasileiro",
  },
  {
    src: "/certificados/ibama.png",
    alt: "IBAMA",
    title: "IBAMA",
  },
] as const;

export default async function HomePage() {
  let heroSlides: HeroSlide[] = [];
  let dnaSlides: DnaSlide[] = [];
  let feedbacks: Feedback[] = [];

  try {
    const content = preparePublicContent(readContentData());
    heroSlides = content.heroSlides as unknown as HeroSlide[];
    dnaSlides = content.dnaSlides as unknown as DnaSlide[];
    feedbacks = content.feedbacks as unknown as Feedback[];
  } catch {
    // Components usam fallbacks próprios quando o conteúdo não está disponível.
  }

  return (
    <div>
      <HeroCarousel slides={heroSlides} />

      <PostHeroInteractiveShowcase
        title="Previsibilidade para crescer."
        items={POST_HERO_SHOWCASE_ITEMS}
        cta={{ label: "Conhecer soluções", href: site.services }}
      />

      <section className="py-6 sm:py-8">
        <div className="mx-auto mb-4 flex max-w-[1440px] flex-col items-center px-6 text-center">
          <span className="text-xs font-semibold text-[var(--primary)] uppercase tracking-[0.24em]">
            Compliance e qualidade
          </span>
          <h2 className="hidden">
            Reconhecimento operacional que reforça segurança e padrão.
          </h2>
          <h2 className="mt-1 text-[clamp(1.1rem,1.8vw,1.65rem)] font-bold leading-tight tracking-[-0.03em] text-[var(--foreground)]">
            Credenciais operacionais.
          </h2>
        </div>

        <div className="mx-auto max-w-[1440px] px-6">
          <div className="group relative overflow-hidden py-1">
            <div
              className="flex w-max items-center gap-10 group-hover:[animation-play-state:paused] sm:gap-12"
              style={{ animation: "certifications-marquee 26s linear infinite" }}
              aria-label="Certificações e licenças operacionais"
            >
              {[...CERTS, ...CERTS].map((cert, index) => (
                <div
                  key={`${cert.title}-${index}`}
                  className="flex w-[180px] shrink-0 flex-col items-center justify-center rounded-2xl border border-[var(--foreground)]/10 bg-[var(--color-surface-2)]/60 px-5 py-4 text-center backdrop-blur-md transition-all duration-300 hover:scale-[1.03] hover:bg-[var(--color-surface-2)]/78 hover:shadow-[0_16px_36px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.2)] sm:w-[220px] lg:w-[220px]"
                  aria-hidden={index >= CERTS.length ? true : undefined}
                >
                  <div className="flex h-[64px] items-center justify-center">
                    <img
                      src={cert.src}
                      alt={index < CERTS.length ? cert.alt : ""}
                      className="max-h-[44px] w-auto object-contain opacity-92 transition-transform duration-300 group-hover:scale-[1.04] lg:max-h-[52px]"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  <div className="mt-3 text-sm font-semibold leading-snug tracking-[0.02em] text-[var(--foreground)]/82">
                    {cert.title}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <DnaCarousel slides={dnaSlides} />
      <ServiceLinesRebrand />

      <section className="relative overflow-hidden bg-[var(--foreground)] py-20 xl:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.1),transparent_40%),radial-gradient(circle_at_78%_14%,rgba(56,189,248,0.06),transparent_24%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.025)_0%,transparent_40%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:36px_36px]" />

        <div className="relative mx-auto max-w-[1440px] px-6">
          <BrazilMapWrapper />
        </div>
      </section>

      <TrackingLookupSection />
      <TestimonialsCarousel feedbacks={feedbacks} />
      <FinalQuoteCtaSection />
    </div>
  );
}
