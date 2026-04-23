import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin";
import { requireJsonContentType, requireSameOrigin } from "@/lib/api";
import {
  readContentData,
  readSiteTextsData,
  writeContentData,
  writeSiteTextsData,
} from "@/lib/content";
import { verifyCsrfToken } from "@/lib/csrf";
import { sanitizeHexColor, sanitizeText, sanitizeUrl } from "@/lib/sanitize";
import { publicUser } from "@/lib/users";
import type { ContentData } from "@/types/content";

type Entity = "hero" | "dna" | "vagas" | "feedbacks";
type RawItem = Record<string, unknown> & { id: string; order?: number };

const ENTITY_KEYS: Record<Entity, keyof ContentData> = {
  hero: "heroSlides",
  dna: "dnaSlides",
  vagas: "vagas",
  feedbacks: "feedbacks",
};

const VALID_ENTITIES = Object.keys(ENTITY_KEYS) as Entity[];

function sortByOrder(items: RawItem[]) {
  return [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

function normalizeOrders(items: RawItem[]) {
  return items.map((item, index) => ({
    ...item,
    order: index + 1,
  }));
}

function generateId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

function parseSlug(slug: string[]) {
  const first = slug[0];

  if (first === "content" && slug.length === 1) {
    return { entity: null as Entity | null, id: null, isContent: true, isSiteTexts: false, isReorder: false };
  }

  if (first === "site-texts" && slug.length === 1) {
    return { entity: null as Entity | null, id: null, isContent: false, isSiteTexts: true, isReorder: false };
  }

  if (!VALID_ENTITIES.includes(first as Entity)) {
    return { entity: null as Entity | null, id: null, isContent: false, isSiteTexts: false, isReorder: false };
  }

  const entity = first as Entity;

  if (slug.length === 1) {
    return { entity, id: null, isContent: false, isSiteTexts: false, isReorder: false };
  }

  if (slug.length === 2 && slug[1] === "reorder") {
    return { entity, id: null, isContent: false, isSiteTexts: false, isReorder: true };
  }

  if (slug.length === 2) {
    return { entity, id: slug[1], isContent: false, isSiteTexts: false, isReorder: false };
  }

  return { entity: null as Entity | null, id: null, isContent: false, isSiteTexts: false, isReorder: false };
}

function sanitizeHeroPayload(payload: Record<string, unknown>) {
  return {
    title: sanitizeText(payload.title, 120),
    description: sanitizeText(payload.description, 420),
    image: sanitizeUrl(payload.image),
    desktopImage: sanitizeUrl(payload.desktopImage),
    mobileImage: sanitizeUrl(payload.mobileImage),
    active: Boolean(payload.active ?? true),
    layoutMode:
      payload.layoutMode === "full-image" ? "full-image" : "text-image",
    fullImageButtonsEnabled: Boolean(payload.fullImageButtonsEnabled),
    fullImageBackgroundType:
      payload.fullImageBackgroundType === "straight" ? "straight" : "wavy",
    buttons: Array.isArray(payload.buttons)
      ? (payload.buttons as Array<Record<string, unknown>>).slice(0, 2).map((button) => ({
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
    desktopImage: sanitizeUrl(payload.desktopImage),
    mobileImage: sanitizeUrl(payload.mobileImage),
    active: Boolean(payload.active ?? true),
    layoutMode:
      payload.layoutMode === "full-image" ? "full-image" : "text-image",
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
  const highlight = sanitizeText(
    payload.highlight ?? payload.resultadoTexto,
    120
  );

  return {
    nome: sanitizeText(payload.nome ?? payload.name, 80),
    empresa: sanitizeText(payload.empresa ?? payload.company, 120),
    texto: sanitizeText(
      payload.texto ?? payload.comment ?? payload.testimonial,
      800
    ),
    nota: Math.min(5, Math.max(1, Number(payload.nota ?? payload.rating ?? 5))),
    ativo: Boolean(payload.ativo ?? payload.active ?? true),
    role: sanitizeText(payload.role, 80),
    photo: sanitizeUrl(payload.photo ?? payload.image),
    resultadoIcon: sanitizeText(payload.resultadoIcon, 40),
    resultadoTexto: highlight,
    highlight,
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
  }
}

function normalizeAdminHeroItem(item: RawItem): RawItem {
  const buttons = Array.isArray(item.buttons) ? item.buttons : [];

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
    buttons,
  };
}

function normalizeAdminDnaItem(item: RawItem): RawItem {
  return {
    ...item,
    title: sanitizeText(item.title ?? item.titulo, 120),
    text: sanitizeText(item.text ?? item.descricao, 420),
    image: sanitizeUrl(item.image ?? item.imagem),
    desktopImage: sanitizeUrl(item.desktopImage),
    mobileImage: sanitizeUrl(item.mobileImage),
    active: Boolean(item.active ?? true),
    layoutMode: item.layoutMode === "full-image" ? "full-image" : "text-image",
  };
}

function normalizeAdminVagaItem(item: RawItem): RawItem {
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

function normalizeAdminFeedbackItem(item: RawItem): RawItem {
  const rating = Math.min(5, Math.max(1, Number(item.nota ?? item.rating ?? 5)));
  const active = Boolean(item.ativo ?? item.active ?? true);
  const testimonial = sanitizeText(
    item.testimonial ?? item.comment ?? item.texto,
    800
  );
  const highlight = sanitizeText(item.highlight ?? item.resultadoTexto, 120);

  return {
    ...item,
    name: sanitizeText(item.name ?? item.nome, 80),
    company: sanitizeText(item.company ?? item.empresa, 120),
    testimonial,
    rating,
    active,
    role: sanitizeText(item.role, 80),
    photo: sanitizeUrl(item.photo ?? item.image),
    image: sanitizeUrl(item.photo ?? item.image),
    highlight,
    resultadoIcon: sanitizeText(item.resultadoIcon, 40),
    resultadoTexto: highlight,
  };
}

function normalizeAdminItem(entity: Entity, item: RawItem) {
  switch (entity) {
    case "hero":
      return normalizeAdminHeroItem(item);
    case "dna":
      return normalizeAdminDnaItem(item);
    case "vagas":
      return normalizeAdminVagaItem(item);
    case "feedbacks":
      return normalizeAdminFeedbackItem(item);
  }
}

function getCollection(content: ContentData, entity: Entity) {
  const raw = content as unknown as Record<string, RawItem[]>;
  return sortByOrder(raw[ENTITY_KEYS[entity]] ?? []);
}

function setCollection(content: ContentData, entity: Entity, items: RawItem[]) {
  const raw = content as unknown as Record<string, RawItem[]>;
  raw[ENTITY_KEYS[entity]] = sortByOrder(items);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const adminSession = await requireAdminSession();
  if ("error" in adminSession) return adminSession.error;

  const { slug } = await params;
  const parsed = parseSlug(slug);

  if (parsed.isContent) {
    const content = readContentData();
    return NextResponse.json({
      user: publicUser(adminSession.user),
      csrfToken: adminSession.session.csrfToken,
      content,
    });
  }

  if (parsed.isSiteTexts) {
    return NextResponse.json({
      user: publicUser(adminSession.user),
      csrfToken: adminSession.session.csrfToken,
      siteTexts: readSiteTextsData(),
    });
  }

  if (!parsed.entity) {
    return NextResponse.json(
      { error: "Recurso administrativo nao encontrado." },
      { status: 404 }
    );
  }

  const entity = parsed.entity;
  const items = getCollection(readContentData(), entity).map((item) =>
    normalizeAdminItem(entity, item)
  );

  return NextResponse.json({ items });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const ctError = requireJsonContentType(request);
  if (ctError) {
    return NextResponse.json({ error: ctError }, { status: 415 });
  }

  const adminSession = await requireAdminSession();
  if ("error" in adminSession) return adminSession.error;

  const csrfError = verifyCsrfToken(request, adminSession.session.csrfToken);
  if (csrfError) return csrfError;

  const { slug } = await params;
  const parsed = parseSlug(slug);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalido." }, { status: 400 });
  }

  if (parsed.isSiteTexts) {
    const nextSiteTexts = {
      ...readSiteTextsData(),
      ...Object.fromEntries(
        Object.entries(body).map(([key, value]) => [key, sanitizeText(value, 500)])
      ),
    };

    writeSiteTextsData(nextSiteTexts);
    return NextResponse.json({
      message: "Textos atualizados com sucesso.",
      siteTexts: nextSiteTexts,
    });
  }

  if (!parsed.entity) {
    return NextResponse.json({ error: "Recurso nao encontrado." }, { status: 404 });
  }

  const content = readContentData();
  const collection = getCollection(content, parsed.entity);

  if (parsed.isReorder) {
    const orderedIds = Array.isArray(body.orderedIds)
      ? (body.orderedIds as unknown[]).map(String)
      : [];

    const mapById = new Map(collection.map((item) => [item.id, item]));
    const seen = new Set<string>();
    const nextItems: RawItem[] = [];

    for (const id of orderedIds) {
      const item = mapById.get(id);
      if (!item || seen.has(id)) continue;
      nextItems.push(item);
      seen.add(id);
    }

    for (const item of collection) {
      if (seen.has(item.id)) continue;
      nextItems.push(item);
    }

    const normalized = normalizeOrders(nextItems);
    setCollection(content, parsed.entity, normalized);
    writeContentData(content);

    return NextResponse.json({
      message: "Ordem atualizada.",
      items: normalized.map((item) => normalizeAdminItem(parsed.entity!, item)),
    });
  }

  const nowIso = new Date().toISOString();
  const newItem: RawItem = {
    id: generateId(parsed.entity),
    order: collection.reduce((max, item) => Math.max(max, item.order ?? 0), 0) + 1,
    createdAt: nowIso,
    updatedAt: nowIso,
    ...sanitizeEntityPayload(parsed.entity, body),
  };

  const nextItems = [...collection, newItem];
  setCollection(content, parsed.entity, nextItems);
  writeContentData(content);

  return NextResponse.json(
    {
      message: "Item criado com sucesso.",
      item: normalizeAdminItem(parsed.entity, newItem),
      items: nextItems.map((item) => normalizeAdminItem(parsed.entity!, item)),
    },
    { status: 201 }
  );
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const ctError = requireJsonContentType(request);
  if (ctError) {
    return NextResponse.json({ error: ctError }, { status: 415 });
  }

  const adminSession = await requireAdminSession();
  if ("error" in adminSession) return adminSession.error;

  const csrfError = verifyCsrfToken(request, adminSession.session.csrfToken);
  if (csrfError) return csrfError;

  const { slug } = await params;
  const parsed = parseSlug(slug);

  if (!parsed.entity || !parsed.id) {
    return NextResponse.json({ error: "Recurso nao encontrado." }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "JSON invalido." }, { status: 400 });
  }

  const content = readContentData();
  const collection = getCollection(content, parsed.entity);
  const index = collection.findIndex((item) => item.id === parsed.id);

  if (index === -1) {
    return NextResponse.json({ error: "Item nao encontrado." }, { status: 404 });
  }

  const currentItem = collection[index];
  const updatedItem: RawItem = {
    ...currentItem,
    ...sanitizeEntityPayload(parsed.entity, body),
    id: currentItem.id,
    order: currentItem.order,
    updatedAt: new Date().toISOString(),
  };

  const nextItems = [...collection];
  nextItems[index] = updatedItem;

  setCollection(content, parsed.entity, nextItems);
  writeContentData(content);

  return NextResponse.json({
    message: "Item atualizado com sucesso.",
    item: normalizeAdminItem(parsed.entity, updatedItem),
    items: nextItems.map((item) => normalizeAdminItem(parsed.entity!, item)),
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  const adminSession = await requireAdminSession();
  if ("error" in adminSession) return adminSession.error;

  const csrfError = verifyCsrfToken(request, adminSession.session.csrfToken);
  if (csrfError) return csrfError;

  const { slug } = await params;
  const parsed = parseSlug(slug);

  if (!parsed.entity || !parsed.id) {
    return NextResponse.json({ error: "Recurso nao encontrado." }, { status: 404 });
  }

  const content = readContentData();
  const collection = getCollection(content, parsed.entity);
  const nextItems = collection.filter((item) => item.id !== parsed.id);

  if (nextItems.length === collection.length) {
    return NextResponse.json({ error: "Item nao encontrado." }, { status: 404 });
  }

  const normalized = normalizeOrders(nextItems);
  setCollection(content, parsed.entity, normalized);
  writeContentData(content);

  return NextResponse.json({
    message: "Item removido com sucesso.",
    items: normalized.map((item) => normalizeAdminItem(parsed.entity!, item)),
  });
}
