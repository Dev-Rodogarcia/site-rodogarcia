import { Router } from "express";
import { lookupPostalCodeController } from "../controllers/postalCodeController.js";
import { lookupCompanyAddressController } from "../controllers/companyLookupController.js";
import { RATE_LIMITS, requireRateLimit } from "../security/rateLimit.js";
import { eslTransportRouter } from "./eslTransportRoutes.js";

/**
 * Superfície exclusivamente pública do backend institucional.
 * Conteúdo, uploads, autenticação e operações do CMS são atendidos pelo
 * processo cms/backend e encaminhados pelo gateway Next.
 */
export const apiRouter = Router();

apiRouter.get(
  "/public/postal-code/:postalCode",
  requireRateLimit(
    "public-postal-code",
    RATE_LIMITS.publicPostalCode,
    "Limite de consultas de CEP atingido. Tente novamente mais tarde."
  ),
  lookupPostalCodeController
);
apiRouter.get(
  "/public/company/:cnpj",
  requireRateLimit("public-company-lookup", RATE_LIMITS.publicLookup),
  lookupCompanyAddressController
);
apiRouter.use(eslTransportRouter);
