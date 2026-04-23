import type { Metadata } from "next";
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
  title: "Termos de Uso",
  description:
    "Leia os termos de uso do site da Rodogarcia e entenda o escopo das informações e formulários disponiveis.",
  alternates: { canonical: seo.absoluteUrl(site.terms) },
  robots: { index: true, follow: true },
};

const TERMS_SECTIONS = [
  {
    title: "1. Uso do site",
    body:
      "O site da Rodogarcia e destinado a fins informativos e comerciais relacionados aos serviços de transporte, distribuição, cotação e atendimento institucional.",
  },
  {
    title: "2. Conteúdo e propriedade intelectual",
    body:
      "Textos, imagens, marcas, elementos gráficos e demais materiais publicados pertencem a Rodogarcia ou são utilizados com autorização. O uso indevido do conteúdo não e permitido.",
  },
  {
    title: "3. Formulários e canais digitais",
    body:
      "Os formulários de contato, cotação e carreiras servem para iniciar atendimento institucional. O envio das informações não representa contratação automática nem garantia de aprovação comercial ou recrutamento.",
  },
  {
    title: "4. Limitacao de responsabilidade",
    body:
      "A Rodogarcia busca manter o site atualizado e funcional, mas não se responsabiliza por indisponibilidade temporária, uso indevido das informações publicadas ou decisão tomada sem validação com a equipe oficial.",
  },
  {
    title: "5. Atualizacoes",
    body:
      "Os termos podem ser revisados para refletir ajustes operacionais, legais ou de experiência digital. A versão vigente é a publicada nesta página.",
  },
];

export default function TermosDeUsoPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Condicoes de uso"
        title="Termos claros para o uso do site e dos formulários da Rodogarcia."
        description="Mesmo as páginas legais agora seguem o mesmo padrão visual da Home: leitura ampla, hierarquia organizada e estrutura sem aspecto de página solta."
        pills={["Uso institucional", "Formulários oficiais", "Atualização recorrente"]}
        tone="soft"
      >
        <div className="grid gap-4">
          <SurfaceCard>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              Resumo rápido
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
              O site e um canal institucional e comercial.
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted-raw)]">
              Informações, cotações e contatos publicados aqui fazem parte da jornada oficial da marca.
            </p>
          </SurfaceCard>

          <SurfaceCard tone="soft">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              Privacidade
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted-raw)]">
              O tratamento de dados pessoais e detalhado na página de privacidade, em alinhamento com a LGPD.
            </p>
            <div className="mt-5">
              <ActionLink
                action={{
                  label: "Ler política",
                  href: site.privacy,
                  variant: "secondary",
                }}
                className="w-full"
              />
            </div>
          </SurfaceCard>
        </div>
      </PageHero>

      <SurfaceSection contentClassName="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div>
          <SectionHeader
            eyebrow="Leitura completa"
            title="Os termos foram reorganizados para leitura mais limpa e menos estreita."
            description="Em vez de um bloco compacto de texto, o conteúdo agora respira dentro de um layout coerente com o restante do site."
          />

          <div className="mt-8 space-y-4">
            {TERMS_SECTIONS.map((section) => (
              <SurfaceCard key={section.title}>
                <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
                  {section.title}
                </h2>
                <p className="mt-4 text-sm leading-7 text-[var(--color-muted-raw)]">
                  {section.body}
                </p>
              </SurfaceCard>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <SurfaceCard>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              Este documento cobre
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--color-muted-raw)]">
              <li>Uso do site institucional.</li>
              <li>Envio de dados por formulários oficiais.</li>
              <li>Conteúdo, marcas e responsabilidades basicas.</li>
            </ul>
          </SurfaceCard>

          <SurfaceCard tone="soft">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              Contato
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted-raw)]">
              Em caso de dúvida sobre este documento, fale com a equipe pelo e-mail comercial oficial.
            </p>
            <div className="mt-5">
              <ActionLink
                action={{
                  label: "Enviar e-mail",
                  href: external.commercialEmail,
                  variant: "secondary",
                }}
                className="w-full"
              />
            </div>
          </SurfaceCard>
        </div>
      </SurfaceSection>

      <PageCtaBand
        eyebrow="Precisa de mais contexto?"
        title="Privacidade, contato e atendimento seguem a mesma jornada clara do restante do site."
        description="Se a sua dúvida for sobre dados ou sobre algum canal institucional, você pode seguir diretamente para a página certa."
        primaryAction={{ label: "Ler privacidade", href: site.privacy }}
        secondaryAction={{
          label: "Abrir contato",
          href: site.contact,
          variant: "secondary",
        }}
        benefits={["Leitura objetiva", "LGPD considerada", "Canal institucional oficial"]}
      />
    </PageShell>
  );
}
