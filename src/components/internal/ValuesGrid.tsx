"use client";

import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
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

function ValueItemCard({ item, index, isActive }: { item: any; index: number; isActive: boolean }) {
  const isEven = index % 2 !== 0;

  return (
    <div
      data-index={index}
      // "is-active" state is triggered on scroll for mobile, and by group-hover for desktop
      className={cn(
        "value-item group relative flex flex-col border-t border-slate-200 pt-8 transition-colors duration-300 md:hover:border-[var(--primary)]/30",
        isActive ? "is-active" : ""
      )}
    >
      {/* Linha animada na borda superior (Hover no Desktop / Scroll no Mobile) */}
      <div 
        className="absolute left-0 top-[-1px] h-[2px] w-0 bg-[var(--primary)] transition-all duration-500 ease-out md:group-hover:w-full max-md:[.is-active_&]:w-full" 
        style={{ transitionDelay: `calc(${index} * 30ms)` }}
      />

      {/* Alternância de ícone e título no mobile */}
      <div className={cn(
        "flex items-center gap-4 mb-4 sm:mb-6 sm:flex-col sm:items-start",
        isEven ? "flex-row-reverse text-right sm:text-left sm:flex-col" : "flex-row"
      )}>
        <span 
          className="inline-flex shrink-0 h-16 w-16 items-center justify-center rounded-[20px] bg-slate-50 text-[var(--primary)] shadow-sm transition-all duration-500 md:group-hover:scale-110 md:group-hover:bg-[var(--primary)]/10 md:group-hover:shadow-md max-md:[.is-active_&]:scale-110 max-md:[.is-active_&]:bg-[var(--primary)]/10 max-md:[.is-active_&]:shadow-md"
          style={{ transitionDelay: `calc(${index} * 30ms)` }}
        >
          <item.icon size={32} weight="duotone" />
        </span>
        
        <h3 
          className="text-2xl font-extrabold tracking-[-0.04em] text-[var(--foreground)] transition-colors duration-500 md:group-hover:text-[var(--primary)] max-md:[.is-active_&]:text-[var(--primary)]"
          style={{ transitionDelay: `calc(${index} * 30ms)` }}
        >
          {item.title}
        </h3>
      </div>
      
      <p className={cn(
        "mt-1 sm:mt-0 text-[15px] leading-8 text-[var(--color-muted-raw)] transition-all duration-500",
        isEven ? "text-right sm:text-left" : "text-left"
      )}>
        {item.description}
      </p>
    </div>
  );
}

export function ValuesGrid() {
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Apenas aplica o observer no mobile
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    if (!mediaQuery.matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute("data-index"));
          if (entry.isIntersecting) {
            setActiveIndex(index);
          } else {
            setActiveIndex((prev) => (prev === index ? -1 : prev));
          }
        });
      },
      {
        root: null,
        rootMargin: "-25% 0px -25% 0px", // Trigger area starts 25% from top and bottom
        threshold: 0.55, // Element must be 55% visible
      }
    );

    const items = containerRef.current?.querySelectorAll(".value-item");
    items?.forEach((item) => observer.observe(item));

    return () => {
      items?.forEach((item) => observer.unobserve(item));
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {VALUES.map((item, index) => (
        <ValueItemCard 
          key={item.title} 
          item={item} 
          index={index} 
          isActive={activeIndex === index} 
        />
      ))}
    </div>
  );
}
