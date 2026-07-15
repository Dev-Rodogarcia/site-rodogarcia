"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Briefcase,
  ChartBar,
  CursorClick,
  ImagesSquare,
  Pulse,
  Sparkle,
} from "@phosphor-icons/react";
import { adminResourceKeys, useAdminResource } from "@/hooks/useAdminResource";
import { useCarouselPagination } from "@/hooks/useCarouselPagination";
import {
  adminNavigationGroups,
  api,
  type AppPath,
} from "@/lib/routes";
import {
  DeveloperCard,
  DeveloperHelp,
  DeveloperHero,
  DeveloperCarouselPagination,
  DeveloperMessage,
  DeveloperPage,
  DeveloperSectionHeading,
  developerSecondaryButtonClassName,
} from "@/components/developer/ui";

interface ContentSummary {
  homePage?: {
    hero?: { slides?: Array<{ active?: boolean }> };
    section1?: { items?: Array<unknown> };
    section2?: { items?: Array<{ active?: boolean }> };
    section3?: { cards?: Array<unknown> };
    regionalPresence?: { units?: Array<{ active?: boolean }> };
    socialProof?: { feedbacks?: Array<{ active?: boolean }> };
    quickActions?: Array<{ enabled?: boolean }>;
  };
  careersPage?: {
    jobs?: Array<{ active?: boolean }>;
  };
  aboutPage?: {
    hero?: { title?: string; description?: string; media?: { src?: string } };
    compliance?: {
      image?: { src?: string };
      title?: string;
      description?: string;
      certificateText?: string;
    };
    finalCta?: {
      title?: string;
      description?: string;
      buttons?: Array<{ label?: string; url?: string }>;
    };
  };
  contactPage?: {
    heroWhatsappButton?: { label?: string; url?: string };
    mainChannels?: Array<unknown>;
    info?: {
      companyTitle?: string;
      address?: string;
      hours?: string;
      channelGuideTitle?: string;
      channelGuideDescription?: string;
      documentsDescription?: string;
      quickSupportDescription?: string;
      indicators?: Array<unknown>;
    };
    finalCta?: { buttons?: Array<unknown> };
  };
  footerLinks?: {
    footer?: {
      description?: string;
      proposalButton?: { label?: string; url?: string };
      supportButton?: { label?: string; url?: string };
      columns?: Array<unknown>;
      bottomLinks?: Array<unknown>;
      copyrightText?: string;
      locationText?: string;
    };
  };
  units: Array<{ active?: boolean; ativo?: boolean }>;
}

interface DashboardData {
  content: ContentSummary;
  analytics: {
    totalPageViews: number;
    uniqueSessions: number;
    topPages: Array<{ page: string; views: number }>;
  };
  popup: {
    analytics?: {
      totals: Record<string, number>;
      conversionRate: number;
      topPages: Array<{ pagePath: string; total: number }>;
    };
  };
  leads: { leads: Array<{ createdAt?: string }> };
  images: { images: Array<{ source: string; usedInContent: boolean }> };
}

function DashboardMetric({
  title,
  value,
  icon: Icon,
  helper,
}: {
  title: string;
  value: string;
  icon: typeof ChartBar;
  helper: string;
}) {
  return (
    <DeveloperCard>
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
        <Icon size={22} weight="duotone" />
      </span>
      <div className="mt-5 text-4xl font-bold tracking-[-0.06em] text-[var(--foreground)]">
        {value}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted-raw)]">
        <span>{title}</span>
        <DeveloperHelp label={title} kind="metric" />
      </div>
      <p className="mt-3 text-sm leading-7 text-[var(--color-muted-raw)]">{helper}</p>
    </DeveloperCard>
  );
}

function CoverageRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
        <span className="text-sm font-semibold text-[var(--primary)]">{value}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
        <div
          className="h-2 rounded-full bg-[linear-gradient(90deg,#1d4ed8_0%,#06b6d4_100%)]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function calculateCoverage(filled: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((filled / total) * 100);
}

function countFilled(values: Array<unknown>) {
  return values.filter((value) => Boolean(String(value ?? "").trim())).length;
}

export default function DeveloperDashboardPage() {
  const { data, loading, error } = useAdminResource<DashboardData>({
    key: adminResourceKeys.dashboard,
    fetcher: async (apiRequest) => {
      const [contentRes, analyticsRes, popupRes, leadsRes, imagesRes] =
        await Promise.all([
          apiRequest<{ content: ContentSummary }>(api.admin.content),
          apiRequest<DashboardData["analytics"]>(`${api.analytics.stats}?days=30`),
          apiRequest<DashboardData["popup"]>(`${api.popup.events}?days=30`),
          apiRequest<DashboardData["leads"]>(`${api.admin.leads}?limit=200`),
          apiRequest<DashboardData["images"]>(api.admin.images),
        ]);

      if (
        !contentRes.success ||
        !analyticsRes.success ||
        !popupRes.success ||
        !leadsRes.success ||
        !imagesRes.success
      ) {
        return {
          success: false,
          error:
            contentRes.error ??
            analyticsRes.error ??
            popupRes.error ??
            leadsRes.error ??
            imagesRes.error ??
            "Falha ao carregar o dashboard.",
        };
      }

      return {
        success: true,
        data: {
          content: contentRes.data?.content ?? {
            homePage: {
              hero: { slides: [] },
              section1: { items: [] },
              section2: { items: [] },
              section3: { cards: [] },
              regionalPresence: { units: [] },
              socialProof: { feedbacks: [] },
              quickActions: [],
            },
            careersPage: { jobs: [] },
            footerLinks: { footer: { columns: [], bottomLinks: [] } },
            units: [],
          },
          analytics: analyticsRes.data ?? {
            totalPageViews: 0,
            uniqueSessions: 0,
            topPages: [],
          },
          popup: popupRes.data ?? {},
          leads: leadsRes.data ?? { leads: [] },
          images: imagesRes.data ?? { images: [] },
        },
      };
    },
  });

  const summary = useMemo(() => {
    if (!data) return null;

    const homePage = data.content.homePage;
    const heroSlides = homePage?.hero?.slides ?? [];
    const section1Items = homePage?.section1?.items ?? [];
    const operationItems = homePage?.section2?.items ?? [];
    const serviceCards = homePage?.section3?.cards ?? [];
    const regionalUnits = homePage?.regionalPresence?.units ?? [];
    const quickActions = homePage?.quickActions ?? [];
    const homeFeedbacks = homePage?.socialProof?.feedbacks ?? [];
    const careersJobs = data.content.careersPage?.jobs ?? [];

    const heroActive = heroSlides.filter((item) => item.active !== false).length;
    const operationsActive = operationItems.filter((item) => item.active !== false).length;
    const jobsActive = careersJobs.filter((item) => item.active !== false).length;
    const feedbacksActive = homeFeedbacks.filter((item) => item.active !== false).length;
    const unitsActive = data.content.units.filter(
      (item) => item.active !== false && item.ativo !== false
    ).length;
    const regionalUnitsActive = regionalUnits.filter((item) => item.active !== false).length;
    const uploadImages = data.images.images.filter((item) => item.source === "upload").length;
    const contentImages = data.images.images.filter((item) => item.usedInContent).length;
    const editableItems =
      heroSlides.length +
      section1Items.length +
      operationItems.length +
      serviceCards.length +
      quickActions.length +
      careersJobs.length +
      homeFeedbacks.length +
      data.content.units.length;
    const totalActive = heroActive + operationsActive + jobsActive + feedbacksActive + unitsActive;

    const coverageHome = calculateCoverage(
      Number(heroActive > 0) +
        Number(section1Items.length > 0) +
        Number(operationsActive > 0) +
        Number(serviceCards.length > 0) +
        Number(regionalUnitsActive > 0),
      5
    );
    const coverageCareers = calculateCoverage(
      Number(careersJobs.length > 0) +
        Number(jobsActive > 0),
      2
    );
    const coverageFooter = calculateCoverage(
      (() => {
        const footer = data.content.footerLinks?.footer;
        return countFilled([
          footer?.description,
          footer?.proposalButton?.label,
          footer?.proposalButton?.url,
          footer?.supportButton?.label,
          footer?.supportButton?.url,
          footer?.columns?.length,
          footer?.bottomLinks?.length,
          footer?.copyrightText,
          footer?.locationText,
        ]);
      })(),
      9
    );
    const coverageAbout = calculateCoverage(
      (() => {
        const about = data.content.aboutPage;
        return countFilled([
          about?.hero?.title,
          about?.hero?.description,
          about?.hero?.media?.src,
          about?.compliance?.image?.src,
          about?.compliance?.title,
          about?.compliance?.description,
          about?.compliance?.certificateText,
          about?.finalCta?.title,
          about?.finalCta?.description,
          about?.finalCta?.buttons?.length,
        ]);
      })(),
      10
    );
    const coverageContact = calculateCoverage(
      (() => {
        const contact = data.content.contactPage;
        return countFilled([
          contact?.heroWhatsappButton?.label,
          contact?.heroWhatsappButton?.url,
          contact?.mainChannels?.length,
          contact?.info?.companyTitle,
          contact?.info?.address,
          contact?.info?.hours,
          contact?.info?.channelGuideTitle,
          contact?.info?.channelGuideDescription,
          contact?.info?.documentsDescription,
          contact?.info?.quickSupportDescription,
          contact?.info?.indicators?.length,
          contact?.finalCta?.buttons?.length,
        ]);
      })(),
      12
    );
    const coverageContent = calculateCoverage(
      Number(feedbacksActive > 0) + Number(contentImages > 0) + Number(uploadImages > 0),
      3
    );

    return {
      heroActive,
      operationsActive,
      jobsActive,
      feedbacksActive,
      unitsActive,
      uploadImages,
      contentImages,
      editableItems,
      publicationRate: calculateCoverage(totalActive, editableItems || 1),
      coverageHome,
      coverageCareers,
      coverageFooter,
      coverageAbout,
      coverageContact,
      coverageContent,
      popupTotals: data.popup.analytics?.totals ?? {},
      popupTopPages: data.popup.analytics?.topPages ?? [],
      popupConversion: data.popup.analytics?.conversionRate ?? 0,
    };
  }, [data]);

  const quickLinks = adminNavigationGroups.flatMap((group) =>
    group.items.filter((item) => item.key !== "dashboard")
  );
  const topPages = (data?.analytics.topPages ?? []).slice(0, 8);
  const popupTopPages = summary?.popupTopPages ?? [];
  const {
    pages: popupTopPagesPages,
    currentPage: popupTopPagesPage,
    totalPages: popupTopPagesTotalPages,
    nextPage: nextPopupTopPagesPage,
    prevPage: prevPopupTopPagesPage,
  } = useCarouselPagination(popupTopPages, 5);

  return (
    <DeveloperPage>
      <DeveloperHero
        eyebrow="Painel Rodogarcia"
        title="Visão executiva do CMS."
        description="A área developer foi reorganizada para refletir o CMS estático com rotas reais do app atual, sem header e sem footer público."
        stats={[
          { label: "Módulos ativos", value: quickLinks.length },
          { label: "Últimos 30 dias", value: data?.analytics.uniqueSessions ?? 0 },
        ]}
      />

      {loading ? (
        <div className="mt-6">
          <DeveloperMessage tone="info">Carregando dados do painel...</DeveloperMessage>
        </div>
      ) : null}

      {error ? (
        <div className="mt-6">
          <DeveloperMessage tone="error">{error}</DeveloperMessage>
        </div>
      ) : null}

      {data && summary ? (
        <>
          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DashboardMetric
              title="Itens editáveis"
              value={summary.editableItems.toLocaleString("pt-BR")}
              icon={Sparkle}
              helper="Home, páginas internas, footer e unidades conforme o CMS atual."
            />
            <DashboardMetric
              title="Page views"
              value={data.analytics.totalPageViews.toLocaleString("pt-BR")}
              icon={ChartBar}
              helper="Leitura consolidada de visualizações do site no período atual."
            />
            <DashboardMetric
              title="Conversão do popup"
              value={`${summary.popupConversion.toFixed(1)}%`}
              icon={Pulse}
              helper="Relação entre popup exibido e popup enviado."
            />
            <DashboardMetric
              title="Leads capturados"
              value={data.leads.leads.length.toLocaleString("pt-BR")}
              icon={CursorClick}
              helper="Total de contatos recebidos pelo popup de saída."
            />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <DeveloperCard>
              <DeveloperSectionHeading
                eyebrow="Saúde do conteúdo"
                title="Cobertura por módulo"
                description="Leitura rápida do que já tem dados suficientes para aparecer bem nas páginas do projeto atual."
              />
              <div className="space-y-4">
                <CoverageRow label="Home" value={summary.coverageHome} />
                <CoverageRow label="Trabalhe Conosco" value={summary.coverageCareers} />
                <CoverageRow label="Footer links" value={summary.coverageFooter} />
                <CoverageRow label="Sobre" value={summary.coverageAbout} />
                <CoverageRow label="Contato" value={summary.coverageContact} />
                <CoverageRow label="Mídia e social proof" value={summary.coverageContent} />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] border border-[var(--border)] bg-white/72 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                    Publicação ativa
                  </p>
                  <p className="mt-3 text-3xl font-bold tracking-[-0.05em] text-[var(--foreground)]">
                    {summary.publicationRate}%
                  </p>
                  <p className="mt-2 text-sm text-[var(--color-muted-raw)]">
                    Hero ativos: {summary.heroActive} • operações ativas: {summary.operationsActive}
                  </p>
                </div>

                <div className="rounded-[24px] border border-[var(--border)] bg-white/72 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                    Biblioteca
                  </p>
                  <p className="mt-3 text-3xl font-bold tracking-[-0.05em] text-[var(--foreground)]">
                    {summary.contentImages}
                  </p>
                  <p className="mt-2 text-sm text-[var(--color-muted-raw)]">
                    Imagens em uso • uploads salvos: {summary.uploadImages}
                  </p>
                </div>
              </div>
            </DeveloperCard>

            <DeveloperCard>
              <DeveloperSectionHeading
                eyebrow="Visão comercial"
                title="Sinais operacionais"
                description="Indicadores de jobs, depoimentos e popup para leitura diária."
              />

              <div className="space-y-3">
                {[
                  {
                    label: "Vagas ativas",
                    value: summary.jobsActive.toLocaleString("pt-BR"),
                    icon: Briefcase,
                  },
                  {
                    label: "Feedbacks ativos",
                    value: summary.feedbacksActive.toLocaleString("pt-BR"),
                    icon: Sparkle,
                  },
                  {
                    label: "Unidades ativas",
                    value: summary.unitsActive.toLocaleString("pt-BR"),
                    icon: CursorClick,
                  },
                  {
                    label: "Popup exibido",
                    value: String(summary.popupTotals.popup_shown ?? 0),
                    icon: Pulse,
                  },
                  {
                    label: "Popup enviado",
                    value: String(summary.popupTotals.popup_submitted ?? 0),
                    icon: CursorClick,
                  },
                  {
                    label: "Assets da biblioteca",
                    value: data.images.images.length.toLocaleString("pt-BR"),
                    icon: ImagesSquare,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-4 rounded-[24px] border border-[var(--border)] bg-white/72 px-4 py-4"
                  >
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                      <item.icon size={20} weight="duotone" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--foreground)]">{item.label}</p>
                      <p className="text-xs text-[var(--color-muted-raw)]">
                        Atualizado a partir dos storages e APIs atuais do projeto.
                      </p>
                    </div>
                    <span className="text-xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </DeveloperCard>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <DeveloperCard className="flex h-full flex-col">
              <DeveloperSectionHeading
                eyebrow="Rotas mais acessadas"
                title="Top páginas do site"
                description="As páginas abaixo receberam mais visualizações no período atual."
              />

              <div className="flex flex-1 flex-col justify-between pt-4">
                {topPages.length > 0 ? (
                  topPages.map((item) => {
                    const maxViews = Math.max(...data.analytics.topPages.map((page) => page.views), 1);
                    const pct = Math.round((item.views / maxViews) * 100);

                    return (
                      <div key={item.page}>
                        <div className="flex items-center gap-3">
                          <span className="flex-1 truncate text-sm font-medium text-[var(--foreground)]">
                            {item.page}
                          </span>
                          <span className="text-sm font-semibold text-[var(--primary)]">{item.views}</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                          <div
                            className="h-2 rounded-full bg-[linear-gradient(90deg,#1d4ed8_0%,#06b6d4_100%)]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <DeveloperMessage tone="info">Nenhuma página registrada ainda.</DeveloperMessage>
                )}
              </div>
            </DeveloperCard>

            <DeveloperCard>
              <DeveloperSectionHeading
                eyebrow="Acesso rápido"
                title="Abrir módulos do CMS"
                description="Cada rota abaixo foi reescrita em React/TypeScript dentro de src/app/developer."
              />

              <div className="grid gap-3 sm:grid-cols-2">
                {quickLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href as AppPath}
                    className={developerSecondaryButtonClassName}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="mt-6 rounded-[24px] border border-[var(--border)] bg-white/72 px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                  Top páginas do popup
                </p>
                <div className="mt-3 overflow-hidden">
                  <div
                    className="flex transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)]"
                    style={{ transform: `translateX(-${popupTopPagesPage * 100}%)` }}
                  >
                    {popupTopPagesPages.map((page, index) => (
                      <div key={index} className="w-full shrink-0 space-y-2">
                        {page.length > 0 ? (
                          page.map((item) => (
                            <div
                              key={item.pagePath}
                              className="flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-3 text-sm"
                            >
                              <span className="truncate text-[var(--foreground)]">{item.pagePath}</span>
                              <strong className="text-[var(--primary)]">{item.total}</strong>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-[var(--color-muted-raw)]">
                            Ainda não há páginas com volume suficiente no popup.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <DeveloperCarouselPagination
                  currentPage={popupTopPagesPage}
                  totalPages={popupTopPagesTotalPages}
                  onNext={nextPopupTopPagesPage}
                  onPrev={prevPopupTopPagesPage}
                />
              </div>
            </DeveloperCard>
          </section>
        </>
      ) : null}
    </DeveloperPage>
  );
}
