import fs from "fs";
import path from "path";
import { readContentData, readSiteTextsData, writeContentData, writeSiteTextsData } from "@/lib/content";
import { sanitizePath, sanitizeText, sanitizeUrl } from "@/lib/sanitize";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const UPLOADS_DIR = path.join(PUBLIC_DIR, "uploads");
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif"]);
const MIME_TO_EXTENSION: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "image/avif": ".avif",
};

export interface AdminImageRecord {
  name: string;
  url: string;
  source: "upload" | "content" | "library";
  usedInContent: boolean;
  size: number;
  references: number;
}

function walkFiles(rootDir: string, relativeDir = ""): string[] {
  const currentDir = path.join(rootDir, relativeDir);
  if (!fs.existsSync(currentDir)) return [];

  return fs.readdirSync(currentDir, { withFileTypes: true }).flatMap((entry) => {
    const nextRelative = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      return walkFiles(rootDir, nextRelative);
    }
    return [nextRelative];
  });
}

function collectImageReferences(value: unknown, target: Map<string, number>) {
  if (typeof value === "string") {
    const sanitized = sanitizeUrl(value);
    if (sanitized && IMAGE_EXTENSIONS.has(path.extname(sanitized).toLowerCase())) {
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
      Object.entries(value).map(([key, item]) => [key, replaceReferences(item, fromUrl, toUrl)])
    ) as T;
  }

  return value;
}

export function listAdminImages(): AdminImageRecord[] {
  const references = new Map<string, number>();
  collectImageReferences(readContentData(), references);
  collectImageReferences(readSiteTextsData(), references);

  const files = walkFiles(PUBLIC_DIR)
    .filter((relativePath) => IMAGE_EXTENSIONS.has(path.extname(relativePath).toLowerCase()))
    .map((relativePath) => {
      const url = `/${relativePath.replace(/\\/g, "/")}`;
      const normalized = sanitizePath(url);
      const absolutePath = path.join(PUBLIC_DIR, relativePath);
      const stats = fs.statSync(absolutePath);
      const referenceCount = references.get(normalized) ?? 0;

      return {
        name: path.basename(relativePath),
        url: normalized,
        size: stats.size,
        references: referenceCount,
        usedInContent: referenceCount > 0,
        source: normalized.startsWith("/uploads/")
          ? "upload"
          : referenceCount > 0
            ? "content"
            : "library",
      } satisfies AdminImageRecord;
    });

  return files.sort((a, b) => {
    if (a.usedInContent !== b.usedInContent) {
      return a.usedInContent ? -1 : 1;
    }
    if (a.source !== b.source) {
      return a.source.localeCompare(b.source);
    }
    return a.name.localeCompare(b.name);
  });
}

export function saveAdminImage(fileName: string, dataUrl: string) {
  const match = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Formato de upload invalido.");
  }

  const mimeType = match[1];
  const extension = MIME_TO_EXTENSION[mimeType];
  if (!extension) {
    throw new Error("Tipo de imagem nao suportado.");
  }

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length === 0 || buffer.length > 6 * 1024 * 1024) {
    throw new Error("Imagem fora do limite permitido.");
  }

  const safeBaseName =
    sanitizeText(path.parse(fileName).name, 80)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "imagem";

  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  const finalName = `${safeBaseName}-${Date.now()}${extension}`;
  const targetPath = path.join(UPLOADS_DIR, finalName);
  fs.writeFileSync(targetPath, buffer);

  return {
    fileName: finalName,
    url: `/uploads/${finalName}`,
  };
}

export function replaceAdminImageReferences(fromUrlRaw: string, toUrlRaw: string) {
  const fromUrl = sanitizeUrl(fromUrlRaw);
  const toUrl = sanitizeUrl(toUrlRaw);

  if (!fromUrl || !toUrl) {
    throw new Error("Informe URLs validas.");
  }

  const nextContent = replaceReferences(readContentData(), fromUrl, toUrl);
  const nextSiteTexts = replaceReferences(readSiteTextsData(), fromUrl, toUrl);

  writeContentData(nextContent);
  writeSiteTextsData(nextSiteTexts);

  return { fromUrl, toUrl };
}
