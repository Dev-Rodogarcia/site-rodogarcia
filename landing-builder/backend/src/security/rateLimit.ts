import type { RequestHandler } from "express";

export interface RateLimitPolicy {
  readonly maxRequests: number;
  readonly windowMs: number;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  readonly allowed: boolean;
  readonly retryAfterSeconds: number;
}

const MAX_TRACKED_CLIENTS = 10_000;

/**
 * Limiter local por processo. O serviço do Builder é single-writer; o limite
 * protege as rotas expostas sem transformar IPs em dados persistentes.
 */
export function createRateLimiter(policy: RateLimitPolicy, now = () => Date.now()) {
  const buckets = new Map<string, RateLimitBucket>();

  function pruneExpired(timestamp: number) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= timestamp) buckets.delete(key);
    }
  }

  function makeRoom(timestamp: number) {
    if (buckets.size < MAX_TRACKED_CLIENTS) return;

    pruneExpired(timestamp);
    while (buckets.size >= MAX_TRACKED_CLIENTS) {
      const oldestKey = buckets.keys().next().value;
      if (!oldestKey) break;
      buckets.delete(oldestKey);
    }
  }

  return {
    consume(key: string): RateLimitResult {
      const timestamp = now();
      const current = buckets.get(key);

      if (!current || current.resetAt <= timestamp) {
        makeRoom(timestamp);
        buckets.set(key, { count: 1, resetAt: timestamp + policy.windowMs });
        return { allowed: true, retryAfterSeconds: 0 };
      }

      if (current.count >= policy.maxRequests) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - timestamp) / 1_000)),
        };
      }

      current.count += 1;
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}

function clientKey(ip: string | undefined) {
  return (ip ?? "unknown").slice(0, 128);
}

export function createRateLimitMiddleware(policy: RateLimitPolicy): RequestHandler {
  const limiter = createRateLimiter(policy);

  return (req, res, next) => {
    const result = limiter.consume(clientKey(req.ip));
    if (result.allowed) {
      next();
      return;
    }

    res.setHeader("Retry-After", String(result.retryAfterSeconds));
    res.status(429).json({ error: "Muitas solicitações. Tente novamente em instantes." });
  };
}

export const publicLandingRateLimit: RateLimitPolicy = {
  maxRequests: 120,
  windowMs: 60_000,
};

export const internalLandingRateLimit: RateLimitPolicy = {
  maxRequests: 60,
  windowMs: 60_000,
};
