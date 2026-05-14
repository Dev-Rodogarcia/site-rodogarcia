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
  deleteUserController,
  getCmsPageController,
  getContentController,
  getFooterLinksController,
  getHomeController,
  getServicesPageController,
  getSiteTextsController,
  listEntityController,
  listUsersController,
  reorderEntityController,
  updateEntityController,
  updateFooterLinksSectionController,
  updateUserController,
  updateHomeHeroController,
  updateHomeSection1Controller,
  updateHomeSection2Controller,
  updateHomeSection3Controller,
  updateHomeRegionalPresenceController,
  updateHomeTrackingCtaController,
  updateHomeSocialProofController,
  updateHomeQuickActionsController,
  updateCmsPageSectionController,
  updateServicesFaqController,
  updateServicesFinalCtaController,
  updateServicesModulesController,
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
  limits: { fileSize: 64 * 1024 * 1024, files: 1 },
});

adminRouter.use(requireAdmin);

adminRouter.get("/content", getContentController);
adminRouter.get("/home", getHomeController);
adminRouter.put(
  "/home/hero",
  requireAllowedOrigin,
  requireJson,
  requireCsrf,
  updateHomeHeroController
);
adminRouter.put(
  "/home/section-1",
  requireAllowedOrigin,
  requireJson,
  requireCsrf,
  updateHomeSection1Controller
);
adminRouter.put(
  "/home/section-2",
  requireAllowedOrigin,
  requireJson,
  requireCsrf,
  updateHomeSection2Controller
);
adminRouter.put(
  "/home/section-3",
  requireAllowedOrigin,
  requireJson,
  requireCsrf,
  updateHomeSection3Controller
);
adminRouter.put(
  "/home/regional-presence",
  requireAllowedOrigin,
  requireJson,
  requireCsrf,
  updateHomeRegionalPresenceController
);
adminRouter.put(
  "/home/tracking-cta",
  requireAllowedOrigin,
  requireJson,
  requireCsrf,
  updateHomeTrackingCtaController
);
adminRouter.put(
  "/home/social-proof",
  requireAllowedOrigin,
  requireJson,
  requireCsrf,
  updateHomeSocialProofController
);
adminRouter.put(
  "/home/quick-actions",
  requireAllowedOrigin,
  requireJson,
  requireCsrf,
  updateHomeQuickActionsController
);
adminRouter.get("/services-page", getServicesPageController);
adminRouter.put(
  "/services-page/modules",
  requireAllowedOrigin,
  requireJson,
  requireCsrf,
  updateServicesModulesController
);
adminRouter.put(
  "/services-page/final-cta",
  requireAllowedOrigin,
  requireJson,
  requireCsrf,
  updateServicesFinalCtaController
);
adminRouter.put(
  "/services-page/faq",
  requireAllowedOrigin,
  requireJson,
  requireCsrf,
  updateServicesFaqController
);
adminRouter.get("/pages/:pageKey", getCmsPageController);
adminRouter.put(
  "/pages/:pageKey/:sectionKey",
  requireAllowedOrigin,
  requireJson,
  requireCsrf,
  updateCmsPageSectionController
);
adminRouter.get("/footer-links", getFooterLinksController);
adminRouter.put(
  "/footer-links/:sectionKey",
  requireAllowedOrigin,
  requireJson,
  requireCsrf,
  updateFooterLinksSectionController
);
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
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "media", maxCount: 1 },
  ]),
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
adminRouter.put(
  "/users/:id",
  requireAllowedOrigin,
  requireJson,
  requireCsrf,
  updateUserController
);
adminRouter.delete(
  "/users/:id",
  requireAllowedOrigin,
  requireCsrf,
  deleteUserController
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
