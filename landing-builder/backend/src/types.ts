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
  /** Identifica a estrutura visual aplicada à campanha. O v1 não é selecionável no CMS. */
  template: "campaign-v1";
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
    visible: boolean;
    title: string;
    description: string;
    ctaLabel: string;
    ctaUrl: string;
  };
  benefits: {
    visible: boolean;
    eyebrow: string;
    title: string;
    description: string;
    items: Array<{ title: string; description: string }>;
  };
  story: {
    visible: boolean;
    eyebrow: string;
    title: string;
    description: string;
    image: string;
    ctaLabel: string;
    ctaUrl: string;
  };
  metrics: {
    visible: boolean;
    eyebrow: string;
    title: string;
    items: Array<{ value: string; label: string }>;
  };
  testimonial: {
    visible: boolean;
    eyebrow: string;
    title: string;
    quote: string;
    author: string;
    role: string;
  };
  faq: {
    visible: boolean;
    eyebrow: string;
    title: string;
    items: Array<{ question: string; answer: string }>;
  };
  finalCta: {
    visible: boolean;
    eyebrow: string;
    title: string;
    description: string;
    ctaLabel: string;
    ctaUrl: string;
  };
  footer: {
    brand: string;
    description: string;
    phone: string;
    email: string;
    legalText: string;
  };
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface PublicLandingPage {
  template: LandingPage["template"];
  name: string;
  slug: string;
  seo: LandingSeo;
  theme: LandingTheme;
  analytics: {
    ga4MeasurementId: string;
  };
  hero: LandingPage["hero"];
  lowerSection: LandingPage["lowerSection"];
  benefits: LandingPage["benefits"];
  story: LandingPage["story"];
  metrics: LandingPage["metrics"];
  testimonial: LandingPage["testimonial"];
  faq: LandingPage["faq"];
  finalCta: LandingPage["finalCta"];
  footer: LandingPage["footer"];
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
