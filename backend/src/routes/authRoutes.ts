import { Router } from "express";
import {
  loginController,
  changePasswordController,
  logoutController,
  meController,
  registerController,
  sessionController,
  setupStatusController,
  requestPasswordResetController,
  updateCmsThemeController,
} from "../controllers/authController.js";
import { optionalSession, requireAuthenticated } from "../security/auth.js";
import { requireAllowedOrigin } from "../security/origin.js";
import { RATE_LIMITS, requireRateLimit } from "../security/rateLimit.js";
import { requireCsrf } from "../security/csrf.js";
import { requireJson } from "../validators/common.js";

export const authRouter = Router();

authRouter.get("/session", optionalSession, sessionController);
authRouter.get("/me", optionalSession, meController);
authRouter.get("/setup", setupStatusController);
authRouter.post("/login", requireAllowedOrigin, requireJson, loginController);
authRouter.post(
  "/password-reset-request",
  requireAllowedOrigin,
  requireJson,
  requireRateLimit("password-reset", RATE_LIMITS.passwordReset),
  requestPasswordResetController
);
authRouter.post(
  "/change-password",
  requireAllowedOrigin,
  requireAuthenticated,
  requireJson,
  requireCsrf,
  changePasswordController
);
authRouter.patch(
  "/cms-theme",
  requireAllowedOrigin,
  requireAuthenticated,
  requireJson,
  requireCsrf,
  updateCmsThemeController
);
authRouter.post("/logout", requireAllowedOrigin, optionalSession, requireCsrf, logoutController);
authRouter.post(
  "/register",
  requireAllowedOrigin,
  requireJson,
  requireRateLimit("setup", RATE_LIMITS.setup),
  registerController
);
