import type { RequestHandler } from "express";
import {
  parseCollectionCancellationRequest,
  parseCollectionRequest,
  parseCollectionUpdateRequest,
  parseInvoiceLookupRequest,
  parseQuoteRequest,
  parseRemoteCollectionId,
} from "../validators/eslTransport.js";
import {
  cancelCollection,
  createCollection,
  createFractionalQuote,
  prepareClosedQuoteWhatsapp,
  updateCollection,
  validateCollectionInvoice,
} from "../services/eslTransportService.js";
import { asyncHandler } from "../utils/http.js";

export const createFractionalQuoteController: RequestHandler = asyncHandler(async (req, res) => {
  const quote = await createFractionalQuote(parseQuoteRequest(req.body));
  res.status(201).json({ quote });
});

export const prepareClosedQuoteWhatsappController: RequestHandler = asyncHandler((req, res) => {
  res.json(prepareClosedQuoteWhatsapp(parseQuoteRequest(req.body)));
});

export const validateCollectionInvoiceController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await validateCollectionInvoice(parseInvoiceLookupRequest(req.body));
  res.json(result);
});

export const createCollectionController: RequestHandler = asyncHandler(async (req, res) => {
  const result = await createCollection(parseCollectionRequest(req.body));
  res.status(result.requiresWhatsApp ? 200 : 201).json(result);
});

export const updateCollectionController: RequestHandler = asyncHandler(async (req, res) => {
  const collection = await updateCollection(
    parseRemoteCollectionId(req.params.id),
    parseCollectionUpdateRequest(req.body)
  );
  res.json({ collection });
});

export const cancelCollectionController: RequestHandler = asyncHandler(async (req, res) => {
  const collection = await cancelCollection(
    parseRemoteCollectionId(req.params.id),
    parseCollectionCancellationRequest(req.body)
  );
  res.json({ collection });
});
