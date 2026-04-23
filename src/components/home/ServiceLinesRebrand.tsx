import Link from "next/link";
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

export default function ServiceLinesRebrand() {
  return (
    <section className="relative overflow-hidden bg-[var(--color-surface-2)] py-20">
      <div className="mx-auto max-w-[1440px] px-6">
        <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="flex flex-col justify-between gap-8">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
                Linhas de serviço
              </span>
              <h2 className="mt-3 text-[clamp(2rem,3.8vw,3.4rem)] font-bold leading-[0.98] tracking-[-0.05em] text-[var(--foreground)]">
                Soluções desenhadas para acompanhar a complexidade da sua operação.
              </h2>
              <p className="mt-4 max-w-[30rem] text-sm leading-7 text-[var(--color-muted-raw)] sm:text-base">
                Da distribuição nacional as cargas especiais, cada frente combina
                execução, rastreabilidade e leitura operacional para sustentar o
                ritmo da sua entrega.
              </p>
            </div>

            <Link
              href={site.services}
              className="hidden w-fit items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-strong)] lg:inline-flex"
            >
              Conhecer soluções
              <ArrowRightIcon />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {SERVICE_CARDS.map((card) => (
              <article
                key={card.title}
                className="group flex min-w-0 flex-1 flex-col overflow-hidden rounded-[30px] border border-black/6 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
              >
                <div className="relative aspect-square overflow-hidden bg-[#dce7f7]">
                  {card.media.kind === "video" ? (
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      poster={card.media.poster}
                      className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                    >
                      <source src={card.media.src} type="video/mp4" />
                    </video>
                  ) : (
                    <img
                      src={card.media.src}
                      alt={card.media.alt}
                      className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0)_0%,rgba(2,6,23,0.1)_100%)]" />
                </div>

                <div className="px-5 pt-5">
                  <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--color-primary-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                    {card.kicker}
                  </span>
                </div>

                <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
                  <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--foreground)]">
                    {card.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-[var(--color-muted-raw)]">
                    {card.description}
                  </p>
                  <Link
                    href={card.href}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] transition-colors hover:text-[var(--color-primary-strong)]"
                  >
                    {card.ctaLabel}
                    <ArrowUpRightIcon />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-8 lg:hidden">
          <Link
            href={site.services}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-strong)]"
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
