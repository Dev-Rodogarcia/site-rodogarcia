"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  if (content) {
    const certificate = (
      <span className="inline-flex rounded-full border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200">
        {content.certificateText}
      </span>
    );

    return (
      <section className="relative overflow-hidden bg-[#020617] py-16 text-white sm:py-20 lg:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.15)_0%,rgba(2,6,23,1)_70%)]" />
        <div className="relative mx-auto grid w-full max-w-[1440px] gap-10 px-5 sm:px-8 lg:grid-cols-[minmax(280px,0.86fr)_minmax(0,1fr)] lg:items-center">
          <div className="mx-auto w-full max-w-[360px] overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
            <img
              src={content.image.src}
              alt={content.image.alt}
              className="mx-auto max-h-[320px] w-full object-contain"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-300">
              Governança & Compliance
            </span>
            <h2 className="mt-4 max-w-[15ch] text-[clamp(2rem,4vw,3.6rem)] font-extrabold leading-[1.02] tracking-[-0.05em]">
              {content.title}
            </h2>
            <p className="mt-5 max-w-[58ch] text-sm leading-7 text-white/68 sm:text-base">
              {content.description}
            </p>
            <div className="mt-8">
              {content.certificateUrl ? (
                <a
                  href={content.certificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {certificate}
                </a>
              ) : (
                certificate
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

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
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          const index = Number(visibleEntries[visibleEntries.length - 1].target.getAttribute("data-index"));
          
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          
          timeoutRef.current = setTimeout(() => {
            setCurrentIdx(index);
          }, 150);
        }
      },
      {
        root: null,
        rootMargin: "-45% 0px -45% 0px",
      }
    );

    const ghosts = containerRef.current?.querySelectorAll(".ghost-block");
    ghosts?.forEach((g) => observer.observe(g));

    return () => {
      observer.disconnect();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <section ref={containerRef} className="relative bg-[#020617] text-white" style={{ height: `${totalSlides * 100}vh` }}>
      
      {/* Ghost Blocks para IntersectionObserver */}
      <div className="absolute top-0 left-0 right-0 w-full pointer-events-none">
        {CERTIFICATIONS.map((_, i) => (
          <div key={`ghost-${i}`} className="ghost-block w-full h-screen" data-index={i} />
        ))}
      </div>

      <div className="sticky top-0 h-screen overflow-hidden flex flex-col items-center justify-center">
        
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.15)_0%,rgba(2,6,23,1)_70%)] pointer-events-none" />

        <div 
          className="absolute inset-0 z-50 pointer-events-none opacity-[0.02]" 
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
        />
        <div className="absolute inset-0 z-50 pointer-events-none shadow-[inset_0_0_150px_rgba(2,6,23,0.8)]" />

        <div className="absolute top-24 sm:top-32 left-0 right-0 z-40 text-center pointer-events-none px-6">
          <div className="inline-flex items-center gap-3 mb-3">
            <span className="h-px w-6 bg-sky-500"></span>
            <h2 className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-sky-400">
              Governança & Compliance
            </h2>
            <span className="h-px w-6 bg-sky-500"></span>
          </div>
          <h3 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2 drop-shadow-lg">
            Excelência em cada operação
          </h3>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto h-full">
          <AnimatePresence>
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center px-6 md:px-12 pt-40 pb-16 md:pt-48 md:pb-20"
            >
              <div className="relative z-10 flex flex-col items-center justify-center text-center w-full">
                <div className="mb-6 sm:mb-8 md:mb-10 w-full flex items-center justify-center">
                  <img 
                    src={CERTIFICATIONS[currentIdx].image} 
                    alt={CERTIFICATIONS[currentIdx].title}
                    className={getCertImageClass(CERTIFICATIONS[currentIdx].title)}
                  />
                </div>
                <div className="flex flex-col items-center shrink-0 px-4 w-full">
                  <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-3 sm:mb-4 tracking-tight drop-shadow-lg">
                    {CERTIFICATIONS[currentIdx].title}
                  </h3>
                  <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-lg leading-relaxed">
                    {CERTIFICATIONS[currentIdx].description}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="absolute bottom-6 sm:bottom-10 left-0 right-0 z-40 flex flex-col items-center gap-3 pointer-events-none">
          <div className="text-white/60 font-medium text-xs sm:text-sm tracking-widest font-mono">
            {String(currentIdx + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
          </div>
          <div className="flex gap-2">
            {CERTIFICATIONS.map((_, i) => (
              <div 
                key={i} 
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === currentIdx ? "w-8 bg-sky-400" : "w-2 bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
