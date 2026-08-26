import { seoSettingsRepository } from "../repositories/jsonRepositories.js";
import { HttpError } from "../utils/http.js";
import {
  sanitizeMultilineText,
  sanitizePath,
  sanitizeText,
  sanitizeUrl,
} from "../utils/sanitize.js";
import { recordAuditAction } from "./auditService.js";
import type { Request } from "express";
import { sanitizeInternalImageUrl } from "./mediaValidationService.js";

const DEFAULT_ROUTES = [
  { path: "/", label: "Home", title: "Rodogarcia Transportes | Logística com previsibilidade nacional" },
  { path: "/servicos", label: "Serviços", title: "Serviços | Rodogarcia Transportes" },
  { path: "/sobre", label: "Sobre", title: "Sobre a Rodogarcia" },
  { path: "/para-empresas", label: "Para Empresas", title: "Para Empresas | Rodogarcia Transportes" },
  { path: "/cotacao", label: "Cotação", title: "Cotação | Rodogarcia Transportes" },
  { path: "/fale-conosco", label: "Contato", title: "Contato | Rodogarcia Transportes" },
  { path: "/central-ajuda", label: "Central de ajuda", title: "Central de ajuda | Rodogarcia Transportes" },
  { path: "/imprensa", label: "Imprensa", title: "Imprensa | Rodogarcia Transportes" },
  { path: "/trabalhe-conosco", label: "Carreiras", title: "Carreiras | Rodogarcia Transportes" },
  { path: "/termos-de-uso", label: "Termos", title: "Termos de uso | Rodogarcia Transportes" },
  { path: "/privacidade", label: "Privacidade", title: "Privacidade | Rodogarcia Transportes" },
  { path: "/sua-voz", label: "Sua Voz", title: "Sua Voz | Rodogarcia Transportes" },
];

const DEFAULT_DESCRIPTION =
  "Rodogarcia Transportes: soluções logísticas nacionais com segurança, previsibilidade e rastreabilidade.";
const DEFAULT_OG_IMAGE = "/foto5.webp";

export interface SeoPageSettings {
  path: string;
  label: string;
  title: string;
  description: string;
  metaTags: string;
  index: boolean;
  follow: boolean;
  canonical: string;
  slug: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  updatedAt?: string;
}

function defaultPages(): SeoPageSettings[] {
  return DEFAULT_ROUTES.map((route) => ({
    path: route.path,
    label: route.label,
    title: route.title,
    description: DEFAULT_DESCRIPTION,
    metaTags: "",
    index: true,
    follow: true,
    canonical: route.path,
    slug: route.path === "/" ? "/" : route.path.replace(/^\//, ""),
    ogTitle: route.title,
    ogDescription: DEFAULT_DESCRIPTION,
    ogImage: DEFAULT_OG_IMAGE,
  }));
}

function readRawSettings() {
  return seoSettingsRepository.read<{ pages: SeoPageSettings[]; updatedAt: string }>({
    pages: defaultPages(),
    updatedAt: new Date().toISOString(),
  });
}

function isSeoRecord(value: unknown): value is Partial<SeoPageSettings> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sanitizeCanonical(value: unknown, fallback: string) {
  const canonical = sanitizeUrl(value);
  return canonical.startsWith("/") || /^https?:\/\//i.test(canonical)
    ? canonical
    : fallback;
}

function normalizeOgImage(
  value: unknown,
  fallback: string,
  strictMedia: boolean
) {
  try {
    return sanitizeInternalImageUrl(value, "SEO: imagem social") || fallback;
  } catch (error) {
    if (strictMedia) throw error;
    return fallback;
  }
}

function normalizePage(
  input: Partial<SeoPageSettings>,
  fallback?: SeoPageSettings,
  strictMedia = false
): SeoPageSettings {
  const path = sanitizePath(input.path) || fallback?.path || "/";
  const title = sanitizeText(input.title, 90) || fallback?.title || "Rodogarcia Transportes";
  const description = sanitizeText(input.description, 180) || fallback?.description || DEFAULT_DESCRIPTION;
  const canonical = sanitizeCanonical(input.canonical, path);
  return {
    path,
    label: sanitizeText(input.label, 80) || fallback?.label || path,
    title,
    description,
    metaTags: sanitizeMultilineText(input.metaTags, 1000),
    index: typeof input.index === "boolean" ? input.index : fallback?.index ?? true,
    follow: typeof input.follow === "boolean" ? input.follow : fallback?.follow ?? true,
    canonical,
    slug: path === "/" ? "/" : path.replace(/^\//, ""),
    ogTitle: sanitizeText(input.ogTitle, 95) || title,
    ogDescription: sanitizeText(input.ogDescription, 220) || description,
    ogImage: normalizeOgImage(input.ogImage, fallback?.ogImage || DEFAULT_OG_IMAGE, strictMedia),
    updatedAt: input.updatedAt,
  };
}

export function readSeoSettings() {
  const raw = readRawSettings();
  const rawPages = Array.isArray(raw.pages) ? raw.pages.filter(isSeoRecord) : [];
  const existing = new Map(rawPages.map((page) => [page.path, page]));
  const pages = defaultPages().map((defaults) => normalizePage(existing.get(defaults.path) ?? defaults, defaults));
  return {
    pages,
    updatedAt: raw.updatedAt,
  };
}

export function updateSeoPage(req: Request | undefined, body: Record<string, unknown>) {
  const path = sanitizePath(body.path);
  if (!path) throw new HttpError(422, "Rota SEO invalida.");
  if (!DEFAULT_ROUTES.some((route) => route.path === path)) {
    throw new HttpError(422, "A rota SEO não pertence ao conjunto público editável.");
  }
  if ("canonical" in body && !sanitizeCanonical(body.canonical, "")) {
    throw new HttpError(422, "Canonical deve ser um caminho interno ou URL HTTP(S) válida.");
  }
  if ("title" in body && !sanitizeText(body.title, 90)) {
    throw new HttpError(422, "Título SEO é obrigatório.");
  }
  if ("description" in body && !sanitizeText(body.description, 180)) {
    throw new HttpError(422, "Descrição SEO é obrigatória.");
  }
  const settings = readSeoSettings();
  const current = settings.pages.find((page) => page.path === path);
  const nextPage = normalizePage(
    { ...current, ...body, updatedAt: new Date().toISOString() },
    current,
    true
  );
  if (nextPage.title.length < 8) throw new HttpError(422, "Título SEO muito curto.");
  if (nextPage.description.length < 40) throw new HttpError(422, "Descrição SEO muito curta.");

  const pages = settings.pages.some((page) => page.path === path)
    ? settings.pages.map((page) => (page.path === path ? nextPage : page))
    : [...settings.pages, nextPage];
  const next = { pages, updatedAt: new Date().toISOString() };
  seoSettingsRepository.write(next);
  recordAuditAction({
    req,
    action: "seo.update",
    target: path,
    metadata: { title: nextPage.title, index: String(nextPage.index) },
  });
  return next;
}

export function getPublicSeoPage(pathRaw: unknown) {
  const path = sanitizePath(pathRaw) || "/";
  return readSeoSettings().pages.find((page) => page.path === path) ?? null;
}
