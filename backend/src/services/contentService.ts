import type { ContentData } from "../types/content.js";
import { contentRepository, siteTextsRepository } from "../repositories/contentRepository.js";
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
    heroSlides,
    dnaSlides,
    featuredJobs,
    feedbacks,
    units,
    siteTexts: readSiteTextsData(),
    updatedAt: new Date().toISOString(),
  };
}
