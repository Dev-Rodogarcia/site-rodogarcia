import type { ContentData, HeaderNavigationContent, HeaderNavigationItem, NavigationHighlightTone } from "../types/content.js";
import { HttpError } from "../utils/http.js";
import { sanitizeText } from "../utils/sanitize.js";

const ICONS = new Set(["home", "services", "about", "business", "contact", "careers", "quote", "collections", "voice", "improvements"]);
const TONES = new Set<NavigationHighlightTone>(["blue", "emerald", "amber", "violet"]);

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

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function item(value: unknown, index: number, fallback?: HeaderNavigationItem): HeaderNavigationItem {
  const source = record(value) ?? {};
  const url = sanitizeText(source.url, 180);
  const group = source.group === "principal" ? "principal" : "explorar";
  const icon = sanitizeText(source.icon, 40);
  const tone = source.highlightTone;
  return {
    id: sanitizeText(source.id, 80) || fallback?.id || `nav-item-${index + 1}`,
    order: index + 1,
    group,
    label: sanitizeText(source.label, 60) || fallback?.label || "Item de navegação",
    url: url.startsWith("/") && !url.startsWith("//") ? url : fallback?.url || "/",
    icon: ICONS.has(icon) ? icon : fallback?.icon || "about",
    ...(sanitizeText(source.highlightLabel, 24) ? { highlightLabel: sanitizeText(source.highlightLabel, 24), highlightTone: TONES.has(tone as NavigationHighlightTone) ? tone as NavigationHighlightTone : "blue" } : {}),
  };
}

export function sanitizeHeaderNavigation(value: unknown): HeaderNavigationContent {
  const source = record(value);
  const rawItems = Array.isArray(source?.items) ? source.items : DEFAULT_HEADER_NAVIGATION.items;
  const items = rawItems.slice(0, 20).map((entry, index) => item(entry, index, DEFAULT_HEADER_NAVIGATION.items[index]));
  return { items: items.length ? items : DEFAULT_HEADER_NAVIGATION.items };
}

export function validateHeaderNavigation(payload: unknown): HeaderNavigationContent {
  const source = record(payload);
  if (!source || !Array.isArray(source.items) || source.items.length === 0 || source.items.length > 20) {
    throw new HttpError(400, "Informe entre 1 e 20 itens de navegação.");
  }
  for (const entry of source.items) {
    const current = record(entry);
    if (!current || !sanitizeText(current.label, 60) || !sanitizeText(current.url, 180).startsWith("/")) {
      throw new HttpError(400, "Cada item precisa de nome e destino interno válido.");
    }
    if (String(current.url).startsWith("//") || !ICONS.has(String(current.icon))) {
      throw new HttpError(400, "Use um ícone e destino permitidos para a navegação.");
    }
    if (current.highlightLabel && !TONES.has(current.highlightTone as NavigationHighlightTone)) {
      throw new HttpError(400, "Escolha uma cor de destaque disponível.");
    }
  }
  return sanitizeHeaderNavigation(source);
}

export function getHeaderNavigationContent(content: ContentData) {
  return sanitizeHeaderNavigation(content.headerNavigation);
}
