import type { MetadataRoute } from "next";
import { fetchPublishedLandingIndex, landingUrl } from "@/lib/landing";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const landings = await fetchPublishedLandingIndex();
  return landings.map((landing) => ({
    url: landingUrl(landing.slug).toString(),
    lastModified: landing.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));
}
