import type { RequestHandler } from "express";
import { lookupCompanyAddress } from "../services/companyLookupService.js";
import { asyncHandler } from "../utils/http.js";

export const lookupCompanyAddressController: RequestHandler = asyncHandler(async (req, res) => {
  res.json(await lookupCompanyAddress(req.params.cnpj));
});
