import type { RequestHandler } from "express";
import { recordAuditAction } from "../services/auditService.js";
import { createLandingPage, listLandingPages, publishLandingPage, updateLandingPage } from "../services/landingBuilderService.js";
import { asyncHandler } from "../utils/http.js";

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
