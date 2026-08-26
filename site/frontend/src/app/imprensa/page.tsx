import type { Metadata } from "next";
import {
  ActionLink,
  PageContainer,
  PageSection,
  PageShell,
  SectionHeader,
} from "@/components/internal/PageContent";
import { buildCmsMetadata } from "@/lib/cmsPublic";
import { external, seo, site } from "@/lib/routes";
import { Buildings, Handshake, Target, ArrowRight, EnvelopeSimple, Clock, NotePencil } from "@phosphor-icons/react/dist/ssr";

const fallbackMetadata: Metadata = {
  title: "Imprensa",
  description:
    "Informações institucionais, contexto de marca e orientação de contato para imprensa da Rodogarcia.",
  alternates: { canonical: seo.absoluteUrl(site.press) },
  robots: { index: true, follow: true },
};

export async function generateMetadata(): Promise<Metadata> {
  return buildCmsMetadata(site.press, fallbackMetadata);
}

const BRAND_FACTS = [
  {
    icon: Buildings,
    title: "História operacional",
    description:
      "A Rodogarcia foi fundada em 1989 e construiu sua reputação combinando disciplina operacional e presença nacional.",
  },
  {
    icon: Target,
    title: "Cobertura e escala",
    description:
      "A malha atende operações de distribuição, transferência, indoor e projetos corporativos em diferentes níveis de complexidade.",
  },
  {
    icon: Handshake,
    title: "Qualidade e compliance",
    description:
      "Certificações e licenças reforçam o padrão de governança, segurança e confiança da marca em todo o país.",
  },
];

const MATERIALS = [
  {
    title: "Sobre a empresa",
    description:
      "Resumo institucional para contextualizar a marca, a cobertura e o posicionamento da Rodogarcia.",
  },
  {
    title: "Agenda de entrevistas",
    description:
      "Solicitações podem ser direcionadas pelo canal institucional para alinhamento de pauta, prazo e disponibilidade.",
  },
  {
    title: "Uso de informações e marca",
    description:
      "Conteúdo, identidade e dados institucionais devem ser utilizados com citação e contexto adequados.",
  },
];

export default function ImprensaPage() {
  return (
    <PageShell>
      {/* HERO — azul escuro padrão */}
      <div className="relative overflow-hidden bg-slate-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.15),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:32px_32px]" />

        <section className="relative pt-20 sm:pt-24 lg:pt-28" aria-labelledby="imprensa-hero-title">
          <PageContainer>
            <div className="mx-auto max-w-[860px] py-10 text-center sm:py-12 lg:py-16">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200/80 backdrop-blur-sm">
                Central de imprensa
              </span>

              <h1
                id="imprensa-hero-title"
                className="mx-auto mt-6 max-w-[18ch] text-[clamp(2.6rem,6vw,5rem)] font-bold leading-[0.92] tracking-[-0.05em] sm:tracking-[-0.06em]"
              >
                <span className="block bg-[linear-gradient(180deg,#a5f3fc_0%,#dbeafe_100%)] bg-clip-text text-transparent">
                  Informação
                </span>
                <span className="mt-1 block text-white">direto na fonte.</span>
              </h1>

              <p className="mx-auto mt-5 max-w-[44rem] text-sm leading-7 text-white/68 sm:text-base">
                Informações institucionais, contexto de marca e orientação de contato organizados com clareza para veículos de comunicação e parceiros.
              </p>

              <div className="mt-8 grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:flex-row sm:items-center sm:justify-center">
                <ActionLink
                  action={{ label: "Entrar em contato", href: site.contact }}
                  tone="dark"
                  className="w-full min-w-0 sm:w-auto"
                />
                <ActionLink
                  action={{ label: "Conhecer a empresa", href: site.about, variant: "secondary" }}
                  tone="dark"
                  className="w-full min-w-0 sm:w-auto"
                />
              </div>
            </div>
          </PageContainer>
        </section>
      </div>

      {/* SEÇÃO 2 — clara: fatos da marca */}
      <PageSection>
        <PageContainer>
          <SectionHeader
            eyebrow="Fatos principais"
            title="Contexto rápido e objetivo sobre a nossa atuação."
            description="Os pilares da Rodogarcia e sua presença nacional em transporte corporativo e logística."
            align="center"
          />

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {BRAND_FACTS.map((item) => (
              <div
                key={item.title}
                className="group flex flex-col gap-4 border-t-2 border-[var(--primary)]/10 pt-6 transition-colors duration-300 hover:border-[var(--primary)]/40"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                  <item.icon size={24} weight="duotone" />
                </span>
                <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--foreground)]">
                  {item.title}
                </h2>
                <p className="text-sm leading-7 text-[var(--color-muted-raw)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </PageContainer>
      </PageSection>

      {/* SEÇÃO 3 — escura: como funciona e materiais */}
      <section className="relative overflow-hidden bg-slate-950 py-12 sm:py-16 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.15),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:32px_32px]" />

        <PageContainer className="relative">
          <div className="grid gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
            <div>
              <SectionHeader
                eyebrow="Como funciona"
                title="Solicitações por um canal único e focado."
                description="Facilitamos pedidos de entrevista, materiais visuais e envio de pautas, direcionando tudo para uma equipe especializada em relacionamento institucional."
                theme="dark"
              />
              <div className="mt-8">
                <ActionLink
                  action={{ label: "Abrir canal oficial", href: site.contact }}
                  tone="dark"
                />
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {MATERIALS.map((item) => (
                <div key={item.title} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
                  <div className="mt-1 flex shrink-0 items-center justify-center">
                    <ArrowRight size={20} className="text-sky-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-white/60">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PageContainer>
      </section>

      {/* SEÇÃO 4 — contato institucional */}
      <PageSection>
        <PageContainer>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
            <div>
              <SectionHeader
                eyebrow="Contato institucional"
                title="Um canal organizado para pautas, entrevistas e informações oficiais."
                description="Pedidos de imprensa são melhor atendidos quando chegam com contexto, prazo e objetivo da pauta. Assim o time consegue direcionar a solicitação com mais precisão."
              />

              <div className="mt-8 flex max-w-[34rem] items-start gap-3 border-t border-[var(--border)] pt-5">
                <Clock size={18} weight="duotone" className="mt-0.5 shrink-0 text-[var(--primary)]" />
                <p className="text-sm leading-6 text-[var(--color-muted-raw)]">
                  Retorno organizado em dias úteis, conforme o tema e a necessidade da pauta.
                </p>
              </div>
            </div>

            <div className="rounded-[30px] border border-[var(--border)] bg-white/78 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8">
              <div className="grid gap-5 sm:grid-cols-3">
                {[
                  {
                    icon: EnvelopeSimple,
                    label: "Canal",
                    value: "E-mail institucional",
                  },
                  {
                    icon: NotePencil,
                    label: "Envie",
                    value: "Pauta, prazo e veículo",
                  },
                  {
                    icon: Clock,
                    label: "Atendimento",
                    value: "Dias úteis",
                  },
                ].map((item) => (
                  <div key={item.label} className="border-l border-[var(--primary)]/16 pl-4">
                    <item.icon size={22} weight="duotone" className="text-[var(--primary)]" />
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[var(--foreground)]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 border-t border-[var(--border)] pt-8">
                <p className="max-w-[68ch] text-sm leading-7 text-[var(--color-muted-raw)]">
                  Para entrevistas, dados institucionais ou validação de informações sobre a Rodogarcia, use o contato oficial e detalhe a demanda. A equipe avalia o contexto e retorna pelo canal mais adequado.
                </p>

                <div className="mt-7 grid grid-cols-2 gap-3 sm:flex sm:flex-row sm:flex-wrap">
                  <ActionLink
                    action={{ label: "Entrar em contato", href: site.contact }}
                    className="w-full min-w-0 sm:w-auto"
                  />
                  <ActionLink
                    action={{
                      label: "Enviar e-mail",
                      href: external.commercialEmail,
                      variant: "secondary",
                      external: true,
                    }}
                    className="w-full min-w-0 sm:w-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </PageSection>
    </PageShell>
  );
}
