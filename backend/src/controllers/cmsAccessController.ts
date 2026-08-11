import type { RequestHandler } from "express";
import { createAccessProfile, deleteAccessProfile, listAccessProfiles, updateAccessProfile } from "../security/cmsAccess.js";
import { recordAuditAction } from "../services/auditService.js";
import { asyncHandler, HttpError } from "../utils/http.js";

function id(value: string | string[] | undefined) { const result = Array.isArray(value) ? value[0] : value; if (!result) throw new HttpError(404, "Perfil de acesso não encontrado."); return result; }
export const listAccessProfilesController: RequestHandler = asyncHandler((_req, res) => { res.json({ profiles: listAccessProfiles(true) }); });
export const createAccessProfileController: RequestHandler = asyncHandler((req, res) => { const profile = createAccessProfile(req.body ?? {}); recordAuditAction({ req, action: "access.profile_create", target: profile.id }); res.status(201).json({ profile }); });
export const updateAccessProfileController: RequestHandler = asyncHandler((req, res) => { const profile = updateAccessProfile(id(req.params.id), req.body ?? {}); recordAuditAction({ req, action: "access.profile_update", target: profile!.id }); res.json({ profile }); });
export const deleteAccessProfileController: RequestHandler = asyncHandler((req, res) => { const profileId = id(req.params.id); deleteAccessProfile(profileId); recordAuditAction({ req, action: "access.profile_delete", target: profileId }); res.status(204).end(); });
