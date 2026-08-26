"use client";

import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import type { AuthSession } from "@/types/auth";
import { api } from "@/lib/routes";

interface SessionContextValue {
  session: AuthSession | null;
  loading: boolean;
  refetch: () => void;
}

export const SessionContext = createContext<SessionContextValue>({
  session: null,
  loading: true,
  refetch: () => {},
});

export function useSession() {
  return useContext(SessionContext);
}

export function useSessionState(): SessionContextValue {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(api.auth.session, {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as AuthSession;
        setSession(data);
      } else {
        setSession({ authenticated: false, csrfToken: "", setupRequired: false });
      }
    } catch {
      setSession({ authenticated: false, csrfToken: "", setupRequired: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSession();
  }, [fetchSession]);

  const refetch = useCallback(() => {
    void fetchSession();
  }, [fetchSession]);

  return { session, loading, refetch };
}
