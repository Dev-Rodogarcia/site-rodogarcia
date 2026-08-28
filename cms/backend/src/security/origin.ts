import type { RequestHandler } from "express";
import { env } from "../config/env.js";

function isDevelopmentDevTunnelOrigin(origin: string) {
  if (env.isProduction) return false;

  try {
    const url = new URL(origin);
    return url.protocol === "https:" && /^[a-z0-9-]+-\d+\.[a-z0-9-]+\.devtunnels\.ms$/i.test(url.hostname);
  } catch {
    return false;
  }
}

export function isAllowedOrigin(origin: string | undefined) {
  return Boolean(origin && (env.allowedOrigins.has(origin) || isDevelopmentDevTunnelOrigin(origin)));
}

export const requireAllowedOrigin: RequestHandler = (req, res, next) => {
  const origin = req.header("origin");
  if (isAllowedOrigin(origin)) {
    next();
    return;
  }

  res.status(403).json({ error: "Origem não autorizada." });
};
