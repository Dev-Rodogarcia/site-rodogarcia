import type { Request } from "express";
import { auditLogRepository } from "../repositories/jsonRepositories.js";
import { getClientIp } from "../security/rateLimit.js";
import { publicUser } from "./authService.js";
import { generateId } from "../utils/ids.js";
import { maskIpAddress, sanitizeText } from "../utils/sanitize.js";

function sanitizeMetadata(input: unknown) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
  const entries = Object.entries(input as Record<string, unknown>)
    .slice(0, 12)
    .map(([key, value]) => [sanitizeText(key, 60), sanitizeText(String(value ?? ""), 180)])
    .filter(([key, value]) => key && value);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export function recordAuditAction({
  req,
  action,
  target,
  metadata,
}: {
  req?: Request;
  action: string;
  target?: string;
  metadata?: Record<string, unknown>;
}) {
  const logs = auditLogRepository.read();
  const user = req?.auth?.user ? publicUser(req.auth.user) : null;
  logs.push({
    id: generateId("audit"),
    createdAt: new Date().toISOString(),
    action: sanitizeText(action, 80),
    target: sanitizeText(target, 160),
    actorId: user?.id ?? "",
    actorEmail: user?.email ?? "",
    ip: req ? maskIpAddress(getClientIp(req)) : "",
    metadata: sanitizeMetadata(metadata),
  });
  auditLogRepository.write(logs.slice(-5000));
}

export function listAuditLog(filters: Record<string, unknown> = {}) {
  const action = sanitizeText(filters.action, 80).toLowerCase();
  const from = Date.parse(String(filters.from ?? ""));
  const to = Date.parse(String(filters.to ?? ""));
  const limit = Math.min(Math.max(Number(filters.limit) || 120, 1), 500);

  return auditLogRepository
    .read()
    .filter((entry) => {
      const createdAt = Date.parse(String(entry.createdAt ?? ""));
      if (action && !String(entry.action ?? "").toLowerCase().includes(action)) return false;
      if (Number.isFinite(from) && createdAt < from) return false;
      if (Number.isFinite(to) && createdAt > to) return false;
      return true;
    })
    .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")))
    .slice(0, limit);
}
