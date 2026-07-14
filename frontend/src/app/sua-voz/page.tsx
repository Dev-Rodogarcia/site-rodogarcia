import type { Metadata } from "next";
import { buildCmsMetadata } from "@/lib/cmsPublic";
import { seo, site } from "@/lib/routes";
import { PageShell, PageContainer, PageSection, SectionHeader } from "@/components/internal/PageContent";
import { ShieldCheck, LockKey, PaperPlaneRight } from "@phosphor-icons/react/dist/ssr";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FORM_URL = "https://forms.office.com/r/XwCZGct8QK";

const FAQ_ITEMS = [
  {
    question: "Posso fazer um relato de forma anônima?",
    answer:
      "Sim. Você pode relatar os fatos sem se identificar. A confidencialidade é preservada durante todo o tratamento da manifestação.",
  },
  {
    question: "Que situações podem ser comunicadas?",
    answer:
      "O canal recebe relatos de desvios de conduta, situações que mereçam atenção, sugestões de melhoria e outras comunicações relevantes.",
  },
  {
    question: "Quem analisa a manifestação?",
    answer:
      "A equipe responsável por compliance recebe e avalia cada relato com imparcialidade, considerando o contexto informado.",
  },
  {
    question: "Há proteção contra retaliação?",
    answer:
      "Sim. A Rodogarcia trata os relatos com sigilo e não admite qualquer forma de retaliação a quem utiliza o canal de boa-fé.",
  },
];

const fallbackMetadata: Metadata = {
  title: "Sua Voz",
  description:
    "Canal oficial da Rodogarcia para manifestações, denúncias e comunicações internas com sigilo e segurança.",
  alternates: { canonical: seo.absoluteUrl(site.voice) },
  robots: { index: true, follow: true },
};

export async function generateMetadata(): Promise<Metadata> {
  return buildCmsMetadata(site.voice, fallbackMetadata);
}

export default function SuaVozPage() {
  return (
    <PageShell className="pb-0 sm:pb-0 lg:pb-0">
      <div className="relative overflow-hidden bg-slate-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.15),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:32px_32px]" />

        <section className="relative pt-20 sm:pt-24 lg:pt-28" aria-labelledby="sua-voz-hero-title">
          <PageContainer>
            <div className="mx-auto max-w-[860px] py-10 text-center sm:py-12 lg:py-16">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200/80 backdrop-blur-sm">
                Canal Oficial
              </span>

              <h1
                id="sua-voz-hero-title"
                className="mx-auto mt-6 max-w-[18ch] text-[clamp(2.6rem,6vw,5rem)] font-bold leading-[0.92] tracking-[-0.05em] sm:tracking-[-0.06em]"
              >
                <span className="block bg-[linear-gradient(180deg,#a5f3fc_0%,#dbeafe_100%)] bg-clip-text text-transparent">
                  Sua Voz é
                </span>
                <span className="mt-1 block text-white">Respeitada Aqui!</span>
              </h1>

              <p className="mx-auto mt-5 max-w-[44rem] text-sm leading-7 text-white/68 sm:text-base">
                Este é o canal oficial da Rodogarcia para o envio de manifestações, denúncias e comunicações internas. Garantimos total sigilo, segurança e tratamento adequado para cada relato.
              </p>
            </div>
          </PageContainer>
        </section>
      </div>

      <PageSection>
        <PageContainer>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
            <div>
              <SectionHeader
                eyebrow="Propósito"
                title="Um ambiente seguro para você"
                description="Acreditamos na transparência e na ética como pilares da nossa cultura corporativa."
              />
              <div className="mt-6 space-y-6 text-sm leading-7 text-[var(--color-muted-raw)]">
                <p>
                  O programa Sua Voz foi criado para dar voz aos nossos colaboradores, parceiros e fornecedores. É um canal direto e confidencial onde você pode relatar desvios de conduta, sugerir melhorias ou enviar qualquer comunicação importante.
                </p>
                <p>
                  Todas as manifestações são recebidas e analisadas por um comitê isento, com garantia de confidencialidade absoluta e proteção contra qualquer tipo de retaliação.
                </p>
              </div>

              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--color-surface-strong)] text-[var(--primary)] shadow-sm">
                    <ShieldCheck size={20} weight="duotone" />
                  </div>
                  <div>
                    <h3 className="font-semibold tracking-[-0.01em] text-[var(--foreground)]">Anonimato Garantido</h3>
                    <p className="mt-1 text-sm text-[var(--color-muted-raw)]">Sua identidade é totalmente preservada.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--color-surface-strong)] text-[var(--primary)] shadow-sm">
                    <LockKey size={20} weight="duotone" />
                  </div>
                  <div>
                    <h3 className="font-semibold tracking-[-0.01em] text-[var(--foreground)]">Sigilo Absoluto</h3>
                    <p className="mt-1 text-sm text-[var(--color-muted-raw)]">Informações tratadas com estrita segurança.</p>
                  </div>
                </div>
              </div>
            </div>

            <aside className="flex flex-col gap-6 rounded-[24px] border border-[var(--border)] bg-[var(--color-surface-2)] p-6 sm:p-8">
              <div>
                <h3 className="font-semibold tracking-[-0.02em] text-[var(--foreground)]">Acessar Formulário</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted-raw)]">
                  Utilize o formulário oficial e seguro da Microsoft para enviar o seu relato. É rápido, simples e pode ser feito pelo celular.
                </p>
                <p className="mt-4 border-t border-[var(--border)] pt-4 text-xs leading-5 text-[var(--color-muted-raw)]">
                  Ao enviar, descreva a situação com o máximo de contexto que puder compartilhar.
                </p>
              </div>
              <a
                href={FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(29,78,216,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[var(--color-primary-strong)] hover:shadow-[0_16px_32px_rgba(29,78,216,0.3)]"
              >
                Preencher relato
                <PaperPlaneRight size={16} weight="bold" className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </aside>
          </div>
        </PageContainer>
      </PageSection>

      <section className="relative overflow-hidden bg-slate-950 py-12 sm:py-16 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.15),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:32px_32px]" />

        <PageContainer className="relative lg:px-10">
          <SectionHeader
            eyebrow="Processo"
            title="Como funciona?"
            description="Entenda as etapas após o envio da sua manifestação."
            theme="dark"
            align="center"
          />

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Envio do Relato",
                desc: "Você acessa o formulário seguro e descreve os fatos com o máximo de detalhes.",
              },
              {
                step: "2",
                title: "Análise",
                desc: "Nossa equipe de compliance recebe e avalia a manifestação com total imparcialidade.",
              },
              {
                step: "3",
                title: "Ações e Solução",
                desc: "As medidas cabíveis são tomadas, corrigindo desvios e implementando melhorias.",
              },
            ].map((s) => (
              <div key={s.step} className="rounded-[20px] border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                  {s.step}
                </span>
                <h3 className="mt-4 font-semibold tracking-[-0.01em] text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">{s.desc}</p>
              </div>
            ))}
          </div>
        </PageContainer>
      </section>

      <section
        className="relative overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#f2f6fb_100%)] py-14 sm:py-16 lg:py-20"
        aria-labelledby="sua-voz-faq-title"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(29,78,216,0.07),transparent_20%),radial-gradient(circle_at_82%_18%,rgba(6,182,212,0.06),transparent_18%)]" />
        <PageContainer className="relative">
          <div className="mx-auto max-w-[980px]">
            <SectionHeader
              eyebrow="Dúvidas frequentes"
              title="Perguntas sobre o canal Sua Voz"
              description="Encontre orientações rápidas antes de enviar a sua manifestação."
              align="center"
            />

            <Accordion className="mt-8 flex w-full flex-col">
              {FAQ_ITEMS.map((item, index) => (
                <AccordionItem
                  key={item.question}
                  value={`sua-voz-faq-${index}`}
                  className="border-b border-[var(--border)] last:border-b-0"
                >
                  <AccordionTrigger className="py-6 text-left text-base font-semibold tracking-[-0.02em] text-[var(--foreground)] hover:text-[var(--primary)] hover:no-underline">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="max-w-[62ch] pb-6 pr-8 text-sm leading-7 text-[var(--color-muted-raw)]">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </PageContainer>
      </section>
    </PageShell>
  );
}
