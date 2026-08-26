import type { Request } from "express";
import type { RequestHandler } from "express";
import { rateLimitRepository } from "../repositories/rateLimitRepository.js";
import { HttpError } from "../utils/http.js";

export const RATE_LIMITS = {
  login: { windowMs: 10 * 60 * 1000, maxAttempts: 8 },
  passwordReset: { windowMs: 60 * 60 * 1000, maxAttempts: 5 },
  lead: { windowMs: 60 * 60 * 1000, maxAttempts: 8 },
  improvement: { windowMs: 60 * 60 * 1000, maxAttempts: 8 },
  popupEvent: { windowMs: 60 * 60 * 1000, maxAttempts: 150 },
  analytics: { windowMs: 60 * 60 * 1000, maxAttempts: 1200 },
  consent: { windowMs: 60 * 60 * 1000, maxAttempts: 20 },
  setup: { windowMs: 60 * 60 * 1000, maxAttempts: 5 },
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
