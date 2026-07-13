import fs from "node:fs";
import path from "node:path";
import { env } from "../config/env.js";
import { mediaLibraryRepository } from "../repositories/jsonRepositories.js";
import { HttpError } from "../utils/http.js";
import { sanitizePath, sanitizeText } from "../utils/sanitize.js";

export type InternalMediaKind = "image" | "video" | "all";

export const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".svg",
  ".avif",
]);

export const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".ogg"]);
export const MEDIA_EXTENSIONS = new Set([...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS]);

export interface InternalMediaValidationOptions {
  kind?: InternalMediaKind;
  required?: boolean;
  label?: string;
}

function normalizePublicPath(value: unknown) {
  const raw = sanitizeText(value, 600);
  if (!raw) return "";
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return "";
  const pathValue = sanitizePath(raw.startsWith("/public/") ? raw.slice("/public".length) || "/" : raw);
  return pathValue;
}

function safeFilePathForUrl(url: string) {
  const normalized = normalizePublicPath(url);
  if (!normalized) return "";

  const root = normalized.startsWith("/uploads/")
    ? env.uploadsDir
    : env.frontendPublicDir;
  const relative = normalized.startsWith("/uploads/")
    ? normalized.replace(/^\/uploads\//, "")
    : normalized.replace(/^\//, "");
  const resolved = path.resolve(root, relative);
  const resolvedRoot = path.resolve(root);

  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) {
    return "";
  }

  return resolved;
}

function urlMatchesKind(url: string, kind: InternalMediaKind) {
  const ext = path.extname(url).toLowerCase();
  if (kind === "image") return IMAGE_EXTENSIONS.has(ext);
  if (kind === "video") return VIDEO_EXTENSIONS.has(ext);
  return MEDIA_EXTENSIONS.has(ext);
}

function knownUrlsFromLibrary() {
  const urls = new Set<string>();
  for (const item of mediaLibraryRepository.read()) {
    for (const key of [
      "url",
      "optimizedUrl",
      "originalUrl",
      "thumbnailUrl",
      "smallUrl",
      "mediumUrl",
      "largeUrl",
      "posterUrl",
    ]) {
      const value = normalizePublicPath(item[key]);
      if (value) urls.add(value);
    }
  }
  return urls;
}

export function normalizeInternalMediaUrl(value: unknown): string {
  return normalizePublicPath(value);
}

export function isKnownLibraryMedia(value: unknown, kind: InternalMediaKind = "all"): boolean {
  const url = normalizeInternalMediaUrl(value);
  if (!url || !urlMatchesKind(url, kind)) return false;

  const filePath = safeFilePathForUrl(url);
  try {
    return Boolean(filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile());
  } catch {
    return false;
  }
}

export function assertInternalMediaUrl(
  value: unknown,
  options: InternalMediaValidationOptions = {}
): string {
  const kind = options.kind ?? "all";
  const label = options.label ?? "Mídia";
  const raw = sanitizeText(value, 600);
  const url = normalizeInternalMediaUrl(value);

  if (!url) {
    if (raw) {
      throw new HttpError(422, `${label}: use somente arquivos internos da biblioteca de mídia.`);
    }
    if (options.required) throw new HttpError(422, `${label}: selecione uma mídia da biblioteca.`);
    return "";
  }

  if (!urlMatchesKind(url, kind)) {
    throw new HttpError(
      422,
      `${label}: tipo de arquivo incompatível com o campo.`
    );
  }

  if (!isKnownLibraryMedia(url, kind)) {
    throw new HttpError(
      422,
      `${label}: use somente arquivos internos da biblioteca de mídia.`
    );
  }

  return url;
}

export function sanitizeInternalImageUrl(value: unknown, label = "Imagem"): string {
  return assertInternalMediaUrl(value, { kind: "image", label });
}

export function sanitizeInternalVideoUrl(value: unknown, label = "Vídeo"): string {
  return assertInternalMediaUrl(value, { kind: "video", label });
}

export function sanitizeInternalMediaUrl(value: unknown, label = "Mídia"): string {
  return assertInternalMediaUrl(value, { kind: "all", label });
}
