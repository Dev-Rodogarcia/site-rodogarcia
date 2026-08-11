import type { RequestHandler } from "express";
import { createImprovement, getImprovementAttachment, listImprovements, updateImprovementStatus } from "../services/improvementService.js";
import { asyncHandler } from "../utils/http.js";
import { parseAdminImprovement, parseImprovement, parseImprovementStatus } from "../validators/improvement.js";
import { sanitizeText } from "../utils/sanitize.js";
import { recordAuditAction } from "../services/auditService.js";

export const createImprovementController: RequestHandler = asyncHandler((req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];
  const improvement = createImprovement(req, parseImprovement(req.body), files);
  res.status(201).json({ message: "Sua sugestão foi recebida. Obrigado por contribuir.", id: improvement.id });
});

/** Recebe sugestões enviadas pela equipe autenticada no CMS; somente o perfil de colaborador é aceito. */
export const createAdminImprovementController: RequestHandler = asyncHandler((req, res) => {
  const input = parseAdminImprovement(req.body);
  const files = Array.isArray(req.files) ? req.files : [];
  const improvement = createImprovement(req, input, files);
  recordAuditAction({ req, action: "improvement.create", target: improvement.id, metadata: { profile: "employee", category: improvement.category } });
  res.status(201).json({ message: "Sua sugestão interna foi registrada para triagem.", id: improvement.id });
});

export const downloadImprovementAttachmentController: RequestHandler = asyncHandler((req, res) => {
  const attachment = getImprovementAttachment(
    sanitizeText(req.params.id, 100),
    sanitizeText(req.params.attachmentId, 100)
  );
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "private, no-store");
  res.type(attachment.mimeType);
  res.setHeader("Content-Disposition", `${attachment.inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(attachment.name)}`);
  res.sendFile(attachment.filePath);
});

export const listImprovementsController: RequestHandler = asyncHandler((req, res) => {
  res.json({ improvements: listImprovements(sanitizeText(req.query.status, 20)) });
});

export const updateImprovementStatusController: RequestHandler = asyncHandler((req, res) => {
  const improvement = updateImprovementStatus(sanitizeText(req.params.id, 100), parseImprovementStatus(req.body?.status), req);
  res.json({ improvement });
});
