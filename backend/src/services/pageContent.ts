import type {
  AboutPageContent,
  BusinessPageContent,
  CareersPageContent,
  CollectionsPageContent,
  ImprovementsPageContent,
  CareersPageJob,
  ContactPageContent,
  ContentData,
  PageButton,
  PageFaqItem,
  PageMedia,
  QuoteDirectChannel,
  QuoteOtherChannel,
  QuotePageContent,
  LegacyJob,
} from "../types/content.js";
import { generateId } from "../utils/ids.js";
import { sanitizeHexColor, sanitizeText, sanitizeUrl } from "../utils/sanitize.js";
import {
  isKnownLibraryMedia,
  normalizeInternalMediaUrl,
} from "./mediaValidationService.js";

export const PAGE_KEYS = ["about", "business", "contact", "careers", "quote", "collections", "improvements"] as const;
export type CmsPageKey = (typeof PAGE_KEYS)[number];
export type PageSectionKey =
  | "hero"
  | "compliance"
  | "finalCta"
  | "scaleCta"
  | "faq"
  | "mainChannels"
  | "info"
  | "cultureImage"
  | "jobs"
  | "directApplication"
  | "approvalChannel"
  | "unservedOrigin"
  | "directChannels"
  | "otherChannels"
  | "operationGuidance";

const site = {
  services: "/servicos",
  about: "/sobre",
  business: "/para-empresas",
  quote: "/cotacao",
  contact: "/fale-conosco",
  careers: "/trabalhe-conosco",
  collections: "/coletas",
  improvements: "/melhoria-continua",
  help: "/central-ajuda",
} as const;

const external = {
  tracking: "https://rodogarcia.eslcloud.com.br/recipient_tracking",
  whatsappCommercial: "https://wa.me/5511993139536",
  whatsappQuoteFractional: "https://wa.me/5514991053933",
  whatsappQuoteFull: "https://wa.me/5514991053933",
  whatsappQuoteApproval: "https://wa.me/5514991053696",
  commercialEmail: "mailto:gerente.financeiro@rodogarcia.com.br",
  commercialEmailAddress: "gerente.financeiro@rodogarcia.com.br",
  careersEmailWithSubject:
    "mailto:rh@rodogarcia.com.br?subject=Candidatura%20-%20Trabalhe%20Conosco",
  phoneDisplay: "0800 591 4557",
  phoneHref: "tel:08005914557",
} as const;

type RawRecord = Record<string, unknown>;

function isRecord(value: unknown): value is RawRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function arrayPayload(value: unknown): RawRecord[] {
  return Array.isArray(value) ? (value as RawRecord[]) : [];
}

function sortByOrder<T extends { order?: number }>(items: T[]) {
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function withOrder<T extends { order?: number }>(items: T[]) {
  return items.map((item, index) => ({ ...item, order: index + 1 }));
}

function publicAssetUrl(value: unknown) {
  const url = normalizeInternalMediaUrl(value);
  if (!url || !isKnownLibraryMedia(url, "image")) return "";
  return url.startsWith("/public/") ? url.slice("/public".length) || "/" : url;
}

function sanitizeButton(payload: unknown, fallback: PageButton): PageButton {
  const source = isRecord(payload) ? payload : {};
  const url = sanitizeUrl(source.url ?? source.href) || fallback.url;
  return {
    label: sanitizeText(source.label, 40) || fallback.label,
    url,
    external: url.startsWith("http") || url.startsWith("mailto:") || url.startsWith("tel:"),
  };
}

function sanitizeWhatsappUrl(value: unknown, fallback: string) {
  const url = sanitizeUrl(value);
  return /^https:\/\/(?:wa\.me|api\.whatsapp\.com)\//i.test(url) ? url : fallback;
}

function sanitizeButtons(payload: unknown, fallbacks: PageButton[], count = 2) {
  const source = Array.isArray(payload) ? payload : [];
  return Array.from({ length: count }, (_, index) =>
    sanitizeButton(source[index], fallbacks[index] ?? fallbacks[0]!)
  );
}

function sanitizeMedia(payload: unknown, fallback: PageMedia): PageMedia {
  const source = isRecord(payload) ? payload : {};
  return {
    src: publicAssetUrl(source.src ?? source.image ?? source.url) || fallback.src,
    alt: sanitizeText(source.alt, 160) || fallback.alt,
  };
}

function sanitizeFaqItem(payload: RawRecord, index: number, fallback: PageFaqItem): PageFaqItem {
  return {
    id: sanitizeText(payload.id, 80) || fallback.id || `faq-${index + 1}`,
    order: Number(payload.order ?? index + 1),
    question: sanitizeText(payload.question, 180) || fallback.question,
    answer: sanitizeText(payload.answer, 320) || fallback.answer,
  };
}

function sanitizeFixedFaq(payload: unknown, fallbacks: PageFaqItem[]) {
  const items = arrayPayload(isRecord(payload) ? payload.items : undefined);
  return withOrder(
    fallbacks.map((fallback, index) =>
      sanitizeFaqItem(items[index] ?? {}, index, fallback)
    )
  );
}

function sanitizeOperationGuidance(payload: unknown, fallback: { eyebrow: string; title: string; description: string; items: PageFaqItem[] }) {
  const source = isRecord(payload) ? payload : {};
  return {
    eyebrow: sanitizeText(source.eyebrow, 80) || fallback.eyebrow,
    title: sanitizeText(source.title, 120) || fallback.title,
    description: sanitizeText(source.description, 320) || fallback.description,
    items: sanitizeFixedFaq(source, fallback.items),
  };
}

const DEFAULT_ABOUT_PAGE: AboutPageContent = {
  hero: {
    title: "Mais de 35 anos conectando o Brasil",
    description:
      "Desde 1989, transformando a logística com excelência, tecnologia e compromisso com cada entrega.",
    media: { src: "/caminhoneiro1.png", alt: "Operação Rodogarcia em movimento" },
    buttons: [
      { label: "Solicitar cotação", url: site.quote },
      { label: "Conhecer serviços", url: site.services },
    ],
  },
  compliance: {
    image: { src: "/certificados/certificado-sassmaq.png", alt: "Certificado SASSMAQ" },
    title: "Governanca e Compliance",
    description:
      "Certificações, licenças e controles sustentam operações com mais segurança, rastreabilidade e previsibilidade.",
    certificateText: "SASSMAQ, ISO 9001 e licenças operacionais ativas.",
    certificateUrl: "",
    certifications: [
      { title: "ISO 9001", description: "Gestão da qualidade aplicada em cada camada da operação.", image: { src: "/certificados/LOGO ISO 9001.svg", alt: "Certificado ISO 9001" } },
      { title: "SASSMAQ", description: "Segurança, saúde e meio ambiente em processos sensíveis.", image: { src: "/certificados/certificado-sassmaq.webp", alt: "Certificado SASSMAQ" } },
      { title: "EcoVadis", description: "Maturidade em sustentabilidade e responsabilidade corporativa.", image: { src: "/certificados/ecovadis.webp", alt: "Certificação EcoVadis" } },
      { title: "Licença PF", description: "Autorização para operações que exigem controles adicionais.", image: { src: "/certificados/pf.webp", alt: "Licença Polícia Federal" } },
      { title: "Polícia Civil SP", description: "Habilitação estadual alinhada a operações com governança ampliada.", image: { src: "/certificados/pc-sp.webp", alt: "Licença Polícia Civil de São Paulo" } },
      { title: "Exército Brasileiro", description: "Autorização conectada a rotinas com requisitos extras de controle.", image: { src: "/certificados/exercito-br.webp", alt: "Certificado Exército Brasileiro" } },
      { title: "IBAMA", description: "Conformidade e controle rigoroso em operações com impacto e regulamentação ambiental.", image: { src: "/certificados/ibama.webp", alt: "Certificado IBAMA" } },
    ],
  },
  finalCta: {
    title: "Estruture sua operação com a Rodogarcia.",
    description: "Mais previsibilidade. Sem surpresas na sua malha logística.",
    buttons: [
      { label: "Solicitar cotação agora", url: site.quote },
      { label: "Falar com atendimento", url: site.contact },
    ],
  },
};

const DEFAULT_BUSINESS_PAGE: BusinessPageContent = {
  scaleCta: {
    buttons: [
      { label: "Solicitar cotação", url: site.quote },
      { label: "Falar com especialista", url: site.contact },
    ],
  },
  faq: {
    title: "Perguntas Frequentes",
    items: [
      {
        id: "business-faq-1",
        order: 1,
        question: "Quais tipos de carga a Rodogarcia transporta?",
        answer:
          "Trabalhamos com operações B2B de escala, carga fracionada corporativa, lotação e projetos especiais com alta exigência de SLA e compliance.",
      },
      {
        id: "business-faq-2",
        order: 2,
        question: "Como funciona a visibilidade da operação?",
        answer:
          "O acompanhamento combina indicadores, SLA e rastreabilidade para dar mais controle ao time responsável pela operação.",
      },
      {
        id: "business-faq-3",
        order: 3,
        question: "A Rodogarcia atende todo o Brasil?",
        answer:
          "Sim. A malha logística e os parceiros homologados ampliam cobertura, prazo e capilaridade em diferentes regiões.",
      },
      {
        id: "business-faq-4",
        order: 4,
        question: "Como funciona a fase de implantação?",
        answer:
          "O escopo é acompanhado de perto nos primeiros envios, com ajustes em ciclos curtos para evitar gargalos.",
      },
    ],
  },
};

const DEFAULT_CONTACT_PAGE: ContactPageContent = {
  heroWhatsappButton: {
    label: "Abrir WhatsApp",
    url: external.whatsappCommercial,
    external: true,
  },
  mainChannels: [
    {
      id: "phone",
      order: 1,
      title: "Telefone",
      description: "Canal direto para orientação inicial e alinhamento rápido.",
      button: { label: "Ligar agora", url: external.phoneHref, external: true },
    },
    {
      id: "email",
      order: 2,
      title: "E-mail comercial",
      description: "Ideal para mensagens formais, anexos e alinhamentos com contexto.",
      button: { label: "Enviar e-mail", url: external.commercialEmail, external: true },
    },
    {
      id: "whatsapp",
      order: 3,
      title: "WhatsApp comercial",
      description: "Canal mais rápido para abrir conversa e pedir direcionamento.",
      button: { label: "Abrir WhatsApp", url: external.whatsappCommercial, external: true },
    },
  ],
  info: {
    items: [
      {
        id: "phone",
        order: 1,
        label: "Telefone",
        title: external.phoneDisplay,
        description: "segunda a sexta, das 8h as 18h",
      },
      {
        id: "email",
        order: 2,
        label: "E-mail",
        title: external.commercialEmailAddress,
        description: "conforme ordem de atendimento",
      },
      {
        id: "whatsapp",
        order: 3,
        label: "WhatsApp",
        title: "atendimento Rodogarcia",
        description: external.whatsappCommercial,
      },
      {
        id: "address",
        order: 4,
        label: "Endereço",
        title: "Rua Pedro Carmine Deo, 156, Agudos - SP",
        description: "CEP 17123-210 - Brasil",
      },
    ],
    companyTitle: "Rodogarcia Transportes",
    address: "Rua Pedro Carmine Deo, 156, Agudos - SP, CEP 17123-210",
    hours: "segunda a sexta, das 8h as 18h",
    channelGuideTitle: "Qual canal usar?",
    channelGuideDescription: "Use WhatsApp para cotações e e-mail para briefings com anexos.",
    documentsDescription: "O e-mail continua sendo o melhor canal para briefing, documentos e materiais.",
    quickSupportDescription: "Telefone para orientação inicial e direcionamento do atendimento.",
    indicators: [
      {
        id: "commercial-return",
        order: 1,
        value: "< 2h",
        description: "retorno comercial em dias úteis",
      },
      {
        id: "whatsapp-return",
        order: 2,
        value: "Imediato",
        description: "WhatsApp para primeiro contato",
      },
    ],
  },
  finalCta: {
    buttons: [
      { label: "Solicitar cotação", url: site.quote },
      { label: "Central de ajuda", url: site.help },
    ],
  },
};

const DEFAULT_CAREERS_JOBS: CareersPageJob[] = [
  {
    id: "career-job-1",
    order: 1,
    title: "Motorista Categoria C/D/E",
    location: "Agudos/SP",
    type: "Integral",
    description:
      "Experiência mínima de 2 anos em transporte de cargas e foco em segurança operacional.",
    applyUrl: `${site.careers}#candidatura`,
    active: true,
  },
  {
    id: "career-job-2",
    order: 2,
    title: "Analista de Logística",
    location: "Campinas/SP",
    type: "Integral",
    description: "Gestão de rotas, leitura de indicadores e melhoria de processo logístico.",
    applyUrl: `${site.careers}#candidatura`,
    active: true,
  },
  {
    id: "career-job-3",
    order: 3,
    title: "Assistente Administrativo",
    location: "Osasco/SP",
    type: "Integral",
    description: "Apoio a rotinas administrativas, documentação e interface com a operação.",
    applyUrl: `${site.careers}#candidatura`,
    active: true,
  },
];

const DEFAULT_CAREERS_PAGE: CareersPageContent = {
  hero: {
    buttons: [
      { label: "Ver vagas abertas", url: "#vagas" },
      { label: "Enviar currículo", url: "#candidatura" },
    ],
  },
  cultureImage: {
    src: "/caminhoneiro1.png",
    alt: "Time Rodogarcia em operação",
  },
  jobs: DEFAULT_CAREERS_JOBS,
  directApplication: {
    buttons: [
      {
        label: "Enviar currículo por e-mail",
        url: external.careersEmailWithSubject,
        external: true,
      },
      { label: "Abrir contato", url: site.contact },
    ],
  },
  finalCta: {
    buttons: [
      {
        label: "Enviar currículo",
        url: external.careersEmailWithSubject,
        external: true,
      },
      { label: "Falar com contato", url: site.contact },
    ],
  },
};

const DEFAULT_QUOTE_PAGE: QuotePageContent = {
  hero: {
    buttons: [
      { label: "Solicitar cotação", url: "#formulario-cotacao" },
      { label: "Solicitar coleta", url: site.collections },
    ],
  },
  operationGuidance: {
    eyebrow: "Antes do atendimento",
    title: "Quer alinhar a operação antes?",
    description: "Veja qual caminho faz mais sentido para a sua carga antes de acionar o atendimento institucional.",
    items: [
      { id: "quote-guidance-cargo", order: 1, question: "Qual tipo de carga devo selecionar?", answer: "Use carga fracionada quando os volumes seguirem junto de outras cargas e você quiser calcular a proposta nesta página. Escolha carga fechada para uma operação com veículo dedicado." },
      { id: "quote-guidance-details", order: 2, question: "Quais informações agilizam o atendimento?", answer: "Tenha em mãos origem, destino, o CNPJ do cliente, peso, volume, valor da nota e quantidade de volumes. A cotação do site usa a tabela PADRÃO." },
      { id: "quote-guidance-support", order: 3, question: "Quando devo falar com o time institucional?", answer: "Use os canais abaixo para orientações, necessidades especiais ou para alinhar uma operação antes de enviar a solicitação. O formulário continua sendo o caminho principal para calcular ou preparar a cotação." },
    ],
  },
  approvalChannel: {
    whatsappUrl: external.whatsappQuoteApproval,
  },
  unservedOrigin: {
    title: "Ainda não atendemos esta origem",
    description:
      "A cidade de origem informada ainda não faz parte da nossa área de atendimento. Fale com nosso comercial para avaliar a sua operação.",
    button: {
      label: "Falar com o comercial",
      url: external.whatsappCommercial,
      external: true,
    },
  },
  directChannels: [
    {
      id: "fractional",
      order: 1,
      title: "Distribuição e volumes menores",
      description:
        "Canal ideal para distribuição e volumes com maior frequência de embarque.",
      button: {
        label: "Abrir WhatsApp - Fracionado",
        url: external.whatsappQuoteFractional,
        external: true,
      },
    },
    {
      id: "full-load",
      order: 2,
      title: "Lotação e operações especiais",
      description:
        "Melhor opção para lotação, projetos de maior volume e requisitos técnicos específicos.",
      button: {
        label: "Abrir WhatsApp - Lotação",
        url: external.whatsappQuoteFull,
        external: true,
      },
    },
  ],
  otherChannels: [
    {
      id: "quote-channel-whatsapp",
      order: 1,
      icon: "WhatsappLogo",
      iconColor: "#22c55e",
      title: "WhatsApp comercial",
      description: "Canal mais rápido para abrir conversa e pedir cotação.",
      button: { label: "Abrir WhatsApp", url: external.whatsappCommercial, external: true },
      buttonColor: "#22c55e",
      active: true,
    },
    {
      id: "quote-channel-phone",
      order: 2,
      icon: "PhoneCall",
      iconColor: "#0ea5e9",
      title: "Telefone",
      description: `Ligue para ${external.phoneDisplay} e fale direto com o atendimento.`,
      button: { label: "Ligar agora", url: external.phoneHref, external: true },
      buttonColor: "#0f172a",
      active: true,
    },
    {
      id: "quote-channel-email",
      order: 3,
      icon: "EnvelopeSimple",
      iconColor: "#1d4ed8",
      title: "E-mail comercial",
      description: "Ideal para mensagens formais, briefings e envio de documentos.",
      button: { label: "Enviar e-mail", url: external.commercialEmail, external: true },
      buttonColor: "#0f172a",
      active: true,
    },
    {
      id: "quote-channel-form",
      order: 4,
      icon: "ClipboardText",
      iconColor: "#64748b",
      title: "Formulario completo",
      description: "Prefere detalhar a carga por escrito? Use o fluxo estruturado.",
      button: { label: "Abrir formulario", url: site.contact },
      buttonColor: "#0f172a",
      active: true,
    },
  ],
};

const DEFAULT_COLLECTIONS_PAGE: CollectionsPageContent = {
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

const DEFAULT_IMPROVEMENTS_PAGE: ImprovementsPageContent = {
  operationGuidance: {
    eyebrow: "Para aproveitar melhor",
    title: "Dicas para enviar uma boa sugestão",
    description: "Quanto mais contexto você compartilhar, mais fácil será avaliar o próximo passo.",
    items: [
      { id: "improvements-guidance-context", order: 1, question: "O que vale a pena explicar?", answer: "Conte o que acontece hoje, em que momento isso dificulta sua rotina ou experiência no site e qual resultado você espera alcançar." },
      { id: "improvements-guidance-files", order: 2, question: "Posso enviar um arquivo ou uma imagem?", answer: "Sim. Você pode anexar fotos, planilhas CSV, XLS ou XLSX que ajudem a entender o caso. Os arquivos ficam disponíveis apenas para a equipe responsável." },
      { id: "improvements-guidance-return", order: 3, question: "Quando receberei um retorno?", answer: "Cada sugestão é analisada pela equipe responsável. O envio não gera atendimento imediato, mas ajuda a priorizar melhorias reais para o site e para a operação." },
    ],
  },
};

export function pageContentKey(pageKey: CmsPageKey) {
  return `${pageKey === "business" ? "business" : pageKey}Page` as
    | "aboutPage"
    | "businessPage"
    | "contactPage"
    | "careersPage"
    | "quotePage"
    | "collectionsPage"
    | "improvementsPage";
}

export function parsePageKey(value: string | undefined): CmsPageKey | null {
  return PAGE_KEYS.includes(value as CmsPageKey) ? (value as CmsPageKey) : null;
}

export function sanitizeAboutPage(payload: unknown): AboutPageContent {
  const source = isRecord(payload) ? payload : {};
  const hero = isRecord(source.hero) ? source.hero : {};
  const compliance = isRecord(source.compliance) ? source.compliance : {};
  const finalCta = isRecord(source.finalCta) ? source.finalCta : {};
  const certificationFallback = {
    title: sanitizeText(compliance.certificateText, 180) || DEFAULT_ABOUT_PAGE.compliance.certificateText,
    description: sanitizeText(compliance.description, 320) || DEFAULT_ABOUT_PAGE.compliance.description,
    image: sanitizeMedia(compliance.image, DEFAULT_ABOUT_PAGE.compliance.image),
    certificateUrl: sanitizeUrl(compliance.certificateUrl),
  };
  const certificationItems = arrayPayload(compliance.certifications);
  const certifications = certificationItems.length
    ? certificationItems.slice(0, 12).map((item, index) => {
        const fallback = DEFAULT_ABOUT_PAGE.compliance.certifications[index] ?? certificationFallback;
        return {
          title: sanitizeText(item.title, 180) || fallback.title,
          description: sanitizeText(item.description, 320) || fallback.description,
          image: sanitizeMedia(item.image, fallback.image),
          certificateUrl: sanitizeUrl(item.certificateUrl),
        };
      })
    : DEFAULT_ABOUT_PAGE.compliance.certifications;
  return {
    hero: {
      title: sanitizeText(hero.title, 320) || DEFAULT_ABOUT_PAGE.hero.title,
      description: sanitizeText(hero.description, 220) || DEFAULT_ABOUT_PAGE.hero.description,
      media: sanitizeMedia(hero.media, DEFAULT_ABOUT_PAGE.hero.media),
      buttons: sanitizeButtons(hero.buttons, DEFAULT_ABOUT_PAGE.hero.buttons),
    },
    compliance: {
      image: sanitizeMedia(compliance.image, DEFAULT_ABOUT_PAGE.compliance.image),
      title: sanitizeText(compliance.title, 220) || DEFAULT_ABOUT_PAGE.compliance.title,
      description:
        sanitizeText(compliance.description, 320) || DEFAULT_ABOUT_PAGE.compliance.description,
      certificateText:
        sanitizeText(compliance.certificateText, 180) ||
        DEFAULT_ABOUT_PAGE.compliance.certificateText,
      certificateUrl: sanitizeUrl(compliance.certificateUrl),
      certifications,
    },
    finalCta: {
      title: sanitizeText(finalCta.title, 320) || DEFAULT_ABOUT_PAGE.finalCta.title,
      description:
        sanitizeText(finalCta.description, 220) || DEFAULT_ABOUT_PAGE.finalCta.description,
      buttons: sanitizeButtons(finalCta.buttons, DEFAULT_ABOUT_PAGE.finalCta.buttons),
    },
  };
}

export function sanitizeBusinessPage(payload: unknown): BusinessPageContent {
  const source = isRecord(payload) ? payload : {};
  const scaleCta = isRecord(source.scaleCta) ? source.scaleCta : {};
  const faq = isRecord(source.faq) ? source.faq : {};
  return {
    scaleCta: {
      buttons: sanitizeButtons(scaleCta.buttons, DEFAULT_BUSINESS_PAGE.scaleCta.buttons),
    },
    faq: {
      title: sanitizeText(faq.title, 120) || DEFAULT_BUSINESS_PAGE.faq.title,
      items: sanitizeFixedFaq(faq, DEFAULT_BUSINESS_PAGE.faq.items),
    },
  };
}

function sanitizeContactChannel(payload: RawRecord, index: number): ContactPageContent["mainChannels"][number] {
  const fallback = DEFAULT_CONTACT_PAGE.mainChannels[index] ?? DEFAULT_CONTACT_PAGE.mainChannels[0]!;
  return {
    id: sanitizeText(payload.id, 80) || fallback.id,
    order: Number(payload.order ?? index + 1),
    title: fallback.title,
    description: sanitizeText(payload.description, 220) || fallback.description,
    button: sanitizeButton(payload.button, fallback.button),
  };
}

function sanitizeContactInfoItem(payload: RawRecord, index: number): ContactPageContent["info"]["items"][number] {
  const fallback = DEFAULT_CONTACT_PAGE.info.items[index] ?? DEFAULT_CONTACT_PAGE.info.items[0]!;
  return {
    id: sanitizeText(payload.id, 80) || fallback.id,
    order: Number(payload.order ?? index + 1),
    label: fallback.label,
    title: sanitizeText(payload.title, 90) || fallback.title,
    description: sanitizeText(payload.description, 220) || fallback.description,
  };
}

export function sanitizeContactPage(payload: unknown): ContactPageContent {
  const source = isRecord(payload) ? payload : {};
  const info = isRecord(source.info) ? source.info : {};
  const indicatorPayload = arrayPayload(info.indicators);
  return {
    heroWhatsappButton: sanitizeButton(
      source.heroWhatsappButton,
      DEFAULT_CONTACT_PAGE.heroWhatsappButton
    ),
    mainChannels: withOrder(
      DEFAULT_CONTACT_PAGE.mainChannels.map((_, index) =>
        sanitizeContactChannel(arrayPayload(source.mainChannels)[index] ?? {}, index)
      )
    ),
    info: {
      items: withOrder(
        DEFAULT_CONTACT_PAGE.info.items.map((_, index) =>
          sanitizeContactInfoItem(arrayPayload(info.items)[index] ?? {}, index)
        )
      ),
      companyTitle:
        sanitizeText(info.companyTitle, 90) || DEFAULT_CONTACT_PAGE.info.companyTitle,
      address: sanitizeText(info.address, 220) || DEFAULT_CONTACT_PAGE.info.address,
      hours: sanitizeText(info.hours, 160) || DEFAULT_CONTACT_PAGE.info.hours,
      channelGuideTitle:
        sanitizeText(info.channelGuideTitle, 90) ||
        DEFAULT_CONTACT_PAGE.info.channelGuideTitle,
      channelGuideDescription:
        sanitizeText(info.channelGuideDescription, 220) ||
        DEFAULT_CONTACT_PAGE.info.channelGuideDescription,
      documentsDescription:
        sanitizeText(info.documentsDescription, 220) ||
        DEFAULT_CONTACT_PAGE.info.documentsDescription,
      quickSupportDescription:
        sanitizeText(info.quickSupportDescription, 220) ||
        DEFAULT_CONTACT_PAGE.info.quickSupportDescription,
      indicators: withOrder(
        DEFAULT_CONTACT_PAGE.info.indicators.map((fallback, index) => {
          const item = indicatorPayload[index] ?? {};
          return {
            id: sanitizeText(item.id, 80) || fallback.id,
            order: Number(item.order ?? index + 1),
            value: sanitizeText(item.value, 40) || fallback.value,
            description: sanitizeText(item.description, 140) || fallback.description,
          };
        })
      ),
    },
    finalCta: {
      buttons: sanitizeButtons(
        isRecord(source.finalCta) ? source.finalCta.buttons : undefined,
        DEFAULT_CONTACT_PAGE.finalCta.buttons
      ),
    },
  };
}

function jobFromLegacy(job: LegacyJob, index: number): CareersPageJob {
  return {
    id: sanitizeText(job.id, 80) || `career-job-${index + 1}`,
    order: Number(job.order ?? index + 1),
    title: sanitizeText(job.title ?? job.titulo, 90),
    location: sanitizeText(job.location ?? job.local, 90),
    type: sanitizeText(job.contractType ?? job.tipo, 40),
    description: sanitizeText(job.description ?? job.descricao, 220),
    applyUrl: sanitizeUrl(job.applyUrl) || `${site.careers}#candidatura`,
    active: job.active !== false && job.ativo !== false,
  };
}

function sanitizeCareersJob(payload: RawRecord, index: number): CareersPageJob {
  return {
    id: sanitizeText(payload.id, 80) || generateId("career_job"),
    order: Number(payload.order ?? index + 1),
    title: sanitizeText(payload.title, 90),
    location: sanitizeText(payload.location, 90),
    type: sanitizeText(payload.type ?? payload.contractType, 40),
    description: sanitizeText(payload.description, 220),
    applyUrl: sanitizeUrl(payload.applyUrl),
    active: typeof payload.active === "boolean" ? payload.active : true,
    createdAt: sanitizeText(payload.createdAt, 40),
    updatedAt: sanitizeText(payload.updatedAt, 40),
  };
}

export function sanitizeCareersPage(payload: unknown, legacyJobs: LegacyJob[] = []): CareersPageContent {
  const hasPayload = isRecord(payload);
  const source = hasPayload ? payload : {};
  const hero = isRecord(source.hero) ? source.hero : {};
  const directApplication = isRecord(source.directApplication) ? source.directApplication : {};
  const finalCta = isRecord(source.finalCta) ? source.finalCta : {};
  const migratedJobs = sortByOrder(legacyJobs)
    .map(jobFromLegacy)
    .filter((job) => job.title && job.location && job.type && job.description && job.applyUrl);
  const jobFallbacks = migratedJobs.length > 0 ? migratedJobs : DEFAULT_CAREERS_JOBS;
  const sourceJobs = hasPayload ? arrayPayload(source.jobs) : jobFallbacks;
  return {
    hero: {
      buttons: sanitizeButtons(hero.buttons, DEFAULT_CAREERS_PAGE.hero.buttons),
    },
    cultureImage: sanitizeMedia(source.cultureImage, DEFAULT_CAREERS_PAGE.cultureImage),
    jobs: withOrder(
      sourceJobs
        .map((job, index) => sanitizeCareersJob(job as RawRecord, index))
        .filter((job) => job.title && job.location && job.type && job.description && job.applyUrl)
    ),
    directApplication: {
      buttons: sanitizeButtons(
        directApplication.buttons,
        DEFAULT_CAREERS_PAGE.directApplication.buttons
      ),
    },
    finalCta: {
      buttons: sanitizeButtons(finalCta.buttons, DEFAULT_CAREERS_PAGE.finalCta.buttons),
    },
  };
}

function sanitizeDirectChannel(payload: RawRecord, index: number): QuoteDirectChannel {
  const fallback = DEFAULT_QUOTE_PAGE.directChannels[index] ?? DEFAULT_QUOTE_PAGE.directChannels[0]!;
  return {
    id: sanitizeText(payload.id, 80) || fallback.id,
    order: Number(payload.order ?? index + 1),
    title: sanitizeText(payload.title, 220) || fallback.title,
    description: sanitizeText(payload.description, 220) || fallback.description,
    button: sanitizeButton(payload.button, fallback.button),
  };
}

export const QUOTE_ICON_OPTIONS = [
  "WhatsappLogo",
  "PhoneCall",
  "EnvelopeSimple",
  "ClipboardText",
  "ChatCircleDots",
  "Headset",
  "MapPinLine",
  "Truck",
] as const;

function sanitizeQuoteIcon(value: unknown) {
  const icon = sanitizeText(value, 40);
  return QUOTE_ICON_OPTIONS.includes(icon as (typeof QUOTE_ICON_OPTIONS)[number])
    ? icon
    : "ChatCircleDots";
}

function sanitizeOtherChannel(payload: RawRecord, index: number): QuoteOtherChannel {
  const fallback = DEFAULT_QUOTE_PAGE.otherChannels[index] ?? DEFAULT_QUOTE_PAGE.otherChannels[0]!;
  const nowIso = new Date().toISOString();
  return {
    id: sanitizeText(payload.id, 80) || generateId("quote_channel"),
    order: Number(payload.order ?? index + 1),
    icon: sanitizeQuoteIcon(payload.icon ?? fallback.icon),
    iconColor: sanitizeHexColor(payload.iconColor) || fallback.iconColor,
    title: sanitizeText(payload.title, 90) || fallback.title,
    description: sanitizeText(payload.description, 220) || fallback.description,
    button: sanitizeButton(payload.button, fallback.button),
    buttonColor: sanitizeHexColor(payload.buttonColor) || fallback.buttonColor,
    active: typeof payload.active === "boolean" ? payload.active : true,
    createdAt: sanitizeText(payload.createdAt, 40) || nowIso,
    updatedAt: sanitizeText(payload.updatedAt, 40) || nowIso,
  };
}

function legacyText(
  source: Record<string, unknown> | undefined,
  key: string,
  fallback = ""
) {
  return sanitizeText(source?.[key], 320) || fallback;
}

function phoneHrefFromDisplay(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return external.phoneHref;
  return digits.startsWith("55") ? `tel:+${digits}` : `tel:+55${digits}`;
}

function mailtoFromAddress(value: string) {
  const email = sanitizeText(value, 120);
  return email.includes("@") ? `mailto:${email}` : external.commercialEmail;
}

function legacyMediaSlot(
  source: Record<string, unknown> | undefined,
  key: string,
  fallback = ""
) {
  return publicAssetUrl(source?.[key]) || fallback;
}

function aboutPageFromLegacy(
  siteTexts?: Record<string, unknown>,
  mediaSlots?: Record<string, unknown>
) {
  return sanitizeAboutPage({
    ...DEFAULT_ABOUT_PAGE,
    hero: {
      ...DEFAULT_ABOUT_PAGE.hero,
      title: legacyText(siteTexts, "aboutHeroTitle", DEFAULT_ABOUT_PAGE.hero.title),
      description: legacyText(
        siteTexts,
        "aboutHeroSubtitle",
        DEFAULT_ABOUT_PAGE.hero.description
      ),
      media: {
        src: legacyMediaSlot(
          mediaSlots,
          "about.hero",
          legacyText(siteTexts, "aboutHeroImage", DEFAULT_ABOUT_PAGE.hero.media.src)
        ),
        alt: DEFAULT_ABOUT_PAGE.hero.media.alt,
      },
    },
  });
}

function contactPageFromLegacy(siteTexts?: Record<string, unknown>) {
  const phoneNumber = legacyText(siteTexts, "contactPhoneNumber", external.phoneDisplay);
  const phoneHours = legacyText(
    siteTexts,
    "contactPhoneHours",
    DEFAULT_CONTACT_PAGE.info.items[0]?.description
  );
  const emailAddress = legacyText(
    siteTexts,
    "contactEmailAddress",
    external.commercialEmailAddress
  );
  const emailResponse = legacyText(
    siteTexts,
    "contactEmailResponse",
    DEFAULT_CONTACT_PAGE.info.items[1]?.description
  );
  const whatsappUrl = sanitizeUrl(siteTexts?.contactWhatsappUrl) || external.whatsappCommercial;
  const whatsappLabel = legacyText(
    siteTexts,
    "contactWhatsappLabel",
    DEFAULT_CONTACT_PAGE.info.items[2]?.title
  );
  const addressLine = legacyText(
    siteTexts,
    "contactAddressLine",
    "Rua Pedro Carmine Deo, 156, Agudos - SP"
  );
  const addressZip = legacyText(siteTexts, "contactAddressZip", "17123-210");
  const addressCountry = legacyText(siteTexts, "contactAddressCountry", "Brasil");
  const contactCtaLabel = legacyText(
    siteTexts,
    "contactCtaLabel",
    DEFAULT_CONTACT_PAGE.finalCta.buttons[0]?.label
  );
  const contactCtaUrl =
    sanitizeUrl(siteTexts?.contactCtaUrl) || DEFAULT_CONTACT_PAGE.finalCta.buttons[0]?.url;

  return sanitizeContactPage({
    ...DEFAULT_CONTACT_PAGE,
    heroWhatsappButton: {
      ...DEFAULT_CONTACT_PAGE.heroWhatsappButton,
      url: whatsappUrl,
    },
    mainChannels: [
      {
        ...DEFAULT_CONTACT_PAGE.mainChannels[0],
        button: {
          ...DEFAULT_CONTACT_PAGE.mainChannels[0]?.button,
          url: phoneHrefFromDisplay(phoneNumber),
        },
      },
      {
        ...DEFAULT_CONTACT_PAGE.mainChannels[1],
        button: {
          ...DEFAULT_CONTACT_PAGE.mainChannels[1]?.button,
          url: mailtoFromAddress(emailAddress),
        },
      },
      {
        ...DEFAULT_CONTACT_PAGE.mainChannels[2],
        button: {
          ...DEFAULT_CONTACT_PAGE.mainChannels[2]?.button,
          url: whatsappUrl,
        },
      },
    ],
    info: {
      ...DEFAULT_CONTACT_PAGE.info,
      items: [
        {
          ...DEFAULT_CONTACT_PAGE.info.items[0],
          title: phoneNumber,
          description: phoneHours,
        },
        {
          ...DEFAULT_CONTACT_PAGE.info.items[1],
          title: emailAddress,
          description: emailResponse,
        },
        {
          ...DEFAULT_CONTACT_PAGE.info.items[2],
          title: whatsappLabel,
          description: whatsappUrl,
        },
        {
          ...DEFAULT_CONTACT_PAGE.info.items[3],
          title: addressLine,
          description: `CEP ${addressZip} - ${addressCountry}`,
        },
      ],
      address: `${addressLine}, CEP ${addressZip} - ${addressCountry}`,
      hours: phoneHours,
    },
    finalCta: {
      buttons: [
        { label: contactCtaLabel, url: contactCtaUrl },
        DEFAULT_CONTACT_PAGE.finalCta.buttons[1],
      ],
    },
  });
}

function careersPageFromLegacy(
  content: ContentData,
  mediaSlots?: Record<string, unknown>
) {
  return sanitizeCareersPage(
    {
      ...DEFAULT_CAREERS_PAGE,
      cultureImage: {
        src: legacyMediaSlot(
          mediaSlots,
          "careers.culture",
          DEFAULT_CAREERS_PAGE.cultureImage.src
        ),
        alt: DEFAULT_CAREERS_PAGE.cultureImage.alt,
      },
    },
    content.vagas
  );
}

export function migratePageContent(
  content: ContentData,
  legacy: {
    siteTexts?: Record<string, unknown>;
    mediaSlots?: Record<string, unknown>;
  } = {}
): ContentData {
  return {
    ...content,
    aboutPage: content.aboutPage
      ? sanitizeAboutPage(content.aboutPage)
      : aboutPageFromLegacy(legacy.siteTexts, legacy.mediaSlots),
    businessPage: sanitizeBusinessPage(content.businessPage),
    contactPage: content.contactPage
      ? sanitizeContactPage(content.contactPage)
      : contactPageFromLegacy(legacy.siteTexts),
    careersPage: content.careersPage
      ? sanitizeCareersPage(content.careersPage)
      : careersPageFromLegacy(content, legacy.mediaSlots),
    quotePage: sanitizeQuotePage(content.quotePage),
    collectionsPage: sanitizeCollectionsPage(content.collectionsPage),
    improvementsPage: sanitizeImprovementsPage(content.improvementsPage),
  };
}

export function sanitizeQuotePage(payload: unknown): QuotePageContent {
  const source = isRecord(payload) ? payload : {};
  const hero = isRecord(source.hero) ? source.hero : {};
  const approvalChannel = isRecord(source.approvalChannel) ? source.approvalChannel : {};
  const unservedOrigin = isRecord(source.unservedOrigin) ? source.unservedOrigin : {};
  const hasOtherChannels = Array.isArray(source.otherChannels);
  const otherChannels = arrayPayload(source.otherChannels);
  return {
    hero: {
      buttons: sanitizeButtons(hero.buttons, DEFAULT_QUOTE_PAGE.hero.buttons),
    },
    operationGuidance: sanitizeOperationGuidance(source.operationGuidance, DEFAULT_QUOTE_PAGE.operationGuidance),
    approvalChannel: {
      whatsappUrl: sanitizeWhatsappUrl(
        approvalChannel.whatsappUrl,
        DEFAULT_QUOTE_PAGE.approvalChannel.whatsappUrl
      ),
    },
    unservedOrigin: {
      title: sanitizeText(unservedOrigin.title, 120) || DEFAULT_QUOTE_PAGE.unservedOrigin.title,
      description:
        sanitizeText(unservedOrigin.description, 320) || DEFAULT_QUOTE_PAGE.unservedOrigin.description,
      button: sanitizeButton(unservedOrigin.button, DEFAULT_QUOTE_PAGE.unservedOrigin.button),
    },
    directChannels: withOrder(
      DEFAULT_QUOTE_PAGE.directChannels.map((_, index) =>
        sanitizeDirectChannel(arrayPayload(source.directChannels)[index] ?? {}, index)
      )
    ),
    otherChannels: withOrder(
      (hasOtherChannels ? otherChannels : DEFAULT_QUOTE_PAGE.otherChannels).map(
        (channel, index) => sanitizeOtherChannel(channel as RawRecord, index)
      )
    ),
  };
}

export function sanitizeCollectionsPage(payload: unknown): CollectionsPageContent {
  const source = isRecord(payload) ? payload : {};
  const hero = isRecord(source.hero) ? source.hero : {};
  return {
    hero: {
      buttons: sanitizeButtons(hero.buttons, DEFAULT_COLLECTIONS_PAGE.hero.buttons),
    },
    operationGuidance: sanitizeOperationGuidance(source.operationGuidance, DEFAULT_COLLECTIONS_PAGE.operationGuidance),
  };
}

export function sanitizeImprovementsPage(payload: unknown): ImprovementsPageContent {
  const source = isRecord(payload) ? payload : {};
  return { operationGuidance: sanitizeOperationGuidance(source.operationGuidance, DEFAULT_IMPROVEMENTS_PAGE.operationGuidance) };
}

export function getPageContent(content: ContentData, pageKey: CmsPageKey) {
  switch (pageKey) {
    case "about":
      return sanitizeAboutPage(content.aboutPage);
    case "business":
      return sanitizeBusinessPage(content.businessPage);
    case "contact":
      return sanitizeContactPage(content.contactPage);
    case "careers":
      return sanitizeCareersPage(content.careersPage, content.vagas);
    case "quote":
      return sanitizeQuotePage(content.quotePage);
    case "collections":
      return sanitizeCollectionsPage(content.collectionsPage);
    case "improvements":
      return sanitizeImprovementsPage(content.improvementsPage);
  }
}

export function getAllPageContent(content: ContentData) {
  return {
    aboutPage: sanitizeAboutPage(content.aboutPage),
    businessPage: sanitizeBusinessPage(content.businessPage),
    contactPage: sanitizeContactPage(content.contactPage),
    careersPage: sanitizeCareersPage(content.careersPage, content.vagas),
    quotePage: sanitizeQuotePage(content.quotePage),
    collectionsPage: sanitizeCollectionsPage(content.collectionsPage),
    improvementsPage: sanitizeImprovementsPage(content.improvementsPage),
  };
}

export function updatePageSection(
  current: ReturnType<typeof getPageContent>,
  pageKey: CmsPageKey,
  sectionKey: PageSectionKey,
  payload: RawRecord
) {
  switch (pageKey) {
    case "about": {
      const page = current as AboutPageContent;
      if (sectionKey === "hero") return sanitizeAboutPage({ ...page, hero: payload });
      if (sectionKey === "compliance") return sanitizeAboutPage({ ...page, compliance: payload });
      if (sectionKey === "finalCta") return sanitizeAboutPage({ ...page, finalCta: payload });
      break;
    }
    case "business": {
      const page = current as BusinessPageContent;
      if (sectionKey === "scaleCta") return sanitizeBusinessPage({ ...page, scaleCta: payload });
      if (sectionKey === "faq") return sanitizeBusinessPage({ ...page, faq: payload });
      break;
    }
    case "contact": {
      const page = current as ContactPageContent;
      if (sectionKey === "hero") {
        return sanitizeContactPage({ ...page, heroWhatsappButton: payload.heroWhatsappButton ?? payload });
      }
      if (sectionKey === "mainChannels") {
        return sanitizeContactPage({ ...page, mainChannels: payload.mainChannels });
      }
      if (sectionKey === "info") return sanitizeContactPage({ ...page, info: payload });
      if (sectionKey === "finalCta") return sanitizeContactPage({ ...page, finalCta: payload });
      break;
    }
    case "careers": {
      const page = current as CareersPageContent;
      if (sectionKey === "hero") return sanitizeCareersPage({ ...page, hero: payload });
      if (sectionKey === "cultureImage") {
        return sanitizeCareersPage({ ...page, cultureImage: payload });
      }
      if (sectionKey === "jobs") return sanitizeCareersPage({ ...page, jobs: payload.jobs });
      if (sectionKey === "directApplication") {
        return sanitizeCareersPage({ ...page, directApplication: payload });
      }
      if (sectionKey === "finalCta") return sanitizeCareersPage({ ...page, finalCta: payload });
      break;
    }
    case "quote": {
      const page = current as QuotePageContent;
      if (sectionKey === "hero") return sanitizeQuotePage({ ...page, hero: payload });
      if (sectionKey === "approvalChannel") {
        return sanitizeQuotePage({ ...page, approvalChannel: payload });
      }
      if (sectionKey === "unservedOrigin") {
        return sanitizeQuotePage({ ...page, unservedOrigin: payload });
      }
      if (sectionKey === "operationGuidance") {
        return sanitizeQuotePage({ ...page, operationGuidance: payload });
      }
      if (sectionKey === "directChannels") {
        return sanitizeQuotePage({ ...page, directChannels: payload.directChannels });
      }
      if (sectionKey === "otherChannels") {
        return sanitizeQuotePage({ ...page, otherChannels: payload.otherChannels });
      }
      break;
    }
    case "collections": {
      const page = current as CollectionsPageContent;
      if (sectionKey === "hero") return sanitizeCollectionsPage({ ...page, hero: payload });
      if (sectionKey === "operationGuidance") {
        return sanitizeCollectionsPage({ ...page, operationGuidance: payload });
      }
      break;
    }
    case "improvements": {
      const page = current as ImprovementsPageContent;
      if (sectionKey === "operationGuidance") return sanitizeImprovementsPage({ ...page, operationGuidance: payload });
      break;
    }
  }

  return null;
}
