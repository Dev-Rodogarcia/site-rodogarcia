import type { RequestHandler } from "express";
import {
  createLead,
  createPopupEvent,
  getPopupEvents,
  listLeads,
  readPopupConfig,
  updatePopupConfig,
} from "../services/popupService.js";
import { asyncHandler } from "../utils/http.js";

export const getPopupConfigController: RequestHandler = (_req, res) => {
  res.json({ config: readPopupConfig() });
};

export const updatePopupConfigController: RequestHandler = asyncHandler((req, res) => {
  const config = updatePopupConfig(req.body ?? {}, req);
  res.json({ message: "Configuracao do popup atualizada com sucesso.", config });
});

export const createLeadController: RequestHandler = asyncHandler((req, res) => {
  const lead = createLead(req);
  res.status(201).json({
    message: "Lead recebido com sucesso.",
    lead: { id: lead.id, createdAt: lead.createdAt },
  });
});

export const listLeadsController: RequestHandler = asyncHandler((_req, res) => {
  res.json({ leads: listLeads() });
});

export const createPopupEventController: RequestHandler = asyncHandler((req, res) => {
  createPopupEvent(req);
  res.status(201).json({ message: "Evento registrado." });
});

export const listPopupEventsController: RequestHandler = asyncHandler((req, res) => {
  res.json(getPopupEvents(Number(req.query.days ?? "30")));
});
