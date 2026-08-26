import type { RequestHandler } from "express";
import { recordAuditAction } from "../services/auditService.js";
import {
  createLandingPage,
  deleteLandingMedia,
  getLandingPreview,
  listLandingMedia,
  listLandingPages,
  publishLandingPage,
  updateLandingPage,
  uploadLandingMedia,
} from "../services/landingBuilderService.js";
import { asyncHandler, HttpError } from "../utils/http.js";

function idParam(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] ?? "" : value ?? ""; }

export const listLandingPagesController: RequestHandler = asyncHandler(async (_req, res) => { res.json(await listLandingPages()); });
export const createLandingPageController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await createLandingPage(req.body);
  recordAuditAction({ req, action: "landing-builder.create", target: "landing" });
  res.status(201).json(result);
});
export const updateLandingPageController: RequestHandler = asyncHandler(async (req, res) => {
  const id = idParam(req.params.id);
  const result = await updateLandingPage(id, req.body);
  recordAuditAction({ req, action: "landing-builder.update", target: id });
  res.json(result);
});
export const publishLandingPageController: RequestHandler = asyncHandler(async (req, res) => {
  const id = idParam(req.params.id);
  const publish = req.path.endsWith("/publish");
  const result = await publishLandingPage(id, publish);
  recordAuditAction({ req, action: publish ? "landing-builder.publish" : "landing-builder.unpublish", target: id });
  res.json(result);
});

export const getLandingPreviewController: RequestHandler = asyncHandler(async (req, res) => {
  const id = idParam(req.params.id);
  const result = await getLandingPreview(id);
  recordAuditAction({ req, action: "landing-builder.preview", target: id });
  res.json(result);
});

export const listLandingMediaController: RequestHandler = asyncHandler(async (_req, res) => {
  res.json(await listLandingMedia());
});

export const uploadLandingMediaController: RequestHandler = asyncHandler(async (req, res) => {
  if (!req.file) throw new HttpError(422, "Selecione um arquivo de mídia.");
  const alt = typeof req.body?.alt === "string" ? req.body.alt : "";
  const result = await uploadLandingMedia(req.file, alt);
  recordAuditAction({ req, action: "landing-builder.media_upload", target: req.file.originalname.slice(0, 120) });
  res.status(201).json(result);
});

export const deleteLandingMediaController: RequestHandler = asyncHandler(async (req, res) => {
  const id = idParam(req.params.id);
  const result = await deleteLandingMedia(id);
  recordAuditAction({ req, action: "landing-builder.media_delete", target: id });
  res.json(result);
});
