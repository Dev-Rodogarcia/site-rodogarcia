"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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
  const base = "w-auto max-w-full object-contain drop-shadow-2xl";
  if (title === "Exército Brasileiro") {
    return `h-[40vh] sm:h-[45vh] md:h-[40vh] lg:h-[44vh] xl:h-[46vh] max-h-[600px] ${base}`;
  }
  if (title === "EcoVadis" || title === "SASSMAQ") {
    return `h-[36vh] sm:h-[40vh] md:h-[28vh] lg:h-[30vh] xl:h-[32vh] max-h-[480px] ${base}`;
  }
  return `h-[36vh] sm:h-[40vh] md:h-[34vh] lg:h-[36vh] xl:h-[38vh] max-h-[560px] ${base}`;
};

export function ComplianceSection({ content }: { content?: ComplianceContent }) {
  void content;
  return <LegacyComplianceSection />;
}

function LegacyComplianceSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const totalSlides = CERTIFICATIONS.length;
  const [currentIdx, setCurrentIdx] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.34)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.34)_1px,transparent_1px)] [background-size:30px_30px]" />

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
              <div className="relative z-10 flex w-full flex-col items-center justify-center text-center">
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
              </div>
            </motion.div>
          </AnimatePresence>
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
    </section>
  );
}
