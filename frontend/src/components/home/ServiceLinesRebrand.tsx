import Link from "next/link";
import { mediaSlot } from "@/lib/cmsPublic";
import { site } from "@/lib/routes";

type ServiceCard = {
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  kicker: string;
  media:
    | {
        kind: "video";
        src: string;
        poster?: string;
      }
    | {
        kind: "image";
        src: string;
        alt: string;
      };
};

const SERVICE_CARDS: ServiceCard[] = [
  {
    title: "Distribuição nacional",
    description:
      "Coleta, transferencia e entrega final com rastreabilidade e governança de rota.",
    href: site.services,
    ctaLabel: "Explorar serviços",
    kicker: "Malha ativa",
    media: {
      kind: "video",
      src: "/caminhoes1.mp4",
      poster: "/foto2.png",
    },
  },
  {
    title: "Operação indoor",
    description:
      "Fluxos de armazenagem, cross docking e apoio a operações de alto giro.",
    href: site.business,
    ctaLabel: "Ver operações B2B",
    kicker: "Fluxo interno",
    media: {
      kind: "video",
      src: "/Vídeo_de_Operação_Gerado.mp4",
      poster: "/foto4.png",
    },
  },
  {
    title: "Cargas especiais",
    description:
      "Compliance e segurança para indústrias com demanda sensível e exigente.",
    href: site.contact,
    ctaLabel: "Fale conosco",
    kicker: "Execução crítica",
    media: {
      kind: "video",
      src: "/caminhoneiro.mp4",
      poster: "/caminhoneiro1.png",
    },
  },
];

const SERVICE_MEDIA_SLOTS = [
  {
    src: "home.services.distribution.video",
    poster: "home.services.distribution.poster",
  },
  {
    src: "home.services.indoor.video",
    poster: "home.services.indoor.poster",
  },
  {
    src: "home.services.special.video",
    poster: "home.services.special.poster",
  },
] as const;

export default function ServiceLinesRebrand({
  mediaSlots = {},
}: {
  mediaSlots?: Record<string, string>;
}) {
  const serviceCards = SERVICE_CARDS.map((card, index) => {
    const slots = SERVICE_MEDIA_SLOTS[index];
    if (!slots || card.media.kind !== "video") return card;

    return {
      ...card,
      media: {
        ...card.media,
        src: mediaSlot(mediaSlots, slots.src, card.media.src),
        poster: mediaSlot(mediaSlots, slots.poster, card.media.poster ?? ""),
      },
    } satisfies ServiceCard;
  });

  return (
    <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#f2f6fb_100%)] py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(6,182,212,0.04),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(29,78,216,0.05),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(15,23,42,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.1)_1px,transparent_1px)] [background-size:40px_40px]" />

      <div className="relative mx-auto max-w-[1440px] px-6">
        <div className="grid gap-12 lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[440px_minmax(0,1fr)] xl:gap-16">
          <div className="flex flex-col justify-between gap-8 pt-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/10 bg-[var(--color-primary-soft)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--primary)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                Linhas de serviço
              </span>
              <h2 className="mt-6 text-[clamp(2rem,3.8vw,3.2rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-[var(--foreground)] [text-wrap:balance]">
                Soluções para a complexidade da sua operação.
              </h2>
              <p className="mt-5 max-w-[32rem] text-[15px] leading-relaxed text-[var(--color-muted-raw)] sm:text-[17px]">
                Da distribuição nacional às cargas especiais, cada frente combina
                execução rigorosa, rastreabilidade e inteligência operacional para sustentar o
                ritmo da sua entrega em qualquer cenário.
              </p>
            </div>

            <Link
              href={site.services}
              className="hidden w-fit items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3.5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(29,78,216,0.24)] transition-all duration-300 hover:-translate-y-1 hover:bg-[var(--color-primary-strong)] hover:shadow-[0_16px_32px_rgba(29,78,216,0.32)] lg:inline-flex"
            >
              Conhecer soluções
              <ArrowRightIcon />
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {serviceCards.map((card) => (
              <article
                key={card.title}
                className="group flex min-w-0 flex-1 flex-col overflow-hidden rounded-[32px] border border-white bg-white/60 shadow-[0_8px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-sky-100 hover:bg-white hover:shadow-[0_24px_50px_rgba(29,78,216,0.08)]"
              >
                <div className="relative aspect-video overflow-hidden p-2 pb-0">
                  <div className="relative h-full w-full overflow-hidden rounded-[24px] bg-slate-100">
                    {card.media.kind === "video" ? (
                      <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        poster={card.media.poster}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                      >
                        <source src={card.media.src} type="video/mp4" />
                      </video>
                    ) : (
                      <img
                        src={card.media.src}
                        alt={card.media.alt}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                        loading="lazy"
                        decoding="async"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-transparent to-transparent opacity-80" />
                    
                    <div className="absolute left-4 top-4">
                      <span className="inline-flex rounded-full border border-white/20 bg-black/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-sm backdrop-blur-md">
                        {card.kicker}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
                  <h3 className="text-lg font-bold tracking-[-0.03em] text-[var(--foreground)] transition-colors duration-300 group-hover:text-[var(--primary)]">
                    {card.title}
                  </h3>
                  <p className="mt-2.5 flex-1 text-[13px] leading-[1.6] text-[var(--color-muted-raw)]">
                    {card.description}
                  </p>
                  
                  <div className="mt-5 border-t border-slate-100/80 pt-4">
                    <Link
                      href={card.href}
                      className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-[var(--primary)] transition-all duration-300 hover:gap-3 hover:text-[var(--color-primary-strong)]"
                    >
                      {card.ctaLabel}
                      <ArrowRightIcon />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-10 lg:hidden">
          <Link
            href={site.services}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-6 py-4 text-sm font-bold text-white shadow-[0_12px_24px_rgba(29,78,216,0.24)] transition-all duration-300 hover:-translate-y-1 hover:bg-[var(--color-primary-strong)] hover:shadow-[0_16px_32px_rgba(29,78,216,0.32)]"
          >
            Conhecer soluções
            <ArrowRightIcon />
          </Link>
        </div>
      </div>
    </section>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M2.667 8h10.666M8.667 3.333 13.333 8l-4.666 4.667"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4.667 11.333 11.333 4.667M6 4.667h5.333V10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
