import crypto from "node:crypto";
import { z } from "zod";
import { readLandings, writeLandings } from "./store.js";
import type { LandingPage, LandingStatus } from "./types.js";

const slugSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(2).max(80);
const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const optionalId = z.string().trim().max(80).optional().default("");
const text = (max: number) => z.string().trim().max(max).optional().default("");
const safeUrl = z.string().trim().max(400).refine(
  (value) => !value || (/^\/(?!\/)/.test(value) || /^(https:|mailto:|tel:)/.test(value)),
  "Use uma rota interna, URL HTTPS, telefone ou e-mail válido."
).optional().default("");
const internalMedia = z.string().trim().max(300).refine(
  (value) => !value || /^\/(?:uploads|landing-media)\/[A-Za-z0-9._/-]+$/.test(value),
  "Selecione uma mídia interna válida da biblioteca."
).optional().default("");
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
const heroSchema = z.preprocess((value) => value ?? {}, z.object({
  phone: text(40), email: text(160), logo: internalMedia, backgroundImage: internalMedia,
  eyebrow: text(80), title: text(180), description: text(700), ctaLabel: text(70), ctaUrl: safeUrl,
  highlights: z.array(z.object({ title: text(80), description: text(220) })).min(1).max(4).optional().default([
    { title: "Cobertura nacional", description: "Uma informação importante da campanha." },
  ]),
}));
const lowerSectionSchema = z.preprocess((value) => value ?? {}, z.object({
  title: text(180), description: text(900), ctaLabel: text(70), ctaUrl: safeUrl,
}));

const landingInputSchema = z.object({
  name: text(120),
  slug: slugSchema,
  theme: themeSchema,
  analytics: analyticsSchema,
  hero: heroSchema,
  lowerSection: lowerSectionSchema,
});

function normalizeSlug(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function assertSlugAvailable(slug: string, currentId?: string) {
  const exists = readLandings().some((landing) => landing.slug === slug && landing.id !== currentId);
  if (exists) throw new Error("Já existe uma landing page com esta rota.");
}

function parseInput(input: unknown) {
  const parsed = landingInputSchema.safeParse(input);
  if (!parsed.success) throw new Error("Revise os campos da landing page.");
  if (!parsed.data.name || !parsed.data.hero.title || !parsed.data.lowerSection.title) {
    throw new Error("Informe o nome, o título do Hero e o título da seção inferior.");
  }
  return parsed.data;
}

export function listLandings() {
  return readLandings().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getPublishedLanding(slugInput: unknown) {
  const slug = normalizeSlug(slugInput);
  return readLandings().find((landing) => landing.slug === slug && landing.status === "published") ?? null;
}

export function createLanding(input: unknown) {
  const values = parseInput(input);
  assertSlugAvailable(values.slug);
  const now = new Date().toISOString();
  const landing: LandingPage = { id: `landing_${crypto.randomUUID()}`, ...values, status: "draft", createdAt: now, updatedAt: now };
  const landings = readLandings();
  landings.push(landing);
  writeLandings(landings);
  return landing;
}

export function updateLanding(id: string, input: unknown) {
  const values = parseInput(input);
  const landings = readLandings();
  const index = landings.findIndex((landing) => landing.id === id);
  if (index < 0) throw new Error("Landing page não encontrada.");
  assertSlugAvailable(values.slug, id);
  const current = landings[index]!;
  const updated: LandingPage = { ...current, ...values, updatedAt: new Date().toISOString() };
  landings[index] = updated;
  writeLandings(landings);
  return updated;
}

export function setLandingStatus(id: string, status: LandingStatus) {
  const landings = readLandings();
  const index = landings.findIndex((landing) => landing.id === id);
  if (index < 0) throw new Error("Landing page não encontrada.");
  const current = landings[index]!;
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
