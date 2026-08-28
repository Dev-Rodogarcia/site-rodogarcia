import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp, { type Metadata } from "sharp";
import { getLandingMediaRoot, readLandingMedia, readLandings, writeLandingMedia } from "./store.js";
import type { LandingMedia, LandingMediaKind, StoredLandingMedia } from "./types.js";

export const LANDING_MEDIA_URL_PREFIX = "/landing-media/";

const MAX_IMAGE_UPLOAD_BYTES = 20 * 1024 * 1024;
const MAX_VIDEO_UPLOAD_BYTES = 70 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 40_000_000;
const MEDIA_ID_PATTERN = /^media_[A-Za-z0-9-]{36}$/;
const IMAGE_SIGNATURES = new Map<string, string>([
  ["png", "image/png"],
  ["jpeg", "image/jpeg"],
  ["webp", "image/webp"],
  ["avif", "image/avif"],
]);
const VIDEO_EXTENSIONS: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/ogg": "ogg",
};
const MP4_BRANDS = new Set([
  "isom", "iso2", "iso3", "iso4", "iso5", "iso6", "mp41", "mp42", "avc1", "dash", "M4V ", "MSNV", "qt  ",
]);

export class LandingMediaServiceError extends Error {
  constructor(message: string, readonly statusCode: 404 | 409 | 422) {
    super(message);
    this.name = "LandingMediaServiceError";
  }
}

export interface LandingMediaUpload {
  buffer: Buffer;
  size: number;
  mimetype: string;
}

function safeId(value: unknown): string | null {
  return typeof value === "string" && MEDIA_ID_PATTERN.test(value) ? value : null;
}

function isPng(buffer: Buffer) {
  return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
}

function isJpeg(buffer: Buffer) {
  return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

function isWebp(buffer: Buffer) {
  return buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
}

function isoBrands(buffer: Buffer) {
  if (buffer.length < 16 || buffer.subarray(4, 8).toString("ascii") !== "ftyp") return [];
  const brands: string[] = [];
  for (let index = 8; index + 4 <= Math.min(buffer.length, 64); index += 4) {
    brands.push(buffer.subarray(index, index + 4).toString("ascii"));
  }
  return brands;
}

function isAvif(buffer: Buffer) {
  return isoBrands(buffer).some((brand) => brand === "avif" || brand === "avis");
}

function detectImageMime(buffer: Buffer) {
  if (isPng(buffer)) return IMAGE_SIGNATURES.get("png")!;
  if (isJpeg(buffer)) return IMAGE_SIGNATURES.get("jpeg")!;
  if (isWebp(buffer)) return IMAGE_SIGNATURES.get("webp")!;
  if (isAvif(buffer)) return IMAGE_SIGNATURES.get("avif")!;
  return null;
}

function detectVideoMime(buffer: Buffer) {
  const brands = isoBrands(buffer);
  if (brands.some((brand) => MP4_BRANDS.has(brand))) return "video/mp4";
  if (buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) && buffer.subarray(0, 4_096).includes("webm")) {
    return "video/webm";
  }
  if (buffer.subarray(0, 4).toString("ascii") === "OggS" && buffer.subarray(0, 65_536).includes("theora")) {
    return "video/ogg";
  }
  return null;
}

function toMediaDto(record: StoredLandingMedia): LandingMedia {
  return {
    id: record.id,
    url: record.url,
    kind: record.kind,
    mimeType: record.mimeType,
    size: record.size,
    ...(record.width ? { width: record.width } : {}),
    ...(record.height ? { height: record.height } : {}),
    createdAt: record.createdAt,
  };
}

function mediaFilePath(record: StoredLandingMedia) {
  const expectedExtensions = record.kind === "image" ? ["webp"] : ["mp4", "webm", "ogg"];
  const match = new RegExp(`^${record.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.(${expectedExtensions.join("|")})$`).test(record.storageName);
  if (!match) return null;

  const root = path.resolve(getLandingMediaRoot());
  const candidate = path.resolve(root, record.storageName);
  const relative = path.relative(root, candidate);
  return relative && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative) ? candidate : null;
}

function isMediaReferenced(url: string) {
  const visit = (value: unknown): boolean => {
    if (typeof value === "string") return value === url;
    if (Array.isArray(value)) return value.some(visit);
    if (value && typeof value === "object") return Object.values(value).some(visit);
    return false;
  };

  return readLandings().some((landing) => visit(landing));
}

function mediaUrl(id: string) {
  return `${LANDING_MEDIA_URL_PREFIX}${id}`;
}

function normalizeMediaUrl(value: unknown) {
  if (typeof value !== "string" || !value.startsWith(LANDING_MEDIA_URL_PREFIX)) return null;
  const id = safeId(value.slice(LANDING_MEDIA_URL_PREFIX.length));
  return id ? mediaUrl(id) : null;
}

export function getLandingMediaByUrl(value: unknown): LandingMedia | null {
  const url = normalizeMediaUrl(value);
  if (!url) return null;
  const record = readLandingMedia().find((item) => item.url === url);
  return record ? toMediaDto(record) : null;
}

export function assertLandingMediaUrl(value: unknown) {
  const normalized = normalizeMediaUrl(value);
  if (!normalized || !getLandingMediaByUrl(normalized)) {
    throw new LandingMediaServiceError("Selecione uma mídia própria válida da biblioteca da campanha.", 422);
  }
  return normalized;
}

export function listLandingMedia() {
  return readLandingMedia()
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map(toMediaDto);
}

export async function saveLandingMedia(file: LandingMediaUpload): Promise<LandingMedia> {
  if (!Buffer.isBuffer(file.buffer) || file.buffer.length === 0 || file.size !== file.buffer.length) {
    throw new LandingMediaServiceError("Arquivo de mídia inválido.", 422);
  }

  const imageMime = detectImageMime(file.buffer);
  const videoMime = imageMime ? null : detectVideoMime(file.buffer);
  const kind: LandingMediaKind | null = imageMime ? "image" : videoMime ? "video" : null;
  const detectedMime = imageMime ?? videoMime;
  if (!kind || !detectedMime) {
    throw new LandingMediaServiceError("Tipo de mídia não suportado. Use PNG, JPG, WebP, AVIF, MP4, WebM ou Ogg de vídeo válido.", 422);
  }

  const maxBytes = kind === "image" ? MAX_IMAGE_UPLOAD_BYTES : MAX_VIDEO_UPLOAD_BYTES;
  if (file.size > maxBytes) {
    throw new LandingMediaServiceError(kind === "image" ? "Imagem excede o limite de 20 MB." : "Vídeo excede o limite de 70 MB.", 422);
  }

  const id = `media_${crypto.randomUUID()}`;
  const root = getLandingMediaRoot();
  fs.mkdirSync(root, { recursive: true });
  const createdAt = new Date().toISOString();

  if (kind === "image") {
    const storageName = `${id}.webp`;
    const finalPath = path.join(root, storageName);
    const temporaryPath = `${finalPath}.${process.pid}.${Date.now()}.tmp`;
    let metadata: Metadata;
    try {
      metadata = await sharp(file.buffer, { failOn: "error", limitInputPixels: MAX_IMAGE_PIXELS }).metadata();
      if (!metadata.format || !IMAGE_SIGNATURES.has(metadata.format)) {
        throw new Error("Formato de imagem inválido.");
      }
      await sharp(file.buffer, { failOn: "error", limitInputPixels: MAX_IMAGE_PIXELS })
        .rotate()
        .resize({ width: 2_400, height: 2_400, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toFile(temporaryPath);
      fs.renameSync(temporaryPath, finalPath);
    } catch {
      fs.rmSync(temporaryPath, { force: true });
      throw new LandingMediaServiceError("Não foi possível validar ou otimizar a imagem enviada.", 422);
    }

    const optimizedMetadata = await sharp(finalPath, { failOn: "error" }).metadata();

    const record: StoredLandingMedia = {
      id,
      url: mediaUrl(id),
      kind,
      mimeType: "image/webp",
      size: fs.statSync(finalPath).size,
      ...(optimizedMetadata.width ? { width: optimizedMetadata.width } : {}),
      ...(optimizedMetadata.height ? { height: optimizedMetadata.height } : {}),
      createdAt,
      storageName,
    };
    writeLandingMedia([record, ...readLandingMedia()]);
    return toMediaDto(record);
  }

  const extension = VIDEO_EXTENSIONS[detectedMime];
  const storageName = `${id}.${extension}`;
  const finalPath = path.join(root, storageName);
  const temporaryPath = `${finalPath}.${process.pid}.${Date.now()}.tmp`;
  try {
    fs.writeFileSync(temporaryPath, file.buffer, { flag: "wx" });
    fs.renameSync(temporaryPath, finalPath);
  } catch {
    fs.rmSync(temporaryPath, { force: true });
    throw new LandingMediaServiceError("Não foi possível salvar o vídeo enviado.", 422);
  }

  const record: StoredLandingMedia = {
    id,
    url: mediaUrl(id),
    kind,
    mimeType: detectedMime,
    size: file.size,
    createdAt,
    storageName,
  };
  writeLandingMedia([record, ...readLandingMedia()]);
  return toMediaDto(record);
}

export function deleteLandingMedia(idInput: unknown) {
  const id = safeId(idInput);
  if (!id) throw new LandingMediaServiceError("Mídia não encontrada.", 404);
  const records = readLandingMedia();
  const index = records.findIndex((record) => record.id === id);
  if (index < 0) throw new LandingMediaServiceError("Mídia não encontrada.", 404);
  const record = records[index]!;
  if (isMediaReferenced(record.url)) {
    throw new LandingMediaServiceError("Esta mídia ainda está em uso por uma landing page.", 409);
  }

  const filePath = mediaFilePath(record);
  if (!filePath) throw new LandingMediaServiceError("Registro de mídia inválido.", 422);
  fs.rmSync(filePath, { force: true });
  records.splice(index, 1);
  writeLandingMedia(records);
}

export function resolveLandingMedia(idInput: unknown) {
  const id = safeId(idInput);
  if (!id) return null;
  const record = readLandingMedia().find((item) => item.id === id);
  if (!record) return null;
  const filePath = mediaFilePath(record);
  if (!filePath || !fs.existsSync(filePath)) return null;
  return { record: toMediaDto(record), filePath };
}
