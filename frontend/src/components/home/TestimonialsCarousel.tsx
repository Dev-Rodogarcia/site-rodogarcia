"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Buildings, Quotes, Star } from "@phosphor-icons/react";
import type { Feedback } from "@/types/content";

interface TestimonialsCarouselProps {
  feedbacks: Feedback[];
}

interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  company: string;
  testimonial: string;
  photo: string;
  rating: number;
}

const STATIC_FEEDBACKS: TestimonialItem[] = [
  {
    id: "fallback-feedback-1",
    name: "Mariana Araujo",
    role: "Gerente de Abastecimento",
    company: "Capricche",
    testimonial:
      "Nas jánelas de campanha, a Rodogarcia manteve previsibilidade de coleta e entrega entre CD e lojás, com menos ruptura e retorno rápido nas ocorrências.",
    photo: "/feedbacks/capricche.jpg",
    rating: 5,
  },
  {
    id: "fallback-feedback-2",
    name: "Leandro Martins",
    role: "Coordenador de Logística Industrial",
    company: "Corbion Brasil",
    testimonial:
      "Em uma operação industrial sensível, o que pesou foi a disciplina de agendamento e rastreabilidade. O SLA ficou mais estável e a leitura de ocorrências muito mais objetiva.",
    photo: "/feedbacks/corbion-brasil.png",
    rating: 5,
  },
  {
    id: "fallback-feedback-3",
    name: "Patricia Nunes",
    role: "Gerente de Supply Chain",
    company: "Danfoss",
    testimonial:
      "A Rodogarcia trouxe regularidade para embarques técnicos e maior confiança nas jánelas de entrega para clientes industriais. A redução de desvios operacionais foi perceptível.",
    photo: "/feedbacks/danfoss.png",
    rating: 5,
  },
  {
    id: "fallback-feedback-4",
    name: "Carlos Eduardo Prado",
    role: "Supervisor Nacional de Transportes",
    company: "Frigelar",
    testimonial:
      "Com capilaridade nacional e resposta rápida, conseguimos sustentar picos sazonais com mais previsibilidade de entrega e menos retrabalho no atendimento.",
    photo: "/feedbacks/frigelar.jpg",
    rating: 5,
  },
  {
    id: "fallback-feedback-5",
    name: "Aline Moreira",
    role: "Coordenadora de Customer Service Logístico",
    company: "H.B. Fuller",
    testimonial:
      "Precisávamos de controle fino de agendamento, compliance e rastreabilidade. A Rodogarcia entregou consistência operacional e menos ruído nas tratativas com planta e cliente.",
    photo: "/feedbacks/hbfuller.png",
    rating: 5,
  },
  {
    id: "fallback-feedback-6",
    name: "Diego Carvalho",
    role: "Gerente de Operações",
    company: "Hidrodomi",
    testimonial:
      "Nossa distribuição ganhou cadência. Hoje temos mais visibilidade por etapa, melhor ocupação das jánelas e menos impacto quando a operação exige replanejámento.",
    photo: "/feedbacks/hidrodomi.gif",
    rating: 4,
  },
  {
    id: "fallback-feedback-7",
    name: "Renata Campos",
    role: "Especialista de Supply Chain",
    company: "Kemira",
    testimonial:
      "Em uma malha sensível, a diferença esteve na previsibilidade de coleta, no acompanhamento das entregas e na qualidade do retorno para a nossa equipe.",
    photo: "/feedbacks/kemira.jpg",
    rating: 5,
  },
  {
    id: "fallback-feedback-8",
    name: "Bruno Tavares",
    role: "Gerente de Distribuição",
    company: "PPG",
    testimonial:
      "A combinação entre capilaridade e controle de entrega ajudou a reduzir avarias e melhorar o cumprimento das jánelas dos nossos clientes em todo o Brasil.",
    photo: "/feedbacks/PPG.jpg",
    rating: 5,
  },
  {
    id: "fallback-feedback-9",
    name: "Thiago Fernandes",
    role: "Coordenador de Logística",
    company: "Tigre",
    testimonial:
      "Para uma operação com alto volume e distribuição nacional, a Rodogarcia sustentou SLA, agendamento e rastreabilidade com padrão muito acima da média.",
    photo: "/feedbacks/tigre.jpg",
    rating: 5,
  },
];

const FALLBACK_PHOTOS = STATIC_FEEDBACKS.map((item) => item.photo);

function clampRating(value: unknown): number {
  const numeric = Number(value ?? 5);
  if (!Number.isFinite(numeric)) return 5;
  return Math.min(5, Math.max(1, Math.round(numeric)));
}

function normalizeFeedbacks(feedbacks: Feedback[]): TestimonialItem[] {
  const normalized = feedbacks
    .map((item, index) => {
      const name =
        String(item.name ?? item.nome ?? "").trim() || `Cliente ${index + 1}`;
      const role = String(item.role ?? "").trim();
      const company = String(item.company ?? item.empresa ?? "").trim();
      const testimonial =
        String(item.testimonial ?? item.comment ?? item.texto ?? "").trim() ||
        "Depoimento indisponivel.";
      const photo =
        String(item.photo ?? item.image ?? "").trim() ||
        FALLBACK_PHOTOS[index % FALLBACK_PHOTOS.length];

      return {
        id: String(item.id ?? `feedback-${index + 1}`),
        name,
        role,
        company,
        testimonial,
        photo,
        rating: clampRating(item.rating ?? item.nota),
      };
    })
    .filter((item) => item.testimonial.length > 0);

  return normalized.length > 0 ? normalized : STATIC_FEEDBACKS;
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }).map((_, index) => {
    const filled = index < rating;

    return (
      <Star
        key={`star-${index}`}
        size={15}
        weight={filled ? "fill" : "regular"}
        className={filled ? "text-amber-400" : "text-slate-300"}
        aria-hidden="true"
      />
    );
  });
}

export default function TestimonialsCarousel({
  feedbacks,
}: TestimonialsCarouselProps) {
  const items = normalizeFeedbacks(feedbacks);
  const containerRef = useRef<HTMLDivElement>(null);
  const totalSlides = items.length;
  const [currentIdx, setCurrentIdx] = useState(0);
  const activeIndexRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastChangeTime = useRef<number>(0);

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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((e) => e.isIntersecting);
        if (visibleEntries.length > 0) {
          const index = Number(
            visibleEntries[visibleEntries.length - 1].target.getAttribute("data-index")
          );

          if (index === activeIndexRef.current) return;

          const now = Date.now();
          const timeSinceLast = now - lastChangeTime.current;

          if (timeoutRef.current) clearTimeout(timeoutRef.current);

          if (timeSinceLast >= 450) {
            activeIndexRef.current = index;
            setCurrentIdx(index);
            lastChangeTime.current = now;
          } else {
            timeoutRef.current = setTimeout(() => {
              activeIndexRef.current = index;
              setCurrentIdx(index);
              lastChangeTime.current = Date.now();
            }, 450 - timeSinceLast);
          }
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

  const currentItem = items[currentIdx];

  if (!currentItem) return null;

  return (
    <section
      ref={containerRef}
      className="relative bg-[#0b1e3a]"
      style={{ height: `${totalSlides * 80}vh` }}
      aria-labelledby="testimonials-title"
    >
      <div className="absolute top-0 left-0 right-0 w-full pointer-events-none">
        {items.map((_, i) => (
          <div
            key={`ghost-${i}`}
            className="ghost-block w-full h-[80vh]"
            data-index={i}
          />
        ))}
      </div>

      <motion.div
        style={{ filter, opacity, willChange: "filter, opacity" }}
        className="sticky top-0 h-screen overflow-hidden flex flex-col items-center pt-20 pb-20 sm:pt-24 sm:pb-24"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_46%),radial-gradient(circle_at_88%_18%,rgba(34,211,238,0.14),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,transparent_42%)]" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.34)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.34)_1px,transparent_1px)] [background-size:30px_30px]" />
        <div className="pointer-events-none absolute left-12 top-10 h-40 w-40 rounded-full bg-[#2563eb]/16 blur-3xl" />
        <div className="pointer-events-none absolute bottom-8 right-10 h-36 w-36 rounded-full bg-cyan-300/10 blur-3xl" />

        <div className="relative z-40 w-full text-center pointer-events-none px-6 shrink-0">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200 drop-shadow-md">
            Prova social
          </span>
          <h2
            id="testimonials-title"
            className="mt-3 text-[clamp(1.75rem,4vw,2.5rem)] md:text-[clamp(2.5rem,4vw,3.5rem)] font-bold leading-[1.05] md:leading-[0.98] tracking-[-0.05em] text-white drop-shadow-lg max-w-[800px] mx-auto"
          >
            Marcas gigantes confiam a operação na Rodogarcia.
          </h2>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto flex-1 mt-6 sm:mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, y: 12, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.985 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center px-4 md:px-12"
            >
              <article className="relative w-full max-w-3xl mx-auto rounded-[30px] border border-white/80 bg-white p-6 sm:p-8 md:p-10 shadow-[0_14px_32px_rgba(3,10,26,0.14)] pointer-events-auto">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-14 sm:h-16 w-[100px] sm:w-[120px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] mb-6">
                    <img
                      src={currentItem.photo}
                      alt={currentItem.company ? `Logo da ${currentItem.company}` : currentItem.name}
                      className="h-full w-full object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  <div className="relative w-full rounded-[26px] border border-slate-200 bg-slate-50 p-6 sm:p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] mb-8">
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[var(--primary,theme(colors.blue.600))] shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
                      <Quotes size={20} weight="fill" />
                    </span>
                    <p className="mt-2 text-base sm:text-lg md:text-xl leading-relaxed text-slate-800 italic">
                      "{currentItem.testimonial}"
                    </p>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 break-words w-full px-2">
                    {currentItem.name}
                  </h3>
                  <div className="mt-2 flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-sm sm:text-base text-slate-600 break-words w-full px-2 justify-center">
                    <span>{currentItem.role}</span>
                    {currentItem.company && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center gap-1.5 font-medium text-slate-700">
                          <Buildings size={16} weight="duotone" />
                          {currentItem.company}
                        </span>
                      </>
                    )}
                  </div>

                  <div
                    className="mt-5 flex items-center gap-1"
                    aria-label={`${currentItem.rating} de 5 estrelas`}
                  >
                    {renderStars(currentItem.rating)}
                  </div>
                </div>
              </article>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="absolute bottom-6 sm:bottom-10 left-0 right-0 z-40 flex flex-col items-center gap-3 pointer-events-none">
          <div className="text-white/60 font-medium text-xs sm:text-sm tracking-widest font-mono">
            {String(currentIdx + 1).padStart(2, "0")} /{" "}
            {String(totalSlides).padStart(2, "0")}
          </div>
          <div className="flex gap-2">
            {items.map((_, i) => (
              <div
                key={`dot-${i}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIdx ? "w-8 bg-sky-400" : "w-2.5 bg-white/20"
                  }`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

