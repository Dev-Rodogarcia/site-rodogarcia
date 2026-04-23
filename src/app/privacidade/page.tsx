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
  title: "Privacidade",
  description:
    "Entenda como a Rodogarcia trata os dados enviados pelos formulários e canais digitais do site.",
  alternates: { canonical: seo.absoluteUrl(site.privacy) },
  robots: { index: true, follow: true },
};

const PRIVACY_SECTIONS = [
  {
    title: "1. Quais dados podem ser coletados",
    body:
      "Os formulários do site podem receber nome, e-mail, telefone, empresa, origem, destino, mensagem e outras informações enviadas voluntariamente pelo usuário conforme o objetivo do atendimento.",
  },
  {
    title: "2. Finalidade do tratamento",
    body:
      "Os dados são usados para responder contatos, elaborar cotações, receber candidaturas e conduzir comunicacoes institucionais relacionadas aos serviços da Rodogarcia.",
  },
  {
    title: "3. Compartilhamento e acesso interno",
    body:
      "As informações são tratadas dentro do fluxo institucional e podem ser acessadas por equipes responsaveis por atendimento comercial, contato, recrutamento ou operação, conforme a natureza da demanda.",
  },
  {
    title: "4. Retenção e segurança",
    body:
      "A Rodogarcia adota medidas técnicas e organizacionais para proteger as informações recebidas e manter os dados apenas pelo período necessário ao atendimento ou obrigação legal aplicável.",
  },
  {
    title: "5. Direitos do titular",
    body:
      "O titular pode solicitar esclarecimentos, atualização ou revisão de informações pessoais pelos canais institucionais da empresa, em alinhamento com a LGPD.",
  },
];

export default function PrivacidadePage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Política de privacidade"
        title="Como tratamos os dados enviados pelos canais digitais da Rodogarcia."
        description="Esta página foi criada para eliminar o link morto do rodape e manter o mesmo padrão premium da Home tambem nas rotas legais."
        pills={["LGPD", "Formulários oficiais", "Tratamento institucional"]}
        tone="soft"
      >
        <div className="grid gap-4">
          <SurfaceCard>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              Escopo
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[var(--foreground)]">
              Dados enviados por contato, cotação e carreiras.
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted-raw)]">
              A política cobre as informações compartilhadas voluntariamente pelo usuário nos canais do site.
            </p>
          </SurfaceCard>

          <SurfaceCard tone="soft">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              Canal institucional
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted-raw)]">
              Para esclarecimentos adicionais, use o e-mail comercial oficial da Rodogarcia.
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
      </PageHero>

      <SurfaceSection contentClassName="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div>
          <SectionHeader
            eyebrow="Leitura completa"
            title="A política foi estruturada para manter clareza juridica sem sacrificar a experiência."
            description="O objetivo aqui e explicar o tratamento de dados com linguagem direta, hierarquia limpa e largura de leitura coerente com o resto do site."
          />

          <div className="mt-8 space-y-4">
            {PRIVACY_SECTIONS.map((section) => (
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
              Esta página cobre
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--color-muted-raw)]">
              <li>Dados enviados nos formulários do site.</li>
              <li>Finalidade do uso institucional dessas informações.</li>
              <li>Orientação para contato sobre direitos do titular.</li>
            </ul>
          </SurfaceCard>

          <SurfaceCard tone="soft">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">
              Relação com outros documentos
            </p>
            <div className="mt-5 space-y-3">
              <ActionLink
                action={{
                  label: "Ver termos de uso",
                  href: site.terms,
                  variant: "secondary",
                }}
                className="w-full"
              />
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
        </div>
      </SurfaceSection>

      <PageCtaBand
        eyebrow="Fluxo institucional"
        title="Se precisar de orientação adicional, contato e termos seguem ao lado."
        description="Privacidade agora faz parte da navegação principal do rodape sem criar ruptura visual ou links mortos."
        primaryAction={{ label: "Abrir contato", href: site.contact }}
        secondaryAction={{
          label: "Ver termos de uso",
          href: site.terms,
          variant: "secondary",
        }}
        benefits={["Página criada no rodape", "LGPD considerada", "Leitura consistente com a Home"]}
      />
    </PageShell>
  );
}
