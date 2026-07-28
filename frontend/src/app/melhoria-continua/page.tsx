import type { Metadata } from "next";
import { Lightbulb, UsersThree } from "@phosphor-icons/react/dist/ssr";
import ImprovementForm from "@/components/forms/ImprovementForm";
import { OperationGuidanceAccordion } from "@/components/internal/OperationGuidanceAccordion";
import { PageContainer, PageHero, PageShell, SurfaceSection } from "@/components/internal/PageContent";
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
  return <PageShell className="!pb-0"><PageHero eyebrow="Melhoria contínua" title="O que podemos facilitar na sua rotina?" description="Este espaço recebe sugestões de quem usa o site e de colaboradores que enxergam oportunidades de melhorar a rotina de trabalho. Escolha seu perfil para abrir o formulário certo." tone="dark" align="center" /><SurfaceSection tone="default" contentClassName="grid gap-8 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:items-start"><aside className="rounded-[30px] border border-emerald-300/20 bg-[linear-gradient(145deg,#0f766e,#12324a)] p-7 text-white shadow-[0_22px_52px_rgba(2,6,23,0.22)] lg:h-[348px]"><span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/12"><Lightbulb size={26} weight="fill" /></span><h2 className="mt-5 text-2xl font-semibold tracking-[-0.04em]">Uma ideia pode simplificar o próximo passo.</h2><p className="mt-3 text-sm leading-7 text-white/78">Relate o contexto. A equipe recebe somente os dados necessários para entender e avaliar a melhoria.</p><div className="mt-7 border-t border-white/15 pt-5"><div className="flex gap-3"><UsersThree size={20} className="mt-0.5 shrink-0 text-emerald-200" /><p className="text-sm leading-6 text-white/82">Colaboradores informam a filial para que a sugestão chegue com o contexto operacional adequado.</p></div></div></aside><ImprovementForm /></SurfaceSection><section className="bg-white py-12 sm:py-16 lg:py-20"><PageContainer><OperationGuidanceAccordion {...guidance} /></PageContainer></section></PageShell>;
}
