import type { RequestHandler } from "express";
import { env } from "../config/env.js";

export const requireAllowedOrigin: RequestHandler = (req, res, next) => {
  const origin = req.header("origin");
  if (origin && env.allowedOrigins.has(origin)) {
    next();
    return;
  }

  res.status(403).json({ error: "Origem não autorizada." });
};
