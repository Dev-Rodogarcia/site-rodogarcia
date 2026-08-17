export type LandingStatus = "draft" | "published" | "unpublished";

export interface LandingTheme {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  font: "system" | "space-grotesk" | "plus-jakarta";
}

export interface LandingPage {
  id: string;
  name: string;
  slug: string;
  status: LandingStatus;
  theme: LandingTheme;
  analytics: {
    ga4MeasurementId: string;
    gtmContainerId: string;
    metaPixelId: string;
    googleAdsId: string;
  };
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
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}
