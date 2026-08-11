import { Router } from "express";
import {
  createAnalyticsEventController,
  getAnalyticsConfigController,
  getPublicAnalyticsConfigController,
  getAnalyticsStatsController,
  updateAnalyticsConfigController,
} from "../controllers/analyticsController.js";
import { requireAdmin } from "../security/auth.js";
import { requireCmsPermission } from "../security/cmsAccess.js";
import { requireCsrf } from "../security/csrf.js";
import { requireAllowedOrigin } from "../security/origin.js";
import { requireJson } from "../validators/common.js";

export const analyticsRouter = Router();

analyticsRouter.post(
  "/event",
  requireAllowedOrigin,
  requireJson,
  createAnalyticsEventController
);
analyticsRouter.get("/public-config", getPublicAnalyticsConfigController);
analyticsRouter.get("/stats", requireAdmin, requireCmsPermission("analytics"), getAnalyticsStatsController);
analyticsRouter.get("/config", requireAdmin, requireCmsPermission("analytics"), getAnalyticsConfigController);
analyticsRouter.post(
  "/config",
  requireAllowedOrigin,
  requireJson,
  requireAdmin,
  requireCmsPermission("analytics"),
  requireCsrf,
  updateAnalyticsConfigController
);
