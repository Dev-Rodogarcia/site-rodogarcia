export type LandingStatus = "draft" | "published" | "unpublished";

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
  /** Quando falso, a campanha publicada continua acessível, mas não entra no sitemap. */
  index: boolean;
}

export interface LandingPage {
  id: string;
  name: string;
  slug: string;
  status: LandingStatus;
  /** Token opaco, usado somente para renderizar um rascunho fora da API interna. */
  previewToken: string;
  seo: LandingSeo;
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

export interface PublicLandingPage {
  name: string;
  slug: string;
  seo: LandingSeo;
  theme: LandingTheme;
  analytics: {
    ga4MeasurementId: string;
  };
  hero: LandingPage["hero"];
  lowerSection: LandingPage["lowerSection"];
}

/** Registro público mínimo para geração de sitemap. */
export interface PublicLandingIndexItem {
  slug: string;
  updatedAt: string;
}

export type LandingMediaKind = "image" | "video";

export interface LandingMedia {
  id: string;
  url: string;
  kind: LandingMediaKind;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  createdAt: string;
}

/** Metadados exclusivamente internos necessários para entregar e excluir o arquivo. */
export interface StoredLandingMedia extends LandingMedia {
  storageName: string;
}
