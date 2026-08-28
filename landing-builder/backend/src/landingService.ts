import crypto from "node:crypto";
import { z } from "zod";
import { assertLandingMediaUrl, getLandingMediaByUrl } from "./mediaService.js";
import { readLandings, writeLandings } from "./store.js";
import { campaignV1Schema } from "./templates/campaignV1.js";
import type { LandingPage, LandingSeo, LandingStatus, PublicLandingIndexItem, PublicLandingPage } from "./types.js";

export class LandingServiceError extends Error {
  constructor(message: string, readonly statusCode: 404 | 422) {
    super(message);
    this.name = "LandingServiceError";
  }
}

const slugSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(2).max(80);
const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const optionalId = z.string().trim().max(80).optional().default("");
const text = (max: number) => z.string().trim().max(max).optional().default("");
const RESERVED_SLUGS = new Set([
  "admin", "api", "auth", "developer", "health", "preview", "public", "uploads", "landing-assets", "_next",
  "central-ajuda", "coletas", "cotacao", "fale-conosco", "imprensa", "melhoria-continua", "para-empresas",
  "privacidade", "servicos", "sobre", "sua-voz", "termos-de-uso", "trabalhe-conosco",
  "inicio", "home", "institucional", "empresa", "quem-somos", "transportes", "nossos-servicos", "contato",
  "contact", "quote", "orcamento", "coleta", "solicitar-coleta", "careers", "vagas", "ajuda", "help", "faq",
  "press", "midia", "empresas", "b2b", "termos", "politica", "politica-de-privacidade", "canal-de-denuncias", "rastrear-encomenda",
]);
const themeSchema = z.preprocess((value) => value ?? {}, z.object({
  primaryColor: colorSchema.optional().default("#111111"),
  secondaryColor: colorSchema.optional().default("#111111"),
  backgroundColor: colorSchema.optional().default("#ffffff"),
  textColor: colorSchema.optional().default("#111111"),
  font: z.enum(["system", "space-grotesk", "plus-jakarta"]).optional().default("system"),
}));
const analyticsSchema = z.preprocess((value) => value ?? {}, z.object({
  ga4MeasurementId: optionalId.refine((value) => !value || /^G-[A-Z0-9]{4,}$/i.test(value), "Measurement ID GA4 inválido."),
  gtmContainerId: optionalId.refine((value) => !value || /^GTM-[A-Z0-9]+$/i.test(value), "ID do GTM inválido."),
  metaPixelId: optionalId.refine((value) => !value || /^\d{5,30}$/.test(value), "ID do Meta Pixel inválido."),
  googleAdsId: optionalId.refine((value) => !value || /^AW-[A-Z0-9]+$/i.test(value), "ID do Google Ads inválido."),
}));
const seoSchema = z.preprocess((value) => value ?? {}, z.object({
  title: text(70),
  description: text(160),
  index: z.boolean().optional().default(true),
}));
const landingInputSchema = campaignV1Schema.extend({
  name: text(120),
  slug: slugSchema,
  seo: seoSchema,
  theme: themeSchema,
  analytics: analyticsSchema,
});

function normalizeSlug(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function createPreviewToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function isPreviewToken(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
}

function tokenMatches(stored: unknown, received: unknown) {
  if (!isPreviewToken(stored) || !isPreviewToken(received)) return false;
  const expected = Buffer.from(stored);
  const provided = Buffer.from(received);
  return expected.length === provided.length && crypto.timingSafeEqual(expected, provided);
}

function normalizeSeo(landing: Pick<LandingPage, "hero"> & { seo?: Partial<LandingSeo> }): LandingSeo {
  return {
    title: typeof landing.seo?.title === "string" && landing.seo.title.trim()
      ? landing.seo.title.trim().slice(0, 70)
      : landing.hero.title.trim().slice(0, 70),
    description: typeof landing.seo?.description === "string" && landing.seo.description.trim()
      ? landing.seo.description.trim().slice(0, 160)
      : landing.hero.description.trim().slice(0, 160),
    index: landing.seo?.index !== false,
  };
}

function publicMediaUrl(value: unknown) {
  return getLandingMediaByUrl(value)?.url ?? "";
}

function ensureLandingMetadata(landing: LandingPage): LandingPage {
  const parsed = landingInputSchema.safeParse(landing);
  const normalized = parsed.success ? { ...landing, ...parsed.data } : landing;
  const previewToken = isPreviewToken(normalized.previewToken) ? normalized.previewToken : createPreviewToken();
  const seo = normalizeSeo(normalized);
  const withMetadata = { ...normalized, previewToken, seo };
  return JSON.stringify(withMetadata) === JSON.stringify(landing) ? landing : withMetadata;
}

function readNormalizedLandings() {
  const landings = readLandings();
  const normalized = landings.map(ensureLandingMetadata);
  if (normalized.some((landing, index) => landing !== landings[index])) writeLandings(normalized);
  return normalized;
}

function assertSlugAllowed(slug: string) {
  if (RESERVED_SLUGS.has(slug)) {
    throw new LandingServiceError("Esta rota é reservada pelo site institucional.", 422);
  }
}

function assertSlugAvailable(slug: string, currentId?: string) {
  assertSlugAllowed(slug);
  const exists = readLandings().some((landing) => landing.slug === slug && landing.id !== currentId);
  if (exists) throw new LandingServiceError("Já existe uma landing page com esta rota.", 422);
}

function parseInput(input: unknown) {
  const parsed = landingInputSchema.safeParse(input);
  if (!parsed.success) throw new LandingServiceError("Revise os campos da landing page.", 422);
  if (!parsed.data.name || !parsed.data.hero.title || !parsed.data.lowerSection.title) {
    throw new LandingServiceError("Informe o nome, o título do Hero e o título da seção inferior.", 422);
  }
  const values = {
    ...parsed.data,
    seo: normalizeSeo({ hero: parsed.data.hero, seo: parsed.data.seo }),
  };
  for (const mediaUrl of [values.hero.logo, values.hero.backgroundImage, values.story.image]) {
    if (mediaUrl) assertLandingMediaUrl(mediaUrl);
  }
  return values;
}

export function listLandings() {
  return readNormalizedLandings().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getPublishedLanding(slugInput: unknown) {
  const slug = normalizeSlug(slugInput);
  return readNormalizedLandings().find((landing) => landing.slug === slug && landing.status === "published") ?? null;
}

export function getPreviewLanding(token: unknown) {
  return readNormalizedLandings().find((landing) => tokenMatches(landing.previewToken, token)) ?? null;
}

export function listPublishedLandingIndex(): PublicLandingIndexItem[] {
  return readNormalizedLandings()
    .filter((landing) => landing.status === "published" && normalizeSeo(landing).index)
    .sort((left, right) => left.slug.localeCompare(right.slug))
    .map((landing) => ({ slug: landing.slug, updatedAt: landing.updatedAt }));
}

export function toPublicLanding(landing: LandingPage): PublicLandingPage {
  return {
    template: landing.template,
    name: landing.name,
    slug: landing.slug,
    seo: normalizeSeo(landing),
    theme: {
      primaryColor: landing.theme.primaryColor,
      secondaryColor: landing.theme.secondaryColor,
      backgroundColor: landing.theme.backgroundColor,
      textColor: landing.theme.textColor,
      font: landing.theme.font,
    },
    analytics: {
      ga4MeasurementId: landing.analytics.ga4MeasurementId,
    },
    hero: {
      phone: landing.hero.phone,
      email: landing.hero.email,
      logo: publicMediaUrl(landing.hero.logo),
      backgroundImage: publicMediaUrl(landing.hero.backgroundImage),
      eyebrow: landing.hero.eyebrow,
      title: landing.hero.title,
      description: landing.hero.description,
      ctaLabel: landing.hero.ctaLabel,
      ctaUrl: landing.hero.ctaUrl,
      highlights: landing.hero.highlights.map((highlight) => ({
        title: highlight.title,
        description: highlight.description,
      })),
    },
    lowerSection: {
      visible: landing.lowerSection.visible,
      title: landing.lowerSection.title,
      description: landing.lowerSection.description,
      ctaLabel: landing.lowerSection.ctaLabel,
      ctaUrl: landing.lowerSection.ctaUrl,
    },
    benefits: {
      visible: landing.benefits.visible,
      eyebrow: landing.benefits.eyebrow,
      title: landing.benefits.title,
      description: landing.benefits.description,
      items: landing.benefits.items.map((item) => ({ title: item.title, description: item.description })),
    },
    story: {
      visible: landing.story.visible,
      eyebrow: landing.story.eyebrow,
      title: landing.story.title,
      description: landing.story.description,
      image: publicMediaUrl(landing.story.image),
      ctaLabel: landing.story.ctaLabel,
      ctaUrl: landing.story.ctaUrl,
    },
    metrics: {
      visible: landing.metrics.visible,
      eyebrow: landing.metrics.eyebrow,
      title: landing.metrics.title,
      items: landing.metrics.items.map((item) => ({ value: item.value, label: item.label })),
    },
    testimonial: {
      visible: landing.testimonial.visible,
      eyebrow: landing.testimonial.eyebrow,
      title: landing.testimonial.title,
      quote: landing.testimonial.quote,
      author: landing.testimonial.author,
      role: landing.testimonial.role,
    },
    faq: {
      visible: landing.faq.visible,
      eyebrow: landing.faq.eyebrow,
      title: landing.faq.title,
      items: landing.faq.items.map((item) => ({ question: item.question, answer: item.answer })),
    },
    finalCta: {
      visible: landing.finalCta.visible,
      eyebrow: landing.finalCta.eyebrow,
      title: landing.finalCta.title,
      description: landing.finalCta.description,
      ctaLabel: landing.finalCta.ctaLabel,
      ctaUrl: landing.finalCta.ctaUrl,
    },
    footer: {
      brand: landing.footer.brand,
      description: landing.footer.description,
      phone: landing.footer.phone,
      email: landing.footer.email,
      legalText: landing.footer.legalText,
    },
  };
}

export function toInternalLanding(landing: LandingPage) {
  const { previewToken: _previewToken, ...publicToService } = ensureLandingMetadata(landing);
  return publicToService;
}

export function createLanding(input: unknown) {
  const values = parseInput(input);
  assertSlugAvailable(values.slug);
  const now = new Date().toISOString();
  const landing: LandingPage = {
    id: `landing_${crypto.randomUUID()}`,
    ...values,
    previewToken: createPreviewToken(),
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
  const landings = readNormalizedLandings();
  landings.push(landing);
  writeLandings(landings);
  return landing;
}

export function updateLanding(id: string, input: unknown) {
  const values = parseInput(input);
  const landings = readNormalizedLandings();
  const index = landings.findIndex((landing) => landing.id === id);
  if (index < 0) throw new LandingServiceError("Landing page não encontrada.", 404);
  assertSlugAvailable(values.slug, id);
  const current = ensureLandingMetadata(landings[index]!);
  const updated: LandingPage = { ...current, ...values, updatedAt: new Date().toISOString() };
  landings[index] = updated;
  writeLandings(landings);
  return updated;
}

export function setLandingStatus(id: string, status: LandingStatus) {
  const landings = readNormalizedLandings();
  const index = landings.findIndex((landing) => landing.id === id);
  if (index < 0) throw new LandingServiceError("Landing page não encontrada.", 404);
  const current = ensureLandingMetadata(landings[index]!);
  if (status === "published") assertSlugAvailable(current.slug, current.id);
  const now = new Date().toISOString();
  const updated: LandingPage = {
    ...current,
    status,
    updatedAt: now,
    publishedAt: status === "published" ? now : current.publishedAt,
  };
  landings[index] = updated;
  writeLandings(landings);
  return updated;
}

export function provisionLandingPreview(id: string, rotate = false) {
  const landings = readNormalizedLandings();
  const index = landings.findIndex((landing) => landing.id === id);
  if (index < 0) throw new LandingServiceError("Landing page não encontrada.", 404);
  const current = ensureLandingMetadata(landings[index]!);
  const previewToken = rotate ? createPreviewToken() : current.previewToken;
  const updated = previewToken === current.previewToken
    ? current
    : { ...current, previewToken, updatedAt: new Date().toISOString() };
  if (updated !== landings[index]) {
    landings[index] = updated;
    writeLandings(landings);
  }
  return { previewPath: `/preview/${previewToken}` };
}
