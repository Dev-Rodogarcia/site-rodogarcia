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
  const targetIndex = useRef(0);
  const stepTimer = useRef<number | null>(null);

  useEffect(() => {
    const scheduleStep = () => {
      if (stepTimer.current) return;

      stepTimer.current = window.setTimeout(() => {
        stepTimer.current = null;
        setActiveIndex((current) => {
          const target = targetIndex.current;
          if (current === target) return current;

          const next = current + (target > current ? 1 : -1);
          if (next !== target) scheduleStep();
          return next;
        });
      }, 70);
    };

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
          targetIndex.current = maxIndex;
          scheduleStep();
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
      if (stepTimer.current) window.clearTimeout(stepTimer.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative mx-auto mt-12 max-w-4xl space-y-5 sm:mt-16 sm:space-y-6">
      {STORY_ITEMS.map((item, i) => {
        const isActive = i === activeIndex;
        return (
          <div 
            key={item.eyebrow}
            data-index={i}
            className={cn(
              "history-item relative flex flex-col items-center gap-4 text-center transition-opacity duration-300 sm:flex-row sm:items-start sm:gap-8 sm:text-left",
              isActive ? "opacity-100" : "opacity-70"
            )}
          >
            <div className="flex shrink-0 flex-col items-center">
              <div className={cn(
                "relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border bg-white/[0.06] transition-[background-color,border-color,box-shadow] duration-200 sm:h-16 sm:w-16",
                isActive 
                  ? "border-[var(--primary)]/45 bg-white/[0.1] shadow-[0_10px_24px_rgba(2,6,23,0.18)]" 
                  : "border-white/12 shadow-none"
              )}>
                <span className={cn(
                  "text-lg font-extrabold tracking-tight transition-colors duration-200 sm:text-xl", 
                  isActive ? "text-[var(--primary)]" : "text-white/55"
                )}>
                  {item.eyebrow}
                </span>
              </div>
            </div>

            <div className={cn(
              "flex-1 rounded-2xl border p-5 transition-[background-color,border-color,box-shadow] duration-200 sm:p-6",
              isActive 
                ? "border-[var(--primary)]/30 bg-white/[0.1] shadow-[0_16px_34px_rgba(2,6,23,0.2)]" 
                : "border-white/10 bg-white/[0.055] shadow-none hover:bg-white/[0.08]"
            )}>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-4">
                <span className="inline-flex rounded-full bg-[var(--primary)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)] border border-[var(--primary)]/20">
                  {item.tag}
                </span>
              </div>
              <h3 className="mb-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
                {item.title}
              </h3>
              <p className="text-[15px] leading-relaxed text-white/75 sm:text-base">
                {item.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
