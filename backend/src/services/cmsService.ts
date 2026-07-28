import { readContentData, readSiteTextsData, writeContentData, writeSiteTextsData } from "./contentService.js";
import {
  FOOTER_LINK_SECTION_KEYS,
  getFooterLinksContent,
  updateFooterLinksSection,
  type FooterLinkSectionKey,
} from "./footerLinksContent.js";
import {
  getPageContent,
  pageContentKey,
  updatePageSection,
  type CmsPageKey,
  type PageSectionKey,
} from "./pageContent.js";
import type {
  ContentData,
  HomeFeedback,
  HomeHeroButton,
  HomeHeroMode,
  HomeHeroSlide,
  HomeInteractiveItem,
  HomeMedia,
  HomeOperationItem,
  HomePageContent,
  HomeRegionalPresence,
  HomeRegionalUnit,
  HomeSection1,
  HomeSection2,
  HomeSection3,
  HomeServiceCard,
  HomeSocialProof,
  ServicesFaq,
  ServicesFinalCta,
  ServicesModule,
  ServicesPageContent,
} from "../types/content.js";
import { generateId } from "../utils/ids.js";
import { sanitizeEmail, sanitizeHexColor, sanitizeText, sanitizeUrl } from "../utils/sanitize.js";
import { HttpError } from "../utils/http.js";
import {
  sanitizeInternalImageUrl,
  sanitizeInternalMediaUrl,
  sanitizeInternalVideoUrl,
} from "./mediaValidationService.js";
import { defaultHomeQuickActions } from "../config/contentDefaults.js";

export type Entity = "units";
type RawItem = Record<string, unknown> & { id: string; order?: number };
export type HomeSectionKey =
  | "hero"
  | "section1"
  | "section2"
  | "section3"
  | "regionalPresence"
  | "trackingCta"
  | "socialProof"
  | "quickActions";
export type ServicesPageSectionKey = "modules" | "finalCta" | "faq";

const ENTITY_KEYS: Record<Entity, keyof ContentData> = {
  units: "units",
};

export const VALID_ENTITIES = Object.keys(ENTITY_KEYS) as Entity[];

function sortByOrder(items: RawItem[]) {
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function normalizeOrders(items: RawItem[]) {
  return items.map((item, index) => ({ ...item, order: index + 1 }));
}

function getCollection(content: ContentData, entity: Entity) {
  const raw = content as unknown as Record<string, RawItem[]>;
  return sortByOrder(raw[ENTITY_KEYS[entity]] ?? []);
}

function setCollection(content: ContentData, entity: Entity, items: RawItem[]) {
  const raw = content as unknown as Record<string, RawItem[]>;
  raw[ENTITY_KEYS[entity]] = sortByOrder(items);
}

const BRAZILIAN_STATE_CODES = new Set([
  "ac", "al", "ap", "am", "ba", "ce", "df", "es", "go", "ma", "mt", "ms", "mg",
  "pa", "pb", "pr", "pe", "pi", "rj", "rn", "rs", "ro", "rr", "sc", "sp", "se", "to",
]);
const UNIT_TYPES = new Set(["matriz", "filial", "ponto de apoio"]);

function sanitizeState(value: unknown) {
  const state = sanitizeText(value, 2).toLowerCase().replace(/[^a-z]/g, "");
  return BRAZILIAN_STATE_CODES.has(state) ? state : "";
}

function strictBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function sanitizeUnitPayload(payload: Record<string, unknown>) {
  const type = sanitizeText(payload.type ?? payload.tipo, 40).toLowerCase();
  return {
    name: sanitizeText(payload.name ?? payload.nome, 120),
    type: UNIT_TYPES.has(type) ? type : "",
    state: sanitizeState(payload.state ?? payload.estado),
    city: sanitizeText(payload.city ?? payload.cidade, 80),
    address: sanitizeText(payload.address ?? payload.endereco, 220),
    phone: sanitizeText(payload.phone ?? payload.telefone, 60),
    email: sanitizeEmail(payload.email),
    additionalEmail: sanitizeEmail(payload.additionalEmail),
    contactUrl: sanitizeUrl(payload.contactUrl ?? payload.linkContato),
    description: sanitizeText(payload.description ?? payload.descricao, 220),
    logisticsInfo: sanitizeText(payload.logisticsInfo ?? payload.infoLogistica, 260),
    isDefault: strictBoolean(payload.isDefault ?? payload.matriz, false),
    active: strictBoolean(payload.active ?? payload.ativo, true),
  };
}

function sanitizeEntityPayload(entity: Entity, payload: Record<string, unknown>) {
  switch (entity) {
    case "units":
      return sanitizeUnitPayload(payload);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function arrayPayload(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function hasRequiredText(value: unknown) {
  return sanitizeText(value, 2000).length > 0;
}

function validatePageButtons(value: unknown, count: number, label: string) {
  const buttons = arrayPayload(value);
  if (buttons.length !== count) return `${label}: informe exatamente ${count} botão(ões).`;
  const invalidIndex = buttons.findIndex(
    (button) => !hasRequiredText(button.label) || !sanitizeUrl(button.url)
  );
  return invalidIndex >= 0
    ? `${label}: texto e link são obrigatórios no botão ${invalidIndex + 1}.`
    : null;
}

function validateCmsPagePayload(
  pageKey: CmsPageKey,
  sectionKey: PageSectionKey,
  payload: Record<string, unknown>
) {
  const requiredFields = (source: Record<string, unknown>, fields: string[], label: string) => {
    const missing = fields.find((field) => !hasRequiredText(source[field]));
    return missing ? `${label}: o campo ${missing} é obrigatório.` : null;
  };
  const validateMedia = (value: unknown, label: string) => {
    const media = isRecord(value) ? value : {};
    return requiredFields(media, ["src", "alt"], label);
  };
  const validateOperationGuidance = (payload: Record<string, unknown>, label: string) => {
    const baseError = requiredFields(payload, ["eyebrow", "title", "description"], label);
    if (baseError) return baseError;
    const items = arrayPayload(payload.items);
    if (items.length !== 3) return `${label}: mantenha exatamente 3 orientações.`;
    const invalidIndex = items.findIndex(
      (item) => !hasRequiredText(item.question) || !hasRequiredText(item.answer)
    );
    return invalidIndex >= 0
      ? `${label}: pergunta e resposta são obrigatórias na orientação ${invalidIndex + 1}.`
      : null;
  };
  const quoteIcons = new Set([
    "WhatsappLogo",
    "PhoneCall",
    "EnvelopeSimple",
    "ClipboardText",
    "ChatCircleDots",
    "Headset",
    "MapPinLine",
    "Truck",
  ]);

  if (pageKey === "about") {
    if (sectionKey === "hero") {
      return requiredFields(payload, ["title", "description"], "Sobre / Hero") ||
        validateMedia(payload.media, "Sobre / Hero") ||
        validatePageButtons(payload.buttons, 2, "Sobre / Hero");
    }
    if (sectionKey === "compliance") {
      const requiredError = requiredFields(payload, ["title", "description", "certificateText"], "Sobre / Governança") ||
        validateMedia(payload.image, "Sobre / Governança");
      if (requiredError) return requiredError;
      if (hasRequiredText(payload.certificateUrl) && !sanitizeUrl(payload.certificateUrl)) {
        return "Sobre / Governança: informe um link de certificado válido.";
      }
      return null;
    }
    if (sectionKey === "finalCta") {
      return requiredFields(payload, ["title", "description"], "Sobre / CTA final") ||
        validatePageButtons(payload.buttons, 2, "Sobre / CTA final");
    }
  }

  if (pageKey === "business") {
    if (sectionKey === "scaleCta") return validatePageButtons(payload.buttons, 2, "Empresas / CTA");
    if (sectionKey === "faq") {
      if (!hasRequiredText(payload.title)) return "Empresas / FAQ: o título é obrigatório.";
      const items = arrayPayload(payload.items);
      if (items.length !== 4) return "Empresas / FAQ: informe exatamente 4 perguntas.";
      const invalidIndex = items.findIndex(
        (item) => !hasRequiredText(item.question) || !hasRequiredText(item.answer)
      );
      return invalidIndex >= 0
        ? `Empresas / FAQ: pergunta e resposta são obrigatórias no item ${invalidIndex + 1}.`
        : null;
    }
  }

  if (pageKey === "contact") {
    if (sectionKey === "hero") {
      const button = isRecord(payload.heroWhatsappButton) ? payload.heroWhatsappButton : payload;
      return validatePageButtons([button], 1, "Contato / Hero");
    }
    if (sectionKey === "mainChannels") {
      const channels = arrayPayload(payload.mainChannels);
      if (channels.length !== 3) return "Contato: informe exatamente 3 canais principais.";
      const invalidIndex = channels.findIndex(
        (channel) => !hasRequiredText(channel.description) || Boolean(validatePageButtons([channel.button], 1, "Contato"))
      );
      return invalidIndex >= 0
        ? `Contato: descrição e botão são obrigatórios no canal ${invalidIndex + 1}.`
        : null;
    }
    if (sectionKey === "info") {
      const items = arrayPayload(payload.items);
      const indicators = arrayPayload(payload.indicators);
      if (items.length !== 4 || indicators.length !== 2) {
        return "Contato: mantenha 4 itens informativos e 2 indicadores.";
      }
      if (items.some((item) => !hasRequiredText(item.title) || !hasRequiredText(item.description))) {
        return "Contato: título e descrição são obrigatórios nos itens informativos.";
      }
      if (indicators.some((item) => !hasRequiredText(item.value) || !hasRequiredText(item.description))) {
        return "Contato: valor e descrição são obrigatórios nos indicadores.";
      }
      return requiredFields(
        payload,
        ["companyTitle", "address", "hours", "channelGuideTitle", "channelGuideDescription", "documentsDescription", "quickSupportDescription"],
        "Contato / Informações"
      );
    }
    if (sectionKey === "finalCta") return validatePageButtons(payload.buttons, 2, "Contato / CTA final");
  }

  if (pageKey === "careers") {
    if (["hero", "directApplication", "finalCta"].includes(sectionKey)) {
      return validatePageButtons(payload.buttons, 2, "Carreiras / Botões");
    }
    if (sectionKey === "cultureImage") return validateMedia(payload, "Carreiras / Cultura");
    if (sectionKey === "jobs") {
      if (!Array.isArray(payload.jobs)) return "Carreiras: envie a coleção de vagas.";
      const jobs = arrayPayload(payload.jobs);
      if (jobs.length !== payload.jobs.length) return "Carreiras: remova itens de vaga inválidos.";
      const invalidIndex = jobs.findIndex((job) =>
        ["title", "location", "type", "description"].some((field) => !hasRequiredText(job[field])) ||
        !sanitizeUrl(job.applyUrl) ||
        (job.active !== undefined && typeof job.active !== "boolean")
      );
      return invalidIndex >= 0
        ? `Carreiras: preencha todos os campos obrigatórios da vaga ${invalidIndex + 1}.`
        : null;
    }
  }

  if (pageKey === "quote") {
    if (sectionKey === "hero") {
      return validatePageButtons(payload.buttons, 2, "Cotação / Botões");
    }
    if (sectionKey === "approvalChannel") {
      const whatsappUrl = sanitizeUrl(payload.whatsappUrl);
      return /^https:\/\/(?:wa\.me|api\.whatsapp\.com)\//i.test(whatsappUrl)
        ? null
        : "Cotação: informe um link oficial do WhatsApp para aprovar a cotação.";
    }
    if (sectionKey === "unservedOrigin") {
      if (!hasRequiredText(payload.title) || !hasRequiredText(payload.description)) {
        return "Cotação: preencha o título e a mensagem do popup de região não atendida.";
      }
      return validatePageButtons([payload.button], 1, "Cotação / Região não atendida");
    }
    if (sectionKey === "operationGuidance") {
      return validateOperationGuidance(payload, "Cotação / Orientações");
    }
    if (sectionKey === "directChannels") {
      const channels = arrayPayload(payload.directChannels);
      if (channels.length !== 2) return "Cotação: informe exatamente 2 canais diretos.";
      const invalidIndex = channels.findIndex(
        (channel) => !hasRequiredText(channel.title) || !hasRequiredText(channel.description) || Boolean(validatePageButtons([channel.button], 1, "Cotação"))
      );
      return invalidIndex >= 0
        ? `Cotação: preencha título, descrição e botão do canal ${invalidIndex + 1}.`
        : null;
    }
    if (sectionKey === "otherChannels") {
      if (!Array.isArray(payload.otherChannels)) return "Cotação: envie a coleção de canais.";
      const otherChannels = arrayPayload(payload.otherChannels);
      if (otherChannels.length !== payload.otherChannels.length) {
        return "Cotação: remova itens de canal inválidos.";
      }
      const invalidIndex = otherChannels.findIndex(
        (channel) =>
          !quoteIcons.has(sanitizeText(channel.icon, 40)) ||
          !sanitizeHexColor(channel.iconColor) ||
          !hasRequiredText(channel.title) ||
          !hasRequiredText(channel.description) ||
          !sanitizeHexColor(channel.buttonColor) ||
          (channel.active !== undefined && typeof channel.active !== "boolean") ||
          Boolean(validatePageButtons([channel.button], 1, "Cotação"))
      );
      return invalidIndex >= 0
        ? `Cotação: preencha todos os campos obrigatórios do canal ${invalidIndex + 1}.`
        : null;
    }
  }

  if (pageKey === "collections") {
    if (sectionKey === "hero") return validatePageButtons(payload.buttons, 2, "Coletas / Botões");
    if (sectionKey === "operationGuidance") {
      return validateOperationGuidance(payload, "Coletas / Orientações");
    }
  }

  if (pageKey === "improvements" && sectionKey === "operationGuidance") {
    return validateOperationGuidance(payload, "Melhoria contínua / Orientações");
  }

  return null;
}

function emptyHomePage(): HomePageContent {
  return {
    hero: { slides: [] },
    section1: { title: "", ctaLabel: "", ctaUrl: "", items: [] },
    section2: { title: "", items: [] },
    section3: {
      badge: "",
      title: "",
      description: "",
      ctaLabel: "",
      ctaUrl: "",
      cards: [],
    },
    regionalPresence: { units: [] },
    trackingCta: {
      buttons: [
        {
          label: "Rastrear agora",
          url: "https://rodogarcia.eslcloud.com.br/recipient_tracking",
          enabled: true,
          color: "#1d4ed8",
          variant: "solid",
        },
        {
          label: "Como consultar",
          url: "/central-ajuda",
          enabled: true,
          color: "#ffffff",
          variant: "outline",
        },
      ],
    },
    socialProof: { title: "", feedbacks: [] },
    quickActions: defaultHomeQuickActions(),
  };
}

function emptyServicesPage(): ServicesPageContent {
  return {
    modules: [],
    finalCta: { quoteUrl: "", trackingUrl: "" },
    faq: { title: "", items: [] },
  };
}

function inferMediaType(src: string, value: unknown): "image" | "video" {
  if (value === "video") return "video";
  if (/\.(mp4|webm|ogg)$/i.test(src)) return "video";
  return "image";
}

function wordCount(value: string): number {
  return value.split(/\s+/).filter(Boolean).length;
}

function withOrder<T extends { order?: number }>(items: T[]): T[] {
  return items.map((item, index) => ({ ...item, order: index + 1 }));
}

function sanitizeHomeMedia(payload: unknown): HomeMedia {
  const media = isRecord(payload) ? payload : {};
  const explicitType = media.type === "video" ? "video" : media.type === "image" ? "image" : null;
  const src = explicitType === "video"
    ? sanitizeInternalVideoUrl(media.src, "Mídia: vídeo")
    : explicitType === "image"
      ? sanitizeInternalImageUrl(media.src, "Mídia: imagem")
      : sanitizeInternalMediaUrl(media.src, "Mídia");
  const type = inferMediaType(src, media.type);
  return {
    type,
    src,
    alt: sanitizeText(media.alt, 140),
    poster: sanitizeInternalImageUrl(media.poster, "Mídia: poster"),
    desktopSrc: type === "video"
      ? sanitizeInternalVideoUrl(media.desktopSrc, "Mídia: vídeo desktop")
      : sanitizeInternalImageUrl(media.desktopSrc, "Mídia: imagem desktop"),
    mobileSrc: type === "video"
      ? sanitizeInternalVideoUrl(media.mobileSrc, "Mídia: vídeo mobile")
      : sanitizeInternalImageUrl(media.mobileSrc, "Mídia: imagem mobile"),
  };
}

function sanitizeHomeHeroMode(value: unknown): HomeHeroMode {
  if (value === "media-only") return "media-only";
  if (value === "text-media") return "text-media";
  return "text-media-buttons";
}

function sanitizeHomeButtons(payload: unknown): HomeHeroButton[] {
  return arrayPayload(payload).slice(0, 2).map((button) => ({
    label: sanitizeText(button.label, 40),
    url: sanitizeUrl(button.url),
    enabled: strictBoolean(button.enabled, true),
    color: sanitizeHexColor(button.color),
    variant: button.variant === "outline" ? "outline" : "solid",
  }));
}

function sanitizeHomeTrackingCta(payload: Record<string, unknown>): HomePageContent["trackingCta"] {
  const fallback = emptyHomePage().trackingCta.buttons;
  const buttons: HomeHeroButton[] = arrayPayload(payload.buttons)
    .slice(0, 2)
    .map((button, index) => ({
      label: sanitizeText(button.label, 40) || fallback[index]?.label || "",
      url: sanitizeUrl(button.url) || fallback[index]?.url || "",
      enabled: strictBoolean(button.enabled, true),
      color: sanitizeHexColor(button.color) || fallback[index]?.color || "#1d4ed8",
      variant: button.variant === "outline" ? "outline" : "solid",
    }));

  return {
    buttons: Array.from({ length: 2 }, (_, index) => buttons[index] ?? fallback[index]!),
  };
}

function sanitizeQuickActionType(value: unknown): "link" | "external" | "download" | "modal" {
  if (value === "external") return "external";
  if (value === "download") return "download";
  if (value === "modal") return "modal";
  return "link";
}

function sanitizeQuickActionItem(
  payload: Record<string, unknown>,
  index: number
) {
  const type = sanitizeQuickActionType(payload.type);
  const sanitizedHref = sanitizeUrl(payload.href);
  return {
    id: sanitizeText(payload.id, 80) || generateId("quick_action"),
    order: Number(payload.order ?? index + 1),
    label: sanitizeText(payload.label, 40),
    href: type === "modal" && !sanitizedHref.startsWith("#") ? "" : sanitizedHref,
    icon: sanitizeText(payload.icon, 40),
    type,
    enabled: typeof payload.enabled === "boolean" ? payload.enabled : true,
    downloadFile: sanitizeUrl(payload.downloadFile),
  };
}

function sanitizeQuickActions(items: unknown[]) {
  return withOrder(
    items
      .slice(0, 12)
      .map((action, index) =>
        sanitizeQuickActionItem(
          action && typeof action === "object" && !Array.isArray(action)
            ? (action as Record<string, unknown>)
            : {},
          index
        )
      )
  );
}

const BRAZIL_UF = new Set([
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
]);

function sanitizeUf(value: unknown) {
  const uf = sanitizeText(value, 2).toUpperCase().replace(/[^A-Z]/g, "");
  return BRAZIL_UF.has(uf) ? uf : "";
}

function sanitizeHomeRegionalUnit(
  payload: Record<string, unknown>,
  index: number
): HomeRegionalUnit {
  return {
    id: sanitizeText(payload.id, 80) || generateId("home_unit"),
    order: Number(payload.order ?? index + 1),
    name: sanitizeText(payload.name, 90),
    state: sanitizeUf(payload.state),
    description: sanitizeText(payload.description, 220),
    linkedUnitId: sanitizeText(payload.linkedUnitId, 80),
    address: sanitizeText(payload.address, 220),
    phone: sanitizeText(payload.phone, 60),
    email: sanitizeEmail(payload.email),
    additionalEmail: sanitizeEmail(payload.additionalEmail),
    buttonLabel: sanitizeText(payload.buttonLabel, 40) || "Falar com esta unidade",
    contactUrl: sanitizeUrl(payload.contactUrl),
    active: strictBoolean(payload.active, true),
  };
}

function sanitizeHomeRegionalPresence(
  payload: Record<string, unknown>
): HomeRegionalPresence {
  return {
    units: withOrder(
      arrayPayload(payload.units)
        .slice(0, 24)
        .map((unit, index) => sanitizeHomeRegionalUnit(unit, index))
    ),
  };
}

function sanitizeHomeHeroSlide(payload: Record<string, unknown>, index: number): HomeHeroSlide {
  const mode = sanitizeHomeHeroMode(payload.mode);
  return {
    id: sanitizeText(payload.id, 80) || generateId("home_hero"),
    order: Number(payload.order ?? index + 1),
    title: sanitizeText(payload.title, 120),
    description: sanitizeText(payload.description, 420),
    media: sanitizeHomeMedia(payload.media),
    active: strictBoolean(payload.active, true),
    mode,
    buttons: mode === "text-media-buttons" ? sanitizeHomeButtons(payload.buttons) : [],
  };
}

function sanitizeHomeHero(payload: Record<string, unknown>) {
  return {
    slides: withOrder(
      arrayPayload(payload.slides)
        .slice(0, 20)
        .map((slide, index) => sanitizeHomeHeroSlide(slide, index))
    ),
  };
}

function sanitizeHomeSection1Item(
  payload: Record<string, unknown>,
  index: number
): HomeInteractiveItem {
  return {
    id: sanitizeText(payload.id, 80) || `section1-${index + 1}`,
    order: Number(payload.order ?? index + 1),
    title: sanitizeText(payload.title, 60),
    description: sanitizeText(payload.description, 180),
    media: sanitizeHomeMedia(payload.media),
  };
}

function sanitizeHomeSection1(payload: Record<string, unknown>): HomeSection1 {
  return {
    title: sanitizeText(payload.title, 140),
    ctaLabel: sanitizeText(payload.ctaLabel, 40),
    ctaUrl: sanitizeUrl(payload.ctaUrl),
    items: withOrder(
      arrayPayload(payload.items)
        .map((item, index) => sanitizeHomeSection1Item(item, index))
    ),
  };
}

function sanitizeHomeSection2Item(
  payload: Record<string, unknown>,
  index: number
): HomeOperationItem {
  return {
    id: sanitizeText(payload.id, 80) || `section2-${index + 1}`,
    order: Number(payload.order ?? index + 1),
    title: sanitizeText(payload.title, 120),
    description: sanitizeText(payload.description, 260),
    media: sanitizeHomeMedia(payload.media),
    active: strictBoolean(payload.active, true),
  };
}

function sanitizeHomeSection2(payload: Record<string, unknown>): HomeSection2 {
  return {
    title: sanitizeText(payload.title, 160),
    items: withOrder(
      arrayPayload(payload.items)
        .map((item, index) => sanitizeHomeSection2Item(item, index))
    ),
  };
}

function sanitizeHomeServiceCard(
  payload: Record<string, unknown>,
  index: number
): HomeServiceCard {
  return {
    id: sanitizeText(payload.id, 80) || `section3-card-${index + 1}`,
    order: Number(payload.order ?? index + 1),
    media: sanitizeHomeMedia(payload.media),
    badge: sanitizeText(payload.badge, 60),
    title: sanitizeText(payload.title, 80),
    description: sanitizeText(payload.description, 320),
    ctaLabel: sanitizeText(payload.ctaLabel, 40),
    ctaUrl: sanitizeUrl(payload.ctaUrl),
  };
}

function sanitizeHomeSection3(payload: Record<string, unknown>): HomeSection3 {
  return {
    badge: sanitizeText(payload.badge, 60),
    title: sanitizeText(payload.title, 180),
    description: sanitizeText(payload.description, 420),
    ctaLabel: sanitizeText(payload.ctaLabel, 40),
    ctaUrl: sanitizeUrl(payload.ctaUrl),
    cards: withOrder(
      arrayPayload(payload.cards)
        .map((card, index) => sanitizeHomeServiceCard(card, index))
    ),
  };
}

function sanitizeHomeFeedback(payload: Record<string, unknown>, index: number): HomeFeedback {
  return {
    id: sanitizeText(payload.id, 80) || generateId("home_feedback"),
    order: Number(payload.order ?? index + 1),
    name: sanitizeText(payload.name, 80),
    role: sanitizeText(payload.role, 80),
    context: sanitizeText(payload.context, 120),
    testimonial: sanitizeText(payload.testimonial, 800),
    photo: sanitizeInternalImageUrl(payload.photo, "Prova social: foto"),
    rating: Math.min(5, Math.max(1, Math.round(Number(payload.rating ?? 5)))),
    active: strictBoolean(payload.active, true),
  };
}

function sanitizeHomeSocialProof(payload: Record<string, unknown>): HomeSocialProof {
  return {
    title: sanitizeText(payload.title, 160),
    feedbacks: withOrder(
      arrayPayload(payload.feedbacks).map((feedback, index) =>
        sanitizeHomeFeedback(feedback, index)
      )
    ),
  };
}

function sanitizeHomePage(payload: unknown): HomePageContent {
  const home = emptyHomePage();
  const source = isRecord(payload) ? payload : {};
  home.hero = sanitizeHomeHero(isRecord(source.hero) ? source.hero : {});
  home.section1 = sanitizeHomeSection1(
    isRecord(source.section1) ? source.section1 : {}
  );
  home.section2 = sanitizeHomeSection2(
    isRecord(source.section2) ? source.section2 : {}
  );
  home.section3 = sanitizeHomeSection3(
    isRecord(source.section3) ? source.section3 : {}
  );
  home.regionalPresence = sanitizeHomeRegionalPresence(
    isRecord(source.regionalPresence) ? source.regionalPresence : {}
  );
  home.trackingCta = sanitizeHomeTrackingCta(
    isRecord(source.trackingCta) ? source.trackingCta : {}
  );
  home.socialProof = sanitizeHomeSocialProof(
    isRecord(source.socialProof) ? source.socialProof : {}
  );
  home.quickActions = sanitizeQuickActions(
    Array.isArray(source.quickActions) ? source.quickActions : []
  );
  return home;
}

function validateRequiredMedia(media: HomeMedia, label: string) {
  if (!media.src) return `${label}: mídia obrigatória.`;
  if (media.type === "video" && media.src && !/\.(mp4|webm|ogg)$/i.test(media.src)) {
    return `${label}: vídeo deve usar MP4, WebM ou Ogg.`;
  }
  return null;
}

function validateHomeHero(payload: HomePageContent["hero"]) {
  for (const slide of payload.slides) {
    const prefix = `Hero ${slide.order ?? ""}`.trim();
    const mediaError = validateRequiredMedia(slide.media, prefix);
    if (mediaError) return mediaError;
    if (slide.mode !== "media-only" && (!slide.title || !slide.description)) {
      return `${prefix}: título e descrição são obrigatórios neste modo.`;
    }
    if (slide.mode === "text-media-buttons") {
      const enabledButtons = slide.buttons.filter(
        (button) => button.enabled && button.label && button.url
      );
      if (enabledButtons.length === 0) {
        return `${prefix}: informe ao menos um botão ativo com texto e link.`;
      }
    }
  }
  return null;
}

function validateHomeSection1(section: HomeSection1) {
  if (!section.title || !section.ctaLabel || !section.ctaUrl) {
    return "Seção 1: título, texto do botão e link são obrigatórios.";
  }
  if (section.items.length !== 3) return "Seção 1 deve ter exatamente 3 itens.";
  for (const item of section.items) {
    if (!item.title || !item.description) {
      return "Seção 1: título e descrição dos 3 itens são obrigatórios.";
    }
    if (wordCount(item.title) > 5) {
      return "Seção 1: cada título deve ter no máximo 5 palavras.";
    }
    const mediaError = validateRequiredMedia(item.media, `Seção 1 item ${item.order}`);
    if (mediaError) return mediaError;
  }
  return null;
}

function validateHomeSection2(section: HomeSection2) {
  if (!section.title) return "Seção 2: título principal obrigatório.";
  if (section.items.length > 5) return "Seção 2 permite no máximo 5 itens.";
  for (const item of section.items) {
    if (!item.title || !item.description) {
      return "Seção 2: título e descrição de cada item são obrigatórios.";
    }
    const mediaError = validateRequiredMedia(item.media, `Seção 2 item ${item.order}`);
    if (mediaError) return mediaError;
  }
  return null;
}

function validateHomeSection3(section: HomeSection3) {
  if (!section.badge || !section.title || !section.description || !section.ctaLabel || !section.ctaUrl) {
    return "Seção 3: badge, título, descrição, botão e link são obrigatórios.";
  }
  if (section.cards.length < 3) return "Seção 3 deve ter pelo menos 3 cards.";
  for (const card of section.cards) {
    if (!card.badge || !card.title || !card.description || !card.ctaLabel || !card.ctaUrl) {
      return "Seção 3: todos os campos dos cards são obrigatórios.";
    }
    if (wordCount(card.title) > 2) {
      return "Seção 3: título de cada card deve ter no máximo 2 palavras.";
    }
    const mediaError = validateRequiredMedia(card.media, `Seção 3 card ${card.order}`);
    if (mediaError) return mediaError;
  }
  return null;
}

function validateHomeRegionalPresence(section: HomeRegionalPresence) {
  for (const unit of section.units) {
    if (unit.active === false) continue;
    if (!unit.name || !unit.state || !unit.description || !unit.address || !unit.contactUrl || !unit.additionalEmail) {
      return "Presença Regional: nome, UF, descrição, endereço, e-mail adicional e link do botão são obrigatórios em unidades ativas.";
    }
    if (!BRAZIL_UF.has(unit.state)) {
      return "Presença Regional: selecione uma UF válida.";
    }
  }
  return null;
}

function validateHomeTrackingCta(section: HomePageContent["trackingCta"]) {
  const buttons = section.buttons.slice(0, 2);
  if (buttons.length !== 2) return "Rastreio: informe os dois botões.";
  for (const button of buttons) {
    if (button.enabled !== false && (!button.label || !button.url)) {
      return "Rastreio: texto e link dos botões ativos são obrigatórios.";
    }
  }
  return null;
}

function validateHomeSocialProof(section: HomeSocialProof) {
  if (!section.title) return "Prova Social: título principal obrigatório.";
  for (const feedback of section.feedbacks) {
    if (!feedback.name || !feedback.role || !feedback.context || !feedback.testimonial) {
      return "Prova Social: nome, cargo, contexto da operação e depoimento são obrigatórios.";
    }
  }
  return null;
}

const QUICK_ACTION_ICONS = new Set([
  "FilePdf",
  "Calculator",
  "MagnifyingGlass",
  "Truck",
  "MapPin",
  "WhatsappLogo",
  "Phone",
  "Envelope",
  "ChatCircleDots",
  "Headset",
  "Package",
  "Handshake",
  "FileText",
  "ArrowSquareOut",
]);

function validateHomeQuickActions(actions: NonNullable<HomePageContent["quickActions"]>) {
  for (const [index, action] of actions.entries()) {
    const prefix = `Atalho ${index + 1}`;
    if (!action.label || !QUICK_ACTION_ICONS.has(action.icon)) {
      return `${prefix}: texto e ícone válido são obrigatórios.`;
    }
    if (action.enabled === false) continue;
    const target = action.type === "download" ? action.downloadFile || action.href : action.href;
    if (!target) return `${prefix}: informe um destino ou desative o atalho.`;
    if (action.type === "modal" && !target.startsWith("#")) {
      return `${prefix}: ações de âncora devem usar um destino iniciado por #.`;
    }
    if (action.type === "external" && !/^(?:https?:|mailto:|tel:)/i.test(target)) {
      return `${prefix}: links externos devem usar HTTP(S), mailto: ou tel:.`;
    }
    if (action.type === "link" && !target.startsWith("/")) {
      return `${prefix}: links internos devem começar com /.`;
    }
  }
  return null;
}

function validateHomeSection(section: HomeSectionKey, home: HomePageContent) {
  switch (section) {
    case "hero":
      return validateHomeHero(home.hero);
    case "section1":
      return validateHomeSection1(home.section1);
    case "section2":
      return validateHomeSection2(home.section2);
    case "section3":
      return validateHomeSection3(home.section3);
    case "regionalPresence":
      return validateHomeRegionalPresence(home.regionalPresence);
    case "trackingCta":
      return validateHomeTrackingCta(home.trackingCta);
    case "socialProof":
      return validateHomeSocialProof(home.socialProof);
    case "quickActions":
      return validateHomeQuickActions(home.quickActions ?? []);
  }
}

function normalizeHomeForAdmin(content: ContentData): HomePageContent {
  return sanitizeHomePage(content.homePage);
}

function sanitizeServicesModule(payload: Record<string, unknown>, index: number): ServicesModule {
  const rawImage = isRecord(payload.image) ? payload.image : {};
  const normalizedDetails = Array.isArray(payload.details)
    ? (payload.details as unknown[])
        .map((item) =>
          isRecord(item)
            ? sanitizeText(item.value ?? item.text ?? item.label, 120)
            : sanitizeText(item, 120)
        )
        .slice(0, 3)
    : [];

  return {
    id: sanitizeText(payload.id, 80) || `services-module-${index + 1}`,
    order: Number(payload.order ?? index + 1),
    image: {
      src: sanitizeInternalImageUrl(rawImage.src ?? payload.imageSrc, "Serviços: imagem"),
      alt: sanitizeText(rawImage.alt ?? payload.imageAlt, 160),
      position: [
        "object-top",
        "object-bottom",
        "object-left",
        "object-right",
        "object-[50%_45%]",
      ].includes(sanitizeText(rawImage.position, 60))
        ? sanitizeText(rawImage.position, 60)
        : "",
    },
    eyebrow: sanitizeText(payload.eyebrow, 80),
    title: sanitizeText(payload.title, 180),
    description: sanitizeText(payload.description, 260),
    details: Array.from({ length: 3 }, (_, detailIndex) => normalizedDetails[detailIndex] ?? ""),
    ctaLabel: sanitizeText(payload.ctaLabel, 40),
    ctaUrl: sanitizeUrl(payload.ctaUrl),
  };
}

function sanitizeServicesModules(payload: Record<string, unknown>): ServicesModule[] {
  return withOrder(
    arrayPayload(payload.modules).map((module, index) =>
      sanitizeServicesModule(module, index)
    )
  );
}

function sanitizeServicesFinalCta(payload: Record<string, unknown>): ServicesFinalCta {
  return {
    quoteUrl: sanitizeUrl(payload.quoteUrl),
    trackingUrl: sanitizeUrl(payload.trackingUrl),
  };
}

function sanitizeServicesFaq(payload: Record<string, unknown>): ServicesFaq {
  return {
    title: sanitizeText(payload.title, 120),
    items: withOrder(
      arrayPayload(payload.items).map((item, index) => ({
        id: sanitizeText(item.id, 80) || `services-faq-${index + 1}`,
        order: Number(item.order ?? index + 1),
        question: sanitizeText(item.question, 180),
        answer: sanitizeText(item.answer, 320),
      }))
    ),
  };
}

function sanitizeServicesPage(payload: unknown): ServicesPageContent {
  const servicesPage = emptyServicesPage();
  const source = isRecord(payload) ? payload : {};
  servicesPage.modules = sanitizeServicesModules({ modules: source.modules });
  servicesPage.finalCta = sanitizeServicesFinalCta(
    isRecord(source.finalCta) ? source.finalCta : {}
  );
  servicesPage.faq = sanitizeServicesFaq(isRecord(source.faq) ? source.faq : {});
  return servicesPage;
}

function validateServicesModules(modules: ServicesModule[]) {
  if (modules.length !== 3) return "Serviços: a seção de módulos deve ter exatamente 3 cards.";
  for (const module of modules) {
    const prefix = `Modulo ${module.order ?? ""}`.trim();
    if (!module.image.src || !module.image.alt) {
      return `${prefix}: imagem e texto alternativo são obrigatórios.`;
    }
    if (!module.eyebrow || !module.title || !module.description || !module.ctaLabel || !module.ctaUrl) {
      return `${prefix}: tag, título, descrição, texto do botão e link são obrigatórios.`;
    }
    if (module.details.length !== 3 || module.details.some((detail) => !detail)) {
      return `${prefix}: informe exatamente 3 tópicos.`;
    }
  }
  return null;
}

function validateServicesFinalCta(finalCta: ServicesFinalCta) {
  if (!finalCta.quoteUrl || !finalCta.trackingUrl) {
    return "CTA final: os links de cotação e rastreio são obrigatórios.";
  }
  return null;
}

function validateServicesFaq(faq: ServicesFaq) {
  if (!faq.title) return "FAQ: título principal obrigatório.";
  if (faq.items.length !== 5) return "FAQ: a lista deve manter exatamente 5 perguntas.";
  for (const item of faq.items) {
    if (!item.question || !item.answer) {
      return "FAQ: pergunta e resposta são obrigatórias em todos os itens.";
    }
  }
  return null;
}

function validateServicesPageSection(section: ServicesPageSectionKey, servicesPage: ServicesPageContent) {
  switch (section) {
    case "modules":
      return validateServicesModules(servicesPage.modules);
    case "finalCta":
      return validateServicesFinalCta(servicesPage.finalCta);
    case "faq":
      return validateServicesFaq(servicesPage.faq);
  }
}

function normalizeServicesForAdmin(content: ContentData): ServicesPageContent {
  return sanitizeServicesPage(content.servicesPage);
}

function validateEntityPayload(entity: Entity, payload: Record<string, unknown>) {
  if (entity === "units") {
    if (!payload.name || !payload.type || !payload.state || !payload.address) {
      return "Nome, tipo, UF brasileira e endereço são obrigatórios.";
    }
    if (!payload.phone && !payload.email) {
      return "Informe ao menos telefone ou e-mail da unidade.";
    }
    if (!payload.additionalEmail) {
      return "Informe o e-mail adicional da unidade.";
    }
  }
  return null;
}

function validateEntityInput(entity: Entity, input: Record<string, unknown>) {
  if (entity !== "units") return null;
  const email = sanitizeText(input.email, 160);
  if (email && !sanitizeEmail(input.email)) return "Informe um e-mail válido para a unidade.";
  const additionalEmail = sanitizeText(input.additionalEmail, 160);
  if (!additionalEmail || !sanitizeEmail(input.additionalEmail)) return "Informe um e-mail adicional válido para a unidade.";
  const contactUrl = sanitizeText(input.contactUrl ?? input.linkContato, 600);
  if (contactUrl && !sanitizeUrl(contactUrl)) return "Informe um link de contato válido.";
  for (const [label, value, length] of [
    ["CNPJ para cotação", input.quoteCnpj, 14],
    ["CEP genérico da cidade", input.genericPostalCode, 8],
  ] as const) {
    const digits = sanitizeText(value, 20).replace(/\D/g, "");
    if (digits && digits.length !== length) return `${label} deve ter ${length} dígitos.`;
  }
  for (const [key, value] of [
    ["active", input.active ?? input.ativo],
    ["isDefault", input.isDefault ?? input.matriz],
  ] as const) {
    if (value !== undefined && typeof value !== "boolean") {
      return `${key}: informe um valor booleano válido.`;
    }
  }
  return null;
}

function normalizeAdminItem(entity: Entity, item: RawItem) {
  if (entity === "units") {
    return {
      ...item,
      name: sanitizeText(item.name ?? item.nome, 120),
      type: sanitizeText(item.type ?? item.tipo, 40),
      state: sanitizeState(item.state ?? item.estado),
      city: sanitizeText(item.city ?? item.cidade, 80),
      address: sanitizeText(item.address ?? item.endereco, 220),
      phone: sanitizeText(item.phone ?? item.telefone, 60),
      email: sanitizeEmail(item.email),
      additionalEmail: sanitizeEmail(item.additionalEmail),
      contactUrl: sanitizeUrl(item.contactUrl ?? item.linkContato),
      description: sanitizeText(item.description ?? item.descricao, 220),
      logisticsInfo: sanitizeText(item.logisticsInfo ?? item.infoLogistica, 260),
      quoteCnpj: sanitizeText(item.quoteCnpj, 18).replace(/\D/g, "").slice(0, 14),
      genericPostalCode: sanitizeText(item.genericPostalCode, 12).replace(/\D/g, "").slice(0, 8),
      isDefault: strictBoolean(item.isDefault ?? item.matriz, false),
      active: strictBoolean(item.active ?? item.ativo, true),
    };
  }
}

export function getSiteTexts() {
  return readSiteTextsData();
}

export function updateSiteTexts(body: Record<string, unknown>) {
  const nextSiteTexts = {
    ...readSiteTextsData(),
    ...Object.fromEntries(
      Object.entries(body).map(([key, value]) => [key, sanitizeText(value, 500)])
    ),
  };
  writeSiteTextsData(nextSiteTexts);
  return nextSiteTexts;
}

export function getContent() {
  return readContentData();
}

export function getHomePage() {
  return normalizeHomeForAdmin(readContentData());
}

export function getServicesPage() {
  return normalizeServicesForAdmin(readContentData());
}

export function getCmsPage(pageKey: CmsPageKey) {
  return getPageContent(readContentData(), pageKey);
}

export function parseFooterLinkSection(value: string | undefined): FooterLinkSectionKey | null {
  return FOOTER_LINK_SECTION_KEYS.includes(value as FooterLinkSectionKey)
    ? (value as FooterLinkSectionKey)
    : null;
}

export function getFooterLinks() {
  return getFooterLinksContent(readContentData());
}

export function updateFooterLinks(sectionKey: FooterLinkSectionKey, body: Record<string, unknown>) {
  const content = readContentData();
  const current = getFooterLinksContent(content);
  const next = updateFooterLinksSection(current, sectionKey, isRecord(body) ? body : {});
  content.footerLinks = next;
  writeContentData(content);
  return next;
}

export function updateHomeSection(section: HomeSectionKey, body: Record<string, unknown>) {
  const content = readContentData();
  const home = normalizeHomeForAdmin(content);
  const payload = isRecord(body) ? body : {};

  switch (section) {
    case "hero":
      home.hero = sanitizeHomeHero(payload);
      break;
    case "section1":
      home.section1 = sanitizeHomeSection1(payload);
      break;
    case "section2":
      home.section2 = sanitizeHomeSection2(payload);
      break;
    case "section3":
      home.section3 = sanitizeHomeSection3(payload);
      break;
    case "regionalPresence":
      home.regionalPresence = sanitizeHomeRegionalPresence(payload);
      break;
    case "trackingCta":
      home.trackingCta = sanitizeHomeTrackingCta(payload);
      break;
    case "socialProof":
      home.socialProof = sanitizeHomeSocialProof(payload);
      break;
    case "quickActions":
      home.quickActions = sanitizeQuickActions(
        Array.isArray(payload.quickActions) ? payload.quickActions : []
      );
      break;
  }

  const validationError = validateHomeSection(section, home);
  if (validationError) throw new HttpError(422, validationError);

  content.homePage = home;
  writeContentData(content);
  return home;
}

export function updateServicesPageSection(
  section: ServicesPageSectionKey,
  body: Record<string, unknown>
) {
  const content = readContentData();
  const servicesPage = normalizeServicesForAdmin(content);
  const payload = isRecord(body) ? body : {};

  switch (section) {
    case "modules":
      servicesPage.modules = sanitizeServicesModules({ modules: payload.modules });
      break;
    case "finalCta":
      servicesPage.finalCta = sanitizeServicesFinalCta(payload);
      break;
    case "faq":
      servicesPage.faq = sanitizeServicesFaq(payload);
      break;
  }

  const validationError = validateServicesPageSection(section, servicesPage);
  if (validationError) throw new HttpError(422, validationError);

  content.servicesPage = servicesPage;
  writeContentData(content);
  return servicesPage;
}

export function updateCmsPageSection(
  pageKey: CmsPageKey,
  sectionKey: PageSectionKey,
  body: Record<string, unknown>
) {
  const validationError = validateCmsPagePayload(pageKey, sectionKey, body);
  if (validationError) throw new HttpError(422, validationError);
  const content = readContentData();
  const current = getPageContent(content, pageKey);
  const nextPage = updatePageSection(current, pageKey, sectionKey, isRecord(body) ? body : {});

  if (!nextPage) {
    throw new HttpError(404, "Seção administrativa não encontrada.");
  }

  (content as unknown as Record<string, unknown>)[pageContentKey(pageKey)] = nextPage;
  writeContentData(content);
  return nextPage;
}

export function getItems(entity: Entity) {
  return getCollection(readContentData(), entity).map((item) =>
    normalizeAdminItem(entity, item)
  );
}

export function createItem(entity: Entity, body: Record<string, unknown>) {
  const content = readContentData();
  const collection = getCollection(content, entity);
  const inputError = validateEntityInput(entity, body);
  if (inputError) throw new HttpError(422, inputError);
  const payload = sanitizeEntityPayload(entity, body);
  const validationError = validateEntityPayload(entity, payload);
  if (validationError) throw new HttpError(422, validationError);

  const nowIso = new Date().toISOString();
  const newItem: RawItem = {
    id: generateId(entity),
    order: collection.reduce((max, item) => Math.max(max, item.order ?? 0), 0) + 1,
    createdAt: nowIso,
    updatedAt: nowIso,
    ...payload,
  };
  const nextItems = [
    ...collection.map((item) => payload.isDefault ? { ...item, isDefault: false } : item),
    newItem,
  ];
  setCollection(content, entity, nextItems);
  writeContentData(content);
  return {
    item: normalizeAdminItem(entity, newItem),
    items: nextItems.map((item) => normalizeAdminItem(entity, item)),
  };
}

export function updateItem(entity: Entity, id: string, body: Record<string, unknown>) {
  const content = readContentData();
  const collection = getCollection(content, entity);
  const index = collection.findIndex((item) => item.id === id);
  if (index === -1) throw new HttpError(404, "Item não encontrado.");

  const currentItem = collection[index]!;
  const input = { ...currentItem, ...body };
  const inputError = validateEntityInput(entity, input);
  if (inputError) throw new HttpError(422, inputError);
  const payload = sanitizeEntityPayload(entity, input);
  const validationError = validateEntityPayload(entity, payload);
  if (validationError) throw new HttpError(422, validationError);

  const updatedItem: RawItem = {
    ...currentItem,
    ...payload,
    id: currentItem.id,
    order: currentItem.order,
    updatedAt: new Date().toISOString(),
  };
  const nextItems = collection.map((item) =>
    payload.isDefault && item.id !== id ? { ...item, isDefault: false } : item
  );
  nextItems[index] = updatedItem;
  setCollection(content, entity, nextItems);
  writeContentData(content);
  return {
    item: normalizeAdminItem(entity, updatedItem),
    items: nextItems.map((item) => normalizeAdminItem(entity, item)),
  };
}

export function deleteItem(entity: Entity, id: string) {
  const content = readContentData();
  const collection = getCollection(content, entity);
  const nextItems = collection.filter((item) => item.id !== id);
  if (nextItems.length === collection.length) {
    throw new HttpError(404, "Item não encontrado.");
  }
  const normalized = normalizeOrders(nextItems);
  setCollection(content, entity, normalized);
  writeContentData(content);
  return normalized.map((item) => normalizeAdminItem(entity, item));
}

export function reorderItems(entity: Entity, orderedIds: unknown) {
  const content = readContentData();
  const collection = getCollection(content, entity);
  const ids = Array.isArray(orderedIds) ? orderedIds.map(String) : [];
  const mapById = new Map(collection.map((item) => [item.id, item]));
  const seen = new Set<string>();
  const nextItems: RawItem[] = [];

  for (const id of ids) {
    const item = mapById.get(id);
    if (!item || seen.has(id)) continue;
    nextItems.push(item);
    seen.add(id);
  }
  for (const item of collection) {
    if (!seen.has(item.id)) nextItems.push(item);
  }

  const normalized = normalizeOrders(nextItems);
  setCollection(content, entity, normalized);
  writeContentData(content);
  return normalized.map((item) => normalizeAdminItem(entity, item));
}
