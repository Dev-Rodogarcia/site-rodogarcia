import type * as Content from "@shared/types/content";

export type * from "@shared/types/content";

export type HeroLayoutMode = "text-image" | "full-image";
export type HeroBackgroundType = "wavy" | "straight";

export interface LegacyHeroButton {
  label: string;
  url: string;
  enabled: boolean;
  color?: string;
  variant?: Content.ButtonVariant;
}

export interface LegacyHeroSlide {
  id: string;
  order?: number;
  title: string;
  description: string;
  image: string;
  desktopImage?: string;
  mobileImage?: string;
  active?: boolean;
  layoutMode?: HeroLayoutMode;
  fullImageButtonsEnabled?: boolean;
  fullImageBackgroundType?: HeroBackgroundType;
  buttons: LegacyHeroButton[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LegacyOperationSlide {
  id: string;
  order?: number;
  title: string;
  text: string;
  image: string;
  video?: string;
  desktopImage?: string;
  mobileImage?: string;
  desktopVideo?: string;
  mobileVideo?: string;
  layoutMode?: "text-image" | "full-image";
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LegacyFeedback {
  id: string;
  order?: number;
  name?: string;
  nome?: string;
  image?: string;
  company?: string;
  empresa?: string;
  testimonial?: string;
  comment?: string;
  texto?: string;
  rating?: number;
  nota?: number;
  active?: boolean;
  ativo?: boolean;
  role?: string;
  photo?: string;
  highlight?: string;
  resultadoIcon?: string;
  resultadoTexto?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LegacyJob {
  id: string;
  order?: number;
  title: string;
  location: string;
  workType?: string;
  contractType: string;
  description: string;
  status?: string;
  applyUrl?: string;
  featured?: boolean;
  active: boolean;
  titulo?: string;
  local?: string;
  tipo?: string;
  descricao?: string;
  ativo?: boolean;
  requisitos?: string[];
  beneficios?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ContentData {
  homePage?: Content.HomePageContent;
  servicesPage?: Content.ServicesPageContent;
  aboutPage?: Content.AboutPageContent;
  businessPage?: Content.BusinessPageContent;
  contactPage?: Content.ContactPageContent;
  careersPage?: Content.CareersPageContent;
  quotePage?: Content.QuotePageContent;
  collectionsPage?: Content.CollectionsPageContent;
  improvementsPage?: Content.ImprovementsPageContent;
  headerNavigation?: Content.HeaderNavigationContent;
  footerLinks?: Content.FooterLinksContent;
  /** Legacy storage only: old root hero slides kept for migration safety, not an active CMS module. */
  heroSlides: LegacyHeroSlide[];
  /** Legacy storage only: old operation carousel key kept so old JSON is not destroyed on read/write. */
  dnaSlides: LegacyOperationSlide[];
  /** Legacy storage only: old feedback collection kept for migration safety, not an active CMS module. */
  feedbacks: LegacyFeedback[];
  /** Legacy storage only: old jobs collection migrates into careersPage.jobs. */
  vagas: LegacyJob[];
  units: Content.OperationalUnit[];
}
