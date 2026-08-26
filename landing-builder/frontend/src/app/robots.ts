import type { MetadataRoute } from "next";
import { builderSiteUrl } from "@/lib/landing";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = builderSiteUrl();
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/preview/" },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
