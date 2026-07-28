import fs from "node:fs";
import path from "node:path";
import type { Request } from "express";
import { storagePaths } from "../config/storagePaths.js";
import { improvementRepository } from "../repositories/jsonRepositories.js";
import { getClientIp, getRateLimitState, RATE_LIMITS, registerHit } from "../security/rateLimit.js";
import { generateId } from "../utils/ids.js";
import { HttpError } from "../utils/http.js";
import { sanitizeText } from "../utils/sanitize.js";
import { recordAuditAction } from "./auditService.js";
import type { ImprovementInput } from "../validators/improvement.js";

export type ImprovementStatus = "pending" | "completed" | "archived";
export interface ImprovementAttachment {
  id: string;
  name: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp" | "image/avif" | "text/csv" | "application/vnd.ms-excel" | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  size: number;
  storedName: string;
}

const RETENTION_DAYS = 60;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;
const IMAGE_MIME_TYPES = new Set<ImprovementAttachment["mimeType"]>(["image/png", "image/jpeg", "image/webp", "image/avif"]);

function enforceRateLimit(req: Request) {
  const ip = getClientIp(req);
  const limit = RATE_LIMITS.improvement;
  if (getRateLimitState("improvement", ip, limit.windowMs, limit.maxAttempts).count >= limit.maxAttempts) {
    throw new HttpError(429, "Limite de envios atingido. Tente novamente mais tarde.");
  }
  registerHit("improvement", ip, limit.windowMs);
}

function hasPrefix(buffer: Buffer, prefix: number[]) {
  return prefix.every((byte, index) => buffer[index] === byte);
}

function detectedAttachmentMime(file: Express.Multer.File): ImprovementAttachment["mimeType"] | null {
  const extension = path.extname(file.originalname).toLowerCase();
  const { buffer } = file;
  if (extension === ".png" && hasPrefix(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if ((extension === ".jpg" || extension === ".jpeg") && hasPrefix(buffer, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (extension === ".webp" && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (extension === ".avif" && buffer.subarray(4, 8).toString("ascii") === "ftyp" && ["avif", "avis"].includes(buffer.subarray(8, 12).toString("ascii"))) return "image/avif";
  if (extension === ".xls" && hasPrefix(buffer, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return "application/vnd.ms-excel";
  if (extension === ".xlsx" && hasPrefix(buffer, [0x50, 0x4b, 0x03, 0x04])) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (extension === ".csv" && buffer.length > 0 && !buffer.includes(0)) return "text/csv";
  return null;
}

function extensionForMime(mimeType: ImprovementAttachment["mimeType"]) {
  return mimeType === "image/jpeg" ? ".jpg"
    : mimeType === "image/png" ? ".png"
      : mimeType === "image/webp" ? ".webp"
        : mimeType === "image/avif" ? ".avif"
          : mimeType === "text/csv" ? ".csv"
            : mimeType === "application/vnd.ms-excel" ? ".xls" : ".xlsx";
}

function safeAttachmentName(value: string) {
  const name = path.basename(value).replace(/[\\/:*?"<>|\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim();
  return sanitizeText(name, 150) || "anexo";
}

function attachmentFromUnknown(value: unknown): ImprovementAttachment | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const mimeType = item.mimeType;
  if (typeof item.id !== "string" || typeof item.name !== "string" || typeof item.storedName !== "string" || typeof item.size !== "number" || !IMAGE_MIME_TYPES.has(mimeType as ImprovementAttachment["mimeType"]) && mimeType !== "text/csv" && mimeType !== "application/vnd.ms-excel" && mimeType !== "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") return null;
  return { id: item.id, name: item.name, storedName: item.storedName, size: item.size, mimeType: mimeType as ImprovementAttachment["mimeType"] };
}

function attachmentsFor(item: Record<string, unknown>) {
  return Array.isArray(item.attachments) ? item.attachments.map(attachmentFromUnknown).filter((attachment): attachment is ImprovementAttachment => Boolean(attachment)) : [];
}

function attachmentFilePath(storedName: string) {
  const root = path.resolve(storagePaths.improvementAttachments);
  const resolved = path.resolve(root, storedName);
  if (!resolved.startsWith(`${root}${path.sep}`)) throw new HttpError(404, "Anexo não encontrado.");
  return resolved;
}

function deleteAttachments(item: Record<string, unknown>) {
  for (const attachment of attachmentsFor(item)) {
    try { fs.rmSync(attachmentFilePath(attachment.storedName), { force: true }); } catch { /* a limpeza continua para os demais anexos */ }
  }
}

function persistAttachments(files: Express.Multer.File[]) {
  if (files.length > 5) throw new HttpError(422, "Envie no máximo cinco anexos.");
  const entries = files.map((file) => {
    const mimeType = detectedAttachmentMime(file);
    if (!mimeType) throw new HttpError(422, "Anexe apenas fotos PNG, JPG, WebP ou AVIF, ou arquivos CSV, XLS e XLSX válidos.");
    const id = generateId("attachment");
    const storedName = `${id}${extensionForMime(mimeType)}`;
    return { id, name: safeAttachmentName(file.originalname), mimeType, size: file.size, storedName, buffer: file.buffer };
  });

  fs.mkdirSync(storagePaths.improvementAttachments, { recursive: true });
  const written: string[] = [];
  try {
    for (const entry of entries) {
      fs.writeFileSync(attachmentFilePath(entry.storedName), entry.buffer, { flag: "wx" });
      written.push(entry.storedName);
    }
  } catch (error) {
    for (const storedName of written) fs.rmSync(attachmentFilePath(storedName), { force: true });
    throw error;
  }
  return entries.map(({ buffer: _buffer, ...entry }) => entry);
}

function dateIsOlderThan(value: unknown, now: number) {
  const timestamp = Date.parse(String(value ?? ""));
  return Number.isFinite(timestamp) && now - timestamp >= RETENTION_MS;
}

/** Arquiva concluídas após 60 dias e exclui anexos e registro arquivados após mais 60 dias. */
export function runImprovementRetention(now = new Date()) {
  const nowMs = now.getTime();
  const nowIso = now.toISOString();
  const improvements = improvementRepository.read();
  let changed = false;
  const retained: Record<string, unknown>[] = [];
  for (const item of improvements) {
    if (item.status === "archived" && dateIsOlderThan(item.archivedAt ?? item.updatedAt, nowMs)) {
      deleteAttachments(item);
      changed = true;
      continue;
    }
    if (item.status === "completed" && dateIsOlderThan(item.completedAt ?? item.updatedAt, nowMs)) {
      retained.push({ ...item, status: "archived", archivedAt: nowIso, updatedAt: nowIso });
      changed = true;
      continue;
    }
    retained.push(item);
  }
  if (changed) improvementRepository.write(retained);
}

export function createImprovement(req: Request, input: ImprovementInput, files: Express.Multer.File[]) {
  enforceRateLimit(req);
  runImprovementRetention();
  const attachments = persistAttachments(files);
  const now = new Date().toISOString();
  const normalizedInput = input.profile === "site_user"
    ? { ...input, phone: "", branch: "", area: "", expectedResult: "", applicationPlace: "" }
    : { ...input, page: "" };
  const entry = { id: generateId("improvement"), createdAt: now, updatedAt: now, statusChangedAt: now, status: "pending" as ImprovementStatus, attachments, ...normalizedInput };
  try {
    const improvements = improvementRepository.read();
    improvements.push(entry);
    improvementRepository.write(improvements.slice(-5000));
  } catch (error) {
    deleteAttachments(entry);
    throw error;
  }
  return entry;
}

export function listImprovements(status?: string) {
  runImprovementRetention();
  const requestedStatus = sanitizeText(status, 20);
  return improvementRepository.read()
    .filter((item) => !requestedStatus || item.status === requestedStatus)
    .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
}

export function updateImprovementStatus(id: string, status: ImprovementStatus, req: Request) {
  runImprovementRetention();
  const improvements = improvementRepository.read();
  const index = improvements.findIndex((item) => item.id === id);
  if (index < 0) throw new HttpError(404, "Solicitação de melhoria não encontrada.");
  const current = improvements[index];
  const now = new Date().toISOString();
  const updated: Record<string, unknown> = { ...current, status, updatedAt: now, statusChangedAt: now };
  if (status === "completed") updated.completedAt = now;
  if (status === "archived") updated.archivedAt = now;
  if (status !== "completed") delete updated.completedAt;
  if (status !== "archived") delete updated.archivedAt;
  improvements[index] = updated;
  improvementRepository.write(improvements);
  recordAuditAction({ req, action: "improvement.status.update", target: id, metadata: { status } });
  return updated;
}

export function getImprovementAttachment(improvementId: string, attachmentId: string) {
  runImprovementRetention();
  const item = improvementRepository.read().find((candidate) => candidate.id === improvementId);
  if (!item) throw new HttpError(404, "Solicitação de melhoria não encontrada.");
  const attachment = attachmentsFor(item).find((candidate) => candidate.id === attachmentId);
  if (!attachment) throw new HttpError(404, "Anexo não encontrado.");
  const filePath = attachmentFilePath(attachment.storedName);
  if (!fs.existsSync(filePath)) throw new HttpError(404, "Anexo não encontrado.");
  return { ...attachment, filePath, inline: IMAGE_MIME_TYPES.has(attachment.mimeType) };
}

export const improvementAttachmentRules = { maxFiles: 5, maxFileSizeBytes: 8 * 1024 * 1024, retentionDays: RETENTION_DAYS };
