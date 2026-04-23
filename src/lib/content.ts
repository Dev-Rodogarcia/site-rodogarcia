/**
 * Leitura e escrita type-safe do content.json — portado de server.js
 */

import fs from "fs";
import path from "path";
import type { ContentData } from "@/types/content";
import { sanitizeText, sanitizeUrl, sanitizeHexColor } from "./sanitize";
import { storagePaths } from "./storagePaths";

const CONTENT_FILE = storagePaths.content;
const SITE_TEXTS_FILE = storagePaths.siteTexts;

const DEFAULT_CONTENT: ContentData = {
  heroSlides: [],
  dnaSlides: [],
  feedbacks: [],
  vagas: [],
};

// Using any[] internally for JSON data since JSON structure may differ from strict types
type RawItem = Record<string, unknown> & { order?: number };

function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return defaultValue;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

function sortByOrder(arr: RawItem[]): RawItem[] {
  return [...arr].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function normalizeHeroLayoutMode(value: unknown): "text-image" | "full-image" {
  return value === "full-image" ? "full-image" : "text-image";
}

function normalizeHeroBackgroundType(value: unknown): "wavy" | "straight" {
  return value === "straight" ? "straight" : "wavy";
}

function normalizeButtonVariant(value: unknown): "solid" | "outline" {
  return value === "outline" ? "outline" : "solid";
}

function normalizeDnaLayoutMode(value: unknown): "text-image" | "full-image" {
  return value === "full-image" ? "full-image" : "text-image";
}

export function readContentData(): ContentData {
  const data = readJsonFile(CONTENT_FILE, DEFAULT_CONTENT);
  return {
    heroSlides: Array.isArray(data.heroSlides) ? data.heroSlides : [],
    dnaSlides: Array.isArray(data.dnaSlides) ? data.dnaSlides : [],
    vagas: Array.isArray(data.vagas) ? data.vagas : [],
    feedbacks: Array.isArray(data.feedbacks) ? data.feedbacks : [],
  };
}

export function writeContentData(content: ContentData): void {
  const rawContent = content as unknown as Record<string, RawItem[]>;
  const safePayload = {
    heroSlides: sortByOrder(Array.isArray(rawContent.heroSlides) ? rawContent.heroSlides : []),
    dnaSlides: sortByOrder(Array.isArray(rawContent.dnaSlides) ? rawContent.dnaSlides : []),
    vagas: sortByOrder(Array.isArray(rawContent.vagas) ? rawContent.vagas : []),
    feedbacks: sortByOrder(Array.isArray(rawContent.feedbacks) ? rawContent.feedbacks : []),
  };
  writeJsonFile(CONTENT_FILE, safePayload);
}

export function readSiteTextsData(): Record<string, string> {
  return readJsonFile(SITE_TEXTS_FILE, {});
}

export function writeSiteTextsData(data: Record<string, string>): void {
  writeJsonFile(SITE_TEXTS_FILE, data);
}

/**
 * Prepara o conteúdo público sanitizado — portado de preparePublicContent() em server.js.
 */
export function preparePublicContent(content: ContentData) {
  // Cast to raw items for flexible field access
  const rawHero = (content.heroSlides as unknown as RawItem[]);
  const rawDna = (content.dnaSlides as unknown as RawItem[]);
  const rawVagas = (content.vagas as unknown as RawItem[]);
  const rawFeedbacks = (content.feedbacks as unknown as RawItem[]);

  const heroSlides = sortByOrder(rawHero)
    .filter((item) => Boolean(item.active))
    .map((item) => {
      const layoutMode = normalizeHeroLayoutMode(item.layoutMode);
      const fullImageButtonsEnabled = Boolean(item.fullImageButtonsEnabled);
      const fullImageBackgroundType = normalizeHeroBackgroundType(
        item.fullImageBackgroundType
      );

      const rawButtons = Array.isArray(item.buttons)
        ? (item.buttons as RawItem[])
        : [];
      const buttons = rawButtons
        .slice(0, 2)
        .map((btn) => ({
          label: sanitizeText(btn.label, 40),
          url: sanitizeUrl(btn.url),
          enabled: Boolean(btn.enabled),
          color: sanitizeHexColor(btn.color),
          variant: normalizeButtonVariant(btn.variant),
        }))
        .filter((btn) => btn.enabled && btn.label && btn.url);

      const exposedButtons =
        layoutMode === "full-image" && !fullImageButtonsEnabled ? [] : buttons;

      return {
        id: String(item.id ?? ""),
        title: sanitizeText(item.title, 120),
        description: sanitizeText(item.description, 420),
        image:
          sanitizeUrl(item.image) ||
          sanitizeUrl(item.desktopImage) ||
          sanitizeUrl(item.mobileImage),
        desktopImage:
          sanitizeUrl(item.desktopImage) || sanitizeUrl(item.image),
        mobileImage:
          sanitizeUrl(item.mobileImage) || sanitizeUrl(item.image),
        layoutMode,
        fullImageButtonsEnabled,
        fullImageBackgroundType,
        buttons: exposedButtons,
      };
    });

  const dnaSlides = sortByOrder(rawDna)
    .filter((item) => Boolean(item.active))
    .map((item) => ({
      id: String(item.id ?? ""),
      title: sanitizeText(item.titulo ?? item.title, 120),
      text: sanitizeText(item.descricao ?? item.text, 420),
      image:
        sanitizeUrl(item.imagem ?? item.image) ||
        sanitizeUrl(item.desktopImage) ||
        sanitizeUrl(item.mobileImage),
      desktopImage:
        sanitizeUrl(item.desktopImage) || sanitizeUrl(item.imagem ?? item.image),
      mobileImage:
        sanitizeUrl(item.mobileImage) || sanitizeUrl(item.imagem ?? item.image),
      layoutMode: normalizeDnaLayoutMode(item.layoutMode),
    }));

  const featuredJobs = sortByOrder(rawVagas)
    .filter((item) => item.ativo !== false && item.active !== false && Boolean(item.featured))
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
        photo: sanitizeUrl(item.photo ?? item.image),
      highlight: sanitizeText(item.highlight ?? item.resultadoTexto, 120),
      resultadoIcon: sanitizeText(item.resultadoIcon, 40),
      resultadoTexto: sanitizeText(item.resultadoTexto, 120),
    }));

  return {
    heroSlides,
    dnaSlides,
    featuredJobs,
    feedbacks,
    siteTexts: readSiteTextsData(),
    updatedAt: new Date().toISOString(),
  };
}
