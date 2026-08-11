import { Router } from "express";
import multer from "multer";
import {
  getConsentSettingsController,
  listCookieConsentsController,
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
  getHeaderNavigationController,
  getHomeController,
  getServicesPageController,
  getSiteTextsController,
  listEntityController,
  listUsersController,
  reorderEntityController,
  updateEntityController,
  updateFooterLinksSectionController,
  updateHeaderNavigationController,
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
import { createAdminImprovementController, downloadImprovementAttachmentController, listImprovementsController, updateImprovementStatusController } from "../controllers/improvementController.js";
import {
  deleteImageController,
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
import { requireCmsPermission } from "../security/cmsAccess.js";
import type { CmsPermission } from "../types/auth.js";
import { requireCsrf } from "../security/csrf.js";
import { requireAllowedOrigin } from "../security/origin.js";
import { requireJson } from "../validators/common.js";
import { createAccessProfileController, deleteAccessProfileController, listAccessProfilesController, updateAccessProfileController } from "../controllers/cmsAccessController.js";

export const adminRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 64 * 1024 * 1024, files: 1 },
});
const improvementUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 5 },
});

function permissionForRequest(path: string): CmsPermission | null {
  if (path.startsWith("/access-profiles") || path.startsWith("/users")) return "users";
  if (path.startsWith("/home")) return "home";
  if (path.startsWith("/services-page")) return "services";
  if (path.startsWith("/pages/careers")) return "careers-page";
  if (path.startsWith("/pages/collections")) return "collections";
  if (path.startsWith("/pages/contact")) return "contact-page";
  if (path.startsWith("/pages/quote")) return "quote-page";
  if (path.startsWith("/pages/business")) return "business-page";
  if (path.startsWith("/pages/about")) return "about-page";
  if (path.startsWith("/pages/improvements")) return "improvements";
  if (path.startsWith("/footer-links")) return "footer-links";
  if (path.startsWith("/header-navigation")) return "header-navigation";
  if (path.startsWith("/site-texts")) return "home";
  if (path.startsWith("/images") || path.startsWith("/media-")) return "images";
  if (path.startsWith("/seo")) return "seo";
  if (path.startsWith("/consent-settings") || path.startsWith("/cookie-consents")) return "cookies";
  if (path.startsWith("/leads")) return "leads";
  if (path.startsWith("/improvements")) return "improvements";
  if (path.startsWith("/tracking") || path.startsWith("/audit-log")) return "tracking";
  if (path.startsWith("/content")) return "dashboard";
  if (path.startsWith("/units")) return "units";
  return null;
}
adminRouter.use(requireAdmin, (req, res, next) => {
  if (req.path.startsWith("/access-profiles")) return next();
  const permission = permissionForRequest(req.path);
  if (!permission) { res.status(403).json({ error: "Recurso administrativo sem permissão cadastrada." }); return; }
  return requireCmsPermission(permission)(req, res, next);
});

adminRouter.get("/access-profiles", listAccessProfilesController);
adminRouter.post("/access-profiles", requireAllowedOrigin, requireJson, requireCsrf, createAccessProfileController);
adminRouter.put("/access-profiles/:id", requireAllowedOrigin, requireJson, requireCsrf, updateAccessProfileController);
adminRouter.delete("/access-profiles/:id", requireAllowedOrigin, requireCsrf, deleteAccessProfileController);

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
adminRouter.get("/header-navigation", getHeaderNavigationController);
adminRouter.put(
  "/header-navigation",
  requireAllowedOrigin,
  requireJson,
  requireCsrf,
  updateHeaderNavigationController
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
adminRouter.delete(
  "/images",
  requireAllowedOrigin,
  requireJson,
  requireCsrf,
  deleteImageController
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
adminRouter.get("/cookie-consents", listCookieConsentsController);
adminRouter.post(
  "/consent-settings",
  requireAllowedOrigin,
  requireJson,
  requireCsrf,
  updateConsentSettingsController
);

adminRouter.get("/leads", listUnifiedLeadsController);
adminRouter.get("/improvements", listImprovementsController);
adminRouter.post("/improvements", requireAllowedOrigin, requireCsrf, improvementUpload.array("attachments", 5), createAdminImprovementController);
adminRouter.get("/improvements/:id/attachments/:attachmentId", downloadImprovementAttachmentController);
adminRouter.patch("/improvements/:id", requireAllowedOrigin, requireJson, requireCsrf, updateImprovementStatusController);
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
