import { storagePaths } from "../config/storagePaths.js";
import { sanitizeFooterLinks } from "../services/footerLinksContent.js";
import { migratePageContent } from "../services/pageContent.js";
import type { ContentData, HomePageContent, ServicesPageContent } from "../types/content.js";
import { readJsonFile, writeJsonFile } from "../utils/jsonStore.js";
import { mediaSlotsRepository } from "./jsonRepositories.js";

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

const DEFAULT_CONTENT: ContentData = {
  homePage: emptyHomePage(),
  servicesPage: emptyServicesPage(),
  heroSlides: [],
  dnaSlides: [],
  feedbacks: [],
  vagas: [],
  units: [],
};

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
    data.quotePage
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

function normalizeHomeRoot(content: ContentData) {
  const homePage = content.homePage && typeof content.homePage === "object"
    ? content.homePage
    : emptyHomePage();
  const homeRecord = homePage as unknown as Record<string, unknown>;
  const migratedUnits =
    Array.isArray(content.units) && content.units.length > 0
      ? sortByOrder(content.units as unknown as RawItem[]).map(homeUnitFromLegacy)
      : [];

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
      units: Array.isArray(data.units) ? data.units : [],
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
      !data.homePage?.trackingCta
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
