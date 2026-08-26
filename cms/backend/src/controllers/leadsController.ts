import type { RequestHandler } from "express";
import { listUnifiedLeads } from "../services/leadsService.js";
import { asyncHandler } from "../utils/http.js";

export const listUnifiedLeadsController: RequestHandler = asyncHandler((req, res) => {
  res.json(listUnifiedLeads(req.query as Record<string, unknown>));
});
