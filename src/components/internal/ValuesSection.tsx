"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useScroll, useSpring, useMotionValueEvent } from "framer-motion";
import {
  ShieldCheck,
  Clock,
  Target,
  LightbulbFilament,
  Users,
  Star,
} from "@phosphor-icons/react";

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Seguranca",
    description: "Protecao de carga, equipe e reputacao como base da operacao.",
  },
  {
    icon: Clock,
    title: "Pontualidade",
    description: "Prazo e previsibilidade tratados como parte do valor entregue.",
  },
  {
    icon: Target,
    title: "Comprometimento",
    description: "Leitura real de contexto, sem resposta padrao para cenarios diferentes.",
  },
  {
    icon: LightbulbFilament,
    title: "Inovacao",
    description: "Melhoria constante de processo e experiencia sem excesso visual.",
  },
  {
    icon: Users,
    title: "Respeito",
    description: "Relacoes sustentaveis com clientes, parceiros e equipes ao longo da malha.",
  },
  {
    icon: Star,
    title: "Excelencia",
    description: "Acabamento, comunicacao e execucao guiados pelo mesmo padrao.",
  },
];

export function ValuesSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 150, damping: 25 });

  useMotionValueEvent(smoothProgress, "change", (latest) => {
    const total = VALUES.length;
    let newIndex = Math.round(latest * (total - 1));
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= total) newIndex = total - 1;
    setActiveIndex(newIndex);
  });

  return (
    <div ref={containerRef} className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {VALUES.map((item, index) => {
        const isEven = index % 2 !== 0;
        const isActive = activeIndex === index;

        return (
          <div
            key={item.title}
            data-index={index}
            className={cn(
              "value-item group relative flex flex-col border-t border-slate-200 pt-8 transition-all duration-500 ease-out md:hover:border-[var(--primary)]/30",
              isActive ? "is-active opacity-100 -translate-y-2" : "opacity-60 translate-y-0"
            )}
          >
            {/* Linha animada na borda superior */}
            <div
              className="absolute left-0 top-[-1px] h-[2px] w-0 bg-[var(--primary)] transition-all duration-500 ease-out md:group-hover:w-full [.is-active_&]:w-full"
            />

            {/* Alternância de ícone e título */}
            <div
              className={cn(
                "flex items-center gap-4 mb-4 sm:mb-6 sm:flex-col sm:items-start",
                isEven ? "flex-row-reverse text-right sm:text-left sm:flex-col" : "flex-row"
              )}
            >
              <span
                className="inline-flex shrink-0 h-16 w-16 items-center justify-center rounded-[20px] bg-slate-50 text-[var(--primary)] shadow-sm transition-all duration-500 md:group-hover:scale-110 md:group-hover:bg-[var(--primary)]/10 md:group-hover:shadow-md [.is-active_&]:scale-110 [.is-active_&]:bg-[var(--primary)]/10 [.is-active_&]:shadow-md"
              >
                <item.icon size={32} weight="duotone" />
              </span>

              <h3
                className="text-2xl font-extrabold tracking-[-0.04em] text-[var(--foreground)] transition-colors duration-500 md:group-hover:text-[var(--primary)] [.is-active_&]:text-[var(--primary)]"
              >
                {item.title}
              </h3>
            </div>

            <p
              className={cn(
                "mt-1 sm:mt-0 text-[15px] leading-8 text-[var(--color-muted-raw)] transition-all duration-500",
                isEven ? "text-right sm:text-left" : "text-left"
              )}
            >
              {item.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
