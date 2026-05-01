import crypto from "node:crypto";
import type { RequestHandler } from "express";

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

export const requireCsrf: RequestHandler = (req, res, next) => {
  const expected = req.auth?.session?.csrfToken ?? "";
  const provided = req.header("x-csrf-token") ?? "";

  if (!expected || !provided || !timingSafeEqual(expected, provided)) {
    res.status(403).json({ error: "Token CSRF invalido ou ausente." });
    return;
  }

  next();
};
