import type { HeaderNavigationContent } from "@/types/content";

export const DEFAULT_HEADER_NAVIGATION: HeaderNavigationContent = {
  items: [
    { id: "nav-home", order: 1, group: "principal", label: "Início", url: "/", icon: "home" },
    { id: "nav-careers", order: 2, group: "explorar", label: "Carreiras", url: "/trabalhe-conosco", icon: "careers" },
    { id: "nav-collections", order: 3, group: "explorar", label: "Coletas", url: "/coletas", icon: "collections" },
    { id: "nav-contact", order: 4, group: "explorar", label: "Contato", url: "/fale-conosco", icon: "contact" },
    { id: "nav-quote", order: 5, group: "explorar", label: "Cotação", url: "/cotacao", icon: "quote" },
    { id: "nav-business", order: 6, group: "explorar", label: "Empresas", url: "/para-empresas", icon: "business" },
    { id: "nav-improvements", order: 7, group: "explorar", label: "Melhoria contínua", url: "/melhoria-continua", icon: "improvements", highlightLabel: "Novo", highlightTone: "blue" },
    { id: "nav-services", order: 8, group: "explorar", label: "Serviços", url: "/servicos", icon: "services" },
    { id: "nav-about", order: 9, group: "explorar", label: "Sobre", url: "/sobre", icon: "about" },
    { id: "nav-voice", order: 10, group: "explorar", label: "Sua Voz", url: "/sua-voz", icon: "voice" },
  ],
};
