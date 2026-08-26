"use client";

import { createContext, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

export interface DeveloperPageHeaderStat {
  label: string;
  value: ReactNode;
}

export interface DeveloperPageHeaderContent {
  eyebrow: string;
  title: string;
  description?: string;
  stats: DeveloperPageHeaderStat[];
  actions?: ReactNode;
}

interface DeveloperPageHeaderContextValue {
  header?: DeveloperPageHeaderContent;
  setHeader: Dispatch<SetStateAction<DeveloperPageHeaderContent | undefined>>;
}

const DeveloperPageHeaderContext = createContext<DeveloperPageHeaderContextValue | null>(null);

export function DeveloperPageHeaderProvider({ children }: { children: ReactNode }) {
  const [header, setHeader] = useState<DeveloperPageHeaderContent>();
  const value = useMemo(() => ({ header, setHeader }), [header]);

  return (
    <DeveloperPageHeaderContext.Provider value={value}>
      {children}
    </DeveloperPageHeaderContext.Provider>
  );
}

export function useDeveloperPageHeader() {
  const context = useContext(DeveloperPageHeaderContext);

  if (!context) {
    throw new Error("useDeveloperPageHeader deve ser usado dentro de DeveloperPageHeaderProvider.");
  }

  return context;
}
