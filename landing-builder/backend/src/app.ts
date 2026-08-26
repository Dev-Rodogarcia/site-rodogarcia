import crypto from "node:crypto";
import express, { type ErrorRequestHandler, type RequestHandler } from "express";
import helmet from "helmet";
import multer from "multer";
import { env } from "./config/env.js";
import {
  createLanding,
  getPreviewLanding,
  getPublishedLanding,
  LandingServiceError,
  listPublishedLandingIndex,
  listLandings,
  provisionLandingPreview,
  setLandingStatus,
  toInternalLanding,
  toPublicLanding,
  updateLanding,
} from "./landingService.js";
import {
  deleteLandingMedia,
  LandingMediaServiceError,
  listLandingMedia,
  resolveLandingMedia,
  saveLandingMedia,
} from "./mediaService.js";
import {
  createRateLimitMiddleware,
  internalLandingRateLimit,
  publicLandingRateLimit,
} from "./security/rateLimit.js";

const MAX_LANDING_MEDIA_UPLOAD_BYTES = 70 * 1024 * 1024;
const uploadLandingMedia = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_LANDING_MEDIA_UPLOAD_BYTES,
    files: 1,
    fields: 4,
    fieldSize: 16 * 1024,
    parts: 6,
  },
});

function validServiceToken(provided: string) {
  const expected = Buffer.from(env.serviceToken);
  const received = Buffer.from(provided);
  return expected.length > 0 && received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

const requireService: RequestHandler = (req, res, next) => {
  const provided = req.header("x-landing-builder-service-token") ?? "";
  if (!validServiceToken(provided)) {
    res.status(401).json({ error: "Integração de serviço não autorizada." });
    return;
  }
  res.setHeader("Cache-Control", "private, no-store");
  next();
};

const requireJson: RequestHandler = (req, res, next) => {
  if (req.is("application/json")) {
    next();
    return;
  }

  res.status(415).json({ error: "Use Content-Type: application/json." });
};

const requireEmptyOrJson: RequestHandler = (req, res, next) => {
  const contentLength = req.header("content-length");
  const hasBody = Boolean(req.header("transfer-encoding")) || (contentLength !== undefined && contentLength !== "0");
  if (!hasBody || req.is("application/json")) {
    next();
    return;
  }

  res.status(415).json({ error: "Use Content-Type: application/json." });
};

const requireMultipart: RequestHandler = (req, res, next) => {
  if (req.is("multipart/form-data")) {
    next();
    return;
  }

  res.status(415).json({ error: "Use Content-Type: multipart/form-data." });
};

const requireUploadContentLength: RequestHandler = (req, res, next) => {
  const rawLength = req.header("content-length");
  if (!rawLength) {
    next();
    return;
  }
  const contentLength = Number(rawLength);
  if (!Number.isSafeInteger(contentLength) || contentLength < 0) {
    res.status(400).json({ error: "Content-Length inválido." });
    return;
  }
  if (contentLength > MAX_LANDING_MEDIA_UPLOAD_BYTES + 65_536) {
    res.status(413).json({ error: "Arquivo ou payload excede o limite permitido." });
    return;
  }
  next();
};

function sendServiceError(res: express.Response, error: unknown) {
  if (error instanceof LandingServiceError || error instanceof LandingMediaServiceError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  res.status(500).json({ error: "Não foi possível processar a solicitação." });
}

function respond(res: express.Response, callback: () => unknown, status = 200) {
  try {
    res.status(status).json(callback());
  } catch (error) {
    sendServiceError(res, error);
  }
}

function respondAsync(res: express.Response, next: express.NextFunction, callback: () => Promise<unknown>, status = 200) {
  void callback()
    .then((payload) => res.status(status).json(payload))
    .catch(next);
}

function param(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] ?? "" : value ?? ""; }

function previewRotateRequested(value: unknown) {
  if (value === undefined || value === null || (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0)) {
    return false;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new LandingServiceError("Payload de prévia inválido.", 422);
  }
  const entries = Object.entries(value);
  if (entries.length !== 1 || entries[0]?.[0] !== "rotate" || typeof entries[0][1] !== "boolean") {
    throw new LandingServiceError("Payload de prévia inválido.", 422);
  }
  return entries[0][1];
}

function errorType(error: unknown) {
  return error && typeof error === "object" && "type" in error && typeof error.type === "string"
    ? error.type
    : "";
}

function errorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error && typeof error.code === "string"
    ? error.code
    : "";
}

const requestErrorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (res.headersSent) return;

  if (errorType(error) === "entity.parse.failed") {
    res.status(400).json({ error: "JSON inválido." });
    return;
  }

  if (errorType(error) === "entity.too.large") {
    res.status(413).json({ error: "Payload excede o limite permitido." });
    return;
  }

  if (error instanceof multer.MulterError) {
    const status = errorCode(error) === "LIMIT_FILE_SIZE" ? 413 : 422;
    res.status(status).json({ error: status === 413 ? "Arquivo ou payload excede o limite permitido." : "Upload de mídia inválido." });
    return;
  }

  sendServiceError(res, error);
};

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  // O gateway local encaminha o IP original; só confiamos nesse cabeçalho quando
  // a conexão imediata vem do próprio host.
  app.set("trust proxy", "loopback");
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(express.json({ limit: "1mb" }));

  const limitPublicLandings = createRateLimitMiddleware(publicLandingRateLimit);
  const limitInternalLandings = createRateLimitMiddleware(internalLandingRateLimit);

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.get("/landing-media/:id", limitPublicLandings, (req, res, next) => {
    const media = resolveLandingMedia(param(req.params.id));
    if (!media) {
      res.status(404).json({ error: "Mídia não encontrada." });
      return;
    }
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Content-Disposition", "inline");
    res.type(media.record.mimeType);
    res.sendFile(media.filePath, (error) => {
      if (error && !res.headersSent) next(error);
    });
  });

  app.get("/api/public/landings", limitPublicLandings, (_req, res) => {
    res.json({ landings: listPublishedLandingIndex() });
  });
  app.get("/api/public/landings/:slug", limitPublicLandings, (req, res) => {
    const landing = getPublishedLanding(param(req.params.slug));
    if (!landing) { res.status(404).json({ error: "Landing page não publicada." }); return; }
    res.json({ landing: toPublicLanding(landing) });
  });
  app.get("/api/public/previews/:token", limitPublicLandings, (req, res) => {
    const landing = getPreviewLanding(param(req.params.token));
    if (!landing) { res.status(404).json({ error: "Prévia não encontrada." }); return; }
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
    res.json({ landing: toPublicLanding(landing) });
  });

  app.get("/api/internal/landings", limitInternalLandings, requireService, (_req, res) => respond(res, () => ({ landings: listLandings().map(toInternalLanding) })));
  app.post("/api/internal/landings", limitInternalLandings, requireService, requireJson, (req, res) => respond(res, () => ({ landing: toInternalLanding(createLanding(req.body)) }), 201));
  app.put("/api/internal/landings/:id", limitInternalLandings, requireService, requireJson, (req, res) => respond(res, () => ({ landing: toInternalLanding(updateLanding(param(req.params.id), req.body)) })));
  app.post("/api/internal/landings/:id/publish", limitInternalLandings, requireService, requireEmptyOrJson, (req, res) => respond(res, () => ({ landing: toInternalLanding(setLandingStatus(param(req.params.id), "published")) })));
  app.post("/api/internal/landings/:id/unpublish", limitInternalLandings, requireService, requireEmptyOrJson, (req, res) => respond(res, () => ({ landing: toInternalLanding(setLandingStatus(param(req.params.id), "unpublished")) })));
  app.post("/api/internal/landings/:id/preview", limitInternalLandings, requireService, requireEmptyOrJson, (req, res) => respond(res, () => provisionLandingPreview(param(req.params.id), previewRotateRequested(req.body))));

  app.get("/api/internal/media", limitInternalLandings, requireService, (_req, res) => respond(res, () => ({ media: listLandingMedia() })));
  app.post(
    "/api/internal/media",
    limitInternalLandings,
    requireService,
    requireMultipart,
    requireUploadContentLength,
    uploadLandingMedia.single("file"),
    (req, res, next) => {
      if (!req.file) {
        respond(res, () => { throw new LandingMediaServiceError("Envie um arquivo no campo file.", 422); });
        return;
      }
      respondAsync(res, next, async () => ({ media: await saveLandingMedia(req.file!) }), 201);
    }
  );
  app.delete("/api/internal/media/:id", limitInternalLandings, requireService, requireEmptyOrJson, (req, res) => respond(res, () => {
    deleteLandingMedia(param(req.params.id));
    return { ok: true };
  }));
  app.use((_req, res) => res.status(404).json({ error: "Rota não encontrada." }));
  app.use(requestErrorHandler);
  return app;
}
