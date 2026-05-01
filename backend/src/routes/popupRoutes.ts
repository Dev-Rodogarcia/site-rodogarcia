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
  requireCsrf,
  updatePopupConfigController
);

popupRouter.get("/leads", requireAdmin, listLeadsController);
popupRouter.post("/leads", requireAllowedOrigin, requireJson, createLeadController);

popupRouter.get("/popup-events", requireAdmin, listPopupEventsController);
popupRouter.post(
  "/popup-events",
  requireAllowedOrigin,
  requireJson,
  createPopupEventController
);
