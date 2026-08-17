export type AppPath = `/${string}`;
export type AppChromeKind = "public" | "auth" | "admin";

export interface NavigationItem {
  href: AppPath;
  label: string;
  key: string;
  exact?: boolean;
}

export interface SitemapEntry {
  path: AppPath;
  changeFrequency:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority: number;
}

export interface RedirectAlias {
  source: AppPath;
  destination: string;
  permanent: boolean;
}

const BASE_URL = "https://rodogarcia.com.br";
const SITE_NAME = "Rodogarcia Transportes";

export const site = {
  home: "/",
  services: "/servicos",
  about: "/sobre",
  business: "/para-empresas",
  quote: "/cotacao",
  collections: "/coletas",
  improvements: "/melhoria-continua",
  contact: "/fale-conosco",
  help: "/central-ajuda",
  press: "/imprensa",
  careers: "/trabalhe-conosco",
  terms: "/termos-de-uso",
  privacy: "/privacidade",
  voice: "/sua-voz",
} as const satisfies Record<string, AppPath>;

export const auth = {
  login: "/auth/entrar",
  changePassword: "/auth/trocar-senha",
  prefix: "/auth/",
} as const;

export const admin = {
  root: "/developer",
  home: "/developer/home",
  services: "/developer/servicos",
  aboutPage: "/developer/sobre",
  businessPage: "/developer/para-empresas",
  contactPage: "/developer/fale-conosco",
  careersPage: "/developer/trabalhe-conosco",
  quotePage: "/developer/cotacao",
  collectionsPage: "/developer/coletas",
  improvements: "/developer/melhorias",
  headerNavigation: "/developer/navegacao",
  footerLinks: "/developer/footer-links",
  units: "/developer/unidades",
  popup: "/developer/popup-exit",
  users: "/developer/usuarios",
  sectors: "/developer/setores",
  images: "/developer/imagens",
  analytics: "/developer/analytics",
  seo: "/developer/seo",
  tracking: "/developer/rastreamento",
  leads: "/developer/leads",
  cookies: "/developer/lgpd-cookies",
  cookieMonitoring: "/developer/monitoramento-cookies",
  landingPages: "/developer/landing-pages",
  prefix: "/developer/",
} as const;

export const api = {
  auth: {
    login: "/api/auth/login",
    passwordResetRequest: "/api/auth/password-reset-request",
    logout: "/api/auth/logout",
    register: "/api/auth/register",
    session: "/api/auth/session",
    changePassword: "/api/auth/change-password",
    cmsTheme: "/api/auth/cms-theme",
  },
  admin: {
    content: "/api/admin/content",
    siteTexts: "/api/admin/site-texts",
    images: "/api/admin/images",
    home: "/api/admin/home",
    homeHero: "/api/admin/home/hero",
    homeSection1: "/api/admin/home/section-1",
    homeSection2: "/api/admin/home/section-2",
    homeSection3: "/api/admin/home/section-3",
    homeQuickActions: "/api/admin/home/quick-actions",
    footerLinks: "/api/admin/footer-links",
    headerNavigation: "/api/admin/header-navigation",
    footerLinksSection: (sectionKey: string) =>
      `/api/admin/footer-links/${sectionKey}`,
    homeRegionalPresence: "/api/admin/home/regional-presence",
    homeTrackingCta: "/api/admin/home/tracking-cta",
    homeSocialProof: "/api/admin/home/social-proof",
    servicesPage: "/api/admin/services-page",
    servicesModules: "/api/admin/services-page/modules",
    servicesFinalCta: "/api/admin/services-page/final-cta",
    servicesFaq: "/api/admin/services-page/faq",
    page: (pageKey: string) => `/api/admin/pages/${pageKey}`,
    pageSection: (pageKey: string, sectionKey: string) =>
      `/api/admin/pages/${pageKey}/${sectionKey}`,
    users: "/api/admin/users",
    accessProfiles: "/api/admin/access-profiles",
    accessProfile: (id: string) => `/api/admin/access-profiles/${id}`,
    replaceImageReference: "/api/admin/images/replace-reference",
    mediaSlots: "/api/admin/media-slots",
    seoSettings: "/api/admin/seo-settings",
    consentSettings: "/api/admin/consent-settings",
    cookieConsents: "/api/admin/cookie-consents",
    leads: "/api/admin/leads",
    improvements: "/api/admin/improvements",
    trackingEvents: "/api/admin/tracking-events",
    auditLog: "/api/admin/audit-log",
    landings: "/api/admin/landings",
    landing: (id: string) => `/api/admin/landings/${id}`,
    publishLanding: (id: string) => `/api/admin/landings/${id}/publish`,
    unpublishLanding: (id: string) => `/api/admin/landings/${id}/unpublish`,
    entity: (entity: string) => `/api/admin/${entity}`,
    entityItem: (entity: string, id: string) => `/api/admin/${entity}/${id}`,
    reorder: (entity: string) => `/api/admin/${entity}/reorder`,
  },
  analytics: {
    config: "/api/analytics/config",
    publicConfig: "/api/analytics/public-config",
    event: "/api/analytics/event",
    stats: "/api/analytics/stats",
  },
  popup: {
    config: "/api/popup-config",
    events: "/api/popup-events",
    leads: "/api/leads",
  },
  forms: {
    contact: "/api/contact",
    quote: "/api/quote",
    improvements: "/api/improvements",
  },
  eslTransport: {
    quoteFractional: "/api/quote/fractional",
    quoteClosedWhatsapp: "/api/quote/closed/whatsapp",
    collectionInvoiceValidation: "/api/collections/invoice-validation",
    collections: "/api/collections",
    collection: (id: string) => `/api/collections/${id}`,
    cancelCollection: (id: string) => `/api/collections/${id}/cancel`,
  },
  public: {
    content: "/api/public/content",
    seo: "/api/public/seo",
    mediaSlots: "/api/public/media-slots",
    postalCode: (postalCode: string) => `/api/public/postal-code/${postalCode}`,
    company: (cnpj: string) => `/api/public/company/${cnpj}`,
  },
  consent: {
    settings: "/api/consent-settings",
    events: "/api/consent-events",
  },
  tracking: {
    event: "/api/tracking/event",
  },
} as const;

export const external = {
  developerProfile: "https://www.linkedin.com/in/dev-lucasandrade/",
  tracking: "https://rodogarcia.eslcloud.com.br/recipient_tracking",
  whatsappCommercial: "https://wa.me/5511993139536",
  whatsappQuoteFractional: "https://wa.me/5514991053933",
  whatsappQuoteFull: "https://wa.me/5514991053933",
  whatsappQuoteApproval: "https://wa.me/5514991053696",
  commercialEmailAddress: "gerente.financeiro@rodogarcia.com.br",
  commercialEmail: "mailto:gerente.financeiro@rodogarcia.com.br",
  careersEmailAddress: "rh@rodogarcia.com.br",
  careersEmail: "mailto:rh@rodogarcia.com.br",
  careersEmailWithSubject:
    "mailto:rh@rodogarcia.com.br?subject=Candidatura%20-%20Trabalhe%20Conosco",
  phoneDisplay: "0800 591 4557",
  phoneHref: "tel:08005914557",
  brazilFlag: "https://flagcdn.com/w20/br.png",
} as const;

export const seo = {
  baseUrl: BASE_URL,
  siteName: SITE_NAME,
  defaultOgImage: "/foto5.webp",
  sitemapPath: "/sitemap.xml",
  disallow: ["/developer/", "/auth/", "/api/"] as const,
  absoluteUrl(path: string) {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }

    return `${BASE_URL}${path}`;
  },
} as const;

export const headerNavigation = [
  { href: site.home, label: "Início", key: "home" },
  { href: site.services, label: "Serviços", key: "services" },
  { href: site.about, label: "Sobre", key: "about" },
  { href: site.business, label: "Empresas", key: "business" },
  { href: site.contact, label: "Contato", key: "contact" },
  { href: site.voice, label: "Sua Voz", key: "voice" },
] as const satisfies readonly NavigationItem[];

export const drawerNavigation = [
  { href: site.careers, label: "Carreiras", key: "careers" },
  { href: site.collections, label: "Coletas", key: "collections" },
  { href: site.contact, label: "Contato", key: "contact" },
  { href: site.quote, label: "Cotação", key: "quote" },
  { href: site.business, label: "Empresas", key: "business" },
  { href: site.improvements, label: "Melhoria contínua", key: "improvements" },
  { href: site.services, label: "Serviços", key: "services" },
  { href: site.about, label: "Sobre", key: "about" },
  { href: site.voice, label: "Sua Voz", key: "voice" },
  { href: site.home, label: "Início", key: "home" },
] as const satisfies readonly NavigationItem[];

export const adminNavigationGroups = [
  {
    label: "Dashboard",
    key: "overview",
    items: [{ href: admin.root, label: "Dashboard", key: "dashboard", exact: true }],
  },
  {
    label: "Páginas",
    key: "pages",
    items: [
      { href: admin.careersPage, label: "Página Carreiras", key: "careers-page" },
      { href: admin.collectionsPage, label: "Página Coletas", key: "collections-page" },
      { href: admin.contactPage, label: "Página Contato", key: "contact-page" },
      { href: admin.quotePage, label: "Página Cotação", key: "quote-page" },
      { href: admin.businessPage, label: "Página Empresas", key: "business-page" },
      { href: admin.home, label: "Página Inicial", key: "home" },
      { href: admin.improvements, label: "Página Melhoria", key: "improvements" },
      { href: admin.services, label: "Página Serviços", key: "services" },
      { href: admin.aboutPage, label: "Página Sobre", key: "about-page" },
    ],
  },
  {
    label: "Estrutura do site",
    key: "site-structure",
    items: [
      { href: admin.headerNavigation, label: "Navegação", key: "header-navigation" },
      { href: admin.footerLinks, label: "Rodapé", key: "footer-links" },
      { href: admin.units, label: "Unidades", key: "units" },
    ],
  },
  {
    label: "Ferramentas",
    key: "tools",
    items: [
      { href: admin.analytics, label: "Analytics", key: "analytics" },
      { href: admin.landingPages, label: "Landing Pages", key: "landing-pages" },
      { href: admin.images, label: "Imagens", key: "images" },
      { href: admin.popup, label: "Popup de saída", key: "popup" },
      { href: admin.tracking, label: "Rastreamento", key: "tracking" },
      { href: admin.seo, label: "SEO", key: "seo" },
    ],
  },
  {
    label: "Registros e privacidade",
    key: "records-privacy",
    items: [
      { href: admin.cookieMonitoring, label: "Consentimentos", key: "cookie-monitoring" },
      { href: admin.leads, label: "Leads", key: "leads" },
      { href: admin.cookies, label: "LGPD e cookies", key: "cookies" },
    ],
  },
  {
    label: "Administração",
    key: "administration",
    items: [
      { href: admin.users, label: "Usuários", key: "users" },
      { href: admin.sectors, label: "Setores e acessos", key: "access-profiles" },
    ],
  },
] as const satisfies readonly {
  label: string;
  key: string;
  items: readonly NavigationItem[];
}[];

export const adminNavigation: readonly NavigationItem[] = adminNavigationGroups.reduce<
  NavigationItem[]
>((items, group) => items.concat(group.items as readonly NavigationItem[]), []);

export const sitemapRoutes = [
  { path: site.home, changeFrequency: "weekly", priority: 1.0 },
  { path: site.services, changeFrequency: "monthly", priority: 0.9 },
  { path: site.about, changeFrequency: "monthly", priority: 0.8 },
  { path: site.business, changeFrequency: "monthly", priority: 0.8 },
  { path: site.quote, changeFrequency: "monthly", priority: 0.9 },
  { path: site.collections, changeFrequency: "monthly", priority: 0.8 },
  { path: site.improvements, changeFrequency: "monthly", priority: 0.5 },
  { path: site.contact, changeFrequency: "monthly", priority: 0.7 },
  { path: site.help, changeFrequency: "monthly", priority: 0.6 },
  { path: site.press, changeFrequency: "monthly", priority: 0.5 },
  { path: site.careers, changeFrequency: "weekly", priority: 0.7 },
  { path: site.terms, changeFrequency: "yearly", priority: 0.3 },
  { path: site.privacy, changeFrequency: "yearly", priority: 0.3 },
  { path: site.voice, changeFrequency: "yearly", priority: 0.4 },
] as const satisfies readonly SitemapEntry[];

export const redirectAliases = [
  { source: "/index.html", destination: site.home, permanent: true },
  { source: "/inicio", destination: site.home, permanent: true },
  { source: "/home", destination: site.home, permanent: true },
  { source: "/sobre.html", destination: site.about, permanent: true },
  { source: "/institucional", destination: site.about, permanent: true },
  { source: "/empresa", destination: site.about, permanent: true },
  { source: "/quem-somos", destination: site.about, permanent: true },
  { source: "/servicos.html", destination: site.services, permanent: true },
  { source: "/transportes", destination: site.services, permanent: true },
  { source: "/nossos-servicos", destination: site.services, permanent: true },
  { source: "/fale-conosco.html", destination: site.contact, permanent: true },
  { source: "/contato", destination: site.contact, permanent: true },
  { source: "/contact", destination: site.contact, permanent: true },
  { source: "/cotacao.html", destination: site.quote, permanent: true },
  { source: "/quote", destination: site.quote, permanent: true },
  { source: "/orcamento", destination: site.quote, permanent: true },
  { source: "/coleta", destination: site.collections, permanent: true },
  { source: "/solicitar-coleta", destination: site.collections, permanent: true },
  { source: "/trabalhe-conosco.html", destination: site.careers, permanent: true },
  { source: "/careers", destination: site.careers, permanent: true },
  { source: "/vagas", destination: site.careers, permanent: true },
  { source: "/central-ajuda.html", destination: site.help, permanent: true },
  { source: "/ajuda", destination: site.help, permanent: true },
  { source: "/help", destination: site.help, permanent: true },
  { source: "/faq", destination: site.help, permanent: true },
  { source: "/imprensa.html", destination: site.press, permanent: true },
  { source: "/press", destination: site.press, permanent: true },
  { source: "/midia", destination: site.press, permanent: true },
  { source: "/para-empresas.html", destination: site.business, permanent: true },
  { source: "/empresas", destination: site.business, permanent: true },
  { source: "/b2b", destination: site.business, permanent: true },
  { source: "/termos-de-uso.html", destination: site.terms, permanent: true },
  { source: "/termos", destination: site.terms, permanent: true },
  { source: "/politica-de-privacidade", destination: site.privacy, permanent: true },
  { source: "/politica", destination: site.privacy, permanent: true },
  { source: "/sua-voz.html", destination: site.voice, permanent: true },
  { source: "/canal-de-denuncias", destination: site.voice, permanent: true },
  { source: "/entrar.html", destination: auth.login, permanent: true },
  { source: "/auth/entrar.html", destination: auth.login, permanent: true },
  { source: "/criar-conta.html", destination: auth.login, permanent: true },
  { source: "/auth/criar-conta.html", destination: auth.login, permanent: true },
  { source: "/admin", destination: admin.root, permanent: true },
  { source: "/developer/index.html", destination: admin.root, permanent: true },
  {
    source: "/rastrear-encomenda",
    destination: external.tracking,
    permanent: false,
  },
] as const satisfies readonly RedirectAlias[];

export function isAuthRoute(pathname: string): boolean {
  return pathname === auth.login || pathname.startsWith(auth.prefix);
}

export function isAdminRoute(pathname: string): boolean {
  return pathname === admin.root || pathname.startsWith(admin.prefix);
}

export function isBareLayoutRoute(pathname: string): boolean {
  return isAuthRoute(pathname) || isAdminRoute(pathname);
}

export function getAppChrome(pathname: string): AppChromeKind {
  if (isAuthRoute(pathname)) return "auth";
  if (isAdminRoute(pathname)) return "admin";
  return "public";
}

export function getAdminRouteContext(pathname: string) {
  for (const group of adminNavigationGroups) {
    for (const item of group.items) {
      const isExact = "exact" in item && item.exact === true;
      const matches = isExact ? pathname === item.href : pathname.startsWith(item.href);
      if (matches) {
        return {
          groupLabel: group.label,
          item,
        };
      }
    }
  }

  return {
    groupLabel: adminNavigationGroups[0]?.label ?? "Painel",
    item: adminNavigationGroups[0]?.items[0] ?? {
      href: admin.root,
      label: "Dashboard",
      key: "dashboard",
      exact: true,
    },
  };
}
