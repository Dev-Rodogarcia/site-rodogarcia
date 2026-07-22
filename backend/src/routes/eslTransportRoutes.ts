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
] as const;

eslTransportRouter.post(
  "/quote/fractional",
  ...requirePublicEslRequest,
  requireRateLimit(
    "esl-quote",
    RATE_LIMITS.eslQuote,
    "Limite de cotações atingido. Tente novamente mais tarde."
  ),
  createFractionalQuoteController
);
eslTransportRouter.post(
  "/quote/closed/whatsapp",
  ...requirePublicEslRequest,
  requireRateLimit(
    "esl-quote",
    RATE_LIMITS.eslQuote,
    "Limite de cotações atingido. Tente novamente mais tarde."
  ),
  prepareClosedQuoteWhatsappController
);
eslTransportRouter.post(
  "/collections/invoice-validation",
  ...requirePublicEslRequest,
  requireRateLimit(
    "esl-invoice-validation",
    RATE_LIMITS.eslInvoiceValidation,
    "Limite de consultas de NF atingido. Tente novamente mais tarde."
  ),
  validateCollectionInvoiceController
);
eslTransportRouter.post(
  "/collections",
  ...requirePublicEslRequest,
  requireRateLimit(
    "esl-collection-create",
    RATE_LIMITS.eslCollectionCreate,
    "Limite de solicitações de coleta atingido. Tente novamente mais tarde."
  ),
  createCollectionController
);
eslTransportRouter.patch(
  "/collections/:id",
  ...requirePublicEslRequest,
  requireRateLimit(
    "esl-collection-maintenance",
    RATE_LIMITS.eslCollectionMaintenance,
    "Limite de alterações de coleta atingido. Tente novamente mais tarde."
  ),
  updateCollectionController
);
eslTransportRouter.post(
  "/collections/:id/cancel",
  ...requirePublicEslRequest,
  requireRateLimit(
    "esl-collection-maintenance",
    RATE_LIMITS.eslCollectionMaintenance,
    "Limite de alterações de coleta atingido. Tente novamente mais tarde."
  ),
  cancelCollectionController
);
