"use client";

import { motion } from "framer-motion";
import { ActionLink, PageContainer } from "./PageContent";
import { site } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface StatItem {
  value: string;
  label: string;
}

interface AboutHeroProps {
  eyebrow?: string; // Still accepted but unused in JSX
  title: string;
  description: string;
  stats: StatItem[];
  image: string;
}

export function AboutHero({
  title,
  description,
  stats,
  image,
}: AboutHeroProps) {
  return (
    <section className="relative overflow-hidden pt-32 sm:pt-40 lg:pt-48 pb-16 sm:pb-20 lg:pb-24 bg-[var(--foreground)] text-white">
      {/* Background elements matching the tone="dark" */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(29,78,216,0.12),transparent_50%),radial-gradient(circle_at_100%_100%,rgba(56,189,248,0.06),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.025)_0%,transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.3)_1px,transparent_1px)] [background-size:40px_40px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[var(--primary)]/30 to-transparent opacity-80" />

      {/* Watermark Gigante "DESDE 1989" - Ancorado no canto inferior esquerdo */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 0.03, x: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="pointer-events-none absolute -bottom-10 sm:-bottom-20 -left-10 sm:-left-20 whitespace-nowrap text-[clamp(8rem,22vw,24rem)] font-bold tracking-tighter select-none z-0"
      >
        DESDE 1989
      </motion.div>

      <PageContainer className="relative z-10">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          
          {/* Main Content Area */}
          <div className="flex flex-col max-w-[780px]">
            {/* Título Institucional no Padrão do Sistema */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-[14ch] text-[clamp(3rem,6vw,5.8rem)] font-bold leading-[0.92] tracking-[-0.07em] text-white"
            >
              Evolução em{" "}
              <span className="relative inline-block text-white">
                Movimento
                {/* Underline animado sutil */}
                <motion.span 
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.8, ease: "circOut" }}
                  className="absolute -bottom-1 left-0 w-full h-1 bg-sky-400 origin-left"
                />
              </span>
            </motion.h1>

            {/* Manifesto / Storytelling no Padrão do Sistema */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="mt-6 sm:mt-8 max-w-[60ch]"
            >
              <p className="text-sm leading-7 sm:text-base text-white/68">
                Tudo começou em 1989 com uma visão clara: transformar complexidade logística em previsibilidade. De uma base regional para uma operação nacional, nosso manifesto continua o mesmo: entregar com disciplina e evoluir com segurança.
              </p>
            </motion.div>

            {/* CTAs usando o componente nativo do Design System */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mt-8 flex flex-col sm:flex-row flex-wrap gap-3"
            >
              <ActionLink 
                action={{ label: "Solicitar cotação", href: site.quote }} 
                tone="dark" 
              />
              <ActionLink 
                action={{ label: "Conhecer serviços", href: site.services, variant: "secondary" }} 
                tone="dark" 
              />
            </motion.div>
          </div>

          {/* Menor Imagem Complementar */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="relative mx-auto w-full max-w-[320px] sm:max-w-[420px] lg:max-w-[480px] lg:ml-auto mt-12 lg:mt-0"
          >
            {/* Elemento de Moldura Minimalista */}
            <div className="pointer-events-none absolute -inset-2 sm:-inset-4 border border-white/10 rounded-[28px] sm:rounded-[38px] z-0" />

            <div className="relative aspect-[4/3] sm:aspect-[3/2] overflow-hidden rounded-[24px] sm:rounded-[34px] bg-[#0f172a] shadow-2xl z-10 border border-white/10">
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(2,6,23,0.1)_100%)] z-20 pointer-events-none" />
              <motion.img
                initial={{ scale: 1.05, filter: "blur(2px)" }}
                animate={{ scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                src={image}
                alt={title}
                className="h-full w-full object-cover mix-blend-luminosity opacity-80"
              />
              
              {/* Grain Overlay Padrão */}
              <div className="absolute inset-0 opacity-[0.1] mix-blend-overlay pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZUZpbHRlciI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2VGaWx0ZXIpIi8+PC9zdmc+')] z-30" />
              
              {/* Degradê Inferior para Integração */}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--foreground)] via-transparent to-transparent z-10" />
            </div>
          </motion.div>
        </div>

        {/* Metrics em tipografia pura editorial (sem cards) - Movido para fora do grid */}
        {stats && stats.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-16 sm:mt-24 grid grid-cols-2 gap-y-10 gap-x-4 sm:flex sm:flex-wrap items-center sm:justify-center lg:justify-start sm:gap-16 border-t border-white/10 pt-8"
          >
            {stats.map((item, idx) => (
              <div 
                key={item.label} 
                className={cn(
                  "flex items-center sm:justify-start gap-4 sm:gap-10",
                  idx === stats.length - 1 ? "col-span-2 justify-center sm:col-span-1" : "justify-center"
                )}
              >
                <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
                  <span className="text-[2rem] sm:text-[2.5rem] font-bold tracking-[-0.05em] text-white leading-none">
                    {item.value}
                  </span>
                  <span className="mt-2 text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-white/50">
                    {item.label}
                  </span>
                </div>
                {/* Divisor vertical suave */}
                {idx < stats.length - 1 && (
                  <div className="h-12 w-px bg-white/10 hidden sm:block" />
                )}
              </div>
            ))}
          </motion.div>
        )}
      </PageContainer>
    </section>
  );
}
