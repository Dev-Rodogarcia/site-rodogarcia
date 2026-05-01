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
import { requireJson } from "../validators/common.js";

export const authRouter = Router();

authRouter.get("/session", optionalSession, sessionController);
authRouter.get("/me", optionalSession, meController);
authRouter.get("/setup", setupStatusController);
authRouter.post("/login", requireAllowedOrigin, requireJson, loginController);
authRouter.post("/logout", requireAllowedOrigin, optionalSession, logoutController);
authRouter.post("/register", requireAllowedOrigin, requireJson, registerController);
