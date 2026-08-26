import { Router } from "express";
import multer from "multer";
import {
  createContactController,
  createQuoteController,
  listContactsController,
  listQuotesController,
} from "../controllers/formsController.js";
import { createImprovementController } from "../controllers/improvementController.js";
import { requireAdmin } from "../security/auth.js";
import { requireCmsPermission } from "../security/cmsAccess.js";
import { requireAllowedOrigin } from "../security/origin.js";
import { RATE_LIMITS, requireRateLimit } from "../security/rateLimit.js";
import { improvementAttachmentRules } from "../services/improvementService.js";
import { requireContentLengthLimit, requireJson } from "../validators/common.js";

export const formsRouter = Router();
const improvementUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: improvementAttachmentRules.maxFileSizeBytes,
    files: improvementAttachmentRules.maxFiles,
    fields: improvementAttachmentRules.maxFields,
    fieldSize: improvementAttachmentRules.maxFieldSizeBytes,
    parts: improvementAttachmentRules.maxFiles + improvementAttachmentRules.maxFields,
  },
});

formsRouter.get("/contact", requireAdmin, requireCmsPermission("leads"), listContactsController);
formsRouter.post(
  "/contact",
  requireJson,
  requireAllowedOrigin,
  createContactController
);
formsRouter.get("/quote", requireAdmin, requireCmsPermission("leads"), listQuotesController);
formsRouter.post("/quote", requireJson, requireAllowedOrigin, createQuoteController);
formsRouter.post(
  "/improvements",
  requireAllowedOrigin,
  requireRateLimit(
    "improvement",
    RATE_LIMITS.improvement,
    "Limite de envios atingido. Tente novamente mais tarde."
  ),
  requireContentLengthLimit(improvementAttachmentRules.maxRequestSizeBytes),
  improvementUpload.array("attachments", improvementAttachmentRules.maxFiles),
  createImprovementController
);
