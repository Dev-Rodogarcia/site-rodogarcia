import type { RequestHandler } from "express";
import { listAuditLog } from "../services/auditService.js";
import {
  createPublicTrackingEvent,
  getTrackingSummary,
  listTrackingEvents,
} from "../services/trackingService.js";
import { asyncHandler } from "../utils/http.js";

export const createTrackingEventController: RequestHandler = asyncHandler((req, res) => {
  createPublicTrackingEvent(req);
  res.status(201).json({ message: "Evento registrado." });
});

export const listTrackingEventsController: RequestHandler = asyncHandler((req, res) => {
  res.json({
    events: listTrackingEvents(req.query as Record<string, unknown>),
    summary: getTrackingSummary(req.query as Record<string, unknown>),
  });
});

export const listAuditLogController: RequestHandler = asyncHandler((req, res) => {
  res.json({ events: listAuditLog(req.query as Record<string, unknown>) });
});
