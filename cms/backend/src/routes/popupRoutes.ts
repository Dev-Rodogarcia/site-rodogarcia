import { Router } from "express";
import {
  createLeadController,
  createPopupEventController,
  getPopupConfigController,
  listLeadsController,
  listPopupEventsController,
  updatePopupConfigController,
} from "../controllers/popupController.js";
import { requireAdmin } from "../security/auth.js";
import { requireCmsPermission } from "../security/cmsAccess.js";
import { requireCsrf } from "../security/csrf.js";
import { requireAllowedOrigin } from "../security/origin.js";
import { requireJson } from "../validators/common.js";

export const popupRouter = Router();

popupRouter.get("/popup-config", getPopupConfigController);
popupRouter.post(
  "/popup-config",
  requireAllowedOrigin,
  requireJson,
  requireAdmin,
  requireCmsPermission("popup"),
  requireCsrf,
  updatePopupConfigController
);

popupRouter.get("/leads", requireAdmin, requireCmsPermission("leads"), listLeadsController);
popupRouter.post("/leads", requireAllowedOrigin, requireJson, createLeadController);

popupRouter.get(
  "/popup-events",
  requireAdmin,
  requireCmsPermission("popup"),
  listPopupEventsController
);
popupRouter.post(
  "/popup-events",
  requireAllowedOrigin,
  requireJson,
  createPopupEventController
);
