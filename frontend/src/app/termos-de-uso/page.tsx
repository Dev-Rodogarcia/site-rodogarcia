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
import { ShieldCheck, Info } from "@phosphor-icons/react/dist/ssr";

const fallbackMetadata: Metadata = {
  title: "Termos de Uso",
  description:
    "Leia os termos de uso do site da Rodogarcia e entenda o escopo das informações e formulários disponíveis.",
  alternates: { canonical: seo.absoluteUrl(site.terms) },
  robots: { index: true, follow: true },
};

export async function generateMetadata(): Promise<Metadata> {
  return buildCmsMetadata(site.terms, fallbackMetadata);
}

const TERMS_SECTIONS = [
  {
    title: "1. Uso do site",
    body: "O site da Rodogarcia é destinado a fins informativos e comerciais relacionados aos serviços de transporte, distribuição, cotação e atendimento institucional.",
  },
  {
    title: "2. Conteúdo e propriedade intelectual",
    body: "Textos, imagens, marcas, elementos gráficos e demais materiais publicados pertencem à Rodogarcia ou são utilizados com autorização. O uso indevido do conteúdo não é permitido.",
  },
  {
    title: "3. Formulários e canais digitais",
    body: "Os formulários de contato, cotação e carreiras servem para iniciar atendimento institucional. O envio das informações não representa contratação automática nem garantia de aprovação comercial ou recrutamento.",
  },
  {
    title: "4. Limitação de responsabilidade",
    body: "A Rodogarcia busca manter o site atualizado e funcional, mas não se responsabiliza por indisponibilidade temporária, uso indevido das informações publicadas ou decisão tomada sem validação com a equipe oficial.",
  },
  {
    title: "5. Atualizações",
    body: "Os termos podem ser revisados para refletir ajustes operacionais, legais ou de experiência digital. A versão vigente é a publicada nesta página.",
  },
];

export default function TermosDeUsoPage() {
  return (
    <PageShell>
      {/* HERO — azul escuro padrão */}
      <div className="relative overflow-hidden bg-slate-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.15),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:32px_32px]" />

        <section className="relative pt-20 sm:pt-24 lg:pt-28" aria-labelledby="termos-hero-title">
          <PageContainer>
            <div className="mx-auto max-w-[860px] py-10 text-center sm:py-12 lg:py-16">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200/80 backdrop-blur-sm">
                Condições de uso
              </span>

              <h1
                id="termos-hero-title"
                className="mx-auto mt-6 max-w-[18ch] text-[clamp(2.6rem,6vw,5rem)] font-bold leading-[0.92] tracking-[-0.05em] sm:tracking-[-0.06em]"
              >
                <span className="block bg-[linear-gradient(180deg,#a5f3fc_0%,#dbeafe_100%)] bg-clip-text text-transparent">
                  Transparência
                </span>
                <span className="mt-1 block text-white">e clareza.</span>
              </h1>

              <p className="mx-auto mt-5 max-w-[44rem] text-sm leading-7 text-white/68 sm:text-base">
                Termos claros para o uso do site, formulários e canais oficiais da Rodogarcia. Todas as informações em um só lugar.
              </p>
            </div>
          </PageContainer>
        </section>
      </div>

      {/* SEÇÃO 2 — clara: resumo geral */}
      <PageSection>
        <PageContainer>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div>
              <SectionHeader
                eyebrow="Resumo rápido"
                title="O site é um canal institucional e comercial."
                description="Informações, cotações e contatos publicados aqui fazem parte da jornada oficial da marca."
              />
              <p className="mt-6 text-sm leading-7 text-[var(--color-muted-raw)]">
                Este documento cobre o uso do site institucional, o envio de dados por formulários oficiais, e as responsabilidades sobre conteúdo e marcas. A leitura completa garante que você entenda o escopo de uso dos canais digitais.
              </p>
            </div>
            
            <div className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--color-surface-2)] p-6">
              <ShieldCheck size={24} weight="duotone" className="text-[var(--primary)]" />
              <h3 className="font-semibold tracking-[-0.02em] text-[var(--foreground)]">Privacidade e Dados</h3>
              <p className="text-sm leading-7 text-[var(--color-muted-raw)]">
                O tratamento de dados pessoais é detalhado em nossa página de privacidade, alinhado à LGPD.
              </p>
              <ActionLink
                action={{
                  label: "Ler política",
                  href: site.privacy,
                  variant: "secondary",
                }}
                className="mt-2 w-full"
              />
            </div>
          </div>
        </PageContainer>
      </PageSection>

      {/* SEÇÃO 3 — escura: termos completos */}
      <section className="relative overflow-hidden bg-slate-950 py-12 sm:py-16 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.15),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:32px_32px]" />

        <PageContainer className="relative">
          <SectionHeader
            eyebrow="Leitura completa"
            title="Termos detalhados"
            description="Entenda os limites e as diretrizes para utilizar nosso portal e serviços associados."
            theme="dark"
            align="center"
          />

          <div className="mx-auto mt-12 max-w-3xl space-y-8">
            {TERMS_SECTIONS.map((section) => (
              <div key={section.title} className="border-b border-white/10 pb-8 last:border-b-0 last:pb-0">
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">
                  {section.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/62">
                  {section.body}
                </p>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>

      {/* SEÇÃO 4 — clara: duvidas e contato */}
      <PageSection>
        <PageContainer>
          <div className="mx-auto max-w-[980px] rounded-[30px] border border-[var(--border)] bg-white/72 p-6 shadow-[0_22px_56px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="flex gap-5">
                <span className="mt-1 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                  <Info size={24} weight="duotone" />
                </span>
                <div>
                  <h2 className="text-[clamp(1.5rem,2.4vw,2.2rem)] font-bold leading-[1.2] tracking-[-0.03em] text-[var(--foreground)]">
                    Ficou alguma dúvida?
                  </h2>
                  <p className="mt-4 max-w-[64ch] text-sm leading-7 text-[var(--color-muted-raw)] sm:text-base">
                    Em caso de dúvida sobre este documento ou sobre o uso dos canais institucionais, fale com a equipe pelo canal oficial. O retorno ajuda a orientar o próximo passo com clareza.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row lg:flex-col">
                <ActionLink
                  action={{
                    label: "Enviar e-mail",
                    href: external.commercialEmail,
                    external: true,
                  }}
                  className="w-full min-w-0 sm:w-auto lg:w-full"
                />
                <ActionLink
                  action={{
                    label: "Abrir contato",
                    href: site.contact,
                    variant: "secondary",
                  }}
                  className="w-full min-w-0 sm:w-auto lg:w-full"
                />
              </div>
            </div>
          </div>
        </PageContainer>
      </PageSection>
    </PageShell>
  );
}
