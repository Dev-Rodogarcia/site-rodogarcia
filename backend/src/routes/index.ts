import { Router } from "express";
import {
  getConsentSettingsController,
  recordCookieConsentController,
} from "../controllers/consentController.js";
import { getMediaSlotsController } from "../controllers/mediaController.js";
import { getPublicContentController } from "../controllers/publicContentController.js";
import { getPublicSeoController } from "../controllers/seoController.js";
import { lookupPostalCodeController } from "../controllers/postalCodeController.js";
import { createTrackingEventController } from "../controllers/trackingController.js";
import { requireAllowedOrigin } from "../security/origin.js";
import { RATE_LIMITS, requireRateLimit } from "../security/rateLimit.js";
import { adminRouter } from "./adminRoutes.js";
import { analyticsRouter } from "./analyticsRoutes.js";
import { authRouter } from "./authRoutes.js";
import { formsRouter } from "./formsRoutes.js";
import { eslTransportRouter } from "./eslTransportRoutes.js";
import { popupRouter } from "./popupRoutes.js";
import { requireJson } from "../validators/common.js";

export const apiRouter = Router();

apiRouter.get("/public/content", getPublicContentController);
apiRouter.get("/public/seo", getPublicSeoController);
apiRouter.get("/public/media-slots", getMediaSlotsController);
apiRouter.get("/public/postal-code/:postalCode", lookupPostalCodeController);
apiRouter.get("/consent-settings", getConsentSettingsController);
apiRouter.post(
  "/consent-events",
  requireAllowedOrigin,
  requireJson,
  requireRateLimit("consent", RATE_LIMITS.consent),
  recordCookieConsentController
);
apiRouter.post(
  "/tracking/event",
  requireAllowedOrigin,
  requireJson,
  createTrackingEventController
);
apiRouter.use("/auth", authRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/analytics", analyticsRouter);
apiRouter.use(eslTransportRouter);
apiRouter.use(formsRouter);
apiRouter.use(popupRouter);
