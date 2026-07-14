import type { ErrorRequestHandler, RequestHandler } from "express";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "Recurso não encontrado." });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const errorName = error instanceof Error ? error.name : "";
  const errorCode =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";
  const isMulterError = errorName === "MulterError";
  const isBodyTooLarge = errorCode === "LIMIT_FILE_SIZE" || errorCode === "entity.too.large";
  const status = error instanceof HttpError
    ? error.status
    : isBodyTooLarge
      ? 413
      : isMulterError
        ? 422
        : 500;
  const message =
    isBodyTooLarge
      ? "Arquivo ou payload excede o limite permitido."
      : error instanceof Error && status < 500
        ? error.message
      : "Erro interno no servidor.";
  res.status(status).json({ error: message });
};
