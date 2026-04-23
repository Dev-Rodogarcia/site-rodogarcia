"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSession } from "./useSession";

export interface ApiRequestResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type ApiRequestFn = <T>(
  url: string,
  options?: RequestInit
) => Promise<ApiRequestResult<T>>;

/**
 * Fetch wrapper com CSRF token injetado automaticamente.
 * Portado de src/js/shared/api.js.
 */
export function useApiRequest() {
  const { session } = useSession();
  const csrfTokenRef = useRef(session?.csrfToken ?? "");

  useEffect(() => {
    csrfTokenRef.current = session?.csrfToken ?? "";
  }, [session?.csrfToken]);

  const apiRequest = useCallback<ApiRequestFn>(async <T>(
    url: string,
    options: RequestInit = {}
  ): Promise<ApiRequestResult<T>> => {
    const method = (options.method ?? "GET").toUpperCase();
    const isUnsafe = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
    const csrfToken = csrfTokenRef.current;
    const providedHeaders = options.headers ?? {};
    const shouldSetJsonHeader = !(options.body instanceof FormData);
    const headers: HeadersInit = {
      ...(shouldSetJsonHeader ? { "Content-Type": "application/json" } : {}),
      ...providedHeaders,
      ...(isUnsafe && csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
    };

    try {
      const res = await fetch(url, { ...options, headers });
      const body = (await res.json()) as { error?: string } & T;

      if (!res.ok) {
        return { success: false, error: (body as { error?: string }).error ?? `HTTP ${res.status}` };
      }

      return { success: true, data: body };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Erro de rede.",
      };
    }
  }, []);

  return { apiRequest };
}
