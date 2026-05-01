import type { RequestHandler } from "express";
import { listUnifiedLeads } from "../services/leadsService.js";
import { asyncHandler } from "../utils/http.js";

export const listUnifiedLeadsController: RequestHandler = asyncHandler((req, res) => {
  const leads = listUnifiedLeads(req.query as Record<string, unknown>);
  res.json({
    leads,
    total: leads.length,
  });
});
