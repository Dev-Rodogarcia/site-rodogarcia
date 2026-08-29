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
const color = (fallback: string) => z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use uma cor hexadecimal válida.").optional().default(fallback);
const visible = z.boolean().optional().default(true);
const feedbackItem = z.object({ name: text(100), detail: text(120), quote: text(900), rating: z.number().int().min(1).max(5).optional().default(5) });

function preserveLegacyFeedback(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const content = value as Record<string, unknown>;
  if (Array.isArray(content.items) && content.items.length > 0) return value;
  const quote = typeof content.quote === "string" ? content.quote.trim() : "";
  const name = typeof content.author === "string" ? content.author.trim() : "";
  const detail = typeof content.role === "string" ? content.role.trim() : "";
  return quote || name || detail ? { ...content, items: [{ name, detail, quote, rating: 5 }] } : value;
}

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
    title: text(180).default("Conectamos os maiores polos industriais do Brasil"),
    description: text(900).default("Operamos com soluções de alta performance em todo o território nacional para operações dedicadas e posições de armazenagem e distribuição."),
    formTitle: text(180).default("Fale com um especialista em logística B2B"),
    formDescription: text(400).default("Preencha o formulário abaixo. Nossa equipe analisará sua demanda e entrará em contato."),
    submitLabel: text(70).default("Receber solução personalizada"),
    mapBaseColor: color("#A9D4EF"),
    mapBranchColor: color("#2E2882"),
    mapBorderColor: color("#FFFFFF"),
    ctaLabel: text(70), ctaUrl: safeUrl,
  })),
  benefits: z.preprocess((value) => value ?? {}, z.object({
    visible, eyebrow: text(80).default("Nossos serviços"), title: text(180).default("Soluções inteligentes de armazenagem e gestão de estoque"), description: text(700),
    items: z.array(z.object({ title: text(80), description: text(220) })).min(1).max(6).optional().default([
      { title: "Recebimento e preparação de pedidos", description: "Entrada rigorosa da mercadoria, conferência cega, separação e picking otimizados para cada pedido." },
      { title: "Picking e packing", description: "Armazenagem, etiquetagem e organização do estoque com separação, montagem de kits e expedição ágil." },
      { title: "Controle de estoque e rastreabilidade", description: "Gestão integrada com inventário cíclico, acuracidade e controle por lote ou validade." },
      { title: "Armazenagem estruturada e flexível", description: "Infraestrutura para absorver picos sazonais e apoiar diferentes necessidades da operação." },
    ]),
  })),
  story: z.preprocess((value) => value ?? {}, z.object({
    visible, eyebrow: text(80).default("Como funciona"), title: text(180).default("Uma experiência simples do início ao fim"),
    description: text(900).default("Combine uma imagem com uma explicação objetiva sobre a operação, o serviço ou a oportunidade apresentada pela campanha."),
    image: internalMedia,
    items: z.array(z.object({ title: text(100), description: text(320) })).min(1).max(4).optional().default([
      { title: "Operação preparada", description: "Organize a estrutura e os processos que sustentam a sua rotina logística." },
      { title: "Visibilidade em tempo real", description: "Apresente os recursos que mantêm a operação acompanhada em cada etapa." },
      { title: "Segurança e escala", description: "Destaque como a estrutura acompanha o crescimento do seu negócio." },
    ]),
    ctaLabel: text(70), ctaUrl: safeUrl,
  })),
  metrics: z.preprocess((value) => value ?? {}, z.object({
    visible, eyebrow: text(80), title: text(180),
    items: z.array(z.object({ value: text(40), label: text(120), description: text(320) })).min(1).max(4).optional().default([
      { value: "10.850 m²", label: "Área de armazenagem", description: "Infraestrutura e capacidade instalada para uma operação segura, uniforme e eficiente." },
      { value: "8", label: "Centros de distribuição", description: "Hubs e unidades estratégicas para conectar operações em diferentes regiões." },
      { value: "+36", label: "Anos de mercado", description: "Experiência e solidez para conduzir operações com confiança." },
    ]),
  })),
  showcase: z.preprocess((value) => value ?? {}, z.object({
    visible,
    eyebrow: text(80).default("Soluções sob medida"),
    title: text(180).default("Soluções de armazenagem para diversos produtos"),
    description: text(700).default("Apresente a estrutura, os processos e a capacidade que tornam esta operação preparada para diferentes demandas."),
    backgroundImage: internalMedia,
    ctaLabel: text(70).default("Fazer cotação"),
    ctaUrl: safeUrl,
    items: z.array(z.object({ title: text(100), description: text(320) })).min(1).max(3).optional().default([
      { title: "Cargas e produtos industriais", description: "Estrutura preparada para receber e gerenciar fluxos industriais de grande porte." },
      { title: "Matéria-prima", description: "Infraestrutura flexível para recebimento, controle e armazenagem de insumos essenciais." },
      { title: "Bens de distribuição geral", description: "Movimentação eficiente com suporte para acelerar o abastecimento dos seus canais." },
    ]),
  })),
  testimonial: z.preprocess((value) => preserveLegacyFeedback(value ?? {}), z.object({
    visible, eyebrow: text(80).default("Nossa história"), title: text(180).default("Solidez, tradição e inovação estruturada na gestão do seu estoque"), description: text(900).default("A confiança de quem acompanha a nossa operação mostra o cuidado que levamos para cada etapa da logística."),
    items: z.array(feedbackItem).min(1).max(6).optional().default([
      { name: "Cliente atendido", detail: "Operação industrial", quote: "Inclua aqui uma avaliação autorizada que descreva a experiência com a operação.", rating: 5 },
      { name: "Cliente atendido", detail: "Distribuição nacional", quote: "Use feedbacks reais para reforçar a confiança antes do próximo contato.", rating: 5 },
      { name: "Cliente atendido", detail: "Operação dedicada", quote: "Apresente uma fala curta, objetiva e aprovada pelo cliente.", rating: 5 },
    ]),
    // Mantidos para ler e migrar campanhas que usavam o antigo depoimento único.
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
    backgroundImage: internalMedia, ctaLabel: text(70).default("Entrar em contato"), ctaUrl: safeUrl,
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
