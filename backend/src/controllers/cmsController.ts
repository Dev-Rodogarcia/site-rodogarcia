import type { RequestHandler } from "express";
import {
  createItem,
  deleteItem,
  getCmsPage,
  getContent,
  getFooterLinks,
  getHomePage,
  getServicesPage,
  getItems,
  getSiteTexts,
  parseFooterLinkSection,
  reorderItems,
  updateItem,
  updateFooterLinks,
  updateHomeSection,
  updateCmsPageSection,
  updateServicesPageSection,
  updateSiteTexts,
  VALID_ENTITIES,
  type Entity,
  type HomeSectionKey,
  type ServicesPageSectionKey,
} from "../services/cmsService.js";
import { parsePageKey, type PageSectionKey } from "../services/pageContent.js";
import {
  createUser,
  deleteUser,
  listUsers,
  publicUser,
  updateUser,
} from "../services/authService.js";
import { recordAuditAction } from "../services/auditService.js";
import { asyncHandler, HttpError } from "../utils/http.js";

function parseEntity(value: string | undefined): Entity {
  if (VALID_ENTITIES.includes(value as Entity)) return value as Entity;
  throw new HttpError(404, "Recurso administrativo não encontrado.");
}

function parseCmsPage(value: string | undefined) {
  const pageKey = parsePageKey(value);
  if (pageKey) return pageKey;
  throw new HttpError(404, "Página administrativa não encontrada.");
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

export const getHomeController: RequestHandler = asyncHandler((req, res) => {
  res.json({
    user: publicUser(req.auth!.user),
    csrfToken: req.auth!.session.csrfToken,
    homePage: getHomePage(),
  });
});

export const getServicesPageController: RequestHandler = asyncHandler((req, res) => {
  res.json({
    user: publicUser(req.auth!.user),
    csrfToken: req.auth!.session.csrfToken,
    servicesPage: getServicesPage(),
  });
});

export const getCmsPageController: RequestHandler = asyncHandler((req, res) => {
  const pageKey = parseCmsPage(paramString(req.params.pageKey));
  res.json({
    user: publicUser(req.auth!.user),
    csrfToken: req.auth!.session.csrfToken,
    pageKey,
    page: getCmsPage(pageKey),
  });
});

export const getFooterLinksController: RequestHandler = asyncHandler((req, res) => {
  res.json({
    user: publicUser(req.auth!.user),
    csrfToken: req.auth!.session.csrfToken,
    footerLinks: getFooterLinks(),
  });
});

function updateHomeSectionController(section: HomeSectionKey): RequestHandler {
  return asyncHandler((req, res) => {
    const homePage = updateHomeSection(section, req.body ?? {});
    recordAuditAction({
      req,
      action: "content.home_update",
      target: `home:${section}`,
    });
    res.json({ message: "Home atualizada com sucesso.", homePage });
  });
}

export const updateHomeHeroController = updateHomeSectionController("hero");
export const updateHomeSection1Controller = updateHomeSectionController("section1");
export const updateHomeSection2Controller = updateHomeSectionController("section2");
export const updateHomeSection3Controller = updateHomeSectionController("section3");
export const updateHomeRegionalPresenceController = updateHomeSectionController("regionalPresence");
export const updateHomeTrackingCtaController = updateHomeSectionController("trackingCta");
export const updateHomeSocialProofController = updateHomeSectionController("socialProof");

function updateServicesPageSectionController(section: ServicesPageSectionKey): RequestHandler {
  return asyncHandler((req, res) => {
    const servicesPage = updateServicesPageSection(section, req.body ?? {});
    recordAuditAction({
      req,
      action: "content.services_update",
      target: `services:${section}`,
    });
    res.json({ message: "Página Serviços atualizada com sucesso.", servicesPage });
  });
}

export const updateServicesModulesController = updateServicesPageSectionController("modules");
export const updateServicesFinalCtaController = updateServicesPageSectionController("finalCta");
export const updateServicesFaqController = updateServicesPageSectionController("faq");

export const updateCmsPageSectionController: RequestHandler = asyncHandler((req, res) => {
  const pageKey = parseCmsPage(paramString(req.params.pageKey));
  const sectionKey = String(paramString(req.params.sectionKey) ?? "") as PageSectionKey;
  const page = updateCmsPageSection(pageKey, sectionKey, req.body ?? {});
  recordAuditAction({
    req,
    action: "content.page_update",
    target: `${pageKey}:${sectionKey}`,
  });
  res.json({ message: "Pagina atualizada com sucesso.", pageKey, page });
});

export const updateFooterLinksSectionController: RequestHandler = asyncHandler((req, res) => {
  const sectionKey = parseFooterLinkSection(paramString(req.params.sectionKey));
  if (!sectionKey) {
    throw new HttpError(404, "Seção FOOTER LINKS não encontrada.");
  }
  const footerLinks = updateFooterLinks(sectionKey, req.body ?? {});
  recordAuditAction({
    req,
    action: "content.footer_links_update",
    target: `footer-links:${sectionKey}`,
  });
  res.json({ message: "FOOTER LINKS atualizado com sucesso.", footerLinks });
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
  const created = createUser(req.body ?? {}, req.auth!.user);
  recordAuditAction({
    req,
    action: "user.create",
    target: created.email,
    metadata: { role: created.role },
  });
  res.status(201).json({
    message: "Usuário criado com sucesso.",
    createdUser: publicUser(created),
    users: listUsers(),
  });
});

export const updateUserController: RequestHandler = asyncHandler((req, res) => {
  const updated = updateUser(paramString(req.params.id), req.body ?? {}, req.auth!.user);
  recordAuditAction({
    req,
    action: "user.update",
    target: updated.email,
    metadata: { role: updated.role, active: String(updated.active !== false) },
  });
  res.json({
    message: "Usuário atualizado com sucesso.",
    updatedUser: publicUser(updated),
    users: listUsers(),
  });
});

export const deleteUserController: RequestHandler = asyncHandler((req, res) => {
  const id = paramString(req.params.id);
  deleteUser(id, req.auth!.user);
  recordAuditAction({
    req,
    action: "user.delete",
    target: String(id ?? ""),
  });
  res.json({
    message: "Usuário removido com sucesso.",
    users: listUsers(),
  });
});
