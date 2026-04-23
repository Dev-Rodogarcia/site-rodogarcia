/**
 * Helpers de fetch server-side para uso em React Server Components e route handlers.
 */

import type { ApiResponse } from "@/types/api";
import { NextResponse } from "next/server";
import { api } from "@/lib/routes";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

/**
 * Fetch tipado para uso em Server Components (não inclui CSRF token).
 * Usa Next.js fetch com cache tag para ISR.
 */
export async function serverFetch<T>(
  path: string,
  options?: RequestInit & { tags?: string[] }
): Promise<ApiResponse<T>> {
  const url = `${BASE_URL}${path}`;

  try {
    const res = await fetch(url, {
      ...options,
      next: options?.tags ? { tags: options.tags } : undefined,
    });

    if (!res.ok) {
      const errorBody = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      return {
        success: false,
        error: errorBody.error ?? `HTTP ${res.status}`,
      };
    }

    const data = (await res.json()) as T;
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro de rede.",
    };
  }
}

/**
 * Lê o conteúdo público da API.
 * Chamado em RSC pages para pré-renderizar o conteúdo no servidor.
 */
export async function fetchPublicContent() {
  return serverFetch(api.public.content, {
    tags: ["public-content"],
  });
}

/**
 * Verifica se o JSON de uma request tem o Content-Type correto.
 * Para uso nos route handlers.
 */
export function requireJsonContentType(request: Request): string | null {
  const ct = request.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    return "Content-Type deve ser application/json.";
  }
  return null;
}

/**
 * Helper para verificar origem da requisição (proteção CORS).
 * Portado de isSameOriginRequest() em server.js.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    const host =
      request.headers.get("x-forwarded-host") ??
      request.headers.get("host") ??
      "";
    const proto =
      (request.headers.get("x-forwarded-proto") ?? "https").split(",")[0].trim();
    const expected = `${proto}://${host}`;
    return originUrl.origin === expected;
  } catch {
    return false;
  }
}

export function requireSameOrigin(request: Request): NextResponse | null {
  if (isSameOrigin(request)) return null;

  return NextResponse.json(
    { error: "Origem não autorizada." },
    { status: 403 }
  );
}
