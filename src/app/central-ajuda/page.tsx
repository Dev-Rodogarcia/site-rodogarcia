import type { Metadata } from "next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ActionLink,
  PageCtaBand,
  PageHero,
  PageShell,
  SectionHeader,
  SurfaceCard,
  SurfaceSection,
} from "@/components/internal/PageContent";
import { external, seo, site } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Central de Ajuda",
  description:
    "Encontre respostas para duvidas sobre rastreamento, cotações, contato e serviços da Rodogarcia.",
  alternates: { canonical: seo.absoluteUrl(site.help) },
  robots: { index: true, follow: true },
};

const FAQ_ITEMS = [
  {
    question: "Como rastrear minha encomenda?",
    answer:
      "Use o portal oficial de rastreio com o código recebido no envio. Se precisar de orientação sobre o acesso, a equipe de atendimento pode ajudar.",
  },
  {
    question: "Como solicitar uma cotação?",
    answer:
      "Voc? pode abrir a página de cotação, seguir para o WhatsApp comercial ou preencher o formulário com origem, destino e tipo de carga.",
  },
  {
    question: "Quais regioes a Rodogarcia atende?",
    answer:
      "A operação tem cobertura nacional, com estrutura para distribuição, transferencia e projetos corporativos em escala.",
  },
  {
    question: "Qual o prazo de entrega?",
    answer:
      "O prazo depende de origem, destino, jánela e tipo de serviço contratado. A equipe comercial orienta o SLA conforme o contexto da operação.",
  },
  {
    question: "A Rodogarcia atende cargas especiais?",
    answer:
      "Sim. Operações com maior exigencia de segurança, compliance e documentação podem ser avaliadas pelo time especializado.",
  },
  {
    question: "Como falar com o suporte?",
    answer:
      "Voc? pode usar o telefone 0800 591 4557, o e-mail comercial ou a página de contato para abrir a demanda no canal correto.",
  },
];

const SHORTCUTS = [
  {
    title: "Rastrear carga",
    description:
      "Acesso direto ao portal operacional para consulta do status da remessa.",
    action: {
      label: "Abrir rastreio",
      href: external.tracking,
      external: true,
    },
  },
  {
    title: "Contato comercial",
    description:
      "Fale com o time para cotação, orientação inicial ou suporte institucional.",
    action: {
      label: "Abrir contato",
      href: site.contact,
      variant: "secondary" as const,
    },
  },
  {
    title: "Privacidade",
    description:
      "Leia como tratamos dados e como os formulários do site entram no fluxo institucional.",
    action: {
      label: "Ler política",
      href: site.privacy,
      variant: "secondary" as const,
    },
  },
];

export default function CentralAjudaPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Central de ajuda"
        title="Respostas diretas para rastreio, cotação e atendimento."
        description="A página foi redesenhada com o mesmo padrão da Home para deixar suporte, FAQ e atalhos mais organizados, mais claros e menos estreitos no desktop."
        pills={["FAQ objetivo", "Atalhos diretos", "Suporte institucional"]}
        primaryAction={{
          label: "Rastrear carga",
          href: external.tracking,
          external: true,
        }}
        secondaryAction={{
          label: "Falar com atendimento",
          href: site.contact,
          variant: "secondary",
        }}
        tone="soft"
      >
        <div className="grid gap-4">
          {SHORTCUTS.map((item) => (
            <SurfaceCard key={item.title}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
                Atalho
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted-raw)]">
                {item.description}
              </p>
              <div className="mt-5">
                <ActionLink action={item.action} className="w-full" />
              </div>
            </SurfaceCard>
          ))}
        </div>
      </PageHero>

      <SurfaceSection contentClassName="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div>
          <SectionHeader
            eyebrow="Perguntas frequentes"
            title="O suporte agora ocupa o mesmo espaco elegante do restante do site."
            description="O accordion foi reorganizado em uma área mais ampla, com leitura tranquila no mobile e sem colunas espremidas no desktop."
          />

          <Accordion className="mt-8 space-y-3">
            {FAQ_ITEMS.map((item, index) => (
              <AccordionItem
                key={item.question}
                value={`faq-${index}`}
                className="rounded-[26px] border border-white/80 bg-white/84 px-5 shadow-[0_18px_44px_rgba(15,23,42,0.05)]"
              >
                <AccordionTrigger className="py-5 text-left text-base font-semibold tracking-[-0.02em] text-[var(--foreground)] hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-7 text-[var(--color-muted-raw)]">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="grid gap-4">
          <SurfaceCard>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              Atendimento
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
              0800 591 4557
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted-raw)]">
              Segunda a sexta, das 8h às 18h. Ideal para orientação rápida antes de seguir para outro canal.
            </p>
            <div className="mt-5">
              <ActionLink
                action={{
                  label: "Abrir contato",
                  href: site.contact,
                  variant: "secondary",
                }}
                className="w-full"
              />
            </div>
          </SurfaceCard>

          <SurfaceCard tone="soft">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              Guia rápido
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--color-muted-raw)]">
              <li>Para cotação: abra a página de cotação ou use o WhatsApp comercial.</li>
              <li>Para rastreio: acesse o portal oficial e consulte o código da remessa.</li>
              <li>Para política de dados: use a página de privacidade no rodape.</li>
            </ul>
          </SurfaceCard>
        </div>
      </SurfaceSection>

      <PageCtaBand
        eyebrow="Ainda precisa de apoio"
        title="A equipe pode direcionar sua demanda para o fluxo certo sem quebrar a experiência."
        description="Quando a dúvida sai do FAQ e entra em contexto real de operação, contato e cotação continuam no mesmo padrão visual e na mesma jornada."
        primaryAction={{ label: "Abrir contato", href: site.contact }}
        secondaryAction={{
          label: "Solicitar cotação",
          href: site.quote,
          variant: "secondary",
        }}
        benefits={["FAQ objetivo", "Portal oficial de rastreio", "Suporte institucional"]}
      />
    </PageShell>
  );
}
