import type {
  ContentData,
  HomeFeedback,
  HomeHeroButton,
  HomeHeroMode,
  HomeMedia,
  HomeMediaType,
  HomeOperationItem,
  HomePageContent,
  HomeRegionalUnit,
  ServicesFaq,
  ServicesFinalCta,
  ServicesModule,
  ServicesPageContent,
} from "../types/content.js";
import { contentRepository, siteTextsRepository } from "../repositories/contentRepository.js";
import { getAllPageContent } from "./pageContent.js";
import { sanitizeHexColor, sanitizeText, sanitizeUrl } from "../utils/sanitize.js";

type RawItem = Record<string, unknown> & { order?: number };

function sortByOrder(arr: RawItem[]): RawItem[] {
  return [...arr].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function normalizeHeroLayoutMode(value: unknown): "text-image" | "full-image" {
  return value === "full-image" ? "full-image" : "text-image";
}

function normalizeButtonVariant(value: unknown): "solid" | "outline" {
  return value === "outline" ? "outline" : "solid";
}

function normalizeBackgroundType(value: unknown): "wavy" | "straight" {
  return value === "straight" ? "straight" : "wavy";
}

function publicAssetUrl(value: unknown) {
  const url = sanitizeUrl(value);
  if (url.startsWith("/public/")) return url.slice("/public".length) || "/";
  return url;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function arrayValue(value: unknown): RawItem[] {
  return Array.isArray(value) ? (value as RawItem[]) : [];
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

function inferHomeMediaType(src: string, explicitType: unknown): HomeMediaType {
  if (explicitType === "video") return "video";
  if (/\.(mp4|webm|ogg)$/i.test(src)) return "video";
  return "image";
}

function normalizeHomeMedia(value: unknown): HomeMedia {
  const media = isRecord(value) ? value : {};
  const src = publicAssetUrl(media.src);
  return {
    type: inferHomeMediaType(src, media.type),
    src,
    alt: sanitizeText(media.alt, 140),
    poster: publicAssetUrl(media.poster),
    desktopSrc: publicAssetUrl(media.desktopSrc),
    mobileSrc: publicAssetUrl(media.mobileSrc),
  };
}

function normalizeHomeHeroMode(value: unknown): HomeHeroMode {
  if (value === "media-only") return "media-only";
  if (value === "text-media") return "text-media";
  return "text-media-buttons";
}

function normalizeHomeButtons(value: unknown): HomeHeroButton[] {
  return Array.isArray(value)
    ? (value as RawItem[])
        .slice(0, 2)
        .map((button) => ({
          label: sanitizeText(button.label, 40),
          url: sanitizeUrl(button.url),
          enabled: Boolean(button.enabled),
          color: sanitizeHexColor(button.color),
          variant: normalizeButtonVariant(button.variant),
        }))
        .filter((button) => button.enabled && button.label && button.url)
    : [];
}

function normalizeTrackingButtons(value: unknown): HomeHeroButton[] {
  const fallback = emptyHomePage().trackingCta.buttons;
  const raw = Array.isArray(value) ? (value as RawItem[]) : [];
  return Array.from({ length: 2 }, (_, index) => {
    const button = raw[index] ?? {};
    return {
      label: sanitizeText(button.label, 40) || fallback[index]?.label || "",
      url: sanitizeUrl(button.url) || fallback[index]?.url || "",
      enabled: button.enabled === undefined ? true : Boolean(button.enabled),
      color: sanitizeHexColor(button.color) || fallback[index]?.color,
      variant: normalizeButtonVariant(button.variant ?? fallback[index]?.variant),
    };
  });
}

function normalizeHomeRegionalUnits(value: unknown): HomeRegionalUnit[] {
  return sortByOrder(arrayValue(value))
    .filter((unit) => unit.active !== false)
    .slice(0, 24)
    .map((unit, index) => ({
      id: String(unit.id ?? `home-regional-unit-${index + 1}`),
      order: Number(unit.order ?? index + 1),
      name: sanitizeText(unit.name, 90),
      state: sanitizeText(unit.state, 2).toUpperCase(),
      description: sanitizeText(unit.description, 220),
      linkedUnitId: sanitizeText(unit.linkedUnitId, 80),
      address: sanitizeText(unit.address, 220),
      phone: sanitizeText(unit.phone, 60),
      email: sanitizeText(unit.email, 120),
      buttonLabel: sanitizeText(unit.buttonLabel, 40) || "Falar com esta unidade",
      contactUrl: sanitizeUrl(unit.contactUrl),
      active: true,
    }))
    .filter((unit) => unit.name && unit.state && unit.description && unit.address && unit.contactUrl);
}

function normalizeHomePage(content: ContentData): HomePageContent {
  const source: Record<string, unknown> = isRecord(content.homePage)
    ? (content.homePage as unknown as Record<string, unknown>)
    : {};
  const homePage = emptyHomePage();

  const rawHero = isRecord(source.hero) ? source.hero : {};
  homePage.hero.slides = sortByOrder(arrayValue(rawHero.slides))
    .filter((item) => item.active !== false)
    .map((item, index) => {
      const mode = normalizeHomeHeroMode(item.mode);
      const title = sanitizeText(item.title, 120);
      const description = sanitizeText(item.description, 420);
      const media = normalizeHomeMedia(item.media);
      return {
        id: String(item.id ?? `home-hero-${index + 1}`),
        order: Number(item.order ?? index + 1),
        title,
        description,
        media,
        active: true,
        mode,
        buttons: mode === "text-media-buttons" ? normalizeHomeButtons(item.buttons) : [],
      };
    })
    .filter((slide) => {
      if (!slide.media.src) return false;
      if (slide.mode === "media-only") return true;
      return Boolean(slide.title && slide.description);
    });

  const rawSection1 = isRecord(source.section1) ? source.section1 : {};
  const section1Items = sortByOrder(arrayValue(rawSection1.items))
    .slice(0, 3)
    .map((item, index) => ({
      id: String(item.id ?? `home-section1-${index + 1}`),
      order: Number(item.order ?? index + 1),
      title: sanitizeText(item.title, 60),
      description: sanitizeText(item.description, 180),
      media: normalizeHomeMedia(item.media),
    }))
    .filter((item) => item.title && item.description && item.media.src);

  const section1Title = sanitizeText(rawSection1.title, 140);
  const section1CtaLabel = sanitizeText(rawSection1.ctaLabel, 40);
  const section1CtaUrl = sanitizeUrl(rawSection1.ctaUrl);
  if (section1Title && section1CtaLabel && section1CtaUrl && section1Items.length === 3) {
    homePage.section1 = {
      title: section1Title,
      ctaLabel: section1CtaLabel,
      ctaUrl: section1CtaUrl,
      items: section1Items,
    };
  }

  const rawSection2 = isRecord(source.section2) ? source.section2 : {};
  const section2Items: HomeOperationItem[] = sortByOrder(arrayValue(rawSection2.items))
    .filter((item) => item.active !== false)
    .slice(0, 5)
    .map((item, index) => ({
      id: String(item.id ?? `home-section2-${index + 1}`),
      order: Number(item.order ?? index + 1),
      title: sanitizeText(item.title, 120),
      description: sanitizeText(item.description, 260),
      media: normalizeHomeMedia(item.media),
      active: true,
    }))
    .filter((item) => item.title && item.description && item.media.src);

  const section2Title = sanitizeText(rawSection2.title, 160);
  if (section2Title && section2Items.length > 0) {
    homePage.section2 = {
      title: section2Title,
      items: section2Items,
    };
  }

  const rawSection3 = isRecord(source.section3) ? source.section3 : {};
  const section3Cards = sortByOrder(arrayValue(rawSection3.cards))
    .slice(0, 3)
    .map((item, index) => ({
      id: String(item.id ?? `home-section3-${index + 1}`),
      order: Number(item.order ?? index + 1),
      media: normalizeHomeMedia(item.media),
      badge: sanitizeText(item.badge, 60),
      title: sanitizeText(item.title, 80),
      description: sanitizeText(item.description, 320),
      ctaLabel: sanitizeText(item.ctaLabel, 40),
      ctaUrl: sanitizeUrl(item.ctaUrl),
    }))
    .filter(
      (item) =>
        item.media.src &&
        item.badge &&
        item.title &&
        item.description &&
        item.ctaLabel &&
        item.ctaUrl
    );

  const section3Badge = sanitizeText(rawSection3.badge, 60);
  const section3Title = sanitizeText(rawSection3.title, 180);
  const section3Description = sanitizeText(rawSection3.description, 420);
  const section3CtaLabel = sanitizeText(rawSection3.ctaLabel, 40);
  const section3CtaUrl = sanitizeUrl(rawSection3.ctaUrl);
  if (
    section3Badge &&
    section3Title &&
    section3Description &&
    section3CtaLabel &&
    section3CtaUrl &&
    section3Cards.length === 3
  ) {
    homePage.section3 = {
      badge: section3Badge,
      title: section3Title,
      description: section3Description,
      ctaLabel: section3CtaLabel,
      ctaUrl: section3CtaUrl,
      cards: section3Cards,
    };
  }

  const rawRegionalPresence = isRecord(source.regionalPresence)
    ? source.regionalPresence
    : {};
  homePage.regionalPresence = {
    units: normalizeHomeRegionalUnits(rawRegionalPresence.units),
  };

  const rawTrackingCta = isRecord(source.trackingCta) ? source.trackingCta : {};
  homePage.trackingCta = {
    buttons: normalizeTrackingButtons(rawTrackingCta.buttons),
  };

  const rawSocialProof = isRecord(source.socialProof) ? source.socialProof : {};
  const feedbacks: HomeFeedback[] = sortByOrder(arrayValue(rawSocialProof.feedbacks))
    .filter((item) => item.active !== false)
    .map((item, index) => ({
      id: String(item.id ?? `home-feedback-${index + 1}`),
      order: Number(item.order ?? index + 1),
      name: sanitizeText(item.name, 80),
      role: sanitizeText(item.role, 80),
      company: sanitizeText(item.company, 120),
      testimonial: sanitizeText(item.testimonial, 800),
      photo: publicAssetUrl(item.photo),
      rating: Math.min(5, Math.max(1, Math.round(Number(item.rating ?? 5)))),
      active: true,
    }))
    .filter((item) => item.name && item.role && item.company && item.testimonial && item.photo);
  const socialTitle = sanitizeText(rawSocialProof.title, 160);
  if (socialTitle && feedbacks.length > 0) {
    homePage.socialProof = {
      title: socialTitle,
      feedbacks,
    };
  }

  return homePage;
}

function emptyServicesPage(): ServicesPageContent {
  return {
    modules: [],
    finalCta: { quoteUrl: "", trackingUrl: "" },
    faq: { title: "", items: [] },
  };
}

function normalizeServicesModule(item: RawItem, index: number): ServicesModule {
  const image = isRecord(item.image) ? item.image : {};
  const rawDetails = Array.isArray(item.details) ? item.details : [];
  const details = rawDetails.slice(0, 3).map((detail) =>
    isRecord(detail)
      ? sanitizeText(detail.value ?? detail.text ?? detail.label, 120)
      : sanitizeText(detail, 120)
  );

  return {
    id: String(item.id ?? `services-module-${index + 1}`),
    order: Number(item.order ?? index + 1),
    image: {
      src: publicAssetUrl(image.src ?? item.imageSrc),
      alt: sanitizeText(image.alt ?? item.imageAlt, 160),
      position: sanitizeText(image.position, 60),
    },
    eyebrow: sanitizeText(item.eyebrow, 80),
    title: sanitizeText(item.title, 180),
    description: sanitizeText(item.description, 260),
    details,
    ctaLabel: sanitizeText(item.ctaLabel, 40),
    ctaUrl: sanitizeUrl(item.ctaUrl),
  };
}

function normalizeServicesFinalCta(value: unknown): ServicesFinalCta {
  const finalCta = isRecord(value) ? value : {};
  return {
    quoteUrl: sanitizeUrl(finalCta.quoteUrl),
    trackingUrl: sanitizeUrl(finalCta.trackingUrl),
  };
}

function normalizeServicesFaq(value: unknown): ServicesFaq {
  const faq = isRecord(value) ? value : {};
  const items = sortByOrder(arrayValue(faq.items))
    .map((item, index) => ({
      id: String(item.id ?? `services-faq-${index + 1}`),
      order: Number(item.order ?? index + 1),
      question: sanitizeText(item.question, 180),
      answer: sanitizeText(item.answer, 320),
    }))
    .filter((item) => item.question && item.answer);

  return {
    title: sanitizeText(faq.title, 120),
    items,
  };
}

function normalizeServicesPage(content: ContentData): ServicesPageContent {
  const source = isRecord(content.servicesPage)
    ? (content.servicesPage as unknown as Record<string, unknown>)
    : {};
  const servicesPage = emptyServicesPage();

  const rawModules = Array.isArray(source.modules) ? (source.modules as RawItem[]) : [];
  const modules = sortByOrder(rawModules)
    .map((item, index) => normalizeServicesModule(item, index))
    .filter(
      (item) =>
        item.image.src &&
        item.image.alt &&
        item.eyebrow &&
        item.title &&
        item.description &&
        item.details.length === 3 &&
        item.details.every(Boolean) &&
        item.ctaLabel &&
        item.ctaUrl
    );
  if (modules.length === 3) servicesPage.modules = modules;

  servicesPage.finalCta = normalizeServicesFinalCta(source.finalCta);

  const faq = normalizeServicesFaq(source.faq);
  if (faq.title && faq.items.length > 0) servicesPage.faq = faq;

  return servicesPage;
}

export function readContentData() {
  return contentRepository.read();
}

export function writeContentData(content: ContentData) {
  contentRepository.write(content);
}

export function readSiteTextsData() {
  return siteTextsRepository.read();
}

export function writeSiteTextsData(data: Record<string, string>) {
  siteTextsRepository.write(data);
}

export function preparePublicContent(content: ContentData) {
  const rawHero = content.heroSlides as unknown as RawItem[];
  const rawDna = content.dnaSlides as unknown as RawItem[];
  const rawVagas = content.vagas as unknown as RawItem[];
  const rawFeedbacks = content.feedbacks as unknown as RawItem[];
  const rawUnits = content.units as unknown as RawItem[];

  const heroSlides = sortByOrder(rawHero)
    .filter((item) => Boolean(item.active))
    .map((item) => {
      const layoutMode = normalizeHeroLayoutMode(item.layoutMode);
      const fullImageButtonsEnabled = Boolean(item.fullImageButtonsEnabled);
      const rawButtons = Array.isArray(item.buttons)
        ? (item.buttons as RawItem[])
        : [];
      const buttons = rawButtons
        .slice(0, 2)
        .map((button) => ({
          label: sanitizeText(button.label, 40),
          url: sanitizeUrl(button.url),
          enabled: Boolean(button.enabled),
          color: sanitizeHexColor(button.color),
          variant: normalizeButtonVariant(button.variant),
        }))
        .filter((button) => button.enabled && button.label && button.url);

      return {
        id: String(item.id ?? ""),
        title: sanitizeText(item.title, 120),
        description: sanitizeText(item.description, 420),
        image:
          publicAssetUrl(item.image) ||
          publicAssetUrl(item.desktopImage) ||
          publicAssetUrl(item.mobileImage),
        desktopImage: publicAssetUrl(item.desktopImage) || publicAssetUrl(item.image),
        mobileImage: publicAssetUrl(item.mobileImage) || publicAssetUrl(item.image),
        layoutMode,
        fullImageButtonsEnabled,
        fullImageBackgroundType: normalizeBackgroundType(
          item.fullImageBackgroundType
        ),
        buttons:
          layoutMode === "full-image" && !fullImageButtonsEnabled ? [] : buttons,
      };
    });

  const dnaSlides = sortByOrder(rawDna)
    .filter((item) => Boolean(item.active))
    .map((item) => ({
      id: String(item.id ?? ""),
      title: sanitizeText(item.titulo ?? item.title, 120),
      text: sanitizeText(item.descricao ?? item.text, 420),
      image:
        publicAssetUrl(item.imagem ?? item.image) ||
        publicAssetUrl(item.desktopImage) ||
        publicAssetUrl(item.mobileImage),
      video:
        publicAssetUrl(item.video) ||
        publicAssetUrl(item.desktopVideo) ||
        publicAssetUrl(item.mobileVideo),
      desktopImage:
        publicAssetUrl(item.desktopImage) || publicAssetUrl(item.imagem ?? item.image),
      mobileImage:
        publicAssetUrl(item.mobileImage) || publicAssetUrl(item.imagem ?? item.image),
      desktopVideo: publicAssetUrl(item.desktopVideo) || publicAssetUrl(item.video),
      mobileVideo: publicAssetUrl(item.mobileVideo) || publicAssetUrl(item.video),
      layoutMode: normalizeHeroLayoutMode(item.layoutMode),
    }));

  const featuredJobs = sortByOrder(rawVagas)
    .filter(
      (item) =>
        item.ativo !== false && item.active !== false && Boolean(item.featured)
    )
    .map((item) => ({
      id: String(item.id ?? ""),
      title: sanitizeText(item.titulo ?? item.title, 120),
      status: sanitizeText(item.status, 40),
      location: sanitizeText(item.local ?? item.location, 120),
      workType: sanitizeText(item.workType, 40),
      contractType: sanitizeText(item.tipo ?? item.contractType, 40),
      description: sanitizeText(item.descricao ?? item.description, 600),
      applyUrl: sanitizeUrl(item.applyUrl),
    }));

  const feedbacks = sortByOrder(rawFeedbacks)
    .filter((item) => item.ativo !== false && item.active !== false)
    .map((item) => ({
      id: String(item.id ?? ""),
      name: sanitizeText(item.nome ?? item.name, 80),
      role: sanitizeText(item.role, 80),
      company: sanitizeText(item.empresa ?? item.company, 120),
      comment: sanitizeText(item.comment ?? item.texto ?? item.testimonial, 800),
      testimonial: sanitizeText(item.testimonial ?? item.comment ?? item.texto, 800),
      rating: Math.min(5, Math.max(1, Number(item.nota ?? item.rating ?? 5))),
      photo: publicAssetUrl(item.photo ?? item.image),
      highlight: sanitizeText(item.highlight ?? item.resultadoTexto, 120),
      resultadoIcon: sanitizeText(item.resultadoIcon, 40),
      resultadoTexto: sanitizeText(item.resultadoTexto, 120),
    }));

  const units = sortByOrder(rawUnits)
    .filter((item) => item.active !== false && item.ativo !== false)
    .map((item) => ({
      id: String(item.id ?? ""),
      name: sanitizeText(item.name ?? item.nome, 120),
      type: sanitizeText(item.type ?? item.tipo, 40),
      state: sanitizeText(item.state ?? item.estado, 2).toLowerCase(),
      city: sanitizeText(item.city ?? item.cidade, 80),
      address: sanitizeText(item.address ?? item.endereco, 220),
      phone: sanitizeText(item.phone ?? item.telefone, 60),
      email: sanitizeText(item.email, 160),
      contactUrl: sanitizeUrl(item.contactUrl ?? item.linkContato),
      description: sanitizeText(item.description ?? item.descricao, 220),
      logisticsInfo: sanitizeText(item.logisticsInfo ?? item.infoLogistica, 260),
      isDefault: Boolean(item.isDefault ?? item.matriz),
    }))
    .filter((item) => item.id && item.name && item.state && item.address);

  return {
    homePage: normalizeHomePage(content),
    servicesPage: normalizeServicesPage(content),
    ...getAllPageContent(content),
    heroSlides,
    dnaSlides,
    featuredJobs,
    feedbacks,
    units,
    siteTexts: readSiteTextsData(),
    updatedAt: new Date().toISOString(),
  };
}
