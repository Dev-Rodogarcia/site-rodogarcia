import "server-only";

export interface LandingTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  font: "system" | "space-grotesk" | "plus-jakarta";
}

export interface LandingSeo { title: string; description: string; index: boolean; }

export interface PublicLandingPage {
  template: "campaign-v1";
  name: string;
  slug: string;
  seo: LandingSeo;
  theme: LandingTheme;
  analytics: { ga4MeasurementId: string };
  hero: {
    phone: string; email: string; logo: string; backgroundImage: string; eyebrow: string; title: string;
    description: string; ctaLabel: string; ctaUrl: string; highlights: Array<{ title: string; description: string }>;
  };
  lowerSection: { visible: boolean; title: string; description: string; ctaLabel: string; ctaUrl: string };
  benefits: { visible: boolean; eyebrow: string; title: string; description: string; items: Array<{ title: string; description: string }> };
  story: { visible: boolean; eyebrow: string; title: string; description: string; image: string; ctaLabel: string; ctaUrl: string };
  metrics: { visible: boolean; eyebrow: string; title: string; items: Array<{ value: string; label: string }> };
  testimonial: { visible: boolean; eyebrow: string; title: string; quote: string; author: string; role: string };
  faq: { visible: boolean; eyebrow: string; title: string; items: Array<{ question: string; answer: string }> };
  finalCta: { visible: boolean; eyebrow: string; title: string; description: string; ctaLabel: string; ctaUrl: string };
  footer: { brand: string; description: string; phone: string; email: string; legalText: string };
}

export interface PublishedLandingIndexItem { slug: string; updatedAt: string; }

const FALLBACK_SITE_URL = "http://127.0.0.1:35180";
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const hexColorPattern = /^#[0-9a-f]{6}$/i;
const ga4MeasurementIdPattern = /^G-[A-Z0-9]{4,}$/i;
const internalMediaPattern = /^\/landing-media(?:\/[A-Za-z0-9][A-Za-z0-9._-]*)+$/;

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function string(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function visible(value: unknown) { return value !== false; }

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

function normalizeBenefits(value: unknown): PublicLandingPage["benefits"] {
  const input = record(value) ?? {};
  const items = Array.isArray(input.items) ? input.items.slice(0, 6).flatMap((item) => {
    const entry = record(item);
    const title = string(entry?.title, 80);
    const description = string(entry?.description, 220);
    return title || description ? [{ title, description }] : [];
  }) : [];
  return { visible: visible(input.visible), eyebrow: string(input.eyebrow, 80), title: string(input.title, 180), description: string(input.description, 700), items };
}

function normalizeMetrics(value: unknown): PublicLandingPage["metrics"] {
  const input = record(value) ?? {};
  const items = Array.isArray(input.items) ? input.items.slice(0, 4).flatMap((item) => {
    const entry = record(item);
    const metricValue = string(entry?.value, 40);
    const label = string(entry?.label, 120);
    return metricValue || label ? [{ value: metricValue, label }] : [];
  }) : [];
  return { visible: visible(input.visible), eyebrow: string(input.eyebrow, 80), title: string(input.title, 180), items };
}

function normalizeFaq(value: unknown): PublicLandingPage["faq"] {
  const input = record(value) ?? {};
  const items = Array.isArray(input.items) ? input.items.slice(0, 8).flatMap((item) => {
    const entry = record(item);
    const question = string(entry?.question, 180);
    const answer = string(entry?.answer, 900);
    return question || answer ? [{ question, answer }] : [];
  }) : [];
  return { visible: visible(input.visible), eyebrow: string(input.eyebrow, 80), title: string(input.title, 180), items };
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
  const story = record(input.story) ?? {};
  const testimonial = record(input.testimonial) ?? {};
  const finalCta = record(input.finalCta) ?? {};
  const footer = record(input.footer) ?? {};
  const measurementId = string(analyticsInput.ga4MeasurementId, 80);

  return {
    template: "campaign-v1",
    name,
    slug,
    seo: { title: string(seoInput.title, 180) || heroTitle, description: string(seoInput.description, 320) || string(hero.description, 700), index: seoInput.index !== false },
    theme: {
      primaryColor: normalizeColor(themeInput.primaryColor, "#111111"), secondaryColor: normalizeColor(themeInput.secondaryColor, "#111111"),
      backgroundColor: normalizeColor(themeInput.backgroundColor, "#ffffff"), textColor: normalizeColor(themeInput.textColor, "#111111"),
      font: themeInput.font === "space-grotesk" || themeInput.font === "plus-jakarta" ? themeInput.font : "system",
    },
    analytics: { ga4MeasurementId: ga4MeasurementIdPattern.test(measurementId) ? measurementId : "" },
    hero: {
      phone: string(hero.phone, 40), email: string(hero.email, 160), logo: normalizeMediaUrl(hero.logo), backgroundImage: normalizeMediaUrl(hero.backgroundImage),
      eyebrow: string(hero.eyebrow, 80), title: heroTitle, description: string(hero.description, 700), ctaLabel: string(hero.ctaLabel, 70), ctaUrl: normalizeActionUrl(hero.ctaUrl), highlights: normalizeHighlights(hero.highlights),
    },
    lowerSection: { visible: visible(lowerSection.visible), title: lowerTitle, description: string(lowerSection.description, 900), ctaLabel: string(lowerSection.ctaLabel, 70), ctaUrl: normalizeActionUrl(lowerSection.ctaUrl) },
    benefits: normalizeBenefits(input.benefits),
    story: { visible: visible(story.visible), eyebrow: string(story.eyebrow, 80), title: string(story.title, 180), description: string(story.description, 900), image: normalizeMediaUrl(story.image), ctaLabel: string(story.ctaLabel, 70), ctaUrl: normalizeActionUrl(story.ctaUrl) },
    metrics: normalizeMetrics(input.metrics),
    testimonial: { visible: visible(testimonial.visible), eyebrow: string(testimonial.eyebrow, 80), title: string(testimonial.title, 180), quote: string(testimonial.quote, 900), author: string(testimonial.author, 100), role: string(testimonial.role, 120) },
    faq: normalizeFaq(input.faq),
    finalCta: { visible: visible(finalCta.visible), eyebrow: string(finalCta.eyebrow, 80), title: string(finalCta.title, 180), description: string(finalCta.description, 700), ctaLabel: string(finalCta.ctaLabel, 70), ctaUrl: normalizeActionUrl(finalCta.ctaUrl) },
    footer: { brand: string(footer.brand, 120) || name, description: string(footer.description, 400), phone: string(footer.phone, 40), email: string(footer.email, 160), legalText: string(footer.legalText, 240) || "Todos os direitos reservados." },
  };
}

function backendUrl() { return (process.env.LANDING_BUILDER_BACKEND_URL ?? "http://127.0.0.1:36110").replace(/\/+$/, ""); }

async function fetchPayload(path: string) {
  try {
    const response = await fetch(`${backendUrl()}${path}`, { cache: "no-store", headers: { Accept: "application/json" } });
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

export function landingUrl(slug: string) { return new URL(`/${slug}`, builderSiteUrl()); }
