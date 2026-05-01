import type { Metadata } from "next";
import { api, seo } from "@/lib/routes";
import { serverFetch } from "@/lib/api";

export interface SeoPageSettings {
  path: string;
  title: string;
  description: string;
  index: boolean;
  follow: boolean;
  canonical: string;
  metaTags?: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
}

export async function fetchCmsSeo(path: string) {
  const response = await serverFetch<{ seo: SeoPageSettings | null }>(
    `${api.public.seo}?path=${encodeURIComponent(path)}`,
    { cache: "no-store" }
  );
  return response.success ? response.data?.seo ?? null : null;
}

export async function buildCmsMetadata(
  path: string,
  fallback: Metadata
): Promise<Metadata> {
  const settings = await fetchCmsSeo(path);
  if (!settings) return fallback;
  const title = settings.title || fallback.title;
  const description = settings.description || fallback.description || "";
  const canonical = settings.canonical || path;
  const ogTitle = settings.ogTitle || title;
  const ogDescription = settings.ogDescription || description;
  const ogImage = settings.ogImage || seo.defaultOgImage;
  const other = Object.fromEntries(
    String(settings.metaTags ?? "")
      .split("\n")
      .map((line) => line.split("="))
      .filter(([key, value]) => key?.trim() && value?.trim())
      .map(([key, ...rest]) => [key.trim(), rest.join("=").trim()])
  );

  return {
    ...fallback,
    title,
    description,
    alternates: { ...(fallback.alternates ?? {}), canonical: seo.absoluteUrl(canonical) },
    robots: {
      ...(typeof fallback.robots === "object" ? fallback.robots : {}),
      index: settings.index,
      follow: settings.follow,
    },
    openGraph: {
      ...(fallback.openGraph ?? {}),
      title: String(ogTitle),
      description: String(ogDescription),
      url: seo.absoluteUrl(path),
      images: [{ url: seo.absoluteUrl(ogImage) }],
    },
    twitter: {
      ...(fallback.twitter ?? {}),
      title: String(ogTitle),
      description: String(ogDescription),
      images: [seo.absoluteUrl(ogImage)],
    },
    other: Object.keys(other).length > 0 ? other : fallback.other,
  };
}

export async function fetchMediaSlots() {
  const response = await serverFetch<{ slots: Record<string, string> }>(
    api.public.mediaSlots,
    { cache: "no-store" }
  );
  return response.success ? response.data?.slots ?? {} : {};
}

export function mediaSlot(slots: Record<string, string> | undefined, key: string, fallback: string) {
  const value = slots?.[key] || fallback;
  if (value.startsWith("/public/")) return value.slice("/public".length) || "/";
  return value;
}
