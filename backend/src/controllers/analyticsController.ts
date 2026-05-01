import type { RequestHandler } from "express";
import {
  createAnalyticsEvent,
  getAnalyticsStats,
  readAnalyticsConfig,
  updateAnalyticsConfig,
} from "../services/analyticsService.js";
import { publicUser } from "../services/authService.js";
import { asyncHandler } from "../utils/http.js";

export const createAnalyticsEventController: RequestHandler = asyncHandler((req, res) => {
  createAnalyticsEvent(req);
  res.status(201).json({ message: "Evento registrado." });
});

export const getAnalyticsStatsController: RequestHandler = asyncHandler((req, res) => {
  res.json(getAnalyticsStats(Number(req.query.days ?? "30")));
});

export const getAnalyticsConfigController: RequestHandler = asyncHandler((req, res) => {
  res.json({
    user: publicUser(req.auth!.user),
    csrfToken: req.auth!.session.csrfToken,
    config: readAnalyticsConfig(),
  });
});

export const updateAnalyticsConfigController: RequestHandler = asyncHandler((req, res) => {
  const config = updateAnalyticsConfig(req.body ?? {});
  res.json({ message: "Configuracao de analytics atualizada com sucesso.", config });
});
