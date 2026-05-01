import { readContentData, readSiteTextsData, writeContentData, writeSiteTextsData } from "./contentService.js";
import type { ContentData } from "../types/content.js";
import { generateId } from "../utils/ids.js";
import { sanitizeEmail, sanitizeHexColor, sanitizeText, sanitizeUrl } from "../utils/sanitize.js";
import { HttpError } from "../utils/http.js";

export type Entity = "hero" | "dna" | "vagas" | "feedbacks" | "units";
type RawItem = Record<string, unknown> & { id: string; order?: number };

const ENTITY_KEYS: Record<Entity, keyof ContentData> = {
  hero: "heroSlides",
  dna: "dnaSlides",
  vagas: "vagas",
  feedbacks: "feedbacks",
  units: "units",
};

export const VALID_ENTITIES = Object.keys(ENTITY_KEYS) as Entity[];

function sortByOrder(items: RawItem[]) {
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function normalizeOrders(items: RawItem[]) {
  return items.map((item, index) => ({ ...item, order: index + 1 }));
}

function getCollection(content: ContentData, entity: Entity) {
  const raw = content as unknown as Record<string, RawItem[]>;
  return sortByOrder(raw[ENTITY_KEYS[entity]] ?? []);
}

function setCollection(content: ContentData, entity: Entity, items: RawItem[]) {
  const raw = content as unknown as Record<string, RawItem[]>;
  raw[ENTITY_KEYS[entity]] = sortByOrder(items);
}

function sanitizeHeroPayload(payload: Record<string, unknown>) {
  return {
    title: sanitizeText(payload.title, 120),
    description: sanitizeText(payload.description, 420),
    image: sanitizeUrl(payload.image),
    desktopImage: sanitizeUrl(payload.desktopImage),
    mobileImage: sanitizeUrl(payload.mobileImage),
    active: Boolean(payload.active ?? true),
    layoutMode: payload.layoutMode === "full-image" ? "full-image" : "text-image",
    fullImageButtonsEnabled: Boolean(payload.fullImageButtonsEnabled),
    fullImageBackgroundType:
      payload.fullImageBackgroundType === "straight" ? "straight" : "wavy",
    buttons: Array.isArray(payload.buttons)
      ? (payload.buttons as Array<Record<string, unknown>>)
          .slice(0, 2)
          .map((button) => ({
            label: sanitizeText(button.label, 40),
            url: sanitizeUrl(button.url),
            enabled: Boolean(button.enabled),
            color: sanitizeHexColor(button.color),
            variant: button.variant === "outline" ? "outline" : "solid",
          }))
      : [],
  };
}

function sanitizeDnaPayload(payload: Record<string, unknown>) {
  return {
    title: sanitizeText(payload.title, 120),
    text: sanitizeText(payload.text, 420),
    image: sanitizeUrl(payload.image),
    video: sanitizeUrl(payload.video),
    desktopImage: sanitizeUrl(payload.desktopImage),
    mobileImage: sanitizeUrl(payload.mobileImage),
    desktopVideo: sanitizeUrl(payload.desktopVideo),
    mobileVideo: sanitizeUrl(payload.mobileVideo),
    active: Boolean(payload.active ?? true),
    layoutMode: payload.layoutMode === "full-image" ? "full-image" : "text-image",
  };
}

function sanitizeVagaPayload(payload: Record<string, unknown>) {
  return {
    titulo: sanitizeText(payload.titulo ?? payload.title, 120),
    descricao: sanitizeText(payload.descricao ?? payload.description, 600),
    local: sanitizeText(payload.local ?? payload.location, 120),
    tipo: sanitizeText(payload.tipo ?? payload.contractType, 40),
    ativo: Boolean(payload.ativo ?? payload.active ?? true),
    featured: Boolean(payload.featured),
    status: sanitizeText(payload.status, 40),
    workType: sanitizeText(payload.workType, 40),
    applyUrl: sanitizeUrl(payload.applyUrl),
  };
}

function sanitizeFeedbackPayload(payload: Record<string, unknown>) {
  const highlight = sanitizeText(payload.highlight ?? payload.resultadoTexto, 120);
  return {
    nome: sanitizeText(payload.nome ?? payload.name, 80),
    empresa: sanitizeText(payload.empresa ?? payload.company, 120),
    texto: sanitizeText(payload.texto ?? payload.comment ?? payload.testimonial, 800),
    nota: Math.min(5, Math.max(1, Number(payload.nota ?? payload.rating ?? 5))),
    ativo: Boolean(payload.ativo ?? payload.active ?? true),
    role: sanitizeText(payload.role, 80),
    photo: sanitizeUrl(payload.photo ?? payload.image),
    resultadoIcon: sanitizeText(payload.resultadoIcon, 40),
    resultadoTexto: highlight,
    highlight,
  };
}

function sanitizeState(value: unknown) {
  return sanitizeText(value, 2).toLowerCase().replace(/[^a-z]/g, "");
}

function sanitizeUnitPayload(payload: Record<string, unknown>) {
  return {
    name: sanitizeText(payload.name ?? payload.nome, 120),
    type: sanitizeText(payload.type ?? payload.tipo, 40),
    state: sanitizeState(payload.state ?? payload.estado),
    city: sanitizeText(payload.city ?? payload.cidade, 80),
    address: sanitizeText(payload.address ?? payload.endereco, 220),
    phone: sanitizeText(payload.phone ?? payload.telefone, 60),
    email: sanitizeEmail(payload.email),
    contactUrl: sanitizeUrl(payload.contactUrl ?? payload.linkContato),
    description: sanitizeText(payload.description ?? payload.descricao, 220),
    logisticsInfo: sanitizeText(payload.logisticsInfo ?? payload.infoLogistica, 260),
    isDefault: Boolean(payload.isDefault ?? payload.matriz),
    active: Boolean(payload.active ?? payload.ativo ?? true),
  };
}

function sanitizeEntityPayload(entity: Entity, payload: Record<string, unknown>) {
  switch (entity) {
    case "hero":
      return sanitizeHeroPayload(payload);
    case "dna":
      return sanitizeDnaPayload(payload);
    case "vagas":
      return sanitizeVagaPayload(payload);
    case "feedbacks":
      return sanitizeFeedbackPayload(payload);
    case "units":
      return sanitizeUnitPayload(payload);
  }
}

function validateEntityPayload(entity: Entity, payload: Record<string, unknown>) {
  if (entity === "hero") {
    const layoutMode = payload.layoutMode === "full-image" ? "full-image" : "text-image";
    if (!payload.title || !payload.image) return "Titulo e imagem sao obrigatorios.";
    if (layoutMode === "text-image" && !payload.description) {
      return "Descricao obrigatoria para hero com texto.";
    }
  }
  if (entity === "dna") {
    const layoutMode = payload.layoutMode === "full-image" ? "full-image" : "text-image";
    if (!payload.title && !payload.image && !payload.video) {
      return "Informe ao menos titulo, imagem ou video.";
    }
    if (payload.title && !payload.image && !payload.video) {
      return "Imagem ou video sao obrigatorios quando houver titulo.";
    }
    if (layoutMode === "text-image" && !payload.text) {
      return "Texto obrigatorio para slide DNA com texto.";
    }
  }
  if (entity === "vagas") {
    if (!payload.titulo || !payload.local || !payload.tipo || !payload.descricao || !payload.applyUrl) {
      return "Titulo, localizacao, contrato, descricao e link sao obrigatorios.";
    }
  }
  if (entity === "feedbacks") {
    if (!payload.nome || !payload.empresa || !payload.texto || !payload.role) {
      return "Nome, cargo, empresa e depoimento sao obrigatorios.";
    }
  }
  if (entity === "units") {
    if (!payload.name || !payload.state || !payload.address) {
      return "Nome, estado e endereco sao obrigatorios.";
    }
    if (!payload.phone && !payload.email) {
      return "Informe ao menos telefone ou e-mail da unidade.";
    }
  }
  return null;
}

function normalizeAdminItem(entity: Entity, item: RawItem) {
  if (entity === "hero") {
    return {
      ...item,
      title: sanitizeText(item.title, 120),
      description: sanitizeText(item.description, 420),
      image: sanitizeUrl(item.image),
      desktopImage: sanitizeUrl(item.desktopImage),
      mobileImage: sanitizeUrl(item.mobileImage),
      active: Boolean(item.active ?? true),
      layoutMode: item.layoutMode === "full-image" ? "full-image" : "text-image",
      fullImageButtonsEnabled: Boolean(item.fullImageButtonsEnabled),
      fullImageBackgroundType:
        item.fullImageBackgroundType === "straight" ? "straight" : "wavy",
      buttons: Array.isArray(item.buttons) ? item.buttons : [],
    };
  }
  if (entity === "dna") {
    return {
      ...item,
      title: sanitizeText(item.title ?? item.titulo, 120),
      text: sanitizeText(item.text ?? item.descricao, 420),
      image: sanitizeUrl(item.image ?? item.imagem),
      video: sanitizeUrl(item.video),
      desktopImage: sanitizeUrl(item.desktopImage),
      mobileImage: sanitizeUrl(item.mobileImage),
      desktopVideo: sanitizeUrl(item.desktopVideo),
      mobileVideo: sanitizeUrl(item.mobileVideo),
      active: Boolean(item.active ?? true),
      layoutMode: item.layoutMode === "full-image" ? "full-image" : "text-image",
    };
  }
  if (entity === "vagas") {
    return {
      ...item,
      title: sanitizeText(item.title ?? item.titulo, 120),
      location: sanitizeText(item.location ?? item.local, 120),
      contractType: sanitizeText(item.contractType ?? item.tipo, 40),
      description: sanitizeText(item.description ?? item.descricao, 600),
      active: Boolean(item.active ?? item.ativo ?? true),
      featured: Boolean(item.featured),
      status: sanitizeText(item.status, 40),
      workType: sanitizeText(item.workType, 40),
      applyUrl: sanitizeUrl(item.applyUrl),
    };
  }
  if (entity === "units") {
    return {
      ...item,
      name: sanitizeText(item.name ?? item.nome, 120),
      type: sanitizeText(item.type ?? item.tipo, 40),
      state: sanitizeState(item.state ?? item.estado),
      city: sanitizeText(item.city ?? item.cidade, 80),
      address: sanitizeText(item.address ?? item.endereco, 220),
      phone: sanitizeText(item.phone ?? item.telefone, 60),
      email: sanitizeEmail(item.email),
      contactUrl: sanitizeUrl(item.contactUrl ?? item.linkContato),
      description: sanitizeText(item.description ?? item.descricao, 220),
      logisticsInfo: sanitizeText(item.logisticsInfo ?? item.infoLogistica, 260),
      isDefault: Boolean(item.isDefault ?? item.matriz),
      active: Boolean(item.active ?? item.ativo ?? true),
    };
  }

  const rating = Math.min(5, Math.max(1, Number(item.nota ?? item.rating ?? 5)));
  const testimonial = sanitizeText(item.testimonial ?? item.comment ?? item.texto, 800);
  const highlight = sanitizeText(item.highlight ?? item.resultadoTexto, 120);
  return {
    ...item,
    name: sanitizeText(item.name ?? item.nome, 80),
    company: sanitizeText(item.company ?? item.empresa, 120),
    testimonial,
    rating,
    active: Boolean(item.ativo ?? item.active ?? true),
    role: sanitizeText(item.role, 80),
    photo: sanitizeUrl(item.photo ?? item.image),
    image: sanitizeUrl(item.photo ?? item.image),
    highlight,
    resultadoIcon: sanitizeText(item.resultadoIcon, 40),
    resultadoTexto: highlight,
  };
}

export function getSiteTexts() {
  return readSiteTextsData();
}

export function updateSiteTexts(body: Record<string, unknown>) {
  const nextSiteTexts = {
    ...readSiteTextsData(),
    ...Object.fromEntries(
      Object.entries(body).map(([key, value]) => [key, sanitizeText(value, 500)])
    ),
  };
  writeSiteTextsData(nextSiteTexts);
  return nextSiteTexts;
}

export function getContent() {
  return readContentData();
}

export function getItems(entity: Entity) {
  return getCollection(readContentData(), entity).map((item) =>
    normalizeAdminItem(entity, item)
  );
}

export function createItem(entity: Entity, body: Record<string, unknown>) {
  const content = readContentData();
  const collection = getCollection(content, entity);
  const payload = sanitizeEntityPayload(entity, body);
  const validationError = validateEntityPayload(entity, payload);
  if (validationError) throw new HttpError(422, validationError);

  const nowIso = new Date().toISOString();
  const newItem: RawItem = {
    id: generateId(entity),
    order: collection.reduce((max, item) => Math.max(max, item.order ?? 0), 0) + 1,
    createdAt: nowIso,
    updatedAt: nowIso,
    ...payload,
  };
  const nextItems = [...collection, newItem];
  setCollection(content, entity, nextItems);
  writeContentData(content);
  return {
    item: normalizeAdminItem(entity, newItem),
    items: nextItems.map((item) => normalizeAdminItem(entity, item)),
  };
}

export function updateItem(entity: Entity, id: string, body: Record<string, unknown>) {
  const content = readContentData();
  const collection = getCollection(content, entity);
  const index = collection.findIndex((item) => item.id === id);
  if (index === -1) throw new HttpError(404, "Item nao encontrado.");

  const payload = sanitizeEntityPayload(entity, body);
  const validationError = validateEntityPayload(entity, payload);
  if (validationError) throw new HttpError(422, validationError);

  const currentItem = collection[index]!;
  const updatedItem: RawItem = {
    ...currentItem,
    ...payload,
    id: currentItem.id,
    order: currentItem.order,
    updatedAt: new Date().toISOString(),
  };
  const nextItems = [...collection];
  nextItems[index] = updatedItem;
  setCollection(content, entity, nextItems);
  writeContentData(content);
  return {
    item: normalizeAdminItem(entity, updatedItem),
    items: nextItems.map((item) => normalizeAdminItem(entity, item)),
  };
}

export function deleteItem(entity: Entity, id: string) {
  const content = readContentData();
  const collection = getCollection(content, entity);
  const nextItems = collection.filter((item) => item.id !== id);
  if (nextItems.length === collection.length) {
    throw new HttpError(404, "Item nao encontrado.");
  }
  const normalized = normalizeOrders(nextItems);
  setCollection(content, entity, normalized);
  writeContentData(content);
  return normalized.map((item) => normalizeAdminItem(entity, item));
}

export function reorderItems(entity: Entity, orderedIds: unknown) {
  const content = readContentData();
  const collection = getCollection(content, entity);
  const ids = Array.isArray(orderedIds) ? orderedIds.map(String) : [];
  const mapById = new Map(collection.map((item) => [item.id, item]));
  const seen = new Set<string>();
  const nextItems: RawItem[] = [];

  for (const id of ids) {
    const item = mapById.get(id);
    if (!item || seen.has(id)) continue;
    nextItems.push(item);
    seen.add(id);
  }
  for (const item of collection) {
    if (!seen.has(item.id)) nextItems.push(item);
  }

  const normalized = normalizeOrders(nextItems);
  setCollection(content, entity, normalized);
  writeContentData(content);
  return normalized.map((item) => normalizeAdminItem(entity, item));
}
