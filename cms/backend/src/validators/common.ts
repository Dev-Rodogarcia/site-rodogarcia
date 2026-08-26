import type { RequestHandler } from "express";
import { HttpError } from "../utils/http.js";

export const requireJson: RequestHandler = (req, res, next) => {
  if (req.is("application/json")) {
    next();
    return;
  }

  res.status(415).json({ error: "Content-Type deve ser application/json." });
};

/**
 * Multer limita cada arquivo, mas não conhece um teto agregado de requisição.
 * Este bloqueio usa o cabeçalho declarado antes que o parser multipart aloque
 * buffers; os limites de arquivo/campos continuam cobrindo corpos sem header.
 */
export function requireContentLengthLimit(maxBytes: number): RequestHandler {
  return (req, _res, next) => {
    const rawContentLength = req.header("content-length");
    if (!rawContentLength) {
      next();
      return;
    }

    const contentLength = Number(rawContentLength);
    if (!Number.isSafeInteger(contentLength) || contentLength < 0) {
      next(new HttpError(400, "Content-Length inválido."));
      return;
    }
    if (contentLength > maxBytes) {
      next(new HttpError(413, "Arquivo ou payload excede o limite permitido."));
      return;
    }
    next();
  };
}
