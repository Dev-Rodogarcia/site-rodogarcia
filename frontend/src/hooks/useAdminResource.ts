"use client";

import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import type { ApiRequestFn, ApiRequestResult } from "./useApiRequest";
import { useApiRequest } from "./useApiRequest";

const DEFAULT_STALE_TIME = 60_000;

interface AdminResourceCacheEntry<TData> {
  data: TData;
  timestamp: number;
}

type AdminResourceFetcher<TData> = (
  apiRequest: ApiRequestFn
) => Promise<ApiRequestResult<TData>>;

interface UseAdminResourceOptions<TData> {
  key: string;
  fetcher: AdminResourceFetcher<TData>;
  staleTime?: number;
  enabled?: boolean;
}

const adminResourceCache = new Map<string, AdminResourceCacheEntry<unknown>>();
const pendingAdminResourceRequests = new Map<
  string,
  Promise<ApiRequestResult<unknown>>
>();

export const adminResourceKeys = {
  dashboard: "admin:dashboard",
  analytics: (days: number) => `admin:analytics:${days}`,
  popup: "admin:popup",
  contactInfo: "admin:contact-info",
  aboutHero: "admin:about-hero",
  images: "admin:images",
  mediaManager: "admin:media-manager",
  mediaSlots: "admin:media-slots",
  seo: "admin:seo",
  consent: "admin:consent",
  leads: (query: string) => `admin:leads:${query}`,
  tracking: (query: string) => `admin:tracking:${query}`,
  users: "admin:users",
} as const;

function getFreshAdminResource<TData>(key: string, staleTime: number) {
  const cached = adminResourceCache.get(key) as AdminResourceCacheEntry<TData> | undefined;
  if (!cached) return null;
  if (Date.now() - cached.timestamp > staleTime) return null;
  return cached;
}

function setAdminResourceCache<TData>(key: string, data: TData) {
  adminResourceCache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

export function invalidateAdminResource(key: string | string[]) {
  const keys = Array.isArray(key) ? key : [key];
  for (const entryKey of keys) {
    adminResourceCache.delete(entryKey);
  }
}

export function useAdminResource<TData>({
  key,
  fetcher,
  staleTime = DEFAULT_STALE_TIME,
  enabled = true,
}: UseAdminResourceOptions<TData>) {
  const { apiRequest } = useApiRequest();
  const activeKeyRef = useRef(key);
  const initialCache = enabled ? getFreshAdminResource<TData>(key, staleTime) : null;
  const [data, setData] = useState<TData | undefined>(initialCache?.data);
  const [loading, setLoading] = useState(enabled && !initialCache);
  const [error, setError] = useState("");

  useEffect(() => {
    activeKeyRef.current = key;
    const cached = enabled ? getFreshAdminResource<TData>(key, staleTime) : null;
    if (cached) {
      setData(cached.data);
      setError("");
      setLoading(false);
      return;
    }

    if (!enabled) {
      setLoading(false);
    }
  }, [enabled, key, staleTime]);

  const loadResource = useEffectEvent(async (force = false) => {
    if (!enabled) {
      return {
        success: false,
        error: "Resource disabled.",
      } as ApiRequestResult<TData>;
    }

    const cached = !force ? getFreshAdminResource<TData>(key, staleTime) : null;
    if (cached) {
      setData(cached.data);
      setError("");
      setLoading(false);
      return {
        success: true,
        data: cached.data,
      } as ApiRequestResult<TData>;
    }

    setLoading(true);
    setError("");

    let request = pendingAdminResourceRequests.get(key) as
      | Promise<ApiRequestResult<TData>>
      | undefined;

    if (!request) {
      request = (async () => {
        const response = await fetcher(apiRequest);
        if (response.success && response.data !== undefined) {
          setAdminResourceCache(key, response.data);
        }
        return response;
      })();

      pendingAdminResourceRequests.set(
        key,
        request as Promise<ApiRequestResult<unknown>>
      );
    }

    try {
      const response = await request;
      if (activeKeyRef.current !== key) return response;

      if (response.success) {
        if (response.data !== undefined) {
          setData(response.data);
        }
        setError("");
      } else {
        setError(response.error ?? "Falha ao carregar recurso.");
      }

      setLoading(false);
      return response;
    } finally {
      if (pendingAdminResourceRequests.get(key) === request) {
        pendingAdminResourceRequests.delete(key);
      }
    }
  });

  useEffect(() => {
    if (!enabled) return;
    void loadResource(false);
  }, [enabled, key, staleTime]);

  const refresh = useCallback(async () => {
    invalidateAdminResource(key);
    return loadResource(true);
  }, [key, loadResource]);

  const invalidate = useCallback(() => {
    invalidateAdminResource(key);
  }, [key]);

  return {
    data,
    loading,
    error,
    refresh,
    invalidate,
  };
}
