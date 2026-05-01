"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChatCircleDots, CheckCircle } from "@phosphor-icons/react";
import { site } from "@/lib/routes";

const BENEFITS = [
  "Resposta rápida",
  "Cobertura nacional",
  "Operação monitorada",
] as const;

export default function FinalQuoteCtaSection() {
  const containerRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["end 400px", "end 0px"],
  });

  const filter = useTransform(
    scrollYProgress,
    [0, 0.25, 0.5, 0.75, 1],
    ["blur(0px)", "blur(1px)", "blur(4px)", "blur(12px)", "blur(24px)"]
  );

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [1, 0.9, 0.6]
  );

  return (
    <motion.section
      ref={containerRef}
      style={{ filter, opacity, willChange: "filter, opacity" }}
      className="relative py-12 sm:py-16"
      aria-labelledby="final-cta-title"
    >
      <div className="mx-auto max-w-[1440px] px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-[34px] border border-[var(--border)] bg-white px-6 py-8 shadow-[0_20px_48px_rgba(15,23,42,0.08)] sm:px-8 sm:py-10 lg:px-10"
        >
          <div className="mx-auto max-w-[760px] text-center">
            <h2
              id="final-cta-title"
              className="text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[0.98] tracking-[-0.05em] text-[var(--foreground)]"
            >
              Solicite sua cotação com quem entende da operação.
            </h2>

            <p className="mt-4 text-sm leading-7 text-[var(--color-muted-raw)] sm:text-base">
              Envie os dados da carga e receba um retorno comercial alinhado ao
              que sua operação precisa.
            </p>

            <div className="mt-8 grid w-full grid-cols-2 gap-3 px-2 sm:flex sm:w-auto sm:items-center sm:justify-center sm:px-0">
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }} className="min-w-0 sm:w-auto">
                <Link
                  href={site.quote}
                  className="inline-flex h-14 w-full min-w-0 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(29,78,216,0.22)] transition-colors hover:bg-[var(--color-primary-strong)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--primary)]/24 sm:w-auto sm:px-7"
                >
                  <span className="min-w-0 truncate">Solicitar cotação</span>
                  <ArrowRight size={18} weight="bold" className="shrink-0" />
                </Link>
              </motion.div>

              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }} className="min-w-0 sm:w-auto">
                <Link
                  href={site.contact}
                  className="inline-flex h-14 w-full min-w-0 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(34,197,94,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-[0_22px_52px_rgba(22,163,74,0.38)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/24 sm:w-auto sm:px-7"
                >
                  <span className="min-w-0 truncate">Falar com especialista</span>
                  <ChatCircleDots size={18} weight="bold" className="shrink-0" />
                </Link>
              </motion.div>
            </div>

            <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-[var(--color-muted-raw)]">
              {BENEFITS.map((benefit) => (
                <li key={benefit} className="inline-flex items-center gap-2">
                  <CheckCircle
                    size={16}
                    weight="fill"
                    className="text-[var(--primary)]"
                  />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}
