export type HeroLayoutMode = "text-image" | "full-image";
export type HeroBackgroundType = "wavy" | "straight";
export type ButtonVariant = "solid" | "outline";

export interface HeroButton {
  label: string;
  url: string;
  enabled: boolean;
  color?: string;
  variant?: ButtonVariant;
}

export interface HeroSlide {
  id: string;
  order?: number;
  title: string;
  description: string;
  /** Main image path */
  image: string;
  /** Optional desktop-specific image */
  desktopImage?: string;
  /** Optional mobile-specific image */
  mobileImage?: string;
  active?: boolean;
  layoutMode?: HeroLayoutMode;
  fullImageButtonsEnabled?: boolean;
  fullImageBackgroundType?: HeroBackgroundType;
  buttons: HeroButton[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DnaSlide {
  id: string;
  order?: number;
  /** Normalized field (admin saves as `title`) — legacy JSON may use `titulo` */
  title: string;
  /** Normalized field (admin saves as `text`) — legacy JSON may use `descricao` */
  text: string;
  /** Normalized field (admin saves as `image`) — legacy JSON may use `imagem` */
  image: string;
  desktopImage?: string;
  mobileImage?: string;
  layoutMode?: "text-image" | "full-image";
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Feedback {
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

export interface Vaga {
  id: string;
  order?: number;
  titulo: string;
  local: string;
  tipo: "CLT" | "PJ" | "Estágio" | "Temporário" | string;
  descricao: string;
  requisitos?: string[];
  beneficios?: string[];
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactInfo {
  telefone?: string;
  whatsapp?: string;
  email?: string;
  endereco?: string;
  horarioAtendimento?: string;
}

export interface AboutContent {
  heroTitulo?: string;
  heroSubtitulo?: string;
  heroImagem?: string;
  história?: string;
  missao?: string;
  visão?: string;
  valores?: string;
}

export interface ContentData {
  heroSlides: HeroSlide[];
  dnaSlides: DnaSlide[];
  feedbacks: Feedback[];
  vagas: Vaga[];
  contato?: ContactInfo;
  sobre?: AboutContent;
}
