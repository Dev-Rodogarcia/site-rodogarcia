import type { MetadataRoute } from "next";
import { seo, sitemapRoutes } from "@/lib/routes";

interface PublishedLandingSitemapEntry {
  slug: string;
  updatedAt: string;
}

function validLandingEntry(value: unknown): value is PublishedLandingSitemapEntry {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.slug === "string" &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug) &&
    typeof entry.updatedAt === "string" &&
    Number.isFinite(Date.parse(entry.updatedAt))
  );
}

async function landingSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const builderUrl = process.env.LANDING_BUILDER_PUBLIC_URL?.trim().replace(/\/+$/, "");
  if (!builderUrl) return [];

  try {
    const response = await fetch(`${builderUrl}/api/public/landings`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return [];
    const payload: unknown = await response.json();
    const landings = payload && typeof payload === "object" && !Array.isArray(payload) && "landings" in payload
      ? (payload as { landings?: unknown }).landings
      : [];
    if (!Array.isArray(landings)) return [];

    return landings
      .filter(validLandingEntry)
      .slice(0, 500)
      .map((landing) => ({
        url: seo.absoluteUrl(`/${landing.slug}`),
        lastModified: new Date(landing.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
  } catch {
    // O sitemap institucional continua disponível se o processo isolado estiver fora do ar.
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  return [
    ...sitemapRoutes.map((route) => ({
      url: seo.absoluteUrl(route.path),
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...(await landingSitemapEntries()),
  ];
}
