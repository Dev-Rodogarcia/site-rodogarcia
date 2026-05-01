import { Router } from "express";
import { getConsentSettingsController } from "../controllers/consentController.js";
import { getMediaSlotsController } from "../controllers/mediaController.js";
import { getPublicContentController } from "../controllers/publicContentController.js";
import { getPublicSeoController } from "../controllers/seoController.js";
import { createTrackingEventController } from "../controllers/trackingController.js";
import { requireAllowedOrigin } from "../security/origin.js";
import { adminRouter } from "./adminRoutes.js";
import { analyticsRouter } from "./analyticsRoutes.js";
import { authRouter } from "./authRoutes.js";
import { formsRouter } from "./formsRoutes.js";
import { popupRouter } from "./popupRoutes.js";
import { requireJson } from "../validators/common.js";

export const apiRouter = Router();

apiRouter.get("/public/content", getPublicContentController);
apiRouter.get("/public/seo", getPublicSeoController);
apiRouter.get("/public/media-slots", getMediaSlotsController);
apiRouter.get("/consent-settings", getConsentSettingsController);
apiRouter.post(
  "/tracking/event",
  requireAllowedOrigin,
  requireJson,
  createTrackingEventController
);
apiRouter.use("/auth", authRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/analytics", analyticsRouter);
apiRouter.use(formsRouter);
apiRouter.use(popupRouter);
