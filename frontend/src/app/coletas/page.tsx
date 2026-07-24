import type { Metadata } from "next";
import { Truck } from "@phosphor-icons/react/dist/ssr";
import { EslCollectionForm } from "@/components/forms/EslTransportForms";
import { OperationGuidanceAccordion } from "@/components/internal/OperationGuidanceAccordion";
import { ActionLink, PageContainer, PageSection, PageShell } from "@/components/internal/PageContent";
import { fetchPublicContent } from "@/lib/api";
import { buildCmsMetadata } from "@/lib/cmsPublic";
import { external, seo, site } from "@/lib/routes";
import type { CollectionsPageContent, QuoteUnservedOriginContent } from "@/types/content";

const fallbackMetadata: Metadata = {
  title: "Solicitar coleta",
  description: "Agende uma coleta Rodogarcia e receba o número do registro pelo site.",
  alternates: { canonical: seo.absoluteUrl(site.collections) },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: seo.siteName,
    title: "Solicitar coleta | Rodogarcia Transportes",
    description: "Valide a nota fiscal e registre sua solicitação de coleta pelo site.",
    url: seo.absoluteUrl(site.collections),
    images: [{ url: seo.absoluteUrl("/foto1.webp") }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Solicitar coleta | Rodogarcia Transportes",
    description: "Valide a nota fiscal e registre sua solicitação de coleta pelo site.",
    images: [seo.absoluteUrl("/foto1.webp")],
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return buildCmsMetadata(site.collections, fallbackMetadata);
}

const FALLBACK_COLLECTIONS_PAGE: CollectionsPageContent = {
  hero: {
    buttons: [
      { label: "Solicitar coleta", url: "#formulario-coleta" },
      { label: "Solicitar cotação", url: site.quote },
    ],
  },
  operationGuidance: {
    eyebrow: "Antes de solicitar",
    title: "Orientações para a coleta",
    description: "Confira os pontos essenciais antes de finalizar para a solicitação seguir sem retrabalho.",
    items: [
      { id: "collections-guidance-request", order: 1, question: "O que preciso informar para solicitar a coleta?", answer: "Preencha os CNPJs da operação, escolha a data e a janela de horário e informe os dados da nota fiscal. Os campos com a interrogação explicam cada dado." },
      { id: "collections-guidance-invoice", order: 2, question: "Por que a nota fiscal precisa ser validada?", answer: "A validação confirma os valores, volumes e peso da nota antes de liberar o agendamento. Se algum dado da nota ou dos CNPJs for alterado depois, valide novamente." },
      { id: "collections-guidance-confirmation", order: 3, question: "Quando recebo a confirmação?", answer: "Após validar a nota e enviar a solicitação, o site mostra o número da coleta. Caso o cadastro do cliente exija atendimento, a mensagem da operação fica pronta para continuar pelo canal comercial." },
    ],
  },
};

const FALLBACK_UNSERVED_ORIGIN: QuoteUnservedOriginContent = {
  title: "Ainda não atendemos esta origem",
  description:
    "A cidade de origem informada ainda não faz parte da nossa área de atendimento. Fale com nosso comercial para avaliar a sua operação.",
  button: { label: "Falar com o comercial", url: external.whatsappCommercial, external: true },
};

export default async function CollectionsPage() {
  const content = await fetchPublicContent();
  const collectionsPage = content.data?.collectionsPage ?? FALLBACK_COLLECTIONS_PAGE;
  const unservedOrigin = content.data?.quotePage?.unservedOrigin ?? FALLBACK_UNSERVED_ORIGIN;

  return (
    <PageShell className="!pb-0">
      <div className="relative overflow-hidden bg-slate-950">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(29,78,216,0.18),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] [background-size:32px_32px]" />
        <section className="relative pt-20 sm:pt-24 lg:pt-28" aria-labelledby="coletas-hero-title">
          <PageContainer>
            <div className="mx-auto max-w-[920px] py-10 text-center sm:py-12 lg:py-16">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-200/80 backdrop-blur-sm"><Truck size={15} weight="bold" />Agendamento de coleta</span>
              <h1 id="coletas-hero-title" className="mx-auto mt-6 max-w-[15ch] text-[clamp(3rem,8vw,6rem)] font-bold leading-[0.9] tracking-[-0.05em] sm:max-w-[18ch] sm:tracking-[-0.07em]">
                <span className="block bg-[linear-gradient(180deg,#a5f3fc_0%,#dbeafe_100%)] bg-clip-text text-transparent">Agende sua coleta</span>
                <span className="mt-1 block text-white">com mais clareza.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-[44rem] text-sm leading-7 text-white/68 sm:text-base">Informe a operação, valide a nota fiscal e receba o número da coleta registrada. Se o cadastro exigir atendimento, nós direcionamos o próximo passo.</p>
              <div className="mt-8 grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:flex-row sm:items-center sm:justify-center">
                {collectionsPage.hero.buttons.slice(0, 2).map((button, index) => (
                  <ActionLink key={`${button.label}-${button.url}`} action={{ label: button.label, href: button.url, variant: index === 1 ? "secondary" : "primary" }} tone="dark" className="w-full min-w-0 sm:w-auto" />
                ))}
              </div>
            </div>
          </PageContainer>
        </section>
      </div>

      <PageSection className="bg-[linear-gradient(180deg,#f8fafc_0%,#eaf1f9_100%)]">
        <PageContainer>
          <div id="formulario-coleta" className="scroll-mt-28">
            <p className="mb-6 text-center text-sm font-medium text-[var(--color-muted-raw)]">Preencha os dados da operação para agendar a coleta.</p>
            <EslCollectionForm unservedOrigin={unservedOrigin} />
          </div>
          <div className="mt-16 sm:mt-20">
            <OperationGuidanceAccordion
              {...collectionsPage.operationGuidance}
            />
          </div>
        </PageContainer>
      </PageSection>
    </PageShell>
  );
}
