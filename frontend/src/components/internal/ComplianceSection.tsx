"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CaretLeft, CaretRight, X } from "@phosphor-icons/react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface ComplianceContent {
  image: {
    src: string;
    alt: string;
  };
  title: string;
  description: string;
  certificateText: string;
  certificateUrl?: string;
}

const CERTIFICATIONS = [
  {
    title: "ISO 9001",
    description: "Gestão da qualidade aplicada em cada camada da operação.",
    image: "/certificados/LOGO ISO 9001.svg",
  },
  {
    title: "SASSMAQ",
    description: "Segurança, saúde e meio ambiente em processos sensíveis.",
    image: "/certificados/certificado-sassmaq.png",
  },
  {
    title: "EcoVadis",
    description: "Maturidade em sustentabilidade e responsabilidade corporativa.",
    image: "/certificados/ecovadis.png",
  },
  {
    title: "Licença PF",
    description: "Autorização para operações que exigem controles adicionais.",
    image: "/certificados/pf.png",
  },
  {
    title: "Polícia Civil SP",
    description: "Habilitação estadual alinhada a operações com governança ampliada.",
    image: "/certificados/pc-sp.png",
  },
  {
    title: "Exército Brasileiro",
    description: "Autorização conectada a rotinas com requisitos extras de controle.",
    image: "/certificados/exercito-br.png",
  },
  {
    title: "IBAMA",
    description: "Conformidade e controle rigoroso em operações com impacto e regulamentação ambiental.",
    image: "/certificados/ibama.png",
  },
];

const getCertImageClass = (title: string) => {
  const base = "w-auto max-w-full object-contain drop-shadow-xl";
  if (title === "Exército Brasileiro") {
    return `h-[40vh] sm:h-[45vh] md:h-[40vh] lg:h-[44vh] xl:h-[46vh] max-h-[600px] ${base}`;
  }
  if (title === "EcoVadis" || title === "SASSMAQ") {
    return `h-[36vh] sm:h-[40vh] md:h-[28vh] lg:h-[30vh] xl:h-[32vh] max-h-[480px] ${base}`;
  }
  return `h-[36vh] sm:h-[40vh] md:h-[34vh] lg:h-[36vh] xl:h-[38vh] max-h-[560px] ${base}`;
};

const getLightboxImageClass = (title: string) => {
  const base = "w-auto max-w-full object-contain";
  if (title === "Exército Brasileiro") {
    return `max-h-[66dvh] ${base}`;
  }
  if (title === "EcoVadis" || title === "SASSMAQ") {
    return `max-h-[56dvh] ${base}`;
  }
  return `max-h-[62dvh] ${base}`;
};

export function ComplianceSection({ content }: { content?: ComplianceContent }) {
  void content;
  return <LegacyComplianceSection />;
}

function LegacyComplianceSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const totalSlides = CERTIFICATIONS.length;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const goToCertification = useCallback(
    (index: number) => {
      const nextIndex = (index + totalSlides) % totalSlides;
      setCurrentIdx(nextIndex);

      const sectionTop = containerRef.current?.offsetTop;
      if (typeof sectionTop !== "number") return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({
        top: sectionTop + nextIndex * window.innerHeight,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    },
    [totalSlides]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length === 0) return;

        const index = Number(
          visibleEntries[visibleEntries.length - 1].target.getAttribute("data-index")
        );

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
          setCurrentIdx(index);
        }, 150);
      },
      {
        root: null,
        rootMargin: "-45% 0px -45% 0px",
      }
    );

    const ghosts = containerRef.current?.querySelectorAll(".ghost-block");
    ghosts?.forEach((ghost) => observer.observe(ghost));

    return () => {
      observer.disconnect();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    document.body.classList.add("has-modal-open");
    return () => document.body.classList.remove("has-modal-open");
  }, [lightboxIndex]);

  const closeLightbox = useCallback((index: number) => {
    setCurrentIdx(index);
    setLightboxIndex(null);
    window.setTimeout(() => triggerRefs.current[index]?.focus({ preventScroll: true }), 0);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative bg-[#020617] text-white"
      style={{ height: `${totalSlides * 100}vh` }}
    >
      <div className="pointer-events-none absolute left-0 right-0 top-0 w-full">
        {CERTIFICATIONS.map((_, index) => (
          <div
            key={`ghost-${index}`}
            className="ghost-block h-screen w-full"
            data-index={index}
          />
        ))}
      </div>

      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.15)_0%,rgba(2,6,23,1)_70%)]" />
        <div className="decorative-grid absolute inset-0" data-theme="dark" />

        <div
          className="pointer-events-none absolute inset-0 z-50 opacity-[0.02]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
          }}
        />
        <div className="pointer-events-none absolute inset-0 z-50 shadow-[inset_0_0_150px_rgba(2,6,23,0.8)]" />

        <div className="pointer-events-none absolute left-0 right-0 top-24 z-40 px-6 text-center sm:top-32">
          <div className="mb-3 inline-flex items-center gap-3">
            <span className="h-px w-6 bg-sky-500" />
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-400 sm:text-xs">
              Governança & Compliance
            </h2>
            <span className="h-px w-6 bg-sky-500" />
          </div>
          <h3 className="mb-2 text-xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-3xl md:text-4xl">
            Excelência em cada operação
          </h3>
        </div>

        <div className="relative z-10 mx-auto h-full w-full max-w-7xl">
          <AnimatePresence>
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center px-6 pb-16 pt-40 md:px-12 md:pb-20 md:pt-48"
            >
              <button
                type="button"
                ref={(node) => {
                  triggerRefs.current[currentIdx] = node;
                }}
                onClick={() => setLightboxIndex(currentIdx)}
                aria-label={`Abrir visualização do certificado ${CERTIFICATIONS[currentIdx].title}`}
                className="relative z-10 flex w-full flex-col items-center justify-center rounded-2xl text-center outline-none transition-transform duration-200 hover:scale-[1.01] focus-visible:ring-4 focus-visible:ring-[var(--primary)]/30 motion-reduce:transition-none"
              >
                <div className="mb-6 flex w-full items-center justify-center sm:mb-8 md:mb-10">
                  <img
                    src={CERTIFICATIONS[currentIdx].image}
                    alt={CERTIFICATIONS[currentIdx].title}
                    className={getCertImageClass(CERTIFICATIONS[currentIdx].title)}
                  />
                </div>
                <div className="flex w-full shrink-0 flex-col items-center px-4">
                  <h3 className="mb-3 text-3xl font-extrabold tracking-tight text-white drop-shadow-lg sm:mb-4 sm:text-4xl md:text-5xl lg:text-6xl">
                    {CERTIFICATIONS[currentIdx].title}
                  </h3>
                  <p className="max-w-lg text-base leading-relaxed text-white/80 sm:text-lg md:text-xl">
                    {CERTIFICATIONS[currentIdx].description}
                  </p>
                </div>
              </button>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="pointer-events-none absolute inset-x-3 top-1/2 z-40 flex -translate-y-1/2 items-center justify-between sm:inset-x-6 lg:inset-x-10">
          <CertificateNavButton
            label="Certificado anterior"
            direction="previous"
            onClick={() => goToCertification(currentIdx - 1)}
          />
          <CertificateNavButton
            label="Próximo certificado"
            direction="next"
            onClick={() => goToCertification(currentIdx + 1)}
          />
        </div>

        <div className="pointer-events-none absolute bottom-6 left-0 right-0 z-40 flex flex-col items-center gap-3 sm:bottom-10">
          <div className="font-mono text-xs font-medium tracking-widest text-white/60 sm:text-sm">
            {String(currentIdx + 1).padStart(2, "0")} / {String(totalSlides).padStart(2, "0")}
          </div>
          <div className="flex gap-2">
            {CERTIFICATIONS.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all duration-300 ${
                  index === currentIdx ? "w-8 bg-sky-400" : "w-2 bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {lightboxIndex !== null ? (
        <CertificateLightbox
          index={lightboxIndex}
          onIndexChange={setLightboxIndex}
          onClose={closeLightbox}
        />
      ) : null}
    </section>
  );
}

function CertificateNavButton({
  label,
  direction,
  onClick,
}: {
  label: string;
  direction: "previous" | "next";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/[0.075] text-white/82 shadow-[0_12px_28px_rgba(2,6,23,0.24)] backdrop-blur-md transition-[background-color,border-color,transform,color] duration-200 ease-out hover:-translate-y-px hover:border-white/20 hover:bg-white/[0.12] hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/16 sm:h-12 sm:w-12"
    >
      {direction === "previous" ? (
        <CaretLeft size={22} weight="bold" aria-hidden="true" />
      ) : (
        <CaretRight size={22} weight="bold" aria-hidden="true" />
      )}
    </button>
  );
}

function CertificateLightbox({
  index,
  onIndexChange,
  onClose,
}: {
  index: number;
  onIndexChange: (index: number) => void;
  onClose: (index: number) => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const cert = CERTIFICATIONS[index];
  const total = CERTIFICATIONS.length;
  const previousIndex = (index - 1 + total) % total;
  const nextIndex = (index + 1) % total;

  useFocusTrap({
    active: true,
    containerRef: dialogRef,
    initialFocusRef: closeButtonRef,
    onEscape: () => onClose(index),
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        onIndexChange(previousIndex);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        onIndexChange(nextIndex);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [nextIndex, onIndexChange, previousIndex]);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-950/72 backdrop-blur-sm"
        aria-hidden="true"
        onClick={() => onClose(index)}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="relative flex max-h-[92dvh] w-full max-w-[940px] flex-col overflow-hidden rounded-[22px] border border-[var(--border)] bg-[var(--color-surface)] p-4 shadow-[0_24px_70px_rgba(2,6,23,0.28)] outline-none sm:p-6"
      >
        <button
          ref={closeButtonRef}
          type="button"
          aria-label="Fechar certificado"
          onClick={() => onClose(index)}
          className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--color-surface-strong)] text-[var(--foreground)] shadow-[0_8px_18px_rgba(15,23,42,0.08)] transition-colors hover:bg-[var(--color-surface-2)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--primary)]/20"
        >
          <X size={20} weight="bold" aria-hidden="true" />
        </button>

        <button
          type="button"
          aria-label="Certificado anterior"
          onClick={() => onIndexChange(previousIndex)}
          className="absolute left-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--color-surface-strong)] text-[var(--foreground)] shadow-[0_10px_24px_rgba(15,23,42,0.1)] transition-colors hover:bg-[var(--color-surface-2)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--primary)]/20 sm:left-5 sm:h-14 sm:w-14"
        >
          <CaretLeft size={24} weight="bold" aria-hidden="true" />
        </button>

        <button
          type="button"
          aria-label="Próximo certificado"
          onClick={() => onIndexChange(nextIndex)}
          className="absolute right-3 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--color-surface-strong)] text-[var(--foreground)] shadow-[0_10px_24px_rgba(15,23,42,0.1)] transition-colors hover:bg-[var(--color-surface-2)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--primary)]/20 sm:right-5 sm:h-14 sm:w-14"
        >
          <CaretRight size={24} weight="bold" aria-hidden="true" />
        </button>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-12 pb-4 pt-12 text-center sm:px-16 sm:pb-6 sm:pt-14">
          <div className="flex min-h-0 w-full items-center justify-center rounded-2xl bg-[var(--color-surface-strong)] px-4 py-6 sm:px-8 sm:py-8">
            <img
              src={cert.image}
              alt={cert.title}
              className={getLightboxImageClass(cert.title)}
            />
          </div>

          <div className="mt-5">
            <h3 id={titleId} className="text-2xl font-extrabold tracking-[-0.03em] text-[var(--foreground)] sm:text-3xl">
              {cert.title}
            </h3>
            <p id={descriptionId} className="mt-2 max-w-xl text-sm leading-6 text-[var(--color-muted-raw)] sm:text-base sm:leading-7">
              {cert.description}
            </p>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2" aria-hidden="true">
            {CERTIFICATIONS.map((item, itemIndex) => (
              <span
                key={item.title}
                className={[
                  "h-1.5 rounded-full transition-all duration-200",
                  itemIndex === index ? "w-8 bg-[var(--primary)]" : "w-2 bg-[var(--border)]",
                ].join(" ")}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
