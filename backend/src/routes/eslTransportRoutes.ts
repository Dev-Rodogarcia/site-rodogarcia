import { Router } from "express";
import {
  cancelCollectionController,
  createCollectionController,
  createFractionalQuoteController,
  prepareClosedQuoteWhatsappController,
  updateCollectionController,
  validateCollectionInvoiceController,
} from "../controllers/eslTransportController.js";
import { requireAllowedOrigin } from "../security/origin.js";
import { RATE_LIMITS, requireRateLimit } from "../security/rateLimit.js";
import { requireJson } from "../validators/common.js";

export const eslTransportRouter = Router();

const requirePublicEslRequest = [
  requireAllowedOrigin,
  requireJson,
  requireRateLimit("esl-public", RATE_LIMITS.eslPublic),
] as const;

eslTransportRouter.post(
  "/quote/fractional",
  ...requirePublicEslRequest,
  createFractionalQuoteController
);
eslTransportRouter.post(
  "/quote/closed/whatsapp",
  ...requirePublicEslRequest,
  prepareClosedQuoteWhatsappController
);
eslTransportRouter.post(
  "/collections/invoice-validation",
  ...requirePublicEslRequest,
  validateCollectionInvoiceController
);
eslTransportRouter.post("/collections", ...requirePublicEslRequest, createCollectionController);
eslTransportRouter.patch(
  "/collections/:id",
  ...requirePublicEslRequest,
  updateCollectionController
);
eslTransportRouter.post(
  "/collections/:id/cancel",
  ...requirePublicEslRequest,
  cancelCollectionController
);
