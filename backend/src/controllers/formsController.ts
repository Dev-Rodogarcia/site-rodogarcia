import type { RequestHandler } from "express";
import {
  createContact,
  createQuote,
  listContacts,
  listQuotes,
} from "../services/formsService.js";
import { asyncHandler } from "../utils/http.js";

export const createContactController: RequestHandler = asyncHandler((req, res) => {
  const contact = createContact(req);
  res.status(201).json({ message: "Mensagem recebida com sucesso.", id: contact.id });
});

export const listContactsController: RequestHandler = asyncHandler((_req, res) => {
  res.json({ contacts: listContacts() });
});

export const createQuoteController: RequestHandler = asyncHandler((req, res) => {
  const quote = createQuote(req);
  res.status(201).json({ message: "Solicitação de cotação recebida.", id: quote.id });
});

export const listQuotesController: RequestHandler = asyncHandler((_req, res) => {
  res.json({ quotes: listQuotes() });
});
