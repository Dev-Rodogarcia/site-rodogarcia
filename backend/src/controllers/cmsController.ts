import type { RequestHandler } from "express";
import {
  createItem,
  deleteItem,
  getContent,
  getItems,
  getSiteTexts,
  reorderItems,
  updateItem,
  updateSiteTexts,
  VALID_ENTITIES,
  type Entity,
} from "../services/cmsService.js";
import { listUsers, publicUser, createUser } from "../services/authService.js";
import { recordAuditAction } from "../services/auditService.js";
import { asyncHandler, HttpError } from "../utils/http.js";

function parseEntity(value: string | undefined): Entity {
  if (VALID_ENTITIES.includes(value as Entity)) return value as Entity;
  throw new HttpError(404, "Recurso administrativo nao encontrado.");
}

function paramString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export const getContentController: RequestHandler = asyncHandler((req, res) => {
  res.json({
    user: publicUser(req.auth!.user),
    csrfToken: req.auth!.session.csrfToken,
    content: getContent(),
  });
});

export const getSiteTextsController: RequestHandler = asyncHandler((req, res) => {
  res.json({
    user: publicUser(req.auth!.user),
    csrfToken: req.auth!.session.csrfToken,
    siteTexts: getSiteTexts(),
  });
});

export const updateSiteTextsController: RequestHandler = asyncHandler((req, res) => {
  const siteTexts = updateSiteTexts(req.body ?? {});
  recordAuditAction({
    req,
    action: "content.site_texts_update",
    target: "site-texts",
    metadata: { keys: Object.keys(req.body ?? {}).join(", ") },
  });
  res.json({ message: "Textos atualizados com sucesso.", siteTexts });
});

export const listEntityController: RequestHandler = asyncHandler((req, res) => {
  res.json({ items: getItems(parseEntity(paramString(req.params.entity))) });
});

export const createEntityController: RequestHandler = asyncHandler((req, res) => {
  const entity = parseEntity(paramString(req.params.entity));
  const result = createItem(entity, req.body ?? {});
  recordAuditAction({ req, action: "content.create", target: entity });
  res.status(201).json({ message: "Item criado com sucesso.", ...result });
});

export const updateEntityController: RequestHandler = asyncHandler((req, res) => {
  const entity = parseEntity(paramString(req.params.entity));
  const id = String(paramString(req.params.id) ?? "");
  const result = updateItem(
    entity,
    id,
    req.body ?? {}
  );
  recordAuditAction({ req, action: "content.update", target: `${entity}:${id}` });
  res.json({ message: "Item atualizado com sucesso.", ...result });
});

export const deleteEntityController: RequestHandler = asyncHandler((req, res) => {
  const entity = parseEntity(paramString(req.params.entity));
  const id = String(paramString(req.params.id) ?? "");
  const items = deleteItem(
    entity,
    id
  );
  recordAuditAction({ req, action: "content.delete", target: `${entity}:${id}` });
  res.json({ message: "Item removido com sucesso.", items });
});

export const reorderEntityController: RequestHandler = asyncHandler((req, res) => {
  const items = reorderItems(
    parseEntity(paramString(req.params.entity)),
    req.body?.orderedIds
  );
  res.json({ message: "Ordem atualizada.", items });
});

export const listUsersController: RequestHandler = asyncHandler((req, res) => {
  res.json({
    user: publicUser(req.auth!.user),
    users: listUsers(),
  });
});

export const createUserController: RequestHandler = asyncHandler((req, res) => {
  const created = createUser(req.body ?? {});
  recordAuditAction({
    req,
    action: "user.create",
    target: created.email,
    metadata: { role: created.role },
  });
  res.status(201).json({
    message: "Usuario criado com sucesso.",
    createdUser: publicUser(created),
    users: listUsers(),
  });
});
