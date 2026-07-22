import { storagePaths } from "../config/storagePaths.js";
import { sanitizeFooterLinks } from "../services/footerLinksContent.js";
import { migratePageContent } from "../services/pageContent.js";
import type { ContentData, HomeFeedback, HomePageContent, ServicesPageContent } from "../types/content.js";
import { readJsonFile, writeJsonFile } from "../utils/jsonStore.js";
import { mediaSlotsRepository } from "./jsonRepositories.js";
import { defaultHomeQuickActions } from "../config/contentDefaults.js";

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

const DEFAULT_CONTENT: ContentData = {
  homePage: emptyHomePage(),
  servicesPage: emptyServicesPage(),
  heroSlides: [],
  dnaSlides: [],
  feedbacks: [],
  vagas: [],
  units: [],
};

const DEFAULT_QUOTE_UNIT = {
  id: "unit-matriz",
  quoteCnpj: "60960473000162",
  genericPostalCode: "17123210",
} as const;

const LEGACY_FEEDBACK_CONTEXTS = [
  "Distribuição e abastecimento",
  "Logística industrial e rastreabilidade",
  "Supply chain e entregas nacionais",
  "Transporte e distribuição regional",
  "Atendimento logístico e agendamento",
  "Operações de distribuição",
  "Coleta, entrega e acompanhamento",
  "Distribuição B2B",
  "Logística e previsibilidade operacional",
] as const;

type RawItem = Record<string, unknown> & { order?: number };

function sortByOrder(items: RawItem[]) {
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function serializeContent(content: ContentData) {
  const rawContent = content as unknown as Record<string, RawItem[]>;
  return {
    homePage:
      content.homePage && typeof content.homePage === "object"
        ? content.homePage
        : emptyHomePage(),
    servicesPage:
      content.servicesPage && typeof content.servicesPage === "object"
        ? content.servicesPage
        : emptyServicesPage(),
    aboutPage:
      content.aboutPage && typeof content.aboutPage === "object"
        ? content.aboutPage
        : undefined,
    businessPage:
      content.businessPage && typeof content.businessPage === "object"
        ? content.businessPage
        : undefined,
    contactPage:
      content.contactPage && typeof content.contactPage === "object"
        ? content.contactPage
        : undefined,
    careersPage:
      content.careersPage && typeof content.careersPage === "object"
        ? content.careersPage
        : undefined,
    quotePage:
      content.quotePage && typeof content.quotePage === "object"
        ? content.quotePage
        : undefined,
    collectionsPage:
      content.collectionsPage && typeof content.collectionsPage === "object"
        ? content.collectionsPage
        : undefined,
    footerLinks:
      content.footerLinks && typeof content.footerLinks === "object"
        ? content.footerLinks
        : undefined,
    heroSlides: sortByOrder(
      Array.isArray(rawContent.heroSlides) ? rawContent.heroSlides : []
    ),
    dnaSlides: sortByOrder(Array.isArray(rawContent.dnaSlides) ? rawContent.dnaSlides : []),
    vagas: sortByOrder(Array.isArray(rawContent.vagas) ? rawContent.vagas : []),
    feedbacks: sortByOrder(
      Array.isArray(rawContent.feedbacks) ? rawContent.feedbacks : []
    ),
    units: sortByOrder(Array.isArray(rawContent.units) ? rawContent.units : []),
  };
}

function shouldPersistPageMigration(data: ContentData) {
  return !(
    data.aboutPage &&
    data.businessPage &&
    data.contactPage &&
    data.careersPage &&
    data.quotePage &&
    data.collectionsPage
  );
}

function needsQuoteUnitMigration(units: ContentData["units"]) {
  const matrix = units.find((unit) => unit.id === DEFAULT_QUOTE_UNIT.id);
  return Boolean(matrix && (!matrix.quoteCnpj || !matrix.genericPostalCode));
}

function migrateQuoteUnit(units: ContentData["units"]) {
  return units.map((unit) =>
    unit.id === DEFAULT_QUOTE_UNIT.id
      ? {
          ...unit,
          quoteCnpj: unit.quoteCnpj || DEFAULT_QUOTE_UNIT.quoteCnpj,
          genericPostalCode: unit.genericPostalCode || DEFAULT_QUOTE_UNIT.genericPostalCode,
        }
      : unit
  );
}

function homeUnitFromLegacy(unit: RawItem, index: number) {
  return {
    id: String(unit.id ?? `home-unit-${index + 1}`),
    order: Number(unit.order ?? index + 1),
    name: String(unit.name ?? unit.nome ?? ""),
    state: String(unit.state ?? unit.estado ?? "").toUpperCase(),
    description: String(unit.description ?? unit.descricao ?? unit.type ?? unit.tipo ?? ""),
    linkedUnitId: String(unit.id ?? ""),
    address: String(unit.address ?? unit.endereco ?? ""),
    phone: String(unit.phone ?? unit.telefone ?? ""),
    email: String(unit.email ?? ""),
    buttonLabel: "Falar com esta unidade",
    contactUrl: String(unit.contactUrl ?? unit.linkContato ?? "/fale-conosco"),
    active: unit.active !== false && unit.ativo !== false,
  };
}

function legacyText(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
}

function hasConfiguredSocialProof(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const socialProof = value as { title?: unknown; feedbacks?: unknown };
  return Boolean(
    legacyText(socialProof.title) &&
      Array.isArray(socialProof.feedbacks) &&
      socialProof.feedbacks.length > 0 &&
      socialProof.feedbacks.every(
        (feedback) =>
          feedback &&
          typeof feedback === "object" &&
          legacyText((feedback as RawItem).name) &&
          legacyText((feedback as RawItem).role) &&
          legacyText((feedback as RawItem).context) &&
          legacyText((feedback as RawItem).testimonial)
      )
  );
}

function homeFeedbackFromLegacy(feedback: RawItem, index: number): HomeFeedback {
  return {
    id: legacyText(feedback.id) || `home-feedback-${index + 1}`,
    order: Number(feedback.order ?? index + 1),
    name: legacyText(feedback.name ?? feedback.nome) || `Cliente ${index + 1}`,
    role: legacyText(feedback.role) || "Profissional de logística",
    context:
      legacyText(feedback.highlight ?? feedback.resultadoTexto) ||
      LEGACY_FEEDBACK_CONTEXTS[index % LEGACY_FEEDBACK_CONTEXTS.length],
    testimonial:
      legacyText(feedback.testimonial ?? feedback.comment ?? feedback.texto) ||
      "A operação ganhou mais previsibilidade, acompanhamento e agilidade nas tratativas.",
    photo: "",
    rating: Math.min(5, Math.max(1, Math.round(Number(feedback.rating ?? feedback.nota ?? 5)))),
    active: feedback.active !== false && feedback.ativo !== false,
  };
}

function socialProofFromLegacy(feedbacks: RawItem[], title?: unknown) {
  return {
    title: legacyText(title) || "Experiências em logística, transporte e distribuição.",
    feedbacks: sortByOrder(feedbacks).map(homeFeedbackFromLegacy),
  };
}

function needsSocialProofMigration(content: Pick<ContentData, "homePage" | "feedbacks">) {
  const currentSocialProof = content.homePage && typeof content.homePage === "object"
    ? (content.homePage as unknown as Record<string, unknown>).socialProof
    : undefined;
  const homeFeedbacks =
    currentSocialProof && typeof currentSocialProof === "object"
      ? (currentSocialProof as { feedbacks?: unknown }).feedbacks
      : undefined;
  return (
    !hasConfiguredSocialProof(currentSocialProof) &&
    (content.feedbacks.length > 0 || (Array.isArray(homeFeedbacks) && homeFeedbacks.length > 0))
  );
}

function normalizeHomeRoot(content: ContentData) {
  const homePage = content.homePage && typeof content.homePage === "object"
    ? content.homePage
    : emptyHomePage();
  const homeRecord = homePage as unknown as Record<string, unknown>;
  const migratedUnits =
    Array.isArray(content.units) && content.units.length > 0
      ? sortByOrder(content.units as unknown as RawItem[]).map(homeUnitFromLegacy)
      : [];
  const legacyHomeSocialProof =
    homeRecord.socialProof && typeof homeRecord.socialProof === "object"
      ? (homeRecord.socialProof as { title?: unknown; feedbacks?: unknown })
      : undefined;
  const legacyHomeFeedbacks = Array.isArray(legacyHomeSocialProof?.feedbacks)
    ? (legacyHomeSocialProof.feedbacks as RawItem[])
    : [];
  const shouldMigrateSocialProof =
    !hasConfiguredSocialProof(homeRecord.socialProof) &&
    (content.feedbacks.length > 0 || legacyHomeFeedbacks.length > 0);

  return {
    ...emptyHomePage(),
    ...homePage,
    regionalPresence:
      homeRecord.regionalPresence &&
      typeof homeRecord.regionalPresence === "object" &&
      Array.isArray((homeRecord.regionalPresence as { units?: unknown }).units)
        ? homePage.regionalPresence
        : { units: migratedUnits },
    trackingCta:
      homeRecord.trackingCta && typeof homeRecord.trackingCta === "object"
        ? homePage.trackingCta
        : emptyHomePage().trackingCta,
    socialProof: shouldMigrateSocialProof
      ? socialProofFromLegacy(
          content.feedbacks.length > 0
            ? (content.feedbacks as unknown as RawItem[])
            : legacyHomeFeedbacks,
          legacyHomeSocialProof?.title
        )
      : homePage.socialProof,
  };
}

export const contentRepository = {
  read(): ContentData {
    const data = readJsonFile<ContentData>(storagePaths.content, DEFAULT_CONTENT);
    const normalized = {
      heroSlides: Array.isArray(data.heroSlides) ? data.heroSlides : [],
      dnaSlides: Array.isArray(data.dnaSlides) ? data.dnaSlides : [],
      vagas: Array.isArray(data.vagas) ? data.vagas : [],
      feedbacks: Array.isArray(data.feedbacks) ? data.feedbacks : [],
      units: migrateQuoteUnit(Array.isArray(data.units) ? data.units : []),
      aboutPage:
        data.aboutPage && typeof data.aboutPage === "object" ? data.aboutPage : undefined,
      businessPage:
        data.businessPage && typeof data.businessPage === "object"
          ? data.businessPage
          : undefined,
      contactPage:
        data.contactPage && typeof data.contactPage === "object"
          ? data.contactPage
          : undefined,
      careersPage:
        data.careersPage && typeof data.careersPage === "object"
          ? data.careersPage
          : undefined,
      quotePage:
        data.quotePage && typeof data.quotePage === "object" ? data.quotePage : undefined,
      collectionsPage:
        data.collectionsPage && typeof data.collectionsPage === "object"
          ? data.collectionsPage
          : undefined,
      footerLinks:
        data.footerLinks && typeof data.footerLinks === "object"
          ? data.footerLinks
          : undefined,
      homePage:
        data.homePage && typeof data.homePage === "object"
          ? data.homePage
          : emptyHomePage(),
      servicesPage:
        data.servicesPage && typeof data.servicesPage === "object"
          ? data.servicesPage
          : emptyServicesPage(),
    };
    normalized.homePage = normalizeHomeRoot(normalized);

    const migrated = migratePageContent(normalized, {
      siteTexts: readJsonFile<Record<string, unknown>>(storagePaths.siteTexts, {}),
      mediaSlots: mediaSlotsRepository.read<Record<string, unknown>>({}),
    });
    migrated.footerLinks = sanitizeFooterLinks(normalized.footerLinks);

    if (
      shouldPersistPageMigration(data) ||
      !data.footerLinks ||
      !data.homePage?.regionalPresence ||
      !data.homePage?.trackingCta ||
      !Array.isArray(data.homePage?.quickActions) ||
      needsSocialProofMigration(data) ||
      needsQuoteUnitMigration(Array.isArray(data.units) ? data.units : [])
    ) {
      writeJsonFile(storagePaths.content, serializeContent(migrated));
    }

    return migrated;
  },
  write(content: ContentData): void {
    writeJsonFile(storagePaths.content, serializeContent(content));
  },
};

export const siteTextsRepository = {
  read(): Record<string, string> {
    return readJsonFile<Record<string, string>>(storagePaths.siteTexts, {});
  },
  write(data: Record<string, string>): void {
    writeJsonFile(storagePaths.siteTexts, data);
  },
};
