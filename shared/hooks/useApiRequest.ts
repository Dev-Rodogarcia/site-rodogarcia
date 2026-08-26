"use client";

import { useCallback, useEffect, useRef } from "react";

export interface ApiRequestResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  /** Status HTTP quando a requisição alcançou o servidor. */
  status?: number;
}

export type ApiRequestFn = <T>(
  url: string,
  options?: RequestInit
) => Promise<ApiRequestResult<T>>;

/**
 * Fetch wrapper com CSRF token injetado automaticamente.
 * Portado de src/js/shared/api.js.
 */
export function useApiRequest(csrfToken = "") {
  const csrfTokenRef = useRef(csrfToken);

  useEffect(() => {
    csrfTokenRef.current = csrfToken;
  }, [csrfToken]);

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
        return {
          success: false,
          status: res.status,
          error: (body as { error?: string }).error ?? `HTTP ${res.status}`,
        };
      }

      return { success: true, status: res.status, data: body };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Erro de rede.",
      };
    }
  }, []);

  return { apiRequest };
}
