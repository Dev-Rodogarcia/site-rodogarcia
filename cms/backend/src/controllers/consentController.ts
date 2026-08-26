import type { RequestHandler } from "express";
import {
  listCookieConsents,
  readConsentSettings,
  recordCookieConsent,
  updateConsentSettings,
} from "../services/consentService.js";
import { asyncHandler } from "../utils/http.js";

export const getConsentSettingsController: RequestHandler = asyncHandler((_req, res) => {
  res.json({ settings: readConsentSettings() });
});

export const updateConsentSettingsController: RequestHandler = asyncHandler((req, res) => {
  const settings = updateConsentSettings(req, req.body ?? {});
  res.json({ message: "Configuracao de LGPD/cookies atualizada.", settings });
});

export const recordCookieConsentController: RequestHandler = asyncHandler((req, res) => {
  const consent = recordCookieConsent(req);
  res.status(201).json({
    message: "Consentimento registrado.",
    consent: {
      id: consent.id,
      createdAt: consent.createdAt,
      status: consent.status,
      version: consent.version,
    },
  });
});

export const listCookieConsentsController: RequestHandler = asyncHandler((req, res) => {
  res.json(listCookieConsents(req.query as Record<string, unknown>));
});
