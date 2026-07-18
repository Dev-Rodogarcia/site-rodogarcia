/**
 * Sanitizacao de entradas portadas do legado.
 * Usado tanto no frontend (hooks/utils) quanto nos route handlers.
 */

import { admin, auth, site } from "@/lib/routes";

const LEGACY_URL_ALIASES = new Map<string, string>([
  ["/index.html", site.home],
  ["/sobre.html", site.about],
  ["/servicos.html", site.services],
  ["/para-empresas.html", site.business],
  ["/cotacao.html", site.quote],
  ["/coleta", site.collections],
  ["/solicitar-coleta", site.collections],
  ["/fale-conosco.html", site.contact],
  ["/central-ajuda.html", site.help],
  ["/imprensa.html", site.press],
  ["/trabalhe-conosco.html", site.careers],
  ["/trabalhe-conosco.html#formulario", `${site.careers}#candidatura`],
  ["/termos-de-uso.html", site.terms],
  ["/auth/entrar.html", auth.login],
  ["/auth/criar-conta.html", auth.login],
  ["/developer/index.html", admin.root],
]);

function normalizePublicAssetPath(input: string): string {
  if (!input.startsWith("/public/")) {
    return input;
  }

  const normalized = input.slice("/public".length);
  return normalized || "/";
}

function normalizeLegacyPath(input: string): string {
  const directAlias = LEGACY_URL_ALIASES.get(input);
  if (directAlias) {
    return directAlias;
  }

  const match = input.match(/^([^?#]+)([?#].*)?$/);
  if (!match) {
    return input;
  }

  const [, pathname, suffix = ""] = match;
  const alias = LEGACY_URL_ALIASES.get(pathname);
  if (!alias) {
    return input;
  }

  return `${alias}${suffix}`;
}

function normalizeInternalUrl(input: string): string {
  return normalizeLegacyPath(normalizePublicAssetPath(input));
}

const HTML_ENTITY_MAP: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  lt: "<",
  nbsp: " ",
  quot: '"',
};

function decodeHtmlEntities(input: string): string {
  let output = input;

  for (let i = 0; i < 2; i += 1) {
    output = output.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_, entity: string) => {
      const normalized = entity.toLowerCase();

      if (normalized in HTML_ENTITY_MAP) {
        return HTML_ENTITY_MAP[normalized];
      }

      if (normalized.startsWith("#x")) {
        const codePoint = Number.parseInt(normalized.slice(2), 16);
        return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : " ";
      }

      if (normalized.startsWith("#")) {
        const codePoint = Number.parseInt(normalized.slice(1), 10);
        return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : " ";
      }

      return " ";
    });
  }

  return output;
}

function stripHtml(input: string): string {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

export function sanitizeText(value: unknown, maxLength = 500): string {
  const text = typeof value === "string" ? value : "";
  return stripHtml(decodeHtmlEntities(text))
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\bmeta\s+charset\b/gi, " ")
    .replace(/\bcharset\s*=\s*["']?utf-?8["']?\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const input = value.trim();
  if (!input) return "";

  if (input.startsWith("/")) return normalizeInternalUrl(input).slice(0, 300);
  if (input.startsWith("#")) return input.slice(0, 100);

  try {
    const url = new URL(input);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString().slice(0, 400);
    }
  } catch {
    return "";
  }

  return "";
}

export function sanitizeEmail(value: unknown): string {
  if (typeof value !== "string") return "";
  const raw = value.toLowerCase().trim().slice(0, 254);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) return "";
  return raw;
}

export function sanitizePath(value: unknown): string {
  if (typeof value !== "string") return site.home;
  const raw = value.trim().slice(0, 200);
  if (!raw.startsWith("/")) return site.home;
  return normalizeInternalUrl(raw.replace(/[<>"']/g, ""));
}

export function sanitizeHexColor(value: unknown): string {
  if (typeof value !== "string") return "";
  const match = value.trim().match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  return match ? match[0] : "";
}

export function toBoolean(value: unknown): boolean {
  return Boolean(value);
}

export const sanitizarTexto = sanitizeText;
export const sanitizarUrl = sanitizeUrl;
export const paraBooleano = toBoolean;
