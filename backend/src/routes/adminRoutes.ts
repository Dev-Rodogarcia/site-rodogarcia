import { Router } from "express";
import multer from "multer";
import {
  getConsentSettingsController,
  updateConsentSettingsController,
} from "../controllers/consentController.js";
import {
  createEntityController,
  createUserController,
  deleteEntityController,
  getContentController,
  getSiteTextsController,
  listEntityController,
  listUsersController,
  reorderEntityController,
  updateEntityController,
  updateSiteTextsController,
} from "../controllers/cmsController.js";
import { listUnifiedLeadsController } from "../controllers/leadsController.js";
import {
  getMediaSlotsController,
  listImagesController,
  replaceImageReferenceController,
  updateMediaSlotsController,
  uploadImageController,
} from "../controllers/mediaController.js";
import {
  getSeoSettingsController,
  updateSeoPageController,
} from "../controllers/seoController.js";
import {
  listAuditLogController,
  listTrackingEventsController,
} from "../controllers/trackingController.js";
import { requireAdmin } from "../security/auth.js";
import { requireCsrf } from "../security/csrf.js";
import { requireAllowedOrigin } from "../security/origin.js";
import { requireJson } from "../validators/common.js";

export const adminRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
});

adminRouter.use(requireAdmin);

adminRouter.get("/content", getContentController);
adminRouter.get("/site-texts", getSiteTextsController);
adminRouter.post(
  "/site-texts",
  requireAllowedOrigin,
  requireJson,
  requireCsrf,
  updateSiteTextsController
);

adminRouter.get("/images", listImagesController);
adminRouter.post(
  "/images",
  requireAllowedOrigin,
  requireCsrf,
  upload.single("image"),
  uploadImageController
);
adminRouter.post(
  "/images/replace-reference",
  requireAllowedOrigin,
  requireJson,
  requireCsrf,
  replaceImageReferenceController
);
adminRouter.get("/media-slots", getMediaSlotsController);
adminRouter.post(
  "/media-slots",
  requireAllowedOrigin,
  requireJson,
  requireCsrf,
  updateMediaSlotsController
);

adminRouter.get("/seo-settings", getSeoSettingsController);
adminRouter.post(
  "/seo-settings",
  requireAllowedOrigin,
  requireJson,
  requireCsrf,
  updateSeoPageController
);

adminRouter.get("/consent-settings", getConsentSettingsController);
adminRouter.post(
  "/consent-settings",
  requireAllowedOrigin,
  requireJson,
  requireCsrf,
  updateConsentSettingsController
);

adminRouter.get("/leads", listUnifiedLeadsController);
adminRouter.get("/tracking-events", listTrackingEventsController);
adminRouter.get("/audit-log", listAuditLogController);

adminRouter.get("/users", listUsersController);
adminRouter.post(
  "/users",
  requireAllowedOrigin,
  requireJson,
  requireCsrf,
  createUserController
);

adminRouter.get("/:entity", listEntityController);
adminRouter.post(
  "/:entity",
  requireAllowedOrigin,
  requireJson,
  requireCsrf,
  createEntityController
);
adminRouter.post(
  "/:entity/reorder",
  requireAllowedOrigin,
  requireJson,
  requireCsrf,
  reorderEntityController
);
adminRouter.put(
  "/:entity/:id",
  requireAllowedOrigin,
  requireJson,
  requireCsrf,
  updateEntityController
);
adminRouter.delete(
  "/:entity/:id",
  requireAllowedOrigin,
  requireCsrf,
  deleteEntityController
);
