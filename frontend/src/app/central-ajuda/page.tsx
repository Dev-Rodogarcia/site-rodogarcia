import type { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ActionLink,
  PageContainer,
  PageSection,
  PageShell,
  SectionHeader,
} from "@/components/internal/PageContent";
import { buildCmsMetadata } from "@/lib/cmsPublic";
import { external, seo, site } from "@/lib/routes";
import {
  ChatCircleDots,
  Package,
  ShieldCheck,
} from "@phosphor-icons/react/dist/ssr";

const fallbackMetadata: Metadata = {
  title: "Central de Ajuda",
  description:
    "Encontre respostas para dúvidas sobre rastreamento, cotações, contato e serviços da Rodogarcia.",
  alternates: { canonical: seo.absoluteUrl(site.help) },
  robots: { index: true, follow: true },
};

export async function generateMetadata(): Promise<Metadata> {
  return buildCmsMetadata(site.help, fallbackMetadata);
}

const FAQ_ITEMS = [
  {
    question: "Como rastrear minha encomenda?",
    answer:
      "Use o portal oficial de rastreio com o código recebido no envio. Se precisar de orientação sobre o acesso, a equipe de atendimento pode ajudar.",
  },
  {
    question: "Como solicitar uma cotação?",
    answer:
      "Você pode acessar a página de cotação, seguir para o WhatsApp comercial ou falar diretamente com a equipe para informar origem, destino e tipo de carga.",
  },
  {
    question: "Quais regiões a Rodogarcia atende?",
    answer:
      "A operação tem cobertura nacional, com estrutura para distribuição, transferência e projetos corporativos em escala.",
  },
  {
    question: "Qual o prazo de entrega?",
    answer:
      "O prazo depende de origem, destino, janela e tipo de serviço contratado. A equipe comercial orienta o SLA conforme o contexto da operação.",
  },
  {
    question: "A Rodogarcia atende cargas especiais?",
    answer:
      "Sim. Operações com maior exigência de segurança, compliance e documentação podem ser avaliadas pelo time especializado.",
  },
  {
    question: "Como falar com o suporte?",
    answer:
      "Você pode usar o telefone 0800 591 4557, o e-mail comercial ou a página de contato para abrir a demanda no canal correto.",
  },
];

const QUICK_ACCESS = [
  {
    icon: Package,
    title: "Rastrear carga",
    description: "Acesso direto ao portal operacional para consulta do status da remessa em tempo real.",
    action: { label: "Abrir rastreio", href: external.tracking, external: true },
  },
  {
    icon: ChatCircleDots,
    title: "Atendimento comercial",
    description: "Fale com o time para cotação, orientação inicial ou suporte institucional.",
    action: { label: "Abrir contato", href: site.contact, variant: "secondary" as const },
  },
  {
    icon: ShieldCheck,
    title: "Política de privacidade",
    description: "Entenda como tratamos dados e como os formulários entram no fluxo institucional.",
    action: { label: "Ler política", href: site.privacy, variant: "secondary" as const },
  },
];

export default function CentralAjudaPage() {
  return (
    <PageShell>
      {/* HERO — azul escuro padrão */}
      <div className="relative overflow-hidden bg-slate-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.15),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:32px_32px]" />

        <section className="relative pt-20 sm:pt-24 lg:pt-28" aria-labelledby="central-ajuda-hero-title">
          <PageContainer>
            <div className="mx-auto max-w-[860px] py-10 text-center sm:py-12 lg:py-16">
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200/80 backdrop-blur-sm">
                Central de ajuda
              </span>

              <h1
                id="central-ajuda-hero-title"
                className="mx-auto mt-6 max-w-[18ch] text-[clamp(2.6rem,6vw,5rem)] font-bold leading-[0.92] tracking-[-0.05em] sm:tracking-[-0.06em]"
              >
                <span className="block bg-[linear-gradient(180deg,#a5f3fc_0%,#dbeafe_100%)] bg-clip-text text-transparent">
                  Respostas diretas,
                </span>
                <span className="mt-1 block text-white">sem ruído.</span>
              </h1>

              <p className="mx-auto mt-5 max-w-[44rem] text-sm leading-7 text-white/68 sm:text-base">
                FAQ, canais de suporte e atalhos operacionais organizados em um só lugar para tornar o atendimento mais ágil.
              </p>

              <div className="mt-8 grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:flex-row sm:items-center sm:justify-center">
                <ActionLink
                  action={{ label: "Rastrear carga", href: external.tracking, external: true }}
                  tone="dark"
                  className="w-full min-w-0 sm:w-auto"
                />
                <ActionLink
                  action={{ label: "Falar com atendimento", href: site.contact, variant: "secondary" }}
                  tone="dark"
                  className="w-full min-w-0 sm:w-auto"
                />
              </div>
            </div>
          </PageContainer>
        </section>
      </div>

      {/* SEÇÃO 2 — clara: acesso rápido */}
      <PageSection>
        <PageContainer>
          <SectionHeader
            eyebrow="Acesso rápido"
            title="Os três caminhos mais usados pelo nosso time de atendimento."
            description="Rastreio, contato e privacidade concentrados para que você chegue ao canal certo sem esforço."
            align="center"
          />

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {QUICK_ACCESS.map((item) => (
              <div
                key={item.title}
                className="group flex flex-col gap-5 border-l-2 border-[var(--primary)]/20 pl-6 transition-all duration-300 hover:border-[var(--primary)]/60"
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] transition-all duration-300 group-hover:bg-[var(--primary)] group-hover:text-white">
                  <item.icon size={24} weight="duotone" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold tracking-[-0.03em] text-[var(--foreground)]">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-muted-raw)]">
                    {item.description}
                  </p>
                </div>
                <ActionLink action={item.action} className="mt-auto" />
              </div>
            ))}
          </div>
        </PageContainer>
      </PageSection>

      {/* SEÇÃO 3 — escura: FAQ */}
      <section
        className="relative overflow-hidden bg-slate-950 py-16 sm:py-20 lg:py-24"
        aria-labelledby="faq-title"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.15),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:32px_32px]" />

        <PageContainer className="relative">
          <div className="grid gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
            <div>
              <SectionHeader
                eyebrow="Perguntas frequentes"
                title="As dúvidas mais comuns respondidas de forma objetiva."
                description="Se sua pergunta não está aqui, o canal de atendimento está disponível para orientação direta."
                theme="dark"
              />

              <div className="mt-10 flex flex-col gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300">
                    Telefone
                  </p>
                  <p className="mt-2 text-xl font-bold tracking-tight text-white">
                    0800 591 4557
                  </p>
                  <p className="mt-1 text-sm leading-6 text-white/60">
                    Segunda a sexta, das 8h às 18h. Sábado das 8h às 12h.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300">
                    Guia de canais
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-7 text-white/60">
                    <li>Para cotação: WhatsApp ou página de cotação.</li>
                    <li>Para rastreio: portal oficial com código da remessa.</li>
                    <li>Para política de dados: rodapé → Privacidade.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="lg:pt-8">
              <Accordion className="space-y-4" defaultValue={["faq-0"]}>
                {FAQ_ITEMS.map((item, index) => (
                  <AccordionItem
                    key={item.question}
                    value={`faq-${index}`}
                    className="rounded-[26px] border border-white/10 bg-white/[0.04] px-5 transition-colors duration-200 data-[open]:border-sky-300/24 data-[open]:bg-white/[0.07]"
                  >
                    <AccordionTrigger className="py-5 text-left text-base font-semibold tracking-[-0.02em] text-white hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 text-sm leading-7 text-white/62">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* SEÇÃO 4 — clara: como funciona o suporte */}
      <PageSection>
        <PageContainer>
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
            <div>
              <SectionHeader
                eyebrow="Como funciona"
                title="Um suporte direto, sem burocracia no meio do caminho."
                description="A equipe direciona cada demanda para o fluxo certo, preservando contexto e evitando que você precise repetir informações em canais diferentes."
              />

              <div className="mt-8 rounded-[28px] border border-[var(--border)] bg-white/72 p-6 shadow-[0_20px_48px_rgba(15,23,42,0.07)] backdrop-blur-xl">
                <p className="text-sm leading-7 text-[var(--color-muted-raw)]">
                  Quando a dúvida sai do FAQ e entra em uma situação real de operação, o atendimento organiza a solicitação, indica o canal adequado e mantém a continuidade até o próximo passo.
                </p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {[
                {
                  step: "01",
                  title: "Identifique a necessidade",
                  description: "Rastreio, cotação, dúvida institucional ou suporte técnico.",
                },
                {
                  step: "02",
                  title: "Informe o contexto",
                  description: "Tenha em mãos código da remessa, origem, destino ou dados básicos da solicitação.",
                },
                {
                  step: "03",
                  title: "Use o canal indicado",
                  description: "Telefone, página de contato, e-mail, WhatsApp ou portal de rastreio.",
                },
                {
                  step: "04",
                  title: "Receba o direcionamento",
                  description: "A equipe encaminha sua demanda sem repetições ou retornos desnecessários.",
                },
              ].map((item) => (
                <div key={item.title} className="flex flex-col gap-3 border-l border-[var(--primary)]/20 pl-5">
                  <span className="text-[2.4rem] font-bold leading-none tracking-[-0.06em] text-[var(--primary)]/15">
                    {item.step}
                  </span>
                  <h3 className="font-semibold tracking-[-0.02em] text-[var(--foreground)]">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-7 text-[var(--color-muted-raw)]">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 rounded-[30px] bg-slate-950 p-6 text-white shadow-[0_24px_64px_rgba(15,23,42,0.16)] sm:p-8 lg:p-10">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200/78">
                  Ainda precisa de apoio?
                </span>
                <h3 className="mt-3 text-[clamp(1.4rem,2.4vw,2rem)] font-bold leading-[1.16] tracking-[-0.03em] text-white">
                  Abra uma solicitação e fale com o canal certo.
                </h3>
                <p className="mt-4 max-w-[66ch] text-sm leading-7 text-white/64">
                  Envie sua demanda pelo contato oficial para que a equipe identifique o melhor fluxo e dê continuidade ao atendimento.
                </p>
              </div>

              <ActionLink
                action={{ label: "Abrir suporte", href: site.contact }}
                tone="dark"
                className="w-full bg-white text-[var(--foreground)] hover:bg-slate-100 sm:w-auto"
              />
            </div>
          </div>
        </PageContainer>
      </PageSection>
    </PageShell>
  );
}
