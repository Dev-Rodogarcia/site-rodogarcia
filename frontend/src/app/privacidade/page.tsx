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
import { LockKey, ShieldCheck } from "@phosphor-icons/react/dist/ssr";

const fallbackMetadata: Metadata = {
  title: "Privacidade",
  description:
    "Entenda como a Rodogarcia trata os dados enviados pelos formulários e canais digitais do site.",
  alternates: { canonical: seo.absoluteUrl(site.privacy) },
  robots: { index: true, follow: true },
};

export async function generateMetadata(): Promise<Metadata> {
  return buildCmsMetadata(site.privacy, fallbackMetadata);
}

const PRIVACY_SECTIONS = [
  {
    title: "1. Quais dados podem ser coletados",
    body: "Os formulários do site podem receber nome, e-mail, telefone, empresa, origem, destino, mensagem e outras informações enviadas voluntariamente pelo usuário conforme o objetivo do atendimento.",
  },
  {
    title: "2. Finalidade do tratamento",
    body: "Os dados são usados para responder contatos, elaborar cotações, receber candidaturas e conduzir comunicações institucionais relacionadas aos serviços da Rodogarcia.",
  },
  {
    title: "3. Compartilhamento e acesso interno",
    body: "As informações são tratadas dentro do fluxo institucional e podem ser acessadas por equipes responsáveis por atendimento comercial, contato, recrutamento ou operação, conforme a natureza da demanda.",
  },
  {
    title: "4. Retenção e segurança",
    body: "A Rodogarcia adota medidas técnicas e organizacionais para proteger as informações recebidas e manter os dados apenas pelo período necessário ao atendimento ou obrigação legal aplicável.",
  },
  {
    title: "5. Direitos do titular",
    body: "O titular pode solicitar esclarecimentos, atualização ou revisão de informações pessoais pelos canais institucionais da empresa, em alinhamento com a LGPD.",
  },
];

export default function PrivacidadePage() {
  return (
    <PageShell>
      {/* HERO — azul escuro padrão */}
      <div className="relative overflow-hidden bg-slate-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.15),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:32px_32px]" />

        <section className="relative pt-20 sm:pt-24 lg:pt-28" aria-labelledby="privacidade-hero-title">
          <PageContainer>
            <div className="mx-auto max-w-[860px] py-10 text-center sm:py-12 lg:py-16">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200/80 backdrop-blur-sm">
                Política de privacidade
              </span>

              <h1
                id="privacidade-hero-title"
                className="mx-auto mt-6 max-w-[18ch] text-[clamp(2.6rem,6vw,5rem)] font-bold leading-[0.92] tracking-[-0.05em] sm:tracking-[-0.06em]"
              >
                <span className="block bg-[linear-gradient(180deg,#a5f3fc_0%,#dbeafe_100%)] bg-clip-text text-transparent">
                  Dados tratados
                </span>
                <span className="mt-1 block text-white">com clareza.</span>
              </h1>

              <p className="mx-auto mt-5 max-w-[44rem] text-sm leading-7 text-white/68 sm:text-base">
                Entenda como os dados enviados pelos formulários e canais digitais são utilizados dentro dos fluxos institucionais da Rodogarcia.
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
                title="Privacidade aplicada aos canais oficiais do site."
                description="A política explica quais informações podem ser recebidas, por que elas são usadas e como o titular pode solicitar orientação."
              />
              <p className="mt-6 text-sm leading-7 text-[var(--color-muted-raw)]">
                O tratamento de dados está relacionado aos formulários de contato, cotação, carreira e demais interações feitas voluntariamente pelo usuário nos canais digitais oficiais.
              </p>
            </div>

            <div className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--color-surface-2)] p-6">
              <ShieldCheck size={24} weight="duotone" className="text-[var(--primary)]" />
              <h3 className="font-semibold tracking-[-0.02em] text-[var(--foreground)]">
                LGPD e transparência
              </h3>
              <p className="text-sm leading-7 text-[var(--color-muted-raw)]">
                As informações são usadas para atendimento institucional e comercial, respeitando finalidade, necessidade e segurança.
              </p>
              <ActionLink
                action={{
                  label: "Ver termos de uso",
                  href: site.terms,
                  variant: "secondary",
                }}
                className="mt-2 w-full"
              />
            </div>
          </div>
        </PageContainer>
      </PageSection>

      {/* SEÇÃO 3 — escura: política completa */}
      <section className="relative overflow-hidden bg-slate-950 py-12 sm:py-16 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.15),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:32px_32px]" />

        <PageContainer className="relative">
          <SectionHeader
            eyebrow="Leitura completa"
            title="Política de privacidade"
            description="Leia os principais pontos sobre coleta, finalidade, segurança e direitos do titular."
            theme="dark"
            align="center"
          />

          <div className="mx-auto mt-12 max-w-3xl space-y-8">
            {PRIVACY_SECTIONS.map((section) => (
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

      {/* SEÇÃO 4 — clara: dúvidas e contato */}
      <PageSection>
        <PageContainer>
          <div className="mx-auto max-w-[980px] rounded-[30px] border border-[var(--border)] bg-white/72 p-6 shadow-[0_22px_56px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="flex gap-5">
                <span className="mt-1 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                  <LockKey size={24} weight="duotone" />
                </span>
                <div>
                  <h2 className="text-[clamp(1.5rem,2.4vw,2.2rem)] font-bold leading-[1.2] tracking-[-0.03em] text-[var(--foreground)]">
                    Precisa falar sobre seus dados?
                  </h2>
                  <p className="mt-4 max-w-[64ch] text-sm leading-7 text-[var(--color-muted-raw)] sm:text-base">
                    Para esclarecer dúvidas sobre privacidade, atualização de informações ou direitos do titular, use o canal institucional oficial.
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
