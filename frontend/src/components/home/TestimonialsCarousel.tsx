"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { Buildings, CaretLeft, CaretRight, Quotes, Star } from "@phosphor-icons/react";
import type { HomeFeedback, HomeSocialProof } from "@/types/content";

interface TestimonialsCarouselProps {
  section: HomeSocialProof;
}

function clampRating(value: unknown): number {
  const numeric = Number(value ?? 5);
  if (!Number.isFinite(numeric)) return 5;
  return Math.min(5, Math.max(1, Math.round(numeric)));
}

function normalizeFeedbacks(feedbacks: HomeFeedback[]): HomeFeedback[] {
  return feedbacks
    .filter((item) => item.active !== false)
    .map((item, index) => ({
      ...item,
      id: item.id || `feedback-${index + 1}`,
      rating: clampRating(item.rating),
    }))
    .filter(
      (item) =>
        item.name &&
        item.role &&
        item.company &&
        item.testimonial &&
        item.photo
    );
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
  section,
}: TestimonialsCarouselProps) {
  const items = normalizeFeedbacks(section.feedbacks);
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
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.9, 0.6]);

  const goToTestimonial = useCallback(
    (index: number) => {
      const nextIndex = (index + totalSlides) % totalSlides;
      activeIndexRef.current = nextIndex;
      setCurrentIdx(nextIndex);
      lastChangeTime.current = Date.now();

      const sectionTop = containerRef.current?.offsetTop;
      if (typeof sectionTop !== "number") return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({
        top: sectionTop + nextIndex * window.innerHeight * 0.8,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    },
    [totalSlides]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length === 0) return;
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
      },
      { root: null, rootMargin: "-45% 0px -45% 0px" }
    );

    const ghosts = containerRef.current?.querySelectorAll(".ghost-block");
    ghosts?.forEach((ghost) => observer.observe(ghost));
    return () => {
      observer.disconnect();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [items.length]);

  const currentItem = items[currentIdx];
  if (!section.title || !currentItem) return null;

  return (
    <section
      ref={containerRef}
      className="relative bg-[#0b1e3a]"
      style={{ height: `${totalSlides * 80}vh` }}
      aria-labelledby="testimonials-title"
    >
      <div className="pointer-events-none absolute left-0 right-0 top-0 w-full">
        {items.map((item, index) => (
          <div key={`ghost-${item.id}`} className="ghost-block h-[80vh] w-full" data-index={index} />
        ))}
      </div>

      <motion.div
        style={{ filter, opacity, willChange: "filter, opacity" }}
        className="sticky top-0 flex h-screen flex-col items-center overflow-hidden pb-20 pt-20 sm:pb-24 sm:pt-24"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_46%),radial-gradient(circle_at_88%_18%,rgba(34,211,238,0.14),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,transparent_42%)]" />
        <div className="decorative-grid absolute inset-0" data-theme="dark" />

        <div className="pointer-events-none relative z-40 w-full shrink-0 px-6 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200 drop-shadow-md">
            Prova social
          </span>
          <h2
            id="testimonials-title"
            className="mx-auto mt-3 max-w-[800px] text-[clamp(1.75rem,4vw,2.5rem)] font-bold leading-[1.05] tracking-[-0.05em] text-white drop-shadow-lg md:text-[clamp(2.5rem,4vw,3.5rem)] md:leading-[0.98]"
          >
            {section.title}
          </h2>
        </div>

        <div className="relative z-10 mx-auto mt-6 w-full max-w-7xl flex-1 sm:mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, y: 12, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.985 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center px-4 md:px-12"
            >
              <article className="pointer-events-auto relative mx-auto w-full max-w-3xl rounded-[30px] border border-white/80 bg-white p-6 shadow-[0_14px_32px_rgba(3,10,26,0.14)] sm:p-8 md:p-10">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-6 flex h-14 w-[100px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] sm:h-16 sm:w-[120px]">
                    <img
                      src={currentItem.photo}
                      alt={`Logo da empresa ${currentItem.company}`}
                      className="h-full w-full object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="relative mb-8 w-full rounded-[26px] border border-slate-200 bg-slate-50 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:p-8">
                    <span className="absolute -top-5 left-1/2 inline-flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-2xl bg-white text-[var(--primary,theme(colors.blue.600))] shadow-[0_8px_20px_rgba(15,23,42,0.08)]">
                      <Quotes size={20} weight="fill" />
                    </span>
                    <p className="mt-2 text-base italic leading-relaxed text-slate-800 sm:text-lg md:text-xl">
                      "{currentItem.testimonial}"
                    </p>
                  </div>
                  <h3 className="w-full break-words px-2 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
                    {currentItem.name}
                  </h3>
                  <div className="mt-2 flex w-full flex-col items-center justify-center gap-1 break-words px-2 text-sm text-slate-600 sm:flex-row sm:gap-2 sm:text-base">
                    <span>{currentItem.role}</span>
                    <span className="hidden sm:inline">-</span>
                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                      <Buildings size={16} weight="duotone" />
                      {currentItem.company}
                    </span>
                  </div>
                  <div className="mt-5 flex items-center gap-1" aria-label={`${currentItem.rating} de 5 estrelas`}>
                    {renderStars(currentItem.rating)}
                  </div>
                </div>
              </article>
            </motion.div>
          </AnimatePresence>
        </div>

        {totalSlides > 1 ? (
          <div className="pointer-events-none absolute inset-x-3 top-1/2 z-40 flex -translate-y-1/2 items-center justify-between sm:inset-x-6 lg:inset-x-10">
            <TestimonialNavButton
              label="Depoimento anterior"
              direction="previous"
              onClick={() => goToTestimonial(currentIdx - 1)}
            />
            <TestimonialNavButton
              label="Próximo depoimento"
              direction="next"
              onClick={() => goToTestimonial(currentIdx + 1)}
            />
          </div>
        ) : null}

        <div className="pointer-events-none absolute bottom-6 left-0 right-0 z-40 flex flex-col items-center gap-3 sm:bottom-10">
          <div className="font-mono text-xs font-medium tracking-widest text-white/60 sm:text-sm">
            {String(currentIdx + 1).padStart(2, "0")} / {String(totalSlides).padStart(2, "0")}
          </div>
          <div className="flex gap-2">
            {items.map((item, index) => (
              <div
                key={`dot-${item.id}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentIdx ? "w-8 bg-sky-400" : "w-2.5 bg-white/20"}`}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function TestimonialNavButton({
  label,
  direction,
  onClick,
}: {
  label: string;
  direction: "previous" | "next";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/[0.075] text-white/82 shadow-[0_12px_28px_rgba(2,6,23,0.24)] backdrop-blur-md transition-[background-color,border-color,transform,color] duration-200 ease-out hover:-translate-y-px hover:border-white/20 hover:bg-white/[0.12] hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/16 sm:h-12 sm:w-12"
    >
      {direction === "previous" ? (
        <CaretLeft size={22} weight="bold" aria-hidden="true" />
      ) : (
        <CaretRight size={22} weight="bold" aria-hidden="true" />
      )}
    </button>
  );
}
