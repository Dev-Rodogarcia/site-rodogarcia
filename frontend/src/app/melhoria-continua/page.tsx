import type { Metadata } from "next";
import { ImprovementExperience } from "@/components/improvements/ImprovementExperience";
import { OperationGuidanceAccordion } from "@/components/internal/OperationGuidanceAccordion";
import { PageContainer, PageHero, PageShell } from "@/components/internal/PageContent";
import { fetchPublicContent } from "@/lib/api";
import { site, seo } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Melhoria contínua",
  description: "Envie sugestões para melhorar o site ou a rotina de trabalho da Rodogarcia.",
  alternates: { canonical: seo.absoluteUrl(site.improvements) },
};

export default async function ImprovementsPage() {
  const response = await fetchPublicContent();
  const guidance = response.success && response.data ? response.data.improvementsPage.operationGuidance : { eyebrow: "Para aproveitar melhor", title: "Dicas para enviar uma boa sugestão", description: "Quanto mais contexto você compartilhar, mais fácil será avaliar o próximo passo.", items: [] };
  return <PageShell className="!pb-0"><PageHero eyebrow="Melhoria contínua" title="O que podemos facilitar na sua rotina?" description="Escolha seu perfil e compartilhe sua sugestão." tone="dark" align="center" /><ImprovementExperience /><section className="bg-white py-12 sm:py-16 lg:py-20"><PageContainer><OperationGuidanceAccordion {...guidance} /></PageContainer></section></PageShell>;
}
