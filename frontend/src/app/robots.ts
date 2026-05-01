import type { MetadataRoute } from "next";
import { seo } from "@/lib/routes";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...seo.disallow],
      },
    ],
    sitemap: seo.absoluteUrl(seo.sitemapPath),
  };
}
