import { Router } from "express";
import {
  loginController,
  logoutController,
  meController,
  registerController,
  sessionController,
  setupStatusController,
} from "../controllers/authController.js";
import { optionalSession } from "../security/auth.js";
import { requireAllowedOrigin } from "../security/origin.js";
import { RATE_LIMITS, requireRateLimit } from "../security/rateLimit.js";
import { requireCsrf } from "../security/csrf.js";
import { requireJson } from "../validators/common.js";

export const authRouter = Router();

authRouter.get("/session", optionalSession, sessionController);
authRouter.get("/me", optionalSession, meController);
authRouter.get("/setup", setupStatusController);
authRouter.post("/login", requireAllowedOrigin, requireJson, loginController);
authRouter.post("/logout", requireAllowedOrigin, optionalSession, requireCsrf, logoutController);
authRouter.post(
  "/register",
  requireAllowedOrigin,
  requireJson,
  requireRateLimit("setup", RATE_LIMITS.setup),
  registerController
);
