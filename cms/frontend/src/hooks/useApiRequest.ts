"use client";

import { useSession } from "./useSession";
import {
  useApiRequest as useSharedApiRequest,
  type ApiRequestFn,
  type ApiRequestResult,
} from "@shared/hooks/useApiRequest";

export type { ApiRequestFn, ApiRequestResult };

/** Injeta o CSRF da sessão administrativa no cliente do CMS. */
export function useApiRequest() {
  const { session } = useSession();
  return useSharedApiRequest(session?.csrfToken ?? "");
}
