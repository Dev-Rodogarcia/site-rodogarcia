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

function sanitizeState(value: unknown) {
  return sanitizeText(value, 2).toLowerCase().replace(/[^a-z]/g, "");
}

function sanitizeUnitPayload(payload: Record<string, unknown>) {
  return {
    name: sanitizeText(payload.name ?? payload.nome, 120),
    type: sanitizeText(payload.type ?? payload.tipo, 40),
    state: sanitizeState(payload.state ?? payload.estado),
    city: sanitizeText(payload.city ?? payload.cidade, 80),
    address: sanitizeText(payload.address ?? payload.endereco, 220),
    phone: sanitizeText(payload.phone ?? payload.telefone, 60),
    email: sanitizeEmail(payload.email),
    contactUrl: sanitizeUrl(payload.contactUrl ?? payload.linkContato),
    description: sanitizeText(payload.description ?? payload.descricao, 220),
    logisticsInfo: sanitizeText(payload.logisticsInfo ?? payload.infoLogistica, 260),
    isDefault: Boolean(payload.isDefault ?? payload.matriz),
    active: Boolean(payload.active ?? payload.ativo ?? true),
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
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
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
    enabled: Boolean(button.enabled),
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
      enabled: button.enabled === undefined ? true : Boolean(button.enabled),
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
  return {
    id: sanitizeText(payload.id, 80) || generateId("quick_action"),
    order: Number(payload.order ?? index + 1),
    label: sanitizeText(payload.label, 40),
    href: sanitizeUrl(payload.href),
    icon: sanitizeText(payload.icon, 40),
    type: sanitizeQuickActionType(payload.type),
    enabled: Boolean(payload.enabled ?? true),
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
    buttonLabel: sanitizeText(payload.buttonLabel, 40) || "Falar com esta unidade",
    contactUrl: sanitizeUrl(payload.contactUrl),
    active: Boolean(payload.active ?? true),
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
    active: Boolean(payload.active ?? true),
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
    active: Boolean(payload.active ?? true),
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
    company: sanitizeText(payload.company, 120),
    testimonial: sanitizeText(payload.testimonial, 800),
    photo: sanitizeInternalImageUrl(payload.photo, "Prova social: foto"),
    rating: Math.min(5, Math.max(1, Math.round(Number(payload.rating ?? 5)))),
    active: Boolean(payload.active ?? true),
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
    if (!unit.name || !unit.state || !unit.description || !unit.address || !unit.contactUrl) {
      return "Presença Regional: nome, UF, descrição, endereço e link do botão são obrigatórios em unidades ativas.";
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
    if (!feedback.name || !feedback.role || !feedback.company || !feedback.testimonial || !feedback.photo) {
      return "Prova Social: foto/logo, nome, cargo, empresa e depoimento são obrigatórios.";
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
      return null;
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
      position: sanitizeText(rawImage.position, 60),
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
    if (!payload.name || !payload.state || !payload.address) {
      return "Nome, estado e endereço são obrigatórios.";
    }
    if (!payload.phone && !payload.email) {
      return "Informe ao menos telefone ou e-mail da unidade.";
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
      contactUrl: sanitizeUrl(item.contactUrl ?? item.linkContato),
      description: sanitizeText(item.description ?? item.descricao, 220),
      logisticsInfo: sanitizeText(item.logisticsInfo ?? item.infoLogistica, 260),
      isDefault: Boolean(item.isDefault ?? item.matriz),
      active: Boolean(item.active ?? item.ativo ?? true),
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
  const nextItems = [...collection, newItem];
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

  const payload = sanitizeEntityPayload(entity, body);
  const validationError = validateEntityPayload(entity, payload);
  if (validationError) throw new HttpError(422, validationError);

  const currentItem = collection[index]!;
  const updatedItem: RawItem = {
    ...currentItem,
    ...payload,
    id: currentItem.id,
    order: currentItem.order,
    updatedAt: new Date().toISOString(),
  };
  const nextItems = [...collection];
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
