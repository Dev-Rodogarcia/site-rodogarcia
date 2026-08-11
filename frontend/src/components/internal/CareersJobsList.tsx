"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Briefcase, Clock, MapPinLine } from "@phosphor-icons/react";
import type { CareersPageJob } from "@/types/content";

function isExternalUrl(url: string) {
  return url.startsWith("http") || url.startsWith("mailto:") || url.startsWith("tel:");
}

export function CareersJobsList({ jobs }: { jobs: CareersPageJob[] }) {
  const activeJobs = useMemo(
    () => jobs.filter((job) => job.active !== false),
    [jobs]
  );
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(activeJobs.length / 3));
  const currentPage = Math.min(page, totalPages - 1);
  const firstJob = currentPage * 3 + 1;
  const lastJob = Math.min((currentPage + 1) * 3, activeJobs.length);
  const currentJobs = activeJobs.slice(currentPage * 3, currentPage * 3 + 3);

  if (activeJobs.length === 0) {
    return (
      <div className="mt-12 rounded-[28px] border border-dashed border-[var(--border)] bg-white/60 px-6 py-10 text-center">
        <p className="text-sm font-semibold text-[var(--foreground)]">Nenhuma vaga aberta no momento.</p>
        <p className="mt-2 text-sm text-[var(--color-muted-raw)]">A candidatura direta continua disponível para banco de talentos.</p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {currentJobs.map((job) => {
          const external = isExternalUrl(job.applyUrl);
          const buttonClassName =
            "mt-auto inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-[var(--border)] bg-white/78 px-5 text-sm font-semibold text-[var(--foreground)] shadow-[0_14px_30px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--color-surface-2)]";
          const button = external ? (
            <a href={job.applyUrl} target="_blank" rel="noopener noreferrer" className={buttonClassName}>
              Candidatar-se
            </a>
          ) : (
            <Link href={job.applyUrl} className={buttonClassName}>
              Candidatar-se
            </Link>
          );

          return (
            <div
              key={job.id}
              className="group flex flex-col gap-4 border-b border-[var(--border)] pb-6 last:border-b-0 md:border-b-0 md:border-l md:pb-0 md:pl-6"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--foreground)]">
                  {job.title}
                </h3>
                <span className="shrink-0 rounded-full bg-[var(--primary)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">
                  Ativa
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted-raw)]">
                <span className="inline-flex items-center gap-1.5">
                  <MapPinLine size={13} weight="duotone" className="text-[var(--primary)]" />
                  {job.location}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase size={13} weight="duotone" className="text-[var(--primary)]" />
                  {job.type}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={13} weight="duotone" className="text-[var(--primary)]" />
                  Publicada
                </span>
              </div>
              <p className="text-sm leading-7 text-[var(--color-muted-raw)]">{job.description}</p>
              {button}
            </div>
          );
        })}
      </div>

      <nav aria-label="Paginação de vagas" className="mt-10 flex flex-col gap-4 border-t border-[var(--border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--color-muted-raw)]" aria-live="polite">
          Mostrando <span className="font-semibold text-[var(--foreground)]">{firstJob}–{lastJob}</span> de <span className="font-semibold text-[var(--foreground)]">{activeJobs.length} {activeJobs.length === 1 ? "vaga" : "vagas"}</span>
          <span className="mx-2 text-[var(--border)]">•</span>Página {currentPage + 1} de {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage === 0}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--primary)]/35 hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <ArrowLeft size={16} weight="bold" />Anterior
          </button>
          <button
            type="button"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[var(--primary)] bg-[var(--primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-strong)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            Próxima<ArrowRight size={16} weight="bold" />
          </button>
        </div>
      </nav>
    </>
  );
}
