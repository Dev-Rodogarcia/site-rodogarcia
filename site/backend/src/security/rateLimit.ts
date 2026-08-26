import type { Request } from "express";
import type { RequestHandler } from "express";
import { rateLimitRepository } from "../repositories/rateLimitRepository.js";
import { HttpError } from "../utils/http.js";

export const RATE_LIMITS = {
  eslQuote: { windowMs: 60 * 60 * 1000, maxAttempts: 30 },
  eslInvoiceValidation: { windowMs: 60 * 60 * 1000, maxAttempts: 30 },
  eslCollectionCreate: { windowMs: 60 * 60 * 1000, maxAttempts: 20 },
  eslCollectionMaintenance: { windowMs: 60 * 60 * 1000, maxAttempts: 10 },
  publicPostalCode: { windowMs: 60 * 60 * 1000, maxAttempts: 60 },
  publicLookup: { windowMs: 60 * 60 * 1000, maxAttempts: 30 },
} as const;

export function getClientIp(req: Request): string {
  return req.ip || "unknown";
}

export function getRateLimitState(
  namespace: string,
  key: string,
  windowMs: number,
  maxAttempts: number
) {
  return rateLimitRepository.get(namespace, key, windowMs, maxAttempts);
}

export function registerHit(namespace: string, key: string, windowMs: number) {
  return rateLimitRepository.hit(namespace, key, windowMs);
}

export function requireRateLimit(
  namespace: string,
  limit: { windowMs: number; maxAttempts: number },
  message = "Muitas tentativas. Tente novamente mais tarde."
): RequestHandler {
  return (req, _res, next) => {
    const ip = getClientIp(req);
    const state = getRateLimitState(namespace, ip, limit.windowMs, limit.maxAttempts);
    if (state.count >= limit.maxAttempts) {
      next(new HttpError(429, message));
      return;
    }
    registerHit(namespace, ip, limit.windowMs);
    next();
  };
}
