import type { RequestHandler } from "express";
import { readConsentSettings, updateConsentSettings } from "../services/consentService.js";
import { asyncHandler } from "../utils/http.js";

export const getConsentSettingsController: RequestHandler = asyncHandler((_req, res) => {
  res.json({ settings: readConsentSettings() });
});

export const updateConsentSettingsController: RequestHandler = asyncHandler((req, res) => {
  const settings = updateConsentSettings(req, req.body ?? {});
  res.json({ message: "Configuracao de LGPD/cookies atualizada.", settings });
});
