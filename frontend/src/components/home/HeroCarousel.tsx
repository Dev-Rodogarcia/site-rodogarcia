"use client";

import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type CSSProperties,
  type TouchEvent,
} from "react";
import Link from "next/link";
import type { HeroButton, HeroSlide } from "@/types/content";
import { external, site } from "@/lib/routes";

interface HeroCarouselProps {
  slides: HeroSlide[];
}

const AUTO_ADVANCE_MS = 6500;

const STATIC_SLIDES: HeroSlide[] = [
  {
    id: "static-1",
    title: "Logística com previsibilidade em cada etapa da operação.",
    description:
      "Frete, distribuição e rastreio com atendimento consultivo, capilaridade nacional e visibilidade do primeiro contato até a entrega.",
    image: "/foto5.png",
    desktopImage: "/foto5.png",
    mobileImage: "/foto5.png",
    layoutMode: "text-image",
    active: true,
    fullImageButtonsEnabled: false,
    fullImageBackgroundType: "wavy",
    buttons: [
      {
        label: "Solicitar cotação",
        url: site.quote,
        enabled: true,
        color: "#1d4ed8",
        variant: "solid",
      },
      {
        label: "Rastrear carga",
        url: external.tracking,
        enabled: true,
        color: "#ffffff",
        variant: "outline",
      },
    ],
  },
  {
    id: "static-2",
    title: "Capilaridade real para quem precisa manter o ritmo da entrega.",
    description:
      "Da coleta à distribuição final, estruturamos rotas com consistência, leitura operacional e resposta rápida ao longo da jornada.",
    image: "/foto4.png",
    desktopImage: "/foto4.png",
    mobileImage: "/foto4.png",
    layoutMode: "full-image",
    active: true,
    fullImageButtonsEnabled: true,
    fullImageBackgroundType: "wavy",
    buttons: [
      {
        label: "Conhecer soluções",
        url: site.services,
        enabled: true,
        color: "#1d4ed8",
        variant: "solid",
      },
    ],
  },
];

const FALLBACK_BUTTONS: HeroButton[] = [
  {
    label: "Solicitar cotação",
    url: site.quote,
    enabled: true,
    color: "#1d4ed8",
    variant: "solid",
  },
  {
    label: "Rastrear carga",
    url: external.tracking,
    enabled: true,
    color: "#ffffff",
    variant: "outline",
  },
];

function isVideoAsset(src: string): boolean {
  return /\.(mp4|webm|ogg)$/i.test(src);
}

function getDesktopAsset(slide: HeroSlide): string {
  return slide.desktopImage || slide.image;
}

function getMobileAsset(slide: HeroSlide): string {
  return slide.mobileImage || slide.desktopImage || slide.image;
}

function getEnabledButtons(slide: HeroSlide): HeroButton[] {
  return slide.buttons
    .filter((button) => button.enabled && button.label && button.url)
    .map((button, index) => {
      if (button.variant === "outline" || button.color) {
        return button;
      }

      return {
        ...button,
        color: index === 0 ? "#1d4ed8" : "#ffffff",
        variant: index === 0 ? "solid" : "outline",
      };
    });
}

function normalizeText(value: string | undefined, fallback: string): string {
  const normalized = value?.trim();
  return normalized ? normalized : fallback;
}

export default function HeroCarousel({ slides }: HeroCarouselProps) {
  const activeSlides = (slides.length > 0 ? slides : STATIC_SLIDES).filter(
    (slide) => slide.active !== false
  );
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    if (current < activeSlides.length) return;
    setCurrent(0);
  }, [activeSlides.length, current]);

  const advanceSlide = useEffectEvent(() => {
    setCurrent((previous) => (previous + 1) % activeSlides.length);
  });

  useEffect(() => {
    if (activeSlides.length <= 1 || paused) return;

    const timeout = window.setTimeout(() => {
      advanceSlide();
    }, AUTO_ADVANCE_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [activeSlides.length, current, paused]);

  if (activeSlides.length === 0) return null;

  function goTo(index: number) {
    setCurrent(
      ((index % activeSlides.length) + activeSlides.length) % activeSlides.length
    );
  }

  function goToPrevious() {
    goTo(current - 1);
  }

  function goToNext() {
    goTo(current + 1);
  }

  function handleTouchStart(event: TouchEvent<HTMLElement>) {
    const touch = event.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>) {
    const startX = touchStartXRef.current;
    const startY = touchStartYRef.current;
    const touch = event.changedTouches[0];

    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (startX === null || startY === null || activeSlides.length <= 1) return;

    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;

    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

    if (deltaX > 0) {
      goToPrevious();
      return;
    }

    goToNext();
  }

  return (
    <section
      className="relative isolate overflow-hidden bg-[#06101d]"
      aria-roledescription="carrossel"
      aria-label="Destaques Rodogarcia"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") goToPrevious();
        if (event.key === "ArrowRight") goToNext();
      }}
      tabIndex={0}
    >
      <div
        className="relative overflow-hidden"
        style={{ minHeight: "clamp(704px, 96vh, 1012px)" }}
      >
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translate3d(-${current * 100}%, 0, 0)` }}
        >
          {activeSlides.map((slide, index) => {
            const isCurrent = index === current;
            const rawTitle = slide.title?.trim() ?? "";
            const rawDescription = slide.description?.trim() ?? "";
            const title = normalizeText(
              rawTitle || undefined,
              "Logística nacional com previsibilidade e resposta rápida."
            );
            const description = normalizeText(
              rawDescription || undefined,
              "A Rodogarcia conecta coleta, transferência e entrega final com rastreio ativo e atendimento consultivo."
            );
            const enabledButtons = getEnabledButtons(slide);
            const isImageOnly =
              slide.layoutMode === "full-image" &&
              !rawTitle &&
              !rawDescription &&
              enabledButtons.length === 0;
            const actions =
              enabledButtons.length > 0
                ? enabledButtons
                : !isImageOnly && !rawTitle && !rawDescription
                  ? FALLBACK_BUTTONS
                  : [];
            const HeadingTag = index === 0 ? "h1" : "h2";
            const showSideMedia = slide.layoutMode !== "full-image" && !isImageOnly;

            return (
              <article
                key={slide.id}
                className="relative min-h-[clamp(704px,96vh,1012px)] w-full min-w-full shrink-0 overflow-hidden"
                aria-hidden={!isCurrent}
              >
                <div className="absolute inset-0">
                  <HeroMedia
                    src={getDesktopAsset(slide)}
                    alt=""
                    decorative
                    blurred={!isImageOnly}
                    priority={index === 0}
                    active={isCurrent}
                    className="h-full w-full object-cover"
                  />
                  {isImageOnly ? (
                    <>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_34%,rgba(4,10,24,0.18)_58%,rgba(4,10,24,0.86)_100%)]" />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,10,24,0.42)_0%,rgba(4,10,24,0.08)_30%,rgba(4,10,24,0.18)_58%,rgba(4,10,24,0.84)_100%)]" />
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(56,189,248,0.15),transparent_24%),radial-gradient(circle_at_84%_16%,rgba(29,78,216,0.18),transparent_22%),linear-gradient(92deg,rgba(4,10,24,0.96)_0%,rgba(4,10,24,0.84)_34%,rgba(4,10,24,0.42)_66%,rgba(4,10,24,0.78)_100%)]" />
                      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,10,24,0.14)_0%,rgba(4,10,24,0.1)_38%,rgba(4,10,24,0.78)_100%)]" />
                    </>
                  )}
                  {/* Subtle top overlay to ensure white header text and logo contrast */}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.4)_0%,rgba(0,0,0,0)_120px)] pointer-events-none" />
                </div>

                {!isImageOnly && (
                  <div className="relative z-10 mx-auto grid min-h-[clamp(704px,96vh,1012px)] max-w-[1320px] grid-cols-1 items-center gap-10 px-6 pb-26 pt-24 sm:px-8 sm:pb-28 sm:pt-28 lg:grid-cols-[minmax(0,504px)_minmax(0,1fr)] lg:gap-14 lg:px-10 lg:pt-32 xl:px-12">
                    <div className="flex max-w-[504px] flex-col justify-center self-center">

                      <HeadingTag className="max-w-[11ch] text-[clamp(3rem,6vw,6rem)] font-bold leading-[0.94] tracking-[-0.065em] text-white">
                        {title}
                      </HeadingTag>

                      <p className="mt-5 max-w-[58ch] text-base leading-7 text-white/74 sm:text-lg sm:leading-8">
                        {description}
                      </p>

                      {actions.length > 0 && (
                        <div
                          className={
                            actions.length > 1
                              ? "mt-8 grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:flex-wrap"
                              : "mt-8 flex flex-wrap gap-3"
                          }
                        >
                          {actions.map((button, buttonIndex) => (
                            <HeroActionLink
                              key={`${button.label}-${buttonIndex}`}
                              button={button}
                              fillMobile={actions.length > 1}
                            />
                          ))}
                        </div>
                      )}

                      {!showSideMedia && (
                        <p className="mt-8 max-w-[52ch] text-sm uppercase tracking-[0.24em] text-white/46">
                          Estrutura, capilaridade e leitura operacional para cada estágio da entrega.
                        </p>
                      )}

                      {showSideMedia && (
                        <div className="mt-10 overflow-hidden rounded-[28px] lg:hidden">
                          <HeroMedia
                            src={getMobileAsset(slide)}
                            alt={title}
                            active={isCurrent}
                            priority={index === 0}
                            className="h-[260px] w-full object-contain object-top"
                          />
                        </div>
                      )}
                    </div>

                    <div className="hidden h-full w-full items-center justify-center lg:flex">
                      {showSideMedia ? (
                        <div className="relative flex h-full w-full items-center justify-center">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_50%,rgba(56,189,248,0.16),transparent_24%)]" />
                          <HeroMedia
                            src={getDesktopAsset(slide)}
                            alt={title}
                            active={isCurrent}
                            priority={index === 0}
                            className="relative z-10 max-h-[62vh] w-auto max-w-[min(100%,760px)] object-contain drop-shadow-[0_24px_70px_rgba(2,6,23,0.45)]"
                          />
                        </div>
                      ) : (
                        <div className="flex w-full items-center justify-center">
                          <div className="max-w-[320px] text-center text-sm uppercase tracking-[0.24em] text-white/50">
                            Cobertura, consistência e resposta rápida para operações que precisam manter ritmo.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {activeSlides.length > 1 && (
          <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-20 hidden items-center justify-between px-3 md:flex lg:px-5 xl:px-6">
            <SliderArrowButton
              direction="left"
              onClick={goToPrevious}
              label="Ver slide anterior"
            />
            <SliderArrowButton
              direction="right"
              onClick={goToNext}
              label="Ver próximo slide"
            />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 z-20 bg-[linear-gradient(180deg,rgba(6,16,29,0)_0%,rgba(6,16,29,0.56)_52%,rgba(6,16,29,0.78)_100%)]">
          <div className="mx-auto flex max-w-[1320px] items-center justify-center px-6 py-4 sm:px-8 lg:px-10 xl:px-12">
            <div className="flex items-center justify-center gap-2">
              {activeSlides.map((item, itemIndex) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={`Ir para o slide ${itemIndex + 1}`}
                  aria-pressed={itemIndex === current}
                  onClick={() => goTo(itemIndex)}
                  className={[
                    "h-2 w-2 rounded-full transition-all duration-300",
                    "hover:bg-white/50",
                    itemIndex === current
                      ? "scale-110 bg-white/92"
                      : "bg-white/30",
                  ].join(" ")}
                />
              ))}
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

function HeroMedia({
  src,
  alt,
  active,
  className,
  decorative = false,
  blurred = false,
  priority = false,
}: {
  src: string;
  alt: string;
  active: boolean;
  className: string;
  decorative?: boolean;
  blurred?: boolean;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div
        aria-hidden="true"
        className={`${className} bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.34),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(29,78,216,0.24),transparent_30%),linear-gradient(180deg,#091120_0%,#050a16_100%)]`}
      />
    );
  }

  const motionClass = blurred
    ? active
      ? "scale-[1.1]"
      : "scale-[1.14]"
    : active
      ? "scale-100"
      : "scale-[1.04]";
  const filterClass = blurred ? "blur-[14px] opacity-72" : "";

  if (isVideoAsset(src)) {
    return (
      <video
        className={`${className} ${motionClass} ${filterClass} transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)]`}
        autoPlay
        loop
        muted
        playsInline
        preload={priority ? "auto" : "metadata"}
        aria-hidden={decorative}
      >
        <source src={src} />
      </video>
    );
  }

  return (
    <img
      src={src}
      alt={decorative ? "" : alt}
      aria-hidden={decorative}
      className={`${className} ${motionClass} ${filterClass} transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)]`}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
    />
  );
}

function HeroActionLink({
  button,
  fillMobile = false,
}: {
  button: HeroButton;
  fillMobile?: boolean;
}) {
  const isExternal =
    button.url.startsWith("http") ||
    button.url.startsWith("mailto:") ||
    button.url.startsWith("tel:");
  const isOutline = button.variant === "outline";

  const className = [
    "inline-flex max-w-full min-w-0 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-all duration-200 sm:px-5",
    "hover:-translate-y-0.5",
    fillMobile ? "w-full sm:w-auto" : "",
    isOutline
      ? "border bg-transparent text-white hover:bg-white/10"
      : "text-white shadow-[0_16px_36px_rgba(4,10,24,0.24)] hover:brightness-110",
  ].join(" ");

  const style: CSSProperties = isOutline
    ? {
        borderColor: button.color || "rgba(255,255,255,0.26)",
        color: button.color || "#ffffff",
      }
    : {
        backgroundColor: button.color || "var(--primary)",
      };

  const content = (
    <>
      <span className="min-w-0 truncate">{button.label}</span>
      <ArrowUpRightIcon className="shrink-0" />
    </>
  );

  if (isExternal) {
    return (
      <a
        href={button.url}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={style}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={button.url} className={className} style={style}>
      {content}
    </Link>
  );
}

function SliderArrowButton({
  direction,
  onClick,
  label,
}: {
  direction: "left" | "right";
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={direction === "left" ? "Anterior" : "Próximo"}
      className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/12 text-white/88 backdrop-blur-sm transition-all duration-200 hover:bg-black/22 hover:text-white"
    >
      <ArrowSliderIcon direction={direction} />
    </button>
  );
}

function ArrowSliderIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={direction === "left" ? "" : "rotate-180"}
    >
      <path
        d="M14.5 5.5 8 12l6.5 6.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowUpRightIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M4.667 11.333 11.333 4.667M6 4.667h5.333V10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

