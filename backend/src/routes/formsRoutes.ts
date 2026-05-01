import { Router } from "express";
import {
  createContactController,
  createQuoteController,
  listContactsController,
  listQuotesController,
} from "../controllers/formsController.js";
import { requireAdmin } from "../security/auth.js";
import { requireAllowedOrigin } from "../security/origin.js";
import { requireJson } from "../validators/common.js";

export const formsRouter = Router();

formsRouter.get("/contact", requireAdmin, listContactsController);
formsRouter.post(
  "/contact",
  requireAllowedOrigin,
  requireJson,
  createContactController
);
formsRouter.get("/quote", requireAdmin, listQuotesController);
formsRouter.post("/quote", requireAllowedOrigin, requireJson, createQuoteController);
