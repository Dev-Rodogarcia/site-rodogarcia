import { Router } from "express";
import {
  createAnalyticsEventController,
  getAnalyticsConfigController,
  getPublicAnalyticsConfigController,
  getAnalyticsStatsController,
  updateAnalyticsConfigController,
} from "../controllers/analyticsController.js";
import { requireAdmin } from "../security/auth.js";
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
analyticsRouter.get("/stats", requireAdmin, getAnalyticsStatsController);
analyticsRouter.get("/config", requireAdmin, getAnalyticsConfigController);
analyticsRouter.post(
  "/config",
  requireAllowedOrigin,
  requireJson,
  requireAdmin,
  requireCsrf,
  updateAnalyticsConfigController
);
