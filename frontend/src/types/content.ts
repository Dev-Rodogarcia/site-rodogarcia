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
  image: string;
  desktopImage?: string;
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
  title: string;
  location: string;
  workType?: string;
  contractType: "CLT" | "PJ" | "Estagio" | "Temporario" | "Integral" | string;
  description: string;
  status?: string;
  applyUrl?: string;
  featured?: boolean;
  active: boolean;
  /** Legacy fields still accepted while old JSON is migrated at the boundary. */
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
  historia?: string;
  missao?: string;
  visao?: string;
  valores?: string;
}

export interface OperationalUnit {
  id: string;
  order?: number;
  name: string;
  type?: string;
  state: string;
  city?: string;
  address: string;
  phone?: string;
  email?: string;
  contactUrl?: string;
  description?: string;
  logisticsInfo?: string;
  isDefault?: boolean;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContentData {
  heroSlides: HeroSlide[];
  dnaSlides: DnaSlide[];
  feedbacks: Feedback[];
  vagas: Vaga[];
  units: OperationalUnit[];
  contato?: ContactInfo;
  sobre?: AboutContent;
}
