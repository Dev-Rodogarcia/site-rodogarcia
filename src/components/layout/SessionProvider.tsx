"use client";

import { SessionContext, useSessionState } from "@/hooks/useSession";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const value = useSessionState();
  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
