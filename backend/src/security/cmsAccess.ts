import type { RequestHandler } from "express";
import { cmsAccessProfileRepository } from "../repositories/cmsAccessProfileRepository.js";
import { CMS_PERMISSIONS, type CmsPermission, type CmsPermissionOverride, type UserRecord } from "../types/auth.js";
import { generateId } from "../utils/ids.js";
import { HttpError } from "../utils/http.js";
import { sanitizeText } from "../utils/sanitize.js";

export const CMS_PERMISSION_CATALOG = CMS_PERMISSIONS.map((key) => ({ key, label: ({ dashboard: "Dashboard", home: "Página Inicial", services: "Página Serviços", "about-page": "Página Sobre", "business-page": "Página Empresas", "contact-page": "Página Contato", "careers-page": "Página Carreiras", collections: "Página Coletas", "quote-page": "Página Cotação", improvements: "Página Melhoria", "header-navigation": "Navegação", "footer-links": "Rodapé", units: "Unidades", analytics: "Analytics", images: "Imagens", popup: "Popup de saída", tracking: "Rastreamento", seo: "SEO", "cookie-monitoring": "Consentimentos", leads: "Leads", cookies: "LGPD e cookies", users: "Usuários e acessos", "landing-pages": "Landing Pages" } as Record<CmsPermission, string>)[key] }));
const isPermission = (value: unknown): value is CmsPermission => typeof value === "string" && (CMS_PERMISSIONS as readonly string[]).includes(value);
export function parseCmsPermissions(value: unknown): CmsPermission[] | undefined { if (value === undefined) return undefined; if (!Array.isArray(value) || value.some((item) => !isPermission(item))) throw new HttpError(422, "Permissões do CMS inválidas."); return [...new Set(value)]; }
export function parseCmsOverrides(value: unknown): CmsPermissionOverride[] | undefined { if (value === undefined) return undefined; if (!Array.isArray(value) || value.some((item) => !item || typeof item !== "object" || !isPermission((item as CmsPermissionOverride).permission) || !["grant", "deny"].includes((item as CmsPermissionOverride).effect))) throw new HttpError(422, "Exceções de permissão inválidas."); const map = new Map<CmsPermission, CmsPermissionOverride>(); for (const item of value as CmsPermissionOverride[]) map.set(item.permission, item); return [...map.values()]; }
export function effectiveCmsPermissions(user: UserRecord): CmsPermission[] {
  if (user.isOwner === true) return [...CMS_PERMISSIONS];
  const profile = user.accessProfileId ? cmsAccessProfileRepository.findById(user.accessProfileId) : null;
  const base = profile && profile.active !== false ? profile.permissions : user.cmsPermissions;
  // Administradores legados continuam operando até receberem um perfil explícito.
  const allowed = new Set<CmsPermission>(base === undefined ? CMS_PERMISSIONS : base);
  for (const override of user.cmsPermissionOverrides ?? []) override.effect === "deny" ? allowed.delete(override.permission) : allowed.add(override.permission);
  return CMS_PERMISSIONS.filter((permission) => allowed.has(permission));
}
export function hasCmsPermission(user: UserRecord, permission: CmsPermission) { return user.role === "admin" && user.active !== false && effectiveCmsPermissions(user).includes(permission); }
export function requireCmsPermission(...permissions: CmsPermission[]): RequestHandler { return (req, res, next) => { const user = req.auth?.user; if (!user || !permissions.some((permission) => hasCmsPermission(user, permission))) { res.status(403).json({ error: "Sua conta não tem acesso a esta área do CMS." }); return; } next(); }; }
function parseProfile(payload: Record<string, unknown>) { const name = sanitizeText(payload.name, 80); const description = sanitizeText(payload.description, 220); const permissions = parseCmsPermissions(payload.permissions) ?? []; if (!name) throw new HttpError(422, "Informe o nome do perfil de acesso."); return { name, description, permissions }; }
export function listAccessProfiles(includeInactive = false) { const profiles = cmsAccessProfileRepository.list(); return includeInactive ? profiles : profiles.filter((profile) => profile.active !== false); }
export function createAccessProfile(payload: Record<string, unknown>) { const values = parseProfile(payload); const exists = cmsAccessProfileRepository.list().some((profile) => profile.name.toLocaleLowerCase("pt-BR") === values.name.toLocaleLowerCase("pt-BR")); if (exists) throw new HttpError(409, "Já existe um perfil com esse nome."); const now = new Date().toISOString(); return cmsAccessProfileRepository.create({ id: generateId("access"), ...values, active: true, createdAt: now, updatedAt: now }); }
export function updateAccessProfile(id: string, payload: Record<string, unknown>) { const profile = cmsAccessProfileRepository.findById(id); if (!profile) throw new HttpError(404, "Perfil de acesso não encontrado."); const values = parseProfile(payload); return cmsAccessProfileRepository.update(id, { ...values, active: typeof payload.active === "boolean" ? payload.active : profile.active, updatedAt: new Date().toISOString() }); }
export function deleteAccessProfile(id: string) { if (!cmsAccessProfileRepository.findById(id)) throw new HttpError(404, "Perfil de acesso não encontrado."); cmsAccessProfileRepository.remove(id); }
