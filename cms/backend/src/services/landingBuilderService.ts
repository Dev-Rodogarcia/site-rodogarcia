import { env } from "../config/env.js";
import { HttpError } from "../utils/http.js";

function getIntegration() {
  if (!env.landingBuilderApiUrl || !env.landingBuilderServiceToken) {
    throw new HttpError(503, "O construtor de landing pages ainda não está configurado neste ambiente.");
  }
  return { baseUrl: env.landingBuilderApiUrl, token: env.landingBuilderServiceToken };
}

async function requestBuilder(path: string, init: RequestInit = {}) {
  const { baseUrl, token } = getIntegration();
  let response: Response;
  try {
    const headers = new Headers(init.headers);
    headers.set("x-landing-builder-service-token", token);
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    throw new HttpError(503, "O construtor de landing pages não está disponível no momento.");
  }
  const payload: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = payload && typeof payload === "object" && "error" in payload
      ? String(payload.error)
      : "Não foi possível concluir a operação no construtor.";
    throw new HttpError(response.status >= 500 ? 503 : response.status, error);
  }
  return payload;
}

export function listLandingPages() { return requestBuilder("/api/internal/landings"); }
export function createLandingPage(payload: unknown) {
  return requestBuilder("/api/internal/landings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}
export function updateLandingPage(id: string, payload: unknown) {
  return requestBuilder(`/api/internal/landings/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}
export function publishLandingPage(id: string, publish: boolean) { return requestBuilder(`/api/internal/landings/${encodeURIComponent(id)}/${publish ? "publish" : "unpublish"}`, { method: "POST" }); }

export function getLandingPreview(id: string) {
  return requestBuilder(`/api/internal/landings/${encodeURIComponent(id)}/preview`, { method: "POST" });
}

export function listLandingMedia() {
  return requestBuilder("/api/internal/media");
}

export function uploadLandingMedia(file: Express.Multer.File, alt: string) {
  const form = new FormData();
  const contentType = file.mimetype || "application/octet-stream";
  form.set("file", new Blob([new Uint8Array(file.buffer)], { type: contentType }), file.originalname || "media");
  if (alt.trim()) form.set("alt", alt.trim());
  return requestBuilder("/api/internal/media", { method: "POST", body: form });
}

export function deleteLandingMedia(id: string) {
  return requestBuilder(`/api/internal/media/${encodeURIComponent(id)}`, { method: "DELETE" });
}
