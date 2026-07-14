import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import sharp from "sharp";
import type { Request } from "express";
import { env } from "../config/env.js";
import {
  mediaLibraryRepository,
  mediaSlotsRepository,
  popupConfigRepository,
  seoSettingsRepository,
} from "../repositories/jsonRepositories.js";
import {
  readContentData,
  readSiteTextsData,
  writeContentData,
  writeSiteTextsData,
} from "./contentService.js";
import { sanitizePath, sanitizeText, sanitizeUrl } from "../utils/sanitize.js";
import { HttpError } from "../utils/http.js";
import { generateId } from "../utils/ids.js";
import { recordAuditAction } from "./auditService.js";
import {
  IMAGE_EXTENSIONS,
  MEDIA_EXTENSIONS,
  VIDEO_EXTENSIONS,
  assertInternalMediaUrl,
} from "./mediaValidationService.js";

const MAX_IMAGE_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_UPLOAD_BYTES = 64 * 1024 * 1024;
const WEBP_QUALITY = clampNumber(process.env.MEDIA_WEBP_QUALITY, 82, 60, 95);
const WEBP_THUMB_QUALITY = clampNumber(process.env.MEDIA_WEBP_THUMB_QUALITY, 72, 55, 90);
const WEBP_MEDIUM_WIDTH = clampNumber(process.env.MEDIA_WEBP_MEDIUM_WIDTH, 960, 480, 1600);
const WEBP_LARGE_WIDTH = clampNumber(process.env.MEDIA_WEBP_LARGE_WIDTH, 1440, 960, 2400);
const WEBP_OPTIMIZED_WIDTH = clampNumber(process.env.MEDIA_WEBP_OPTIMIZED_WIDTH, 1920, 1200, 3200);
const UPLOAD_IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
]);
const UPLOAD_VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/ogg",
  "application/ogg",
]);
const MIME_TO_EXTENSION: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/ogg": ".ogg",
  "application/ogg": ".ogg",
};

export interface AdminImageRecord {
  id?: string;
  name: string;
  url: string;
  source: "upload" | "content" | "library";
  usedInContent: boolean;
  size: number;
  references: number;
  mediaType: "image" | "video";
  format?: string;
  width?: number;
  height?: number;
  uploadedAt?: string;
  originalSize?: number;
  optimizedSize?: number;
  originalUrl?: string;
  optimizedUrl?: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  largeUrl?: string;
}

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.round(parsed)));
}

function walkFiles(rootDir: string, relativeDir = ""): string[] {
  const currentDir = path.join(rootDir, relativeDir);
  if (!fs.existsSync(currentDir)) return [];
  return fs.readdirSync(currentDir, { withFileTypes: true }).flatMap((entry) => {
    const nextRelative = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) return walkFiles(rootDir, nextRelative);
    return [nextRelative];
  });
}

function collectImageReferences(value: unknown, target: Map<string, number>) {
  if (typeof value === "string") {
    const sanitized = sanitizeUrl(value);
    if (sanitized && MEDIA_EXTENSIONS.has(path.extname(sanitized).toLowerCase())) {
      target.set(sanitized, (target.get(sanitized) ?? 0) + 1);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectImageReferences(item, target));
    return;
  }
  if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectImageReferences(item, target));
  }
}

function replaceReferences<T>(value: T, fromUrl: string, toUrl: string): T {
  if (typeof value === "string") {
    return (sanitizeUrl(value) === fromUrl ? toUrl : value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => replaceReferences(item, fromUrl, toUrl)) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        replaceReferences(item, fromUrl, toUrl),
      ])
    ) as T;
  }
  return value;
}

function isValidImageBuffer(mimeType: string, buffer: Buffer): boolean {
  if (mimeType === "image/png") {
    return buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (mimeType === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === "image/webp") {
    return (
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  if (mimeType === "image/avif") {
    return (
      buffer.subarray(4, 8).toString("ascii") === "ftyp" &&
      ["avif", "avis"].includes(buffer.subarray(8, 12).toString("ascii"))
    );
  }
  return false;
}

function isValidVideoBuffer(mimeType: string, buffer: Buffer): boolean {
  if (mimeType === "video/mp4") {
    return buffer.length > 12 && buffer.subarray(4, 8).toString("ascii") === "ftyp";
  }
  if (mimeType === "video/webm") {
    return (
      buffer.length > 4 &&
      buffer[0] === 0x1a &&
      buffer[1] === 0x45 &&
      buffer[2] === 0xdf &&
      buffer[3] === 0xa3
    );
  }
  if (mimeType === "video/ogg" || mimeType === "application/ogg") {
    return buffer.length > 4 && buffer.subarray(0, 4).toString("ascii") === "OggS";
  }
  return false;
}

function mediaTypeFromUrl(url: string): "image" | "video" {
  return VIDEO_EXTENSIONS.has(path.extname(url).toLowerCase()) ? "video" : "image";
}

function safeFileBaseName(fileName: string) {
  return (
    sanitizeText(path.parse(fileName).name, 80)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "imagem"
  );
}

function readMediaLibrary() {
  return mediaLibraryRepository.read();
}

function writeMediaLibrary(items: Record<string, unknown>[]) {
  mediaLibraryRepository.write(items);
}

function getReferences() {
  const references = new Map<string, number>();
  collectImageReferences(readContentData(), references);
  collectImageReferences(readSiteTextsData(), references);
  collectImageReferences(readMediaSlots(), references);
  collectImageReferences(popupConfigRepository.read<Record<string, unknown>>({}), references);
  collectImageReferences(seoSettingsRepository.read<Record<string, unknown>>({}), references);
  return references;
}

function libraryRecordByUrl() {
  const entries: Array<[string, Record<string, unknown>]> = [];
  for (const item of readMediaLibrary()) {
    for (const value of [
      item.url,
      item.optimizedUrl,
      item.originalUrl,
      item.thumbnailUrl,
      item.mediumUrl,
      item.largeUrl,
      item.posterUrl,
    ]) {
      const url = sanitizePath(value);
      if (url) entries.push([url, item]);
    }
  }
  return new Map(entries);
}

export function listAdminImages(): AdminImageRecord[] {
  const references = getReferences();
  const libraryByUrl = libraryRecordByUrl();

  const uploadedRecords: AdminImageRecord[] = readMediaLibrary().map((item) => {
    const url = sanitizePath(item.url ?? item.optimizedUrl);
    const statsPath = url.startsWith("/uploads/")
      ? path.join(env.uploadsDir, url.replace(/^\/uploads\//, ""))
      : path.join(env.frontendPublicDir, url.replace(/^\//, ""));
    const size = fs.existsSync(statsPath)
      ? fs.statSync(statsPath).size
      : Number(item.optimizedSize ?? item.size ?? 0);
    const referenceCount = references.get(url) ?? 0;
    return {
      id: String(item.id ?? ""),
      name: String(item.name ?? path.basename(url)),
      url,
      size,
      references: referenceCount,
      usedInContent: referenceCount > 0,
      source: "upload",
      mediaType: String(item.mediaType ?? mediaTypeFromUrl(url)) === "video" ? "video" : "image",
      format: String(item.format ?? "webp"),
      width: Number(item.width ?? 0) || undefined,
      height: Number(item.height ?? 0) || undefined,
      uploadedAt: String(item.uploadedAt ?? item.createdAt ?? ""),
      originalSize: Number(item.originalSize ?? 0) || undefined,
      optimizedSize: Number(item.optimizedSize ?? size) || undefined,
      originalUrl: sanitizePath(item.originalUrl),
      optimizedUrl: sanitizePath(item.optimizedUrl ?? item.url),
      thumbnailUrl: sanitizePath(item.thumbnailUrl),
      mediumUrl: sanitizePath(item.mediumUrl),
      largeUrl: sanitizePath(item.largeUrl),
    } satisfies AdminImageRecord;
  });

  const uploadFiles: AdminImageRecord[] = [];
  for (const relativePath of walkFiles(env.uploadsDir).filter((item) =>
    MEDIA_EXTENSIONS.has(path.extname(item).toLowerCase())
  )) {
      const url = `/uploads/${relativePath.replace(/\\/g, "/")}`;
      const normalized = sanitizePath(url);
      if (libraryByUrl.has(normalized)) continue;
      const stats = fs.statSync(path.join(env.uploadsDir, relativePath));
      const referenceCount = references.get(normalized) ?? 0;
      uploadFiles.push({
        name: path.basename(relativePath),
        url: normalized,
        size: stats.size,
        references: referenceCount,
        usedInContent: referenceCount > 0,
        source: "upload",
        mediaType: mediaTypeFromUrl(normalized),
        format: path.extname(relativePath).replace(".", ""),
        uploadedAt: stats.mtime.toISOString(),
      });
  }

  const libraryFiles: AdminImageRecord[] = walkFiles(env.frontendPublicDir)
    .filter((relativePath) => !relativePath.replace(/\\/g, "/").startsWith("uploads/"))
    .filter((relativePath) => MEDIA_EXTENSIONS.has(path.extname(relativePath).toLowerCase()))
    .map((relativePath) => {
      const url = `/${relativePath.replace(/\\/g, "/")}`;
      const normalized = sanitizePath(url);
      const stats = fs.statSync(path.join(env.frontendPublicDir, relativePath));
      const referenceCount = references.get(normalized) ?? 0;
      return {
        name: path.basename(relativePath),
        url: normalized,
        size: stats.size,
        references: referenceCount,
        usedInContent: referenceCount > 0,
        source: referenceCount > 0 ? "content" : "library",
        mediaType: mediaTypeFromUrl(normalized),
        format: path.extname(relativePath).replace(".", ""),
      } satisfies AdminImageRecord;
    });

  return [...uploadedRecords, ...uploadFiles, ...libraryFiles].sort((a, b) => {
    if (a.usedInContent !== b.usedInContent) return a.usedInContent ? -1 : 1;
    if (a.source !== b.source) return a.source.localeCompare(b.source);
    return a.name.localeCompare(b.name);
  });
}

export async function saveAdminImageFromBuffer({
  req,
  fileName,
  mimeType,
  buffer,
}: {
  req?: Request;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}) {
  if (!UPLOAD_IMAGE_MIME_TYPES.has(mimeType) || !MIME_TO_EXTENSION[mimeType]) {
    throw new HttpError(422, "Tipo de imagem não suportado. Use PNG, JPG, WebP ou AVIF.");
  }
  if (buffer.length === 0 || buffer.length > MAX_IMAGE_UPLOAD_BYTES) {
    throw new HttpError(422, "Imagem fora do limite permitido.");
  }
  if (!isValidImageBuffer(mimeType, buffer)) {
    throw new HttpError(422, "O conteúdo do arquivo não corresponde ao tipo informado.");
  }

  fs.mkdirSync(env.uploadsDir, { recursive: true });
  const base = `${safeFileBaseName(fileName)}-${crypto.randomUUID()}`;
  const originalName = `${base}${MIME_TO_EXTENSION[mimeType]}`;
  const optimizedName = `${base}.webp`;
  const thumbnailName = `${base}-thumb.webp`;
  const mediumName = `${base}-medium.webp`;
  const largeName = `${base}-large.webp`;
  const originalPath = path.join(env.uploadsDir, originalName);
  const optimizedPath = path.join(env.uploadsDir, optimizedName);
  const thumbnailPath = path.join(env.uploadsDir, thumbnailName);
  const mediumPath = path.join(env.uploadsDir, mediumName);
  const largePath = path.join(env.uploadsDir, largeName);

  fs.writeFileSync(originalPath, buffer);
  const pipeline = sharp(buffer, { failOn: "none" }).rotate();
  const metadata = await pipeline.metadata();
  await sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({ width: WEBP_OPTIMIZED_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toFile(optimizedPath);
  await sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({ width: 420, height: 260, fit: "cover" })
    .webp({ quality: WEBP_THUMB_QUALITY, effort: 4 })
    .toFile(thumbnailPath);
  await sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({ width: WEBP_MEDIUM_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toFile(mediumPath);
  await sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({ width: WEBP_LARGE_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toFile(largePath);

  const record = {
    id: generateId("media"),
    name: path.basename(fileName),
    url: `/uploads/${optimizedName}`,
    mediaType: "image",
    originalUrl: `/uploads/${originalName}`,
    optimizedUrl: `/uploads/${optimizedName}`,
    thumbnailUrl: `/uploads/${thumbnailName}`,
    mediumUrl: `/uploads/${mediumName}`,
    largeUrl: `/uploads/${largeName}`,
    format: "webp",
    originalFormat: mimeType,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    originalSize: buffer.length,
    optimizedSize: fs.statSync(optimizedPath).size,
    thumbnailSize: fs.statSync(thumbnailPath).size,
    mediumSize: fs.statSync(mediumPath).size,
    largeSize: fs.statSync(largePath).size,
    webpQuality: WEBP_QUALITY,
    uploadedAt: new Date().toISOString(),
  };
  writeMediaLibrary([record, ...readMediaLibrary()].slice(0, 5000));
  recordAuditAction({
    req,
    action: "media.upload",
    target: record.url,
    metadata: {
      fileName,
      originalSize: String(record.originalSize),
      optimizedSize: String(record.optimizedSize),
    },
  });
  return record;
}

export async function saveAdminMediaFromBuffer({
  req,
  fileName,
  mimeType,
  buffer,
}: {
  req?: Request;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}) {
  if (UPLOAD_IMAGE_MIME_TYPES.has(mimeType)) {
    return saveAdminImageFromBuffer({ req, fileName, mimeType, buffer });
  }

  if (!UPLOAD_VIDEO_MIME_TYPES.has(mimeType) || !MIME_TO_EXTENSION[mimeType]) {
    throw new HttpError(
      422,
      "Tipo de mídia não suportado. Use imagem PNG/JPG/WebP/AVIF ou vídeo MP4/WebM/Ogg."
    );
  }
  if (buffer.length === 0 || buffer.length > MAX_VIDEO_UPLOAD_BYTES) {
    throw new HttpError(422, "Video fora do limite permitido.");
  }
  if (!isValidVideoBuffer(mimeType, buffer)) {
    throw new HttpError(422, "O conteúdo do vídeo não corresponde ao tipo informado.");
  }

  fs.mkdirSync(env.uploadsDir, { recursive: true });
  const fileExtension = MIME_TO_EXTENSION[mimeType]!;
  const storedName = `${safeFileBaseName(fileName)}-${crypto.randomUUID()}${fileExtension}`;
  const storedPath = path.join(env.uploadsDir, storedName);
  fs.writeFileSync(storedPath, buffer);

  const record = {
    id: generateId("media"),
    name: path.basename(fileName),
    url: `/uploads/${storedName}`,
    mediaType: "video",
    format: fileExtension.replace(".", ""),
    originalFormat: mimeType,
    size: buffer.length,
    originalSize: buffer.length,
    uploadedAt: new Date().toISOString(),
  };
  writeMediaLibrary([record, ...readMediaLibrary()].slice(0, 5000));
  recordAuditAction({
    req,
    action: "media.upload",
    target: record.url,
    metadata: {
      fileName,
      originalSize: String(record.originalSize),
      mediaType: "video",
    },
  });
  return record;
}

export function replaceAdminImageReferences(fromUrlRaw: string, toUrlRaw: string, req?: Request) {
  const fromUrl = assertInternalMediaUrl(fromUrlRaw, { kind: "all", required: true, label: "URL atual" });
  const toUrl = assertInternalMediaUrl(toUrlRaw, { kind: "all", required: true, label: "Nova URL" });
  if (!fromUrl || !toUrl) throw new HttpError(422, "Informe URLs validas.");
  if (mediaTypeFromUrl(fromUrl) !== mediaTypeFromUrl(toUrl)) {
    throw new HttpError(422, "Substitua a referência por uma mídia do mesmo tipo.");
  }

  writeContentData(replaceReferences(readContentData(), fromUrl, toUrl));
  writeSiteTextsData(replaceReferences(readSiteTextsData(), fromUrl, toUrl));
  writeMediaSlots(replaceReferences(readMediaSlots(), fromUrl, toUrl));
  popupConfigRepository.write(
    replaceReferences(popupConfigRepository.read<Record<string, unknown>>({}), fromUrl, toUrl)
  );
  seoSettingsRepository.write(
    replaceReferences(seoSettingsRepository.read<Record<string, unknown>>({}), fromUrl, toUrl)
  );
  recordAuditAction({
    req,
    action: "media.replace_reference",
    target: fromUrl,
    metadata: { toUrl },
  });
  return { fromUrl, toUrl };
}

export function readMediaSlots() {
  return mediaSlotsRepository.read<Record<string, string>>({});
}

export function writeMediaSlots(slots: Record<string, string>) {
  mediaSlotsRepository.write(slots);
}

const EDITABLE_MEDIA_SLOTS = new Set([
  "home.cert.iso",
  "home.cert.sassmaq",
  "home.cert.ecovadis",
  "home.cert.pf",
  "home.cert.pcsp",
  "home.cert.exercito",
  "home.cert.ibama",
]);

export function updateMediaSlots(req: Request | undefined, body: Record<string, unknown>) {
  const current = readMediaSlots();
  const next: Record<string, string> = { ...current };
  for (const [rawKey, value] of Object.entries(body)) {
    const key = sanitizeText(rawKey, 120);
    if (!EDITABLE_MEDIA_SLOTS.has(key)) {
      throw new HttpError(422, `Slot de mídia não editável: ${key || rawKey}.`);
    }
    const mediaUrl = assertInternalMediaUrl(value, {
      kind: "image",
      required: false,
      label: `Slot ${key}`,
    });
    if (mediaUrl) next[key] = mediaUrl;
    else delete next[key];
  }
  writeMediaSlots(next);
  recordAuditAction({
    req,
    action: "media.slots_update",
    target: "media-slots",
    metadata: { count: String(Object.keys(next).length) },
  });
  return next;
}
