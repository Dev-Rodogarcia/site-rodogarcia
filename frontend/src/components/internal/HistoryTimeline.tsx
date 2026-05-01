"use client";

import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const STORY_ITEMS = [
  {
    eyebrow: "01",
    tag: "Fundação",
    title: "O básico bem-feito virou método.",
    description:
      "A Rodogarcia cresceu focando em prazo, proximidade, resposta rápida e disciplina operacional.",
  },
  {
    eyebrow: "02",
    tag: "Expansão",
    title: "Cobertura maior sem romper o padrão.",
    description:
      "Com o ganho de musculatura, a estrutura aumentou preservando a previsibilidade e a leitura técnica.",
  },
  {
    eyebrow: "03",
    tag: "Governança",
    title: "Sustentando a complexidade.",
    description:
      "A evolução necessária para atender clientes mais exigentes, mantendo a clareza sem excesso de burocracia.",
  },
  {
    eyebrow: "04",
    tag: "Consolidação",
    title: "A confiança construída na recorrência.",
    description:
      "Parcerias duradouras que nasceram da entrega consistente e de uma relação comercial transparente.",
  },
];

export function HistoryTimeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const ratios = useRef<Record<number, number>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute("data-index"));
          ratios.current[index] = entry.intersectionRatio;
        });

        let maxRatio = 0;
        let maxIndex = -1;
        Object.entries(ratios.current).forEach(([idx, ratio]) => {
          if (ratio > maxRatio) {
            maxRatio = ratio;
            maxIndex = Number(idx);
          }
        });

        if (maxRatio > 0 && maxIndex !== -1) {
          setActiveIndex(maxIndex);
        }
      },
      {
        root: null,
        rootMargin: "-25% 0px -25% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    const items = containerRef.current?.querySelectorAll(".history-item");
    items?.forEach((item) => observer.observe(item));

    return () => {
      items?.forEach((item) => observer.unobserve(item));
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative mx-auto mt-16 max-w-4xl space-y-8 sm:space-y-12 before:hidden sm:before:block before:absolute before:inset-y-0 sm:before:left-[39px] before:w-px before:bg-gradient-to-b before:from-[var(--primary)]/50 before:via-white/10 before:to-transparent">
      {STORY_ITEMS.map((item, i) => {
        const isActive = i === activeIndex;
        return (
          <div 
            key={item.eyebrow}
            data-index={i}
            className={cn(
              "history-item relative flex flex-col items-center text-center sm:text-left sm:items-start sm:flex-row gap-6 sm:gap-10 group transition-all duration-700",
              isActive ? "opacity-100 translate-y-0" : "opacity-40 sm:opacity-50 translate-y-4 sm:translate-y-0"
            )}
          >
            {/* Linha/Timeline Marker e Setas */}
            <div className="flex flex-col items-center">
              <div className={cn(
                "relative z-10 flex shrink-0 items-center justify-center h-14 w-14 sm:h-20 sm:w-20 rounded-full border bg-[var(--foreground)] transition-all duration-500",
                isActive 
                  ? "border-[var(--primary)]/50 shadow-[0_0_20px_rgba(14,165,233,0.15)] sm:scale-110" 
                  : "border-white/10 shadow-none scale-100 sm:group-hover:scale-105"
              )}>
                <span className={cn(
                  "text-lg sm:text-2xl font-bold tracking-tighter transition-colors duration-500", 
                  isActive ? "text-[var(--primary)]" : "text-white/40 sm:group-hover:text-white/70"
                )}>
                  {item.eyebrow}
                </span>
              </div>
              
              {/* Seta no mobile */}
              {i < STORY_ITEMS.length - 1 && (
                <div className={cn("mt-2 sm:hidden flex flex-col items-center transition-all duration-500", isActive ? "text-[var(--primary)]/80" : "text-white/20")}>
                   <svg className="w-5 h-5 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                   </svg>
                </div>
              )}
            </div>

            {/* Card Content */}
            <div className={cn(
              "flex-1 rounded-[30px] border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8 transition-all duration-500",
              isActive 
                ? "shadow-[0_20px_40px_rgba(2,6,23,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] bg-white/10 sm:-translate-y-1" 
                : "shadow-none bg-white/5 translate-y-0 sm:group-hover:bg-white/10"
            )}>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-4">
                <span className="inline-flex rounded-full bg-[var(--primary)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)] border border-[var(--primary)]/20">
                  {item.tag}
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
                {item.title}
              </h3>
              <p className="text-[15px] sm:text-base leading-relaxed text-white/70">
                {item.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
