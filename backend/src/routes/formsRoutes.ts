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
import { requireAllowedOrigin } from "../security/origin.js";
import { requireJson } from "../validators/common.js";

export const formsRouter = Router();
const improvementUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 5 },
});

formsRouter.get("/contact", requireAdmin, listContactsController);
formsRouter.post(
  "/contact",
  requireJson,
  requireAllowedOrigin,
  createContactController
);
formsRouter.get("/quote", requireAdmin, listQuotesController);
formsRouter.post("/quote", requireJson, requireAllowedOrigin, createQuoteController);
formsRouter.post("/improvements", requireAllowedOrigin, improvementUpload.array("attachments", 5), createImprovementController);
