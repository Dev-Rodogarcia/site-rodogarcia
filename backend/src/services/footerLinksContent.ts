import type {
  ContentData,
  FooterActionCard,
  FooterGlobalContent,
  FooterLinkColumn,
  FooterLinkItem,
  FooterLinksContent,
  FooterLinksHelpContent,
  FooterLinksPrivacyContent,
  FooterLinksTermsContent,
  FooterSocialLink,
  FooterTextBlock,
  PageButton,
  PageFaqItem,
} from "../types/content.js";
import { generateId } from "../utils/ids.js";
import { HttpError } from "../utils/http.js";
import { sanitizeText, sanitizeUrl } from "../utils/sanitize.js";

export const FOOTER_LINK_SECTION_KEYS = ["footer", "terms", "help", "privacy"] as const;
export type FooterLinkSectionKey = (typeof FOOTER_LINK_SECTION_KEYS)[number];

const site = {
  home: "/",
  services: "/servicos",
  about: "/sobre",
  business: "/para-empresas",
  quote: "/cotacao",
  collections: "/coletas",
  contact: "/fale-conosco",
  help: "/central-ajuda",
  press: "/imprensa",
  careers: "/trabalhe-conosco",
  terms: "/termos-de-uso",
  privacy: "/privacidade",
  voice: "/sua-voz",
} as const;

const external = {
  tracking: "https://rodogarcia.eslcloud.com.br/recipient_tracking",
  whatsappCommercial: "https://wa.me/5511993139536",
  commercialEmail: "mailto:gerente.financeiro@rodogarcia.com.br",
  phoneDisplay: "0800 591 4557",
  phoneHref: "tel:08005914557",
} as const;

type RawRecord = Record<string, unknown>;

function isRecord(value: unknown): value is RawRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function arrayPayload(value: unknown): RawRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

const SOCIAL_ICON_KEYS = new Set(["InstagramLogo", "LinkedinLogo", "FacebookLogo", "WhatsappLogo"]);
const HELP_ICON_KEYS = new Set(["Package", "ChatCircleDots", "ShieldCheck"]);

function stringArrayPayload(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => sanitizeText(item, 220)).filter(Boolean) : [];
}

function withOrder<T extends { order?: number }>(items: T[]): T[] {
  return items.map((item, index) => ({ ...item, order: index + 1 }));
}

function sanitizeButton(payload: unknown, fallback: PageButton): PageButton {
  const source = isRecord(payload) ? payload : {};
  const url = sanitizeUrl(source.url ?? source.href) || fallback.url;
  return {
    label: sanitizeText(source.label, 60) || fallback.label,
    url,
    external: url.startsWith("http") || url.startsWith("mailto:") || url.startsWith("tel:"),
  };
}

function sanitizeButtons(payload: unknown, fallbacks: PageButton[], count = 2) {
  const source = Array.isArray(payload) ? payload : [];
  return Array.from({ length: count }, (_, index) =>
    sanitizeButton(source[index], fallbacks[index] ?? fallbacks[0]!)
  );
}

function sanitizeFooterLink(payload: RawRecord, index: number, fallback?: FooterLinkItem): FooterLinkItem {
  const button = sanitizeButton(payload, fallback ?? { label: "", url: site.home });
  return {
    id: sanitizeText(payload.id, 80) || fallback?.id || generateId("footer_link"),
    order: Number(payload.order ?? index + 1),
    ...button,
  };
}

function sanitizeFooterColumn(payload: RawRecord, index: number, fallback?: FooterLinkColumn): FooterLinkColumn {
  const rawLinks = arrayPayload(payload.links);
  const fallbackLinks = fallback?.links ?? [];
  const sourceLinks = Array.isArray(payload.links) ? rawLinks : fallbackLinks;
  return {
    id: sanitizeText(payload.id, 80) || fallback?.id || generateId("footer_column"),
    order: Number(payload.order ?? index + 1),
    title: sanitizeText(payload.title, 80) || fallback?.title || "Links",
    links: withOrder(
      sourceLinks
        .map((link, linkIndex) => sanitizeFooterLink(link as RawRecord, linkIndex, fallbackLinks[linkIndex]))
        .filter((link) => link.label && link.url)
    ),
  };
}

function sanitizeTextBlock(payload: RawRecord, index: number, fallback?: FooterTextBlock): FooterTextBlock {
  return {
    id: sanitizeText(payload.id, 80) || fallback?.id || generateId("footer_block"),
    order: Number(payload.order ?? index + 1),
    title: sanitizeText(payload.title, 180) || fallback?.title || "",
    description: sanitizeText(payload.description ?? payload.body, 700) || fallback?.description || "",
  };
}

function sanitizeFaqItem(payload: RawRecord, index: number, fallback: PageFaqItem): PageFaqItem {
  return {
    id: sanitizeText(payload.id, 80) || fallback.id || `footer-faq-${index + 1}`,
    order: Number(payload.order ?? index + 1),
    question: sanitizeText(payload.question, 180) || fallback.question,
    answer: sanitizeText(payload.answer, 320) || fallback.answer,
  };
}

function sanitizeActionCard(payload: RawRecord, index: number, fallback: FooterActionCard): FooterActionCard {
  const icon = sanitizeText(payload.icon, 40);
  return {
    ...sanitizeTextBlock(payload, index, fallback),
    icon: HELP_ICON_KEYS.has(icon) ? icon : fallback.icon,
    button: sanitizeButton(payload.button, fallback.button),
  };
}

function requireText(value: unknown, label: string, maxLength = 700) {
  if (!sanitizeText(value, maxLength)) throw new HttpError(422, `${label} é obrigatório.`);
}

function requireRecord(value: unknown, label: string): RawRecord {
  if (!isRecord(value)) throw new HttpError(422, `${label} é obrigatório.`);
  return value;
}

function isFooterLink(value: unknown) {
  return Boolean(sanitizeUrl(value) || sanitizeText(value, 600) === "#");
}

function requireButton(value: unknown, label: string) {
  const button = requireRecord(value, label);
  requireText(button.label, `${label}: texto`, 60);
  if (!isFooterLink(button.url ?? button.href)) {
    throw new HttpError(422, `${label}: link válido é obrigatório.`);
  }
}

function requireRecords(value: unknown, label: string) {
  if (!Array.isArray(value) || value.some((item) => !isRecord(item))) {
    throw new HttpError(422, `${label}: informe uma lista válida.`);
  }
  return value as RawRecord[];
}

function requireTextArray(value: unknown, label: string, maxLength = 220) {
  if (!Array.isArray(value)) throw new HttpError(422, `${label}: informe uma lista válida.`);
  value.forEach((item, index) => requireText(item, `${label} ${index + 1}`, maxLength));
}

function requireButtons(value: unknown, label: string, count = 2) {
  const buttons = requireRecords(value, label);
  if (buttons.length !== count) throw new HttpError(422, `${label}: informe exatamente ${count} botão(ões).`);
  buttons.forEach((button, index) => requireButton(button, `${label} ${index + 1}`));
}

function requireTextBlocks(value: unknown, label: string) {
  requireRecords(value, label).forEach((block, index) => {
    requireText(block.title, `${label} ${index + 1}: título`, 180);
    requireText(block.description ?? block.body, `${label} ${index + 1}: descrição`, 700);
  });
}

function validateFooterSectionInput(sectionKey: FooterLinkSectionKey, payload: RawRecord) {
  if (sectionKey === "footer") {
    requireText(payload.description, "Descrição do rodapé", 260);
    requireButton(payload.proposalButton, "Botão de proposta");
    requireButton(payload.supportButton, "Botão de atendimento");
    requireText(payload.serviceHoursTitle, "Título de horários", 80);
    requireText(payload.socialTitle, "Título de redes sociais", 80);
    requireText(payload.copyrightText, "Texto de copyright", 160);
    requireText(payload.locationText, "Texto de localização", 120);
    requireText(payload.creditText, "Texto de crédito", 120);
    if (!sanitizeUrl(payload.creditUrl)) throw new HttpError(422, "Link de crédito válido é obrigatório.");

    requireRecords(payload.columns, "Colunas").forEach((column, index) => {
      requireText(column.title, `Coluna ${index + 1}: título`, 80);
      requireRecords(column.links, `Coluna ${index + 1}: links`).forEach((link, linkIndex) =>
        requireButton(link, `Coluna ${index + 1}: link ${linkIndex + 1}`)
      );
    });
    requireTextArray(payload.serviceHours, "Horários");
    requireRecords(payload.socialLinks, "Redes sociais").forEach((link, index) => {
      requireButton(link, `Rede social ${index + 1}`);
      if (!SOCIAL_ICON_KEYS.has(sanitizeText(link.icon, 40))) {
        throw new HttpError(422, `Rede social ${index + 1}: ícone inválido.`);
      }
    });
    requireRecords(payload.bottomLinks, "Links inferiores").forEach((link, index) =>
      requireButton(link, `Link inferior ${index + 1}`)
    );
    return;
  }

  if (sectionKey === "terms") {
    const hero = requireRecord(payload.hero, "Hero de termos");
    const summary = requireRecord(payload.summary, "Resumo de termos");
    const reading = requireRecord(payload.reading, "Leitura de termos");
    const finalCta = requireRecord(payload.finalCta, "CTA final de termos");
    ["eyebrow", "titleHighlight", "titleRest", "description"].forEach((field) => requireText(hero[field], `Hero de termos: ${field}`));
    ["eyebrow", "title", "description", "body"].forEach((field) => requireText(summary[field], `Resumo de termos: ${field}`));
    requireButton(summary.button, "Resumo de termos: botão");
    ["eyebrow", "title", "description"].forEach((field) => requireText(reading[field], `Leitura de termos: ${field}`));
    requireTextBlocks(reading.blocks, "Blocos de termos");
    requireText(finalCta.title, "CTA final de termos: título", 180);
    requireText(finalCta.description, "CTA final de termos: descrição", 320);
    requireButtons(finalCta.buttons, "CTA final de termos");
    return;
  }

  if (sectionKey === "help") {
    const hero = requireRecord(payload.hero, "Hero da central de ajuda");
    const quickAccess = requireRecord(payload.quickAccess, "Acessos rápidos");
    const contactCard = requireRecord(payload.contactCard, "Cartão de contato");
    const faq = requireRecord(payload.faq, "FAQ");
    const finalSupport = requireRecord(payload.finalSupport, "Suporte final");
    ["eyebrow", "titleHighlight", "titleRest", "description"].forEach((field) => requireText(hero[field], `Hero da central de ajuda: ${field}`));
    requireButtons(hero.buttons, "Hero da central de ajuda");
    ["eyebrow", "title", "description"].forEach((field) => requireText(quickAccess[field], `Acessos rápidos: ${field}`));
    const actions = requireRecords(quickAccess.actions, "Acessos rápidos");
    if (actions.length !== DEFAULT_FOOTER_LINKS.help.quickAccess.actions.length) {
      throw new HttpError(422, `Acessos rápidos: mantenha exatamente ${DEFAULT_FOOTER_LINKS.help.quickAccess.actions.length} ações.`);
    }
    actions.forEach((action, index) => {
      requireText(action.title, `Ação rápida ${index + 1}: título`, 180);
      requireText(action.description, `Ação rápida ${index + 1}: descrição`, 700);
      if (!HELP_ICON_KEYS.has(sanitizeText(action.icon, 40))) throw new HttpError(422, `Ação rápida ${index + 1}: ícone inválido.`);
      requireButton(action.button, `Ação rápida ${index + 1}: botão`);
    });
    requireText(contactCard.phone, "Contato da ajuda: telefone", 80);
    requireText(contactCard.hours, "Contato da ajuda: horários", 180);
    requireTextArray(contactCard.channelDescriptions, "Canais da ajuda");
    ["eyebrow", "title", "description"].forEach((field) => requireText(faq[field], `FAQ: ${field}`));
    const faqItems = requireRecords(faq.items, "FAQ");
    if (faqItems.length !== DEFAULT_FOOTER_LINKS.help.faq.items.length) {
      throw new HttpError(422, `FAQ: mantenha exatamente ${DEFAULT_FOOTER_LINKS.help.faq.items.length} perguntas.`);
    }
    faqItems.forEach((item, index) => {
      requireText(item.question, `FAQ ${index + 1}: pergunta`, 180);
      requireText(item.answer, `FAQ ${index + 1}: resposta`, 320);
    });
    ["eyebrow", "title", "description"].forEach((field) => requireText(finalSupport[field], `Suporte final: ${field}`));
    requireButton(finalSupport.button, "Suporte final: botão");
    return;
  }

  const hero = requireRecord(payload.hero, "Hero de privacidade");
  const dataSection = requireRecord(payload.dataSection, "Seção de dados");
  const finalCta = requireRecord(payload.finalCta, "CTA final de privacidade");
  ["eyebrow", "titleHighlight", "titleRest", "description"].forEach((field) => requireText(hero[field], `Hero de privacidade: ${field}`));
  requireButton(hero.button, "Hero de privacidade: botão");
  ["eyebrow", "title", "description"].forEach((field) => requireText(dataSection[field], `Seção de dados: ${field}`));
  requireTextBlocks(dataSection.blocks, "Blocos de privacidade");
  requireText(finalCta.title, "CTA final de privacidade: título", 180);
  requireText(finalCta.description, "CTA final de privacidade: descrição", 320);
  requireButtons(finalCta.buttons, "CTA final de privacidade");
}

export const DEFAULT_FOOTER_LINKS: FooterLinksContent = {
  footer: {
    description:
      "Estruturamos operações de transporte, distribuição e rastreabilidade com consistência e cobertura nacional.",
    proposalButton: { label: "Receber proposta", url: site.quote },
    supportButton: { label: "Falar com atendimento", url: external.whatsappCommercial, external: true },
    columns: [
      {
        id: "services",
        order: 1,
        title: "Serviços",
        links: [
          { id: "services-road", order: 1, label: "Transporte rodoviário", url: site.services },
          { id: "services-quote", order: 2, label: "Solicitar cotação", url: site.quote },
          { id: "services-collection", order: 3, label: "Solicitar coleta", url: site.collections },
          { id: "services-tracking", order: 4, label: "Rastrear encomenda", url: external.tracking, external: true },
          { id: "services-business", order: 5, label: "Para empresas", url: site.business },
        ],
      },
      {
        id: "company",
        order: 2,
        title: "Empresa",
        links: [
          { id: "company-home", order: 1, label: "Início", url: site.home },
          { id: "company-about", order: 2, label: "Sobre a Rodogarcia", url: site.about },
          { id: "company-careers", order: 3, label: "Carreiras", url: site.careers },
          { id: "company-press", order: 4, label: "Imprensa", url: site.press },
          { id: "company-voice", order: 5, label: "Sua Voz", url: site.voice },
          { id: "company-terms", order: 6, label: "Termos de uso", url: site.terms },
        ],
      },
      {
        id: "resources",
        order: 3,
        title: "Recursos",
        links: [
          { id: "resources-help", order: 1, label: "Central de ajuda", url: site.help },
          { id: "resources-privacy", order: 2, label: "Privacidade de dados", url: site.privacy },
          { id: "resources-contact", order: 3, label: "Atendimento comercial", url: external.whatsappCommercial, external: true },
          { id: "resources-email", order: 4, label: "E-mail comercial", url: external.commercialEmail, external: true },
          { id: "resources-phone", order: 5, label: external.phoneDisplay, url: external.phoneHref, external: true },
        ],
      },
    ],
    serviceHoursTitle: "Horário de atendimento",
    serviceHours: [
      "Segunda a sexta: 08:00 às 18:00",
      "Sábado: 08:00 às 12:00",
      "Domingo e feriados: fechado",
    ],
    socialTitle: "Redes sociais",
    socialLinks: [
      { id: "social-instagram", order: 1, icon: "InstagramLogo", label: "Instagram", url: "#" },
      { id: "social-linkedin", order: 2, icon: "LinkedinLogo", label: "LinkedIn", url: "#" },
      { id: "social-facebook", order: 3, icon: "FacebookLogo", label: "Facebook", url: "#" },
      { id: "social-whatsapp", order: 4, icon: "WhatsappLogo", label: "WhatsApp", url: external.whatsappCommercial, external: true },
    ],
    bottomLinks: [
      { id: "bottom-terms", order: 1, label: "Termos de uso", url: site.terms },
      { id: "bottom-privacy", order: 2, label: "Privacidade", url: site.privacy },
      { id: "bottom-voice", order: 3, label: "Sua Voz", url: site.voice },
    ],
    copyrightText: "Rodogarcia Transportes. Todos os direitos reservados.",
    locationText: "Agudos, SP - Cobertura nacional",
    creditText: "Feito por Lucas Andrade @valentelucass",
    creditUrl: "https://www.linkedin.com/in/dev-lucasandrade/",
  },
  terms: {
    hero: {
      eyebrow: "Condições de uso",
      titleHighlight: "Transparência",
      titleRest: "e clareza.",
      description:
        "Termos claros para o uso do site, formulários e canais oficiais da Rodogarcia. Todas as informações em um só lugar.",
    },
    summary: {
      eyebrow: "Resumo rápido",
      title: "O site é um canal institucional e comercial.",
      description: "Informações, cotações e contatos publicados aqui fazem parte da jornada oficial da marca.",
      body:
        "Este documento cobre o uso do site institucional, o envio de dados por formulários oficiais e as responsabilidades sobre conteúdo e marcas.",
      button: { label: "Ler política", url: site.privacy },
    },
    reading: {
      eyebrow: "Leitura completa",
      title: "Termos detalhados",
      description: "Entenda os limites e as diretrizes para utilizar nosso portal e serviços associados.",
      blocks: [
        {
          id: "terms-use",
          order: 1,
          title: "1. Uso do site",
          description:
            "O site da Rodogarcia é destinado a fins informativos e comerciais relacionados aos serviços de transporte, distribuição, cotação e atendimento institucional.",
        },
        {
          id: "terms-content",
          order: 2,
          title: "2. Conteúdo e propriedade intelectual",
          description:
            "Textos, imagens, marcas, elementos gráficos e demais materiais publicados pertencem à Rodogarcia ou são utilizados com autorização.",
        },
        {
          id: "terms-forms",
          order: 3,
          title: "3. Formulários e canais digitais",
          description:
            "Os formulários de contato, cotação e carreiras servem para iniciar atendimento institucional sem representar contratação automática.",
        },
        {
          id: "terms-responsibility",
          order: 4,
          title: "4. Limitação de responsabilidade",
          description:
            "A Rodogarcia busca manter o site atualizado e funcional, mas indisponibilidades temporárias podem ocorrer.",
        },
        {
          id: "terms-updates",
          order: 5,
          title: "5. Atualizações",
          description:
            "Os termos podem ser revisados para refletir ajustes operacionais, legais ou de experiência digital.",
        },
      ],
    },
    finalCta: {
      title: "Ficou alguma dúvida?",
      description:
        "Em caso de dúvida sobre este documento ou sobre o uso dos canais institucionais, fale com a equipe pelo canal oficial.",
      buttons: [
        { label: "Enviar e-mail", url: external.commercialEmail, external: true },
        { label: "Abrir contato", url: site.contact },
      ],
    },
  },
  help: {
    hero: {
      eyebrow: "Central de ajuda",
      titleHighlight: "Respostas diretas,",
      titleRest: "sem ruído.",
      description:
        "FAQ, canais de suporte e atalhos operacionais organizados em um só lugar para tornar o atendimento mais ágil.",
      buttons: [
        { label: "Rastrear carga", url: external.tracking, external: true },
        { label: "Falar com atendimento", url: site.contact },
      ],
    },
    quickAccess: {
      eyebrow: "Acesso rápido",
      title: "Os três caminhos mais usados pelo nosso time de atendimento.",
      description: "Rastreio, contato e privacidade concentrados para que você chegue ao canal certo sem esforço.",
      actions: [
        {
          id: "help-tracking",
          order: 1,
          icon: "Package",
          title: "Rastrear carga",
          description: "Acesso direto ao portal operacional para consulta do status da remessa em tempo real.",
          button: { label: "Abrir rastreio", url: external.tracking, external: true },
        },
        {
          id: "help-commercial",
          order: 2,
          icon: "ChatCircleDots",
          title: "Atendimento comercial",
          description: "Fale com o time para cotação, orientação inicial ou suporte institucional.",
          button: { label: "Abrir contato", url: site.contact },
        },
        {
          id: "help-privacy",
          order: 3,
          icon: "ShieldCheck",
          title: "Política de privacidade",
          description: "Entenda como tratamos dados e como os formulários entram no fluxo institucional.",
          button: { label: "Ler política", url: site.privacy },
        },
      ],
    },
    contactCard: {
      phone: external.phoneDisplay,
      hours: "Segunda a sexta, das 8h às 18h. Sábado das 8h às 12h.",
      channelDescriptions: [
        "Para cotação: WhatsApp ou página de cotação.",
        "Para rastreio: portal oficial com código da remessa.",
        "Para política de dados: rodapé e página de privacidade.",
      ],
    },
    faq: {
      eyebrow: "Perguntas frequentes",
      title: "As dúvidas mais comuns respondidas de forma objetiva.",
      description: "Se sua pergunta não está aqui, o canal de atendimento está disponível para orientação direta.",
      items: [
        {
          id: "help-faq-1",
          order: 1,
          question: "Como rastrear minha encomenda?",
          answer: "Use o portal oficial de rastreio com o código recebido no envio.",
        },
        {
          id: "help-faq-2",
          order: 2,
          question: "Como solicitar uma cotação?",
          answer: "Acesse a página de cotação ou fale diretamente com a equipe comercial.",
        },
        {
          id: "help-faq-3",
          order: 3,
          question: "Quais regiões a Rodogarcia atende?",
          answer: "A operação tem cobertura nacional para distribuição e projetos corporativos.",
        },
        {
          id: "help-faq-4",
          order: 4,
          question: "Qual o prazo de entrega?",
          answer: "O prazo depende de origem, destino, janela e tipo de serviço contratado.",
        },
        {
          id: "help-faq-5",
          order: 5,
          question: "A Rodogarcia atende cargas especiais?",
          answer: "Operações com maior exigência podem ser avaliadas pelo time especializado.",
        },
        {
          id: "help-faq-6",
          order: 6,
          question: "Como falar com o suporte?",
          answer: "Use o telefone, o e-mail comercial ou a página de contato.",
        },
      ],
    },
    finalSupport: {
      eyebrow: "Ainda precisa de apoio?",
      title: "Abra uma solicitação e fale com o canal certo.",
      description: "Envie sua demanda pelo contato oficial para que a equipe identifique o melhor fluxo.",
      button: { label: "Abrir suporte", url: site.contact },
    },
  },
  privacy: {
    hero: {
      eyebrow: "Política de privacidade",
      titleHighlight: "Dados tratados",
      titleRest: "com clareza.",
      description:
        "Entenda como os dados enviados pelos formulários e canais digitais são utilizados dentro dos fluxos institucionais da Rodogarcia.",
      button: { label: "Ver termos de uso", url: site.terms },
    },
    dataSection: {
      eyebrow: "Política de privacidade",
      title: "Leia os principais pontos sobre coleta, finalidade, segurança e direitos do titular.",
      description:
        "As informações abaixo explicam como os dados podem ser recebidos e tratados nos canais oficiais.",
      blocks: [
        {
          id: "privacy-data",
          order: 1,
          title: "Quais dados podem ser coletados?",
          description:
            "Formulários podem receber nome, e-mail, telefone, empresa, origem, destino e mensagens enviadas voluntariamente.",
        },
        {
          id: "privacy-purpose",
          order: 2,
          title: "Para que os dados são usados?",
          description:
            "Os dados são usados para responder contatos, elaborar cotações e conduzir comunicações institucionais.",
        },
        {
          id: "privacy-access",
          order: 3,
          title: "Quem pode acessar?",
          description:
            "Equipes responsáveis por atendimento, contato, recrutamento ou operação podem acessar conforme a demanda.",
        },
        {
          id: "privacy-security",
          order: 4,
          title: "Como protegemos as informações?",
          description:
            "A Rodogarcia adota medidas técnicas e organizacionais para proteger as informações recebidas.",
        },
        {
          id: "privacy-rights",
          order: 5,
          title: "Quais são os direitos do titular?",
          description:
            "O titular pode solicitar esclarecimentos, atualização ou revisão pelos canais institucionais da empresa.",
        },
      ],
    },
    finalCta: {
      title: "Precisa falar sobre seus dados?",
      description:
        "Para dúvidas sobre privacidade, atualização de informações ou direitos do titular, use o canal institucional oficial.",
      buttons: [
        { label: "Enviar e-mail", url: external.commercialEmail, external: true },
        { label: "Abrir contato", url: site.contact },
      ],
    },
  },
};

export function sanitizeFooterGlobal(payload: unknown): FooterGlobalContent {
  const source = isRecord(payload) ? payload : {};
  const fallback = DEFAULT_FOOTER_LINKS.footer;
  const rawColumns = arrayPayload(source.columns);
  const columns = Array.isArray(source.columns) ? rawColumns : fallback.columns as unknown as RawRecord[];
  const rawSocial = arrayPayload(source.socialLinks);
  const socialSource = Array.isArray(source.socialLinks) ? rawSocial : fallback.socialLinks as unknown as RawRecord[];
  const rawBottom = arrayPayload(source.bottomLinks);
  const bottomSource = Array.isArray(source.bottomLinks) ? rawBottom : fallback.bottomLinks as unknown as RawRecord[];

  return {
    description: sanitizeText(source.description, 260) || fallback.description,
    proposalButton: sanitizeButton(source.proposalButton, fallback.proposalButton),
    supportButton: sanitizeButton(source.supportButton, fallback.supportButton),
    columns: withOrder(
      columns
        .map((column, index) => sanitizeFooterColumn(column, index, fallback.columns[index]))
        .filter((column) => column.title)
    ),
    serviceHoursTitle: sanitizeText(source.serviceHoursTitle, 80) || fallback.serviceHoursTitle,
    serviceHours: (
      Array.isArray(source.serviceHours)
        ? stringArrayPayload(source.serviceHours)
        : fallback.serviceHours
    ).slice(0, 5),
    socialTitle: sanitizeText(source.socialTitle, 80) || fallback.socialTitle,
    socialLinks: withOrder(
      socialSource
        .map((item, index) => {
          const fallbackSocial = fallback.socialLinks[index];
          return {
            ...sanitizeFooterLink(item, index, fallbackSocial),
            icon: SOCIAL_ICON_KEYS.has(sanitizeText(item.icon, 40))
              ? sanitizeText(item.icon, 40)
              : fallbackSocial?.icon || "InstagramLogo",
          } satisfies FooterSocialLink;
        })
        .filter((item) => item.label && item.url)
    ),
    bottomLinks: withOrder(
      bottomSource
        .map((item, index) => sanitizeFooterLink(item, index, fallback.bottomLinks[index]))
        .filter((item) => item.label && item.url)
    ),
    copyrightText: sanitizeText(source.copyrightText, 160) || fallback.copyrightText,
    locationText: sanitizeText(source.locationText, 120) || fallback.locationText,
    creditText: sanitizeText(source.creditText, 120) || fallback.creditText,
    creditUrl: sanitizeUrl(source.creditUrl) || fallback.creditUrl,
  };
}

export function sanitizeFooterTerms(payload: unknown): FooterLinksTermsContent {
  const source = isRecord(payload) ? payload : {};
  const fallback = DEFAULT_FOOTER_LINKS.terms;
  const hero = isRecord(source.hero) ? source.hero : {};
  const summary = isRecord(source.summary) ? source.summary : {};
  const reading = isRecord(source.reading) ? source.reading : {};
  const finalCta = isRecord(source.finalCta) ? source.finalCta : {};
  const rawBlocks = arrayPayload(reading.blocks);
  const blocksSource = Array.isArray(reading.blocks)
    ? rawBlocks
    : fallback.reading.blocks as unknown as RawRecord[];

  return {
    hero: {
      eyebrow: sanitizeText(hero.eyebrow, 80) || fallback.hero.eyebrow,
      titleHighlight: sanitizeText(hero.titleHighlight, 90) || fallback.hero.titleHighlight,
      titleRest: sanitizeText(hero.titleRest, 90) || fallback.hero.titleRest,
      description: sanitizeText(hero.description, 260) || fallback.hero.description,
    },
    summary: {
      eyebrow: sanitizeText(summary.eyebrow, 80) || fallback.summary.eyebrow,
      title: sanitizeText(summary.title, 180) || fallback.summary.title,
      description: sanitizeText(summary.description, 260) || fallback.summary.description,
      body: sanitizeText(summary.body, 500) || fallback.summary.body,
      button: sanitizeButton(summary.button, fallback.summary.button),
    },
    reading: {
      eyebrow: sanitizeText(reading.eyebrow, 80) || fallback.reading.eyebrow,
      title: sanitizeText(reading.title, 220) || fallback.reading.title,
      description: sanitizeText(reading.description, 280) || fallback.reading.description,
      blocks: withOrder(
        blocksSource
          .map((block, index) => sanitizeTextBlock(block, index, fallback.reading.blocks[index]))
          .filter((block) => block.title && block.description)
      ),
    },
    finalCta: {
      title: sanitizeText(finalCta.title, 180) || fallback.finalCta.title,
      description: sanitizeText(finalCta.description, 320) || fallback.finalCta.description,
      buttons: sanitizeButtons(finalCta.buttons, fallback.finalCta.buttons, 2),
    },
  };
}

export function sanitizeFooterHelp(payload: unknown): FooterLinksHelpContent {
  const source = isRecord(payload) ? payload : {};
  const fallback = DEFAULT_FOOTER_LINKS.help;
  const hero = isRecord(source.hero) ? source.hero : {};
  const quickAccess = isRecord(source.quickAccess) ? source.quickAccess : {};
  const contactCard = isRecord(source.contactCard) ? source.contactCard : {};
  const faq = isRecord(source.faq) ? source.faq : {};
  const finalSupport = isRecord(source.finalSupport) ? source.finalSupport : {};
  const actionPayload = arrayPayload(quickAccess.actions);
  const faqPayload = arrayPayload(faq.items);

  return {
    hero: {
      eyebrow: sanitizeText(hero.eyebrow, 80) || fallback.hero.eyebrow,
      titleHighlight: sanitizeText(hero.titleHighlight, 90) || fallback.hero.titleHighlight,
      titleRest: sanitizeText(hero.titleRest, 90) || fallback.hero.titleRest,
      description: sanitizeText(hero.description, 260) || fallback.hero.description,
      buttons: sanitizeButtons(hero.buttons, fallback.hero.buttons, 2),
    },
    quickAccess: {
      eyebrow: sanitizeText(quickAccess.eyebrow, 80) || fallback.quickAccess.eyebrow,
      title: sanitizeText(quickAccess.title, 220) || fallback.quickAccess.title,
      description: sanitizeText(quickAccess.description, 280) || fallback.quickAccess.description,
      actions: withOrder(
        fallback.quickAccess.actions.map((item, index) =>
          sanitizeActionCard(actionPayload[index] ?? {}, index, item)
        )
      ),
    },
    contactCard: {
      phone: sanitizeText(contactCard.phone, 80) || fallback.contactCard.phone,
      hours: sanitizeText(contactCard.hours, 180) || fallback.contactCard.hours,
      channelDescriptions: (
        Array.isArray(contactCard.channelDescriptions)
          ? stringArrayPayload(contactCard.channelDescriptions)
          : fallback.contactCard.channelDescriptions
      ).slice(0, 3),
    },
    faq: {
      eyebrow: sanitizeText(faq.eyebrow, 80) || fallback.faq.eyebrow,
      title: sanitizeText(faq.title, 220) || fallback.faq.title,
      description: sanitizeText(faq.description, 280) || fallback.faq.description,
      items: withOrder(
        fallback.faq.items.map((item, index) => sanitizeFaqItem(faqPayload[index] ?? {}, index, item))
      ),
    },
    finalSupport: {
      eyebrow: sanitizeText(finalSupport.eyebrow, 80) || fallback.finalSupport.eyebrow,
      title: sanitizeText(finalSupport.title, 180) || fallback.finalSupport.title,
      description: sanitizeText(finalSupport.description, 260) || fallback.finalSupport.description,
      button: sanitizeButton(finalSupport.button, fallback.finalSupport.button),
    },
  };
}

export function sanitizeFooterPrivacy(payload: unknown): FooterLinksPrivacyContent {
  const source = isRecord(payload) ? payload : {};
  const fallback = DEFAULT_FOOTER_LINKS.privacy;
  const hero = isRecord(source.hero) ? source.hero : {};
  const dataSection = isRecord(source.dataSection) ? source.dataSection : {};
  const finalCta = isRecord(source.finalCta) ? source.finalCta : {};
  const rawBlocks = arrayPayload(dataSection.blocks);
  const blockSource = Array.isArray(dataSection.blocks)
    ? rawBlocks.slice(0, 5)
    : fallback.dataSection.blocks as unknown as RawRecord[];

  return {
    hero: {
      eyebrow: sanitizeText(hero.eyebrow, 80) || fallback.hero.eyebrow,
      titleHighlight: sanitizeText(hero.titleHighlight, 90) || fallback.hero.titleHighlight,
      titleRest: sanitizeText(hero.titleRest, 90) || fallback.hero.titleRest,
      description: sanitizeText(hero.description, 260) || fallback.hero.description,
      button: sanitizeButton(hero.button, fallback.hero.button),
    },
    dataSection: {
      eyebrow: sanitizeText(dataSection.eyebrow, 80) || fallback.dataSection.eyebrow,
      title: sanitizeText(dataSection.title, 220) || fallback.dataSection.title,
      description: sanitizeText(dataSection.description, 280) || fallback.dataSection.description,
      blocks: withOrder(
        blockSource
          .map((block, index) => sanitizeTextBlock(block, index, fallback.dataSection.blocks[index]))
          .filter((block) => block.title && block.description)
          .slice(0, 5)
      ),
    },
    finalCta: {
      title: sanitizeText(finalCta.title, 180) || fallback.finalCta.title,
      description: sanitizeText(finalCta.description, 320) || fallback.finalCta.description,
      buttons: sanitizeButtons(finalCta.buttons, fallback.finalCta.buttons, 2),
    },
  };
}

export function sanitizeFooterLinks(payload: unknown): FooterLinksContent {
  const source = isRecord(payload) ? payload : {};
  return {
    footer: sanitizeFooterGlobal(source.footer),
    terms: sanitizeFooterTerms(source.terms),
    help: sanitizeFooterHelp(source.help),
    privacy: sanitizeFooterPrivacy(source.privacy),
  };
}

export function updateFooterLinksSection(
  current: FooterLinksContent,
  sectionKey: FooterLinkSectionKey,
  payload: RawRecord
): FooterLinksContent {
  validateFooterSectionInput(sectionKey, payload);
  switch (sectionKey) {
    case "footer":
      return sanitizeFooterLinks({ ...current, footer: payload });
    case "terms":
      return sanitizeFooterLinks({ ...current, terms: payload });
    case "help":
      return sanitizeFooterLinks({ ...current, help: payload });
    case "privacy":
      return sanitizeFooterLinks({ ...current, privacy: payload });
  }
}

export function getFooterLinksContent(content: ContentData) {
  return sanitizeFooterLinks(content.footerLinks);
}
