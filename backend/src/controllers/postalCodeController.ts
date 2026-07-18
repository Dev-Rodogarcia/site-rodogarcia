import type { RequestHandler } from "express";
import { lookupPostalCode } from "../services/postalCodeService.js";
import { asyncHandler } from "../utils/http.js";

export const lookupPostalCodeController: RequestHandler = asyncHandler(async (req, res) => {
  res.json(await lookupPostalCode(req.params.postalCode));
});
