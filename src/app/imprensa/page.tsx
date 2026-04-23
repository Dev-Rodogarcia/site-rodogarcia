import type { Metadata } from "next";
import {
  ActionLink,
  HeroMediaCard,
  PageContainer,
  PageCtaBand,
  PageHero,
  PageSection,
  PageShell,
  SectionHeader,
  SurfaceCard,
  SurfaceSection,
} from "@/components/internal/PageContent";
import { seo, site } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Imprensa",
  description:
    "Informações institucionais, contexto de marca e orientação de contato para imprensa da Rodogarcia.",
  alternates: { canonical: seo.absoluteUrl(site.press) },
  robots: { index: true, follow: true },
};

const BRAND_FACTS = [
  {
    title: "História operacional",
    description:
      "A Rodogarcia foi fundada em 1989 e construiu sua reputação combinando disciplina operacional e presença nacional.",
  },
  {
    title: "Cobertura e escala",
    description:
      "A malha atende operações de distribuição, transferencia, indoor e projetos corporativos em diferentes niveis de complexidade.",
  },
  {
    title: "Qualidade e compliance",
    description:
      "Certificacoes e licenças reforcam o padrão de governança, segurança e confiança da marca.",
  },
  {
    title: "Experiência digital alinhada",
    description:
      "A narrativa institucional agora segue a mesma linguagem visual premium da Home em todas as páginas.",
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
      <PageHero
        eyebrow="Central de imprensa"
        title="Informações institucionais organizadas com a mesma clareza da Home."
        description="A página de imprensa deixou de ser um bloco simples e passou a seguir o mesmo padrão visual do restante do site, com mais contexto, melhor grid e hierarquia mais limpa."
        pills={["Contexto institucional", "Contato orientado", "Leitura objetiva"]}
        primaryAction={{ label: "Entrar em contato", href: site.contact }}
        secondaryAction={{
          label: "Conhecer a empresa",
          href: site.about,
          variant: "secondary",
        }}
        tone="soft"
      >
        <HeroMediaCard
          src="/foto5.png"
          alt="Marca Rodogarcia"
          caption="A narrativa de imprensa foi alinhada ao mesmo acabamento premium e clean usado na página inicial."
        />
      </PageHero>

      <PageSection>
        <PageContainer>
          <SectionHeader
            eyebrow="Fatos principais"
            title="Quatro pontos para contextualizar a marca com rapidez."
            description="Em vez de uma página generica, a estrutura agora entrega leitura institucional util logo no primeiro scroll."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {BRAND_FACTS.map((item) => (
              <SurfaceCard key={item.title}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
                  Marca
                </p>
                <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--color-muted-raw)]">
                  {item.description}
                </p>
              </SurfaceCard>
            ))}
          </div>
        </PageContainer>
      </PageSection>

      <SurfaceSection contentClassName="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
        <div>
          <SectionHeader
            eyebrow="Como funciona"
            title="Solicitações de imprensa entram por um canal unico e objetivo."
            description="A intenção e facilitar entrevista, pedido de contexto institucional e uso de material oficial sem criar pontos soltos na navegação."
          />
          <div className="mt-8">
            <ActionLink action={{ label: "Abrir contato", href: site.contact }} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {MATERIALS.map((item) => (
            <SurfaceCard key={item.title} tone="soft">
              <h3 className="text-xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted-raw)]">
                {item.description}
              </p>
            </SurfaceCard>
          ))}
        </div>
      </SurfaceSection>

      <PageCtaBand
        eyebrow="Contato institucional"
        title="Para entrevistas, informações e contexto adicional, fale com a equipe."
        description="Se a pauta pede mais detalhes, a página de contato concentra o canal institucional sem quebrar a consistência visual do site."
        primaryAction={{ label: "Entrar em contato", href: site.contact }}
        secondaryAction={{
          label: "Conhecer a Rodogarcia",
          href: site.about,
          variant: "secondary",
        }}
        benefits={["Resumo institucional", "Canal unico", "Fluxo alinhado ao restante do site"]}
      />
    </PageShell>
  );
}
