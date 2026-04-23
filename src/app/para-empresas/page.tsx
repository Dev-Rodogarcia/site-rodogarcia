import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ChartLineUp,
  Gear,
  Globe,
  ShieldCheck,
  Truck,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import {
  ActionLink,
  PageContainer,
  PageCtaBand,
  PageSection,
  PageShell,
  SectionHeader,
  SurfaceSection,
} from "@/components/internal/PageContent";
import { seo, site } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Para Empresas",
  description:
    "Soluções logísticas para empresas que precisam de escala, previsibilidade operacional e atendimento consultivo.",
  alternates: { canonical: seo.absoluteUrl(site.business) },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: seo.siteName,
    title: "Para Empresas | Rodogarcia Transportes",
    description:
      "Operações B2B com cobertura nacional, compliance e implantação por etapas.",
    url: seo.absoluteUrl(site.business),
    images: [{ url: seo.absoluteUrl("/foto4.png") }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Para Empresas | Rodogarcia Transportes",
    description:
      "Conheça a camada B2B da Rodogarcia para operações corporativas de maior escala.",
    images: [seo.absoluteUrl("/foto4.png")],
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};

const SERVICES = [
  {
    icon: Truck,
    title: "Distribuição e transferência",
    description:
      "Coleta, consolidação e entrega final para operações que exigem ritmo, leitura de janela e cobertura nacional.",
  },
  {
    icon: Globe,
    title: "Supply chain integrado",
    description:
      "Transporte, indoor e armazenagem organizados como uma frente única para reduzir atrito entre etapas.",
  },
  {
    icon: ShieldCheck,
    title: "Projetos especiais",
    description:
      "Lotes dedicados, cargas sensíveis e operações com maior exigência de compliance ou governança.",
  },
  {
    icon: ChartLineUp,
    title: "Inteligência operacional",
    description:
      "Leitura executiva da operação com indicadores de performance, SLA e visibilidade de ponta a ponta.",
  },
  {
    icon: UsersThree,
    title: "Atendimento consultivo",
    description:
      "Time dedicado para mapear gargalos, propor escopo e acompanhar a curva de entrada da operação.",
  },
  {
    icon: Gear,
    title: "Evolução contínua",
    description:
      "Revisões periódicas para proteger produtividade, custo e padrão de entrega ao longo do tempo.",
  },
];

const ROLLOUT = [
  {
    step: "01",
    title: "Diagnóstico",
    description:
      "Levantamos gargalos, SLA esperado, volume, risco e pontos de atrito da operação atual.",
  },
  {
    step: "02",
    title: "Proposta personalizada",
    description:
      "Escopo, cobertura e indicadores são ajustados conforme o contexto real do negócio.",
  },
  {
    step: "03",
    title: "Implantação assistida",
    description:
      "Entrada acompanhada, com ajustes de curto ciclo para sustentar a curva inicial sem surpresas.",
  },
  {
    step: "04",
    title: "Evolução contínua",
    description:
      "Revisões periódicas para proteger produtividade, custo e padrão de entrega.",
  },
];

export default function ParaEmpresasPage() {
  return (
    <PageShell>
      {/* HERO — azul escuro, padrão /servicos */}
      <div className="relative overflow-hidden bg-[var(--foreground)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(29,78,216,0.1),transparent_40%),radial-gradient(circle_at_78%_14%,rgba(56,189,248,0.06),transparent_24%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.025)_0%,transparent_40%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:36px_36px]" />

        <section className="relative pt-20 sm:pt-24 lg:pt-28" aria-labelledby="para-empresas-hero-title">
          <PageContainer>
            <div className="mx-auto max-w-[920px] py-10 text-center sm:py-12 lg:py-16">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200/80 backdrop-blur-sm">
                Soluções B2B
              </span>

              <h1
                id="para-empresas-hero-title"
                className="mx-auto mt-6 max-w-[16ch] text-[clamp(3rem,8vw,6rem)] font-bold leading-[0.9] tracking-[-0.05em] sm:max-w-[18ch] sm:tracking-[-0.07em]"
              >
                <span className="block bg-[linear-gradient(180deg,#a5f3fc_0%,#dbeafe_100%)] bg-clip-text text-transparent">
                  Logística B2B
                </span>
                <span className="mt-1 block text-white">com escala real.</span>
              </h1>

              <p className="mx-auto mt-5 max-w-[42rem] text-sm leading-7 text-white/68 sm:text-base">
                Estrutura operacional para empresas que precisam crescer sem perder o controle. Cobertura nacional, compliance e atendimento consultivo em uma única frente.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <ActionLink
                  action={{ label: "Solicitar cotação", href: site.quote }}
                  tone="dark"
                />
                <ActionLink
                  action={{ label: "Falar com especialista", href: site.contact, variant: "secondary" }}
                  tone="dark"
                />
              </div>

            </div>
          </PageContainer>
        </section>
      </div>

      {/* SEÇÃO 2 — clara */}
      <PageSection>
        <PageContainer>
          <SectionHeader
            eyebrow="Frentes de atuação"
            title="Seis pilares que reduzem gargalo desde o início."
            description="Cada frente tem um papel claro na operação: entrega, visibilidade, escopo e acompanhamento contínuo."
            align="center"
          />

          <div className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((item) => (
              <div key={item.title} className="group flex flex-col gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] transition-all duration-300 group-hover:bg-[var(--primary)] group-hover:text-white">
                  <item.icon size={24} weight="duotone" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold tracking-[-0.03em] text-[var(--foreground)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-muted-raw)]">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </PageContainer>
      </PageSection>

      {/* SEÇÃO 3 — azul escuro */}
      <SurfaceSection tone="dark" contentClassName="space-y-12">
        <SectionHeader
          eyebrow="Método de implantação"
          title="Uma trilha clara para tirar o projeto do papel."
          description="Processo em quatro etapas para garantir uma entrada segura, sem atrito e com resultado desde o início."
          theme="dark"
          align="center"
        />

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {ROLLOUT.map((item) => (
            <div key={item.title} className="relative flex flex-col gap-3 border-l border-white/10 pl-6">
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
      </SurfaceSection>

      {/* SEÇÃO 4 — clara */}
      <PageSection>
        <PageContainer>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <SectionHeader
                eyebrow="Por que a Rodogarcia"
                title="Quando estrutura, cobertura e acompanhamento se combinam."
                description="A Rodogarcia não opera por escopo genérico. Cada operação B2B é desenhada com base no contexto real da empresa: volume, rota, SLA e nível de complexidade."
              />

              <div className="mt-10 space-y-6">
                {[
                  {
                    label: "Escala com controle",
                    detail:
                      "Quando a empresa precisa crescer em distribuição sem perder previsibilidade operacional.",
                  },
                  {
                    label: "Operação com alto giro",
                    detail:
                      "Quando indoor, transferência e armazenagem precisam responder como um fluxo só.",
                  },
                  {
                    label: "Demanda crítica",
                    detail:
                      "Quando lote, urgência ou requisito técnico pedem um desenho dedicado desde o início.",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="border-b border-[var(--border)] pb-6 last:border-b-0 last:pb-0"
                  >
                    <p className="font-semibold tracking-[-0.02em] text-[var(--foreground)]">
                      {item.label}
                    </p>
                    <p className="mt-1.5 text-sm leading-7 text-[var(--color-muted-raw)]">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[34px] border border-white/70 bg-[#dce7f7] shadow-[0_24px_64px_rgba(15,23,42,0.12)]">
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(2,6,23,0.08)_100%)]" />
              <img
                src="/foto4.png"
                alt="Operação corporativa Rodogarcia"
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </PageContainer>
      </PageSection>

      {/* CTA FINAL */}
      <PageCtaBand
        eyebrow="Vamos desenhar sua operação"
        title="Conte seu contexto e a equipe monta a composição certa."
        description="Se a demanda já está mapeada, seguimos para cotação. Se ainda precisa de leitura técnica, o time entra para organizar o escopo."
        primaryAction={{ label: "Solicitar cotação", href: site.quote }}
        secondaryAction={{
          label: "Falar com especialista",
          href: site.contact,
          variant: "secondary",
        }}
        benefits={["Implantação assistida", "Leitura consultiva", "Cobertura nacional"]}
      />
    </PageShell>
  );
}
