import type { RequestHandler } from "express";
import { preparePublicContent, readContentData } from "../services/contentService.js";
import { asyncHandler } from "../utils/http.js";

export const getPublicContentController: RequestHandler = asyncHandler((_req, res) => {
  res.json(preparePublicContent(readContentData()));
});
