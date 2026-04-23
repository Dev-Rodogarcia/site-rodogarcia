"use client";

import { useRef } from "react";
import { useInView } from "framer-motion";
import { cn } from "@/lib/utils";

interface Certification {
  title: string;
  description: string;
  src: string;
  alt: string;
}

interface CompliancePanelProps {
  certifications: Certification[];
}

export function CompliancePanel({ certifications }: CompliancePanelProps) {
  // O layout é desenhado especificamente para a estrutura atual: 
  // 1 destaque (ISO), 2 blocos médios (Sassmaq, Ecovadis) e 3 faixas menores (licenças)
  const iso = certifications[0];
  const others = certifications.slice(1);
  const sassmaq = others[0];
  const ecovadis = others[1];
  const licenses = others.slice(2);

  const panelRef = useRef(null);
  const isInView = useInView(panelRef, { once: true, margin: "-15% 0px" });

  return (
    <div 
      ref={panelRef}
      className={cn(
        "group/panel w-full rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.85)_0%,rgba(2,6,23,0.95)_100%)] shadow-2xl backdrop-blur-xl overflow-hidden",
        isInView ? "mobile-active" : ""
      )}
    >
      {/* Top Section - Destaques Principais */}
      <div className="grid lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/5">
        
        {/* ISO 9001 - Hero Block */}
        <div className="lg:col-span-1 p-8 sm:p-12 flex flex-col justify-between transition-colors duration-500 hover:bg-white/[0.02] max-md:[.mobile-active_&]:bg-white/[0.02] group/iso">
          <div>
            <div className="flex h-20 sm:h-28 w-auto items-center justify-start mb-8 sm:mb-10 transition-transform duration-500 group-hover/iso:scale-105 max-md:[.mobile-active_&]:scale-105">
              {/* O logo fica flutuando sem caixa branca quadrada */}
              <div className="rounded-xl bg-white px-4 py-2 shadow-inner inline-flex items-center justify-center">
                 <img src={iso.src} alt={iso.alt} className="max-h-12 sm:max-h-16 w-auto object-contain" />
              </div>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3 transition-colors duration-300 group-hover/iso:text-sky-400 max-md:[.mobile-active_&]:text-sky-400">
              {iso.title}
            </h3>
            <p className="text-[15px] sm:text-base leading-relaxed text-white/60">
              {iso.description}
            </p>
          </div>
          {/* Animated Highlight */}
          <div className="mt-10 h-1 w-12 bg-sky-500/50 rounded-full transition-all duration-700 ease-out group-hover/iso:w-full max-md:[.mobile-active_&]:w-full" />
        </div>

        {/* Blocos Secundários */}
        <div className="lg:col-span-2 grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/5">
          {[sassmaq, ecovadis].map((cert) => (
            <div key={cert.title} className="p-8 sm:p-10 flex flex-col transition-colors duration-500 hover:bg-white/[0.02] max-md:[.mobile-active_&]:bg-white/[0.02] group/cert">
              <div className="flex h-16 w-auto items-center justify-start mb-8 transition-transform duration-500 group-hover/cert:-translate-y-1 max-md:[.mobile-active_&]:-translate-y-1">
                <div className="rounded-xl bg-white/95 px-3 py-1.5 shadow-inner inline-flex items-center justify-center">
                   <img src={cert.src} alt={cert.alt} className="max-h-8 sm:max-h-10 w-auto object-contain" />
                </div>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-white mb-2 transition-colors duration-300 group-hover/cert:text-sky-400 max-md:[.mobile-active_&]:text-sky-400">
                {cert.title}
              </h3>
              <p className="text-sm leading-7 text-white/60">
                {cert.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Licenças Strip - Faixas Menores */}
      <div className="border-t border-white/5 bg-white/[0.01]">
        <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/5">
          {licenses.map((lic) => (
            <div key={lic.title} className="p-6 sm:p-8 flex items-center gap-5 transition-colors duration-300 hover:bg-white/[0.03] max-md:[.mobile-active_&]:bg-white/[0.03] group/lic">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white transition-colors duration-300 shadow-inner group-hover/lic:shadow-sky-500/20 max-md:[.mobile-active_&]:shadow-sky-500/20 p-2">
                <img src={lic.src} alt={lic.alt} className="max-h-full w-full object-contain" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover/lic:text-sky-400 max-md:[.mobile-active_&]:text-sky-400 transition-colors duration-300">
                  {lic.title}
                </h4>
                <p className="text-[11px] text-white/50 mt-1 uppercase tracking-wider line-clamp-1">
                  Validação Ativa
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Elemento de Fechamento de Venda (Assinatura) */}
      <div className="border-t border-white/10 bg-[linear-gradient(90deg,rgba(14,165,233,0.1)_0%,rgba(2,6,23,0)_100%)] p-8 sm:px-12 sm:py-10 flex flex-col sm:flex-row sm:items-center justify-between gap-8">
        <p className="text-lg sm:text-xl font-bold tracking-tight text-white max-w-xl leading-snug">
          Licenças ativas. Auditorias recorrentes. <span className="text-sky-400">Operação preparada para empresas exigentes.</span>
        </p>
        <div className="shrink-0 flex sm:justify-end">
          {/* Indicador Pulsante */}
          <div className="inline-flex items-center gap-3 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-sky-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
            Compliance
          </div>
        </div>
      </div>
    </div>
  );
}
