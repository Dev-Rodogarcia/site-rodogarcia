import { z } from "zod";

export const CAMPAIGN_V1_TEMPLATE = "campaign-v1" as const;

const text = (max: number) => z.string().trim().max(max).optional().default("");
const safeUrl = z.string().trim().max(400).refine(
  (value) => !value || (/^\/(?!\/)/.test(value) || /^(https:|mailto:|tel:)/.test(value)),
  "Use uma rota interna, URL HTTPS, telefone ou e-mail válido.",
).optional().default("");
const internalMedia = z.string().trim().max(300).refine(
  (value) => !value || (/^\/landing-media\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)),
  "Selecione uma mídia válida da biblioteca da campanha.",
).optional().default("");
const visible = z.boolean().optional().default(true);

/**
 * Contrato e conteúdo inicial do primeiro template de campanhas.
 * Novos templates vivem em módulos irmãos, sem ampliar este schema com campos opcionais.
 */
export const campaignV1Schema = z.object({
  template: z.literal(CAMPAIGN_V1_TEMPLATE).optional().default(CAMPAIGN_V1_TEMPLATE),
  hero: z.preprocess((value) => value ?? {}, z.object({
    phone: text(40), email: text(160), logo: internalMedia, backgroundImage: internalMedia,
    eyebrow: text(80).default("Campanha em destaque"),
    title: text(180).default("Uma solução preparada para o seu desafio"),
    description: text(700).default("Apresente a proposta principal da campanha com uma mensagem direta, clara e orientada à ação."),
    ctaLabel: text(70).default("Fale com nossa equipe"), ctaUrl: safeUrl,
    highlights: z.array(z.object({ title: text(80), description: text(220) })).min(1).max(4).optional().default([
      { title: "Diferencial 01", description: "Apresente um benefício relevante para o público." },
      { title: "Diferencial 02", description: "Explique por que esta solução faz sentido." },
      { title: "Diferencial 03", description: "Destaque um ponto que ajude na decisão." },
    ]),
  })),
  lowerSection: z.preprocess((value) => value ?? {}, z.object({
    visible,
    title: text(180).default("A solução certa começa com uma mensagem clara"),
    description: text(900).default("Use esta abertura para aprofundar a proposta da campanha, explicar o contexto e preparar a pessoa para conhecer os benefícios."),
    ctaLabel: text(70), ctaUrl: safeUrl,
  })),
  benefits: z.preprocess((value) => value ?? {}, z.object({
    visible, eyebrow: text(80).default("Benefícios"), title: text(180).default("Por que escolher esta solução"), description: text(700).default("Organize os motivos mais importantes em uma leitura rápida."),
    items: z.array(z.object({ title: text(80), description: text(220) })).min(1).max(6).optional().default([
      { title: "Planejamento próximo", description: "Organize a mensagem para o público que você quer alcançar." },
      { title: "Atendimento claro", description: "Explique os diferenciais que ajudam a pessoa a decidir." },
      { title: "Próximo passo simples", description: "Direcione a campanha para uma ação objetiva." },
    ]),
  })),
  story: z.preprocess((value) => value ?? {}, z.object({
    visible, eyebrow: text(80).default("Como funciona"), title: text(180).default("Uma experiência simples do início ao fim"),
    description: text(900).default("Combine uma imagem com uma explicação objetiva sobre a operação, o serviço ou a oportunidade apresentada pela campanha."),
    image: internalMedia, ctaLabel: text(70), ctaUrl: safeUrl,
  })),
  metrics: z.preprocess((value) => value ?? {}, z.object({
    visible, eyebrow: text(80).default("Em números"), title: text(180).default("Informações que reforçam a decisão"),
    items: z.array(z.object({ value: text(40), label: text(120) })).min(1).max(4).optional().default([
      { value: "01", label: "Proposta clara" },
      { value: "02", label: "Benefícios em destaque" },
      { value: "03", label: "CTA bem definido" },
    ]),
  })),
  testimonial: z.preprocess((value) => value ?? {}, z.object({
    visible, eyebrow: text(80).default("Confiança"), title: text(180).default("O que as pessoas dizem"),
    quote: text(900).default("Inclua aqui um depoimento real que ajude o visitante a entender o valor da sua proposta."),
    author: text(100).default("Nome do cliente"), role: text(120).default("Cargo ou empresa"),
  })),
  faq: z.preprocess((value) => value ?? {}, z.object({
    visible, eyebrow: text(80).default("Dúvidas frequentes"), title: text(180).default("Tudo o que você precisa saber"),
    items: z.array(z.object({ question: text(180), answer: text(900) })).min(1).max(8).optional().default([
      { question: "Como funciona esta solução?", answer: "Descreva de forma direta como a pessoa começa e o que pode esperar." },
      { question: "Como solicitar atendimento?", answer: "Use o botão principal para orientar o próximo passo da campanha." },
      { question: "Onde encontro mais informações?", answer: "Inclua nesta resposta os canais ou condições importantes para o público." },
    ]),
  })),
  finalCta: z.preprocess((value) => value ?? {}, z.object({
    visible, eyebrow: text(80).default("Próximo passo"), title: text(180).default("Vamos conversar sobre a sua necessidade?"),
    description: text(700).default("Finalize a campanha com uma chamada direta e um único destino de conversão."),
    ctaLabel: text(70).default("Entrar em contato"), ctaUrl: safeUrl,
  })),
  footer: z.preprocess((value) => value ?? {}, z.object({
    brand: text(120).default("Sua empresa"), description: text(400).default("Uma mensagem curta para encerrar a campanha."),
    phone: text(40), email: text(160), legalText: text(240).default("Todos os direitos reservados."),
  })),
});

export type CampaignV1Content = z.output<typeof campaignV1Schema>;

export function createCampaignV1Content(): CampaignV1Content {
  return campaignV1Schema.parse({});
}
