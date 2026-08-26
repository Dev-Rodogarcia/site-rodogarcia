import type { RequestHandler } from "express";
import { getPublicSeoPage, readSeoSettings, updateSeoPage } from "../services/seoService.js";
import { asyncHandler } from "../utils/http.js";

export const getSeoSettingsController: RequestHandler = asyncHandler((_req, res) => {
  res.json(readSeoSettings());
});

export const updateSeoPageController: RequestHandler = asyncHandler((req, res) => {
  const settings = updateSeoPage(req, req.body ?? {});
  res.json({ message: "SEO atualizado com sucesso.", ...settings });
});

export const getPublicSeoController: RequestHandler = asyncHandler((req, res) => {
  res.json({ seo: getPublicSeoPage(req.query.path ?? "/") });
});
