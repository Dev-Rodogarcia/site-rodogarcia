import type { ReactNode } from "react";
import type { Metadata } from "next";
import {
  Briefcase,
  ChatCircleDots,
  Clock,
  EnvelopeSimple,
  MapPinLine,
  ShieldCheck,
  Trophy,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import {
  ActionLink,
  PageContainer,
  PageCtaBand,
  PageSection,
  PageShell,
  SectionHeader,
} from "@/components/internal/PageContent";
import { preparePublicContent, readContentData } from "@/lib/content";
import { external, seo, site } from "@/lib/routes";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Carreiras",
  description:
    "Conheça as oportunidades da Rodogarcia e envie sua candidatura para uma empresa que cresce com disciplina e foco operacional.",
  alternates: { canonical: seo.absoluteUrl(site.careers) },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: seo.siteName,
    title: "Carreiras | Rodogarcia Transportes",
    description:
      "Veja as vagas em destaque e como a Rodogarcia organiza sua frente de recrutamento.",
    url: seo.absoluteUrl(site.careers),
    images: [{ url: seo.absoluteUrl("/caminhoneiro1.png") }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Carreiras | Rodogarcia Transportes",
    description:
      "Trabalhe em uma operação nacional orientada por consistência, crescimento e excelência.",
    images: [seo.absoluteUrl("/caminhoneiro1.png")],
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};

const BENEFITS = [
  {
    icon: ShieldCheck,
    title: "Plano de saúde",
    description: "Cobertura para você e sua família com foco em bem-estar.",
  },
  {
    icon: Trophy,
    title: "Desenvolvimento",
    description: "Espaço para aprender e crescer junto com a operação.",
  },
  {
    icon: Briefcase,
    title: "Remuneração competitiva",
    description: "Pacote alinhado ao mercado e à responsabilidade do cargo.",
  },
  {
    icon: UsersThree,
    title: "Ambiente colaborativo",
    description: "Time próximo, cultura de ajuda e responsabilidade compartilhada.",
  },
];

const PROCESS_STEPS = [
  {
    step: "01",
    title: "Candidatura",
    description: "Envie seu currículo por e-mail, com a vaga de interesse no assunto e telefone para retorno.",
  },
  {
    step: "02",
    title: "Triagem",
    description: "O time de RH analisa o perfil e entra em contato dentro de 5 dias úteis.",
  },
  {
    step: "03",
    title: "Entrevista",
    description: "Conversa com RH e liderança da área para alinhar expectativas e fit cultural.",
  },
  {
    step: "04",
    title: "Boas-vindas",
    description: "Onboarding estruturado para garantir uma entrada tranquila na operação.",
  },
];

type JobCard = {
  title: string;
  badge: string;
  badgeVariant: "new" | "default";
  location: string;
  workType: string;
  contractType: string;
  description: string;
  applyUrl?: string;
};

const STATIC_JOBS: JobCard[] = [
  {
    title: "Motorista Categoria C/D/E",
    badge: "Novo",
    badgeVariant: "new",
    location: "Agudos/SP",
    workType: "Presencial",
    contractType: "Integral",
    description:
      "Experiência mínima de 2 anos em transporte de cargas e foco em segurança operacional.",
  },
  {
    title: "Analista de Logística",
    badge: "Disponível",
    badgeVariant: "default",
    location: "Campinas/SP",
    workType: "Híbrido",
    contractType: "Integral",
    description: "Gestão de rotas, leitura de indicadores e melhoria de processo logístico.",
  },
  {
    title: "Assistente Administrativo",
    badge: "Disponível",
    badgeVariant: "default",
    location: "Osasco/SP",
    workType: "Presencial",
    contractType: "Integral",
    description: "Apoio a rotinas administrativas, documentação e interface com a operação.",
  },
];

function CareersHeroSurface({
  children,
  className,
  contentClassName,
}: {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section className={cn("relative overflow-hidden py-12 sm:py-16 lg:py-20", className)}>
      <div className="pointer-events-none absolute inset-0 bg-[var(--foreground)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.1),transparent_40%),radial-gradient(circle_at_78%_14%,rgba(56,189,248,0.06),transparent_24%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.025)_0%,transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:36px_36px]" />

      <PageContainer>
        <div className={cn("relative", contentClassName)}>{children}</div>
      </PageContainer>
    </section>
  );
}

function getJobCards(): JobCard[] {
  try {
    const content = preparePublicContent(readContentData());
    if (content.featuredJobs.length > 0) {
      return content.featuredJobs.map((job, index) => ({
        title: job.title,
        badge: index === 0 ? "Novo" : "Disponível",
        badgeVariant: index === 0 ? "new" : "default",
        location: job.location || "A combinar",
        workType: job.workType || "Consulte RH",
        contractType: job.contractType || "Integral",
        description: job.description,
        applyUrl: job.applyUrl,
      }));
    }
  } catch {
    return STATIC_JOBS;
  }

  return STATIC_JOBS;
}

export default function TrabalheConoscoPage() {
  const jobs = getJobCards();

  return (
    <PageShell>
      {/* HERO — azul escuro, padrão /servicos */}
      <div className="relative overflow-hidden bg-[var(--foreground)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.1),transparent_40%),radial-gradient(circle_at_78%_14%,rgba(56,189,248,0.06),transparent_24%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.025)_0%,transparent_40%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:36px_36px]" />

        <section className="relative pt-20 sm:pt-24 lg:pt-28" aria-labelledby="carreiras-hero-title">
          <PageContainer>
            <div className="mx-auto max-w-[920px] py-10 text-center sm:py-12 lg:py-16">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200/80 backdrop-blur-sm">
                Carreiras
              </span>

              <h1
                id="carreiras-hero-title"
                className="mx-auto mt-6 max-w-[16ch] text-[clamp(3rem,8vw,6rem)] font-bold leading-[0.9] tracking-[-0.05em] sm:max-w-[18ch] sm:tracking-[-0.07em]"
              >
                <span className="block bg-[linear-gradient(180deg,#a5f3fc_0%,#dbeafe_100%)] bg-clip-text text-transparent">
                  Construa aqui
                </span>
                <span className="mt-1 block text-white">sua carreira.</span>
              </h1>

              <p className="mx-auto mt-5 max-w-[42rem] text-sm leading-7 text-white/68 sm:text-base">
                35 anos de história, operação nacional e um time que cresce com método. Se você quer mais do que uma vaga, a Rodogarcia tem o ambiente certo.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <ActionLink
                  action={{ label: "Ver vagas abertas", href: "#vagas" }}
                  tone="dark"
                />
                <ActionLink
                  action={{ label: "Enviar currículo", href: "#candidatura", variant: "secondary" }}
                  tone="dark"
                />
              </div>

            </div>
          </PageContainer>
        </section>
      </div>

      {/* SEÇÃO 2 — clara: benefícios */}
      <PageSection>
        <PageContainer>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <SectionHeader
                eyebrow="Cultura e benefícios"
                title="Mais do que preencher vagas, queremos construir carreiras."
                description="O ambiente é colaborativo, o crescimento é real e os benefícios acompanham o nível de responsabilidade de cada função."
              />

              <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
                {BENEFITS.map((item) => (
                  <div key={item.title} className="group flex flex-col gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] transition-all duration-300 group-hover:bg-[var(--primary)] group-hover:text-white">
                      <item.icon size={22} weight="duotone" />
                    </span>
                    <div>
                      <p className="font-semibold tracking-[-0.02em] text-[var(--foreground)]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm leading-7 text-[var(--color-muted-raw)]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[34px] border border-white/70 bg-[#dce7f7] shadow-[0_24px_64px_rgba(15,23,42,0.12)]">
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(2,6,23,0.08)_100%)]" />
              <img
                src="/caminhoneiro1.png"
                alt="Time Rodogarcia em operação"
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </PageContainer>
      </PageSection>

      {/* SEÇÃO 3 — azul escuro: processo seletivo */}
      <CareersHeroSurface contentClassName="space-y-12">
        <SectionHeader
          eyebrow="Processo seletivo"
          title="Como funciona a jornada de entrada."
          description="Quatro etapas simples, diretas e sem burocracia desnecessária."
          theme="dark"
          align="center"
        />

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {PROCESS_STEPS.map((item) => (
            <div key={item.title} className="flex flex-col gap-3 border-l border-white/10 pl-6">
              <span className="text-[2.8rem] font-bold leading-none tracking-[-0.06em] text-white/10">
                {item.step}
              </span>
              <h3 className="text-xl font-semibold tracking-[-0.03em] text-white">
                {item.title}
              </h3>
              <p className="text-sm leading-7 text-white/62">{item.description}</p>
            </div>
          ))}
        </div>
      </CareersHeroSurface>

      {/* SEÇÃO 4 — clara: vagas abertas */}
      <PageSection>
        <PageContainer>
          <div id="vagas" className="scroll-mt-28">
            <SectionHeader
              eyebrow="Vagas em destaque"
              title="Oportunidades abertas para a próxima etapa."
              description="Posições ativas na operação. Candidature-se diretamente ou envie seu perfil para a base de talentos."
              align="center"
            />

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <div
                  key={job.title}
                  className="group flex flex-col gap-4 border-b border-[var(--border)] pb-6 last:border-b-0 md:border-b-0 md:border-l md:pb-0 md:pl-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--foreground)]">
                      {job.title}
                    </h3>
                    <span
                      className={`shrink-0 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                        job.badgeVariant === "new"
                          ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                          : "bg-[var(--foreground)]/6 text-[var(--color-muted-raw)]"
                      }`}
                    >
                      {job.badge}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted-raw)]">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPinLine size={13} weight="duotone" className="text-[var(--primary)]" />
                      {job.location}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Briefcase size={13} weight="duotone" className="text-[var(--primary)]" />
                      {job.workType}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={13} weight="duotone" className="text-[var(--primary)]" />
                      {job.contractType}
                    </span>
                  </div>

                  <p className="text-sm leading-7 text-[var(--color-muted-raw)]">
                    {job.description}
                  </p>

                  <ActionLink
                    action={{
                      label: job.applyUrl ? "Candidatar-se" : "Enviar perfil",
                      href: job.applyUrl || "#candidatura",
                      variant: "secondary",
                      external: Boolean(job.applyUrl),
                    }}
                    className="mt-auto w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        </PageContainer>
      </PageSection>

      {/* SEÇÃO 5 — azul escuro: candidatura direta */}
      <CareersHeroSurface
        className="scroll-mt-28"
        contentClassName="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-start"
      >
        <div id="candidatura">
          <SectionHeader
            eyebrow="Candidatura direta"
            title="Sem formulário longo: envie seu perfil do jeito mais simples."
            description="O caminho aqui é direto. Mande seu currículo por e-mail com a vaga no assunto ou fale com o time para orientação rápida."
            theme="dark"
          />

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ActionLink
              action={{
                label: "Enviar currículo por e-mail",
                href: external.careersEmailWithSubject,
                external: true,
              }}
              tone="dark"
            />
            <ActionLink
              action={{
                label: "Abrir contato",
                href: site.contact,
                variant: "secondary",
              }}
              tone="dark"
            />
          </div>

          <div className="mt-8 grid gap-6 border-t border-white/10 pt-6 md:grid-cols-3">
            {[
              {
                label: "O que enviar",
                detail: "Currículo em PDF ou LinkedIn, telefone para retorno e cidade de atuação.",
              },
              {
                label: "Assunto ideal",
                detail: "Use o nome da vaga quando houver posição aberta. Para perfil geral, envie como banco de talentos.",
              },
              {
                label: "Prazo de retorno",
                detail: "O RH faz a primeira leitura e pode entrar em contato em até 5 dias úteis.",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="border-t border-white/10 pt-6 first:border-t-0 first:pt-0 md:border-t-0 md:pt-0 md:border-l md:pl-5 md:first:border-l-0 md:first:pl-0"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200/78">
                  {item.label}
                </p>
                <p className="mt-3 text-sm leading-7 text-white/62">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6 pt-2 lg:pt-0">
          <div className="border-t border-white/10 pt-6 lg:pt-0">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200/78">
              <EnvelopeSimple size={16} weight="duotone" className="text-sky-300" />
              Envio rápido
            </p>
            <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-white">
              Um canal direto, sem atrito.
            </h3>
            <p className="mt-2 text-sm leading-7 text-white/62">
              Se o perfil combinar com a operação, o RH puxa os próximos passos sem exigir cadastro longo no site.
            </p>
          </div>

          <div className="border-t border-white/10 pt-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200/78">
              O que valorizamos
            </p>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start gap-2 text-sm leading-7 text-white/62">
                <UsersThree size={18} weight="duotone" className="mt-0.5 shrink-0 text-sky-300" />
                Disciplina, colaboração e vontade de evoluir consistentemente.
              </li>
              <li className="flex items-start gap-2 text-sm leading-7 text-white/62">
                <Briefcase size={18} weight="duotone" className="mt-0.5 shrink-0 text-sky-300" />
                Perfis que entendem ritmo operacional e responsabilidade com entrega.
              </li>
              <li className="flex items-start gap-2 text-sm leading-7 text-white/62">
                <ChatCircleDots size={18} weight="duotone" className="mt-0.5 shrink-0 text-sky-300" />
                Comunicação clara, pontualidade e comprometimento com o time.
              </li>
            </ul>
          </div>
        </div>
      </CareersHeroSurface>

      {/* CTA FINAL */}
      <PageCtaBand
        eyebrow="Não encontrou a vaga certa?"
        title="Entre na base de talentos da Rodogarcia."
        description="Se o seu perfil faz sentido para a operação, o RH pode avaliar sua candidatura mesmo fora das vagas em destaque."
        primaryAction={{
          label: "Enviar currículo por e-mail",
          href: external.careersEmailWithSubject,
          variant: "primary",
          external: true,
        }}
        secondaryAction={{
          label: "Falar com contato",
          href: site.contact,
          variant: "secondary",
        }}
        benefits={["Base de talentos ativa", "Contato direto com RH", "Processo estruturado"]}
      />
    </PageShell>
  );
}
