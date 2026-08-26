import "server-only";

export interface LandingTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  font: "system" | "space-grotesk" | "plus-jakarta";
}

export interface LandingSeo {
  title: string;
  description: string;
  index: boolean;
}

export interface PublicLandingPage {
  name: string;
  slug: string;
  seo: LandingSeo;
  theme: LandingTheme;
  analytics: { ga4MeasurementId: string };
  hero: {
    phone: string;
    email: string;
    logo: string;
    backgroundImage: string;
    eyebrow: string;
    title: string;
    description: string;
    ctaLabel: string;
    ctaUrl: string;
    highlights: Array<{ title: string; description: string }>;
  };
  lowerSection: {
    title: string;
    description: string;
    ctaLabel: string;
    ctaUrl: string;
  };
}

export interface PublishedLandingIndexItem {
  slug: string;
  updatedAt: string;
}

const FALLBACK_SITE_URL = "http://127.0.0.1:5012";
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const hexColorPattern = /^#[0-9a-f]{6}$/i;
const ga4MeasurementIdPattern = /^G-[A-Z0-9]{4,}$/i;
const internalMediaPattern = /^\/landing-media(?:\/[A-Za-z0-9][A-Za-z0-9._-]*)+$/;

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function string(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeSlug(value: unknown) {
  const slug = string(value, 80).toLowerCase();
  return slugPattern.test(slug) ? slug : "";
}

function normalizeColor(value: unknown, fallback: string) {
  const color = string(value, 7);
  return hexColorPattern.test(color) ? color : fallback;
}

function normalizeMediaUrl(value: unknown) {
  const url = string(value, 300);
  return internalMediaPattern.test(url) ? url : "";
}

function normalizeActionUrl(value: unknown) {
  const url = string(value, 400);
  if (!url) return "";
  if (/^\/(?!\/)[^\s\\]*$/.test(url)) return url;

  try {
    const parsed = new URL(url);
    return ["https:", "mailto:", "tel:"].includes(parsed.protocol) ? url : "";
  } catch {
    return "";
  }
}

function normalizeHighlights(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 4).flatMap((item) => {
    const itemRecord = record(item);
    if (!itemRecord) return [];
    const title = string(itemRecord.title, 80);
    const description = string(itemRecord.description, 220);
    return title || description ? [{ title, description }] : [];
  });
}

function normalizeLanding(value: unknown): PublicLandingPage | null {
  const input = record(value);
  if (!input) return null;

  const name = string(input.name, 120);
  const slug = normalizeSlug(input.slug);
  const hero = record(input.hero);
  const lowerSection = record(input.lowerSection);
  if (!name || !slug || !hero || !lowerSection) return null;

  const heroTitle = string(hero.title, 180);
  const lowerTitle = string(lowerSection.title, 180);
  if (!heroTitle || !lowerTitle) return null;

  const themeInput = record(input.theme) ?? {};
  const analyticsInput = record(input.analytics) ?? {};
  const seoInput = record(input.seo) ?? {};
  const measurementId = string(analyticsInput.ga4MeasurementId, 80);

  return {
    name,
    slug,
    seo: {
      title: string(seoInput.title, 180) || heroTitle,
      description: string(seoInput.description, 320) || string(hero.description, 700),
      index: seoInput.index !== false,
    },
    theme: {
      primaryColor: normalizeColor(themeInput.primaryColor, "#111111"),
      secondaryColor: normalizeColor(themeInput.secondaryColor, "#111111"),
      backgroundColor: normalizeColor(themeInput.backgroundColor, "#ffffff"),
      textColor: normalizeColor(themeInput.textColor, "#111111"),
      font: themeInput.font === "space-grotesk" || themeInput.font === "plus-jakarta" ? themeInput.font : "system",
    },
    analytics: { ga4MeasurementId: ga4MeasurementIdPattern.test(measurementId) ? measurementId : "" },
    hero: {
      phone: string(hero.phone, 40),
      email: string(hero.email, 160),
      logo: normalizeMediaUrl(hero.logo),
      backgroundImage: normalizeMediaUrl(hero.backgroundImage),
      eyebrow: string(hero.eyebrow, 80),
      title: heroTitle,
      description: string(hero.description, 700),
      ctaLabel: string(hero.ctaLabel, 70),
      ctaUrl: normalizeActionUrl(hero.ctaUrl),
      highlights: normalizeHighlights(hero.highlights),
    },
    lowerSection: {
      title: lowerTitle,
      description: string(lowerSection.description, 900),
      ctaLabel: string(lowerSection.ctaLabel, 70),
      ctaUrl: normalizeActionUrl(lowerSection.ctaUrl),
    },
  };
}

function backendUrl() {
  return (process.env.LANDING_BUILDER_BACKEND_URL ?? "http://127.0.0.1:6110").replace(/\/+$/, "");
}

async function fetchPayload(path: string) {
  try {
    const response = await fetch(`${backendUrl()}${path}`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    return await response.json() as unknown;
  } catch {
    return null;
  }
}

export async function fetchLanding(slug: string): Promise<PublicLandingPage | null> {
  const payload = await fetchPayload(`/api/public/landings/${encodeURIComponent(slug)}`);
  return normalizeLanding(record(payload)?.landing);
}

export async function fetchPreviewLanding(token: string): Promise<PublicLandingPage | null> {
  const normalizedToken = string(token, 200);
  if (!normalizedToken) return null;
  const payload = await fetchPayload(`/api/public/previews/${encodeURIComponent(normalizedToken)}`);
  return normalizeLanding(record(payload)?.landing);
}

export async function fetchPublishedLandingIndex(): Promise<PublishedLandingIndexItem[]> {
  const payload = record(await fetchPayload("/api/public/landings"));
  const values = payload?.landings;
  if (!Array.isArray(values)) return [];

  return values.flatMap((item) => {
    const indexItem = record(item);
    const slug = normalizeSlug(indexItem?.slug);
    const updatedAt = string(indexItem?.updatedAt, 40);
    const date = new Date(updatedAt);
    return slug && !Number.isNaN(date.getTime()) ? [{ slug, updatedAt: date.toISOString() }] : [];
  });
}

export function builderSiteUrl() {
  const configured = (process.env.LANDING_BUILDER_SITE_URL ?? FALLBACK_SITE_URL).trim();
  try {
    const url = new URL(configured);
    if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("invalid protocol");
    return new URL(url.origin);
  } catch {
    return new URL(FALLBACK_SITE_URL);
  }
}

export function landingUrl(slug: string) {
  return new URL(`/${slug}`, builderSiteUrl());
}
