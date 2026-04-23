"use client";

import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import type { DnaSlide } from "@/types/content";

interface DnaCarouselProps {
  slides: DnaSlide[];
}

interface SpotlightSlide {
  id: string;
  title: string;
  text: string;
  desktopAsset: string;
  mobileAsset: string;
}

const AUTO_ADVANCE_MS = 5600;
const MAX_SLIDES = 5;
const MIN_CMS_SLIDES = 3;
const DESKTOP_QUERY = "(min-width: 1024px)";
const FEATURED_VIDEO_ASSETS = [
  "/caminhoes1.mp4",
  "/caminhoneiro.mp4",
  "/Animação_de_Conversa_Sem_Manipulação_de_Objetos.mp4",
  "/Vídeo_de_Operação_Gerado.mp4",
  "/Vídeo_Gerado_Sem_Interação_Manual.mp4",
];

const FALLBACK_SLIDES: SpotlightSlide[] = [
  {
    id: "fallback-dna-1",
    title: "Capilaridade com leitura operacional",
    text: "Operação nacional com resposta mais rápida para rotas que exigem previsibilidade de ponta a ponta.",
    desktopAsset: "/foto5.png",
    mobileAsset: "/foto5.png",
  },
  {
    id: "fallback-dna-2",
    title: "Distribuição com ritmo constante",
    text: "Transferencia, entrega final e acompanhamento integrados para manter a jornada da carga sob controle.",
    desktopAsset: "/foto4.png",
    mobileAsset: "/foto4.png",
  },
  {
    id: "fallback-dna-3",
    title: "Presença em toda a jornada",
    text: "Estrutura de coleta e atendimento para operações que precisam crescer sem perder consistência.",
    desktopAsset: "/foto1.png",
    mobileAsset: "/foto1.png",
  },
  {
    id: "fallback-dna-4",
    title: "Operação que aproxima campo e cliente",
    text: "Times, frota e rastreio conectados para acelerar decisões ao longo do percurso.",
    desktopAsset: "/caminhoneiro1.png",
    mobileAsset: "/caminhoneiro1.png",
  },
  {
    id: "fallback-dna-5",
    title: "Escala com segurança de execução",
    text: "Processos robustos para acompanhar cargas mais sensíveis com padrão consistente em cada etapa.",
    desktopAsset: "/foto2.png",
    mobileAsset: "/foto2.png",
  },
];

function normalizeText(value: string | undefined): string {
  return value?.trim() ?? "";
}

function resolveAssetPath(value: string | undefined): string {
  const normalized = normalizeText(value);

  if (!normalized) return "";
  if (normalized.startsWith("/public/")) {
    return normalized.slice("/public".length);
  }

  return normalized;
}

function isVideoAsset(src: string): boolean {
  return /\.(mp4|webm|ogg)$/i.test(src);
}

function applyFeaturedMedia(slides: SpotlightSlide[]): SpotlightSlide[] {
  return slides.map((slide, index) => {
    const videoSrc = FEATURED_VIDEO_ASSETS[index % FEATURED_VIDEO_ASSETS.length];

    return {
      ...slide,
      desktopAsset: videoSrc,
      mobileAsset: videoSrc,
    };
  });
}

function buildSpotlightSlides(slides: DnaSlide[]): SpotlightSlide[] {
  const validSlides = slides
    .filter((slide) => slide.active !== false)
    .map((slide) => {
      const title = normalizeText(slide.title);
      const text = normalizeText(slide.text);
      const desktopAsset = resolveAssetPath(slide.desktopImage || slide.image);
      const mobileAsset = resolveAssetPath(
        slide.mobileImage || slide.desktopImage || slide.image
      );

      if (!title || !text || !desktopAsset) return null;

      return {
        id: slide.id,
        title,
        text,
        desktopAsset,
        mobileAsset: mobileAsset || desktopAsset,
      } satisfies SpotlightSlide;
    })
    .filter((slide): slide is SpotlightSlide => Boolean(slide))
    .slice(0, MAX_SLIDES);

  if (validSlides.length >= MIN_CMS_SLIDES) {
    return applyFeaturedMedia(validSlides);
  }

  const usedIds = new Set(validSlides.map((slide) => slide.id));
  const completedSlides = [...validSlides];

  for (const fallback of FALLBACK_SLIDES) {
    if (completedSlides.length >= MAX_SLIDES) break;
    if (usedIds.has(fallback.id)) continue;
    completedSlides.push(fallback);
  }

  return applyFeaturedMedia(completedSlides);
}

function SpotlightMedia({
  src,
  alt,
  active,
  className,
}: {
  src: string;
  alt: string;
  active: boolean;
  className: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!isVideoAsset(src)) return;

    const video = videoRef.current;
    if (!video) return;

    if (active) {
      void video.play().catch(() => {});
      return;
    }

    video.pause();
    video.currentTime = 0;
  }, [active, src]);

  if (isVideoAsset(src)) {
    return (
      <video
        ref={videoRef}
        src={src}
        muted
        loop
        playsInline
        preload="metadata"
        className={className}
      />
    );
  }

  const imageProps: ComponentPropsWithoutRef<"img"> = {
    src,
    alt,
    className,
    loading: "lazy",
    decoding: "async",
  };

  return <img {...imageProps} />;
}

export default function DnaCarousel({ slides }: DnaCarouselProps) {
  const spotlightSlides = buildSpotlightSlides(slides);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const mobileCardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (current < spotlightSlides.length) return;
    setCurrent(0);
  }, [current, spotlightSlides.length]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_QUERY);
    const syncViewport = () => {
      setIsDesktop(mediaQuery.matches);
    };

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => {
      mediaQuery.removeEventListener("change", syncViewport);
    };
  }, []);

  const advanceSlide = useEffectEvent(() => {
    setCurrent((previous) => (previous + 1) % spotlightSlides.length);
  });

  useEffect(() => {
    if (!isDesktop || spotlightSlides.length <= 1 || paused) return;

    const timeout = window.setTimeout(() => {
      advanceSlide();
    }, AUTO_ADVANCE_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [advanceSlide, current, isDesktop, paused, spotlightSlides.length]);

  useEffect(() => {
    if (isDesktop || spotlightSlides.length === 0) return;

    const observedCards = mobileCardRefs.current
      .slice(0, spotlightSlides.length)
      .filter((card): card is HTMLButtonElement => Boolean(card));

    if (observedCards.length === 0) return;

    const visibleCards = new Map<number, HTMLButtonElement>();

    const syncCurrentFromViewport = () => {
      if (visibleCards.size === 0) return;

      const viewportCenter = window.innerHeight / 2;
      let nextIndex: number | null = null;
      let smallestDistance = Number.POSITIVE_INFINITY;

      for (const [index, card] of visibleCards) {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.top + rect.height / 2;
        const distance = Math.abs(cardCenter - viewportCenter);

        if (distance < smallestDistance) {
          smallestDistance = distance;
          nextIndex = index;
        }
      }

      if (nextIndex === null) return;

      setCurrent((previous) => (previous === nextIndex ? previous : nextIndex));
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = Number(
            (entry.target as HTMLButtonElement).dataset.dnaIndex ?? "-1"
          );

          if (index < 0) continue;

          if (entry.isIntersecting) {
            visibleCards.set(index, entry.target as HTMLButtonElement);
          } else {
            visibleCards.delete(index);
          }
        }

        syncCurrentFromViewport();
      },
      {
        root: null,
        rootMargin: "-42% 0px -42% 0px",
        threshold: 0,
      }
    );

    for (const card of observedCards) {
      observer.observe(card);
    }

    syncCurrentFromViewport();

    return () => {
      observer.disconnect();
      visibleCards.clear();
    };
  }, [isDesktop, spotlightSlides.length]);

  if (spotlightSlides.length === 0) return null;

  function goTo(index: number) {
    setCurrent(
      ((index % spotlightSlides.length) + spotlightSlides.length) %
        spotlightSlides.length
    );
  }

  return (
    <section
      className="relative overflow-hidden bg-[var(--foreground)] py-16 sm:py-20"
      aria-roledescription="galeria"
      aria-label="DNA Rodogarcia"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_44%),radial-gradient(circle_at_84%_18%,rgba(56,189,248,0.08),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,transparent_42%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.22)_1px,transparent_1px)] [background-size:34px_34px]" />

      <div className="relative mx-auto max-w-[1440px] px-6">
        <div className="max-w-full text-center">
          <h2 className="text-[clamp(1.45rem,2.8vw,2.5rem)] font-bold leading-tight tracking-[-0.04em] text-white sm:whitespace-nowrap">
            Todas as frentes da operação se encontram aqui.
          </h2>
        </div>

        <div className="mt-8 hidden overflow-hidden lg:flex lg:h-[520px] lg:items-stretch lg:justify-center lg:gap-4">
          {spotlightSlides.map((slide, index) => {
            const isActive = index === current;

            return (
              <button
                key={slide.id}
                type="button"
                aria-pressed={isActive}
                onMouseEnter={() => {
                  goTo(index);
                  setPaused(true);
                }}
                onFocus={() => {
                  goTo(index);
                  setPaused(true);
                }}
                onClick={() => {
                  goTo(index);
                }}
                className={`group relative min-w-0 basis-0 self-end overflow-hidden rounded-[42px] border text-left origin-center transform-gpu transition-[flex-grow,width,transform,border-color,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[width,flex-grow,transform] ${
                  isActive
                    ? "h-[420px] grow-[3] border-white/18 opacity-100"
                    : "h-[420px] grow border-white/10 opacity-78"
                }`}
              >
                <div className="absolute inset-0">
                  <SpotlightMedia
                    src={slide.desktopAsset}
                    alt={slide.title}
                    active={isActive}
                    className={`h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isActive ? "scale-[1.02]" : "scale-100"
                    }`}
                  />
                  <div
                    className={`absolute inset-0 transition-opacity duration-500 ${
                      isActive
                        ? "bg-[linear-gradient(180deg,rgba(2,6,23,0.08)_0%,rgba(2,6,23,0.16)_22%,rgba(2,6,23,0.88)_100%)]"
                        : "bg-[linear-gradient(180deg,rgba(2,6,23,0.18)_0%,rgba(2,6,23,0.42)_44%,rgba(2,6,23,0.96)_100%)]"
                    }`}
                  />
                  <div
                    className={`absolute inset-0 transition-opacity duration-500 ${
                      isActive
                        ? "bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_34%)] opacity-100"
                        : "bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_30%)] opacity-70"
                    }`}
                  />
                </div>

                {isActive && (
                  <div className="relative z-10 flex h-full flex-col justify-end p-7">
                    <div className="max-w-[24ch]">
                      <h3 className="text-[1.8rem] font-semibold leading-[1.02] tracking-[-0.03em] text-white">
                        {slide.title}
                      </h3>
                      <p className="mt-3 max-w-[32ch] text-sm leading-6 text-white/74">
                        {slide.text}
                      </p>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-8 lg:hidden">
          <div className="flex flex-col gap-3">
            {spotlightSlides.map((slide, index) => {
              const isActive = index === current;

              return (
                <button
                  key={slide.id}
                  type="button"
                  ref={(node) => {
                    mobileCardRefs.current[index] = node;
                  }}
                  data-dna-index={index}
                  aria-pressed={isActive}
                  onClick={() => {
                    goTo(index);
                  }}
                  className={`relative w-full overflow-hidden rounded-[38px] border text-left transition-[height,transform,border-color,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isActive
                      ? "h-[250px] border-white/18 opacity-100"
                      : "h-[112px] border-white/10 opacity-70"
                  }`}
                >
                  <div className="absolute inset-0">
                    <SpotlightMedia
                      src={slide.mobileAsset}
                      alt={slide.title}
                      active={isActive}
                      className={`h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        isActive ? "scale-[1.02]" : "scale-100"
                      }`}
                    />
                    <div
                      className={`absolute inset-0 ${
                        isActive
                          ? "bg-[linear-gradient(180deg,rgba(2,6,23,0.14)_0%,rgba(2,6,23,0.22)_28%,rgba(2,6,23,0.9)_100%)]"
                          : "bg-[linear-gradient(180deg,rgba(2,6,23,0.24)_0%,rgba(2,6,23,0.5)_52%,rgba(2,6,23,0.96)_100%)]"
                      }`}
                    />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_34%)]" />
                  </div>

                  {isActive && (
                    <div className="relative z-10 flex h-full flex-col justify-end p-5">
                      <h3 className="max-w-[14ch] text-[1.55rem] font-semibold leading-[1.02] tracking-[-0.03em] text-white">
                        {slide.title}
                      </h3>
                      <p className="mt-3 max-w-[30ch] text-sm leading-6 text-white/74">
                        {slide.text}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
