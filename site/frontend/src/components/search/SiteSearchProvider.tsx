"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface SiteSearchContextValue {
  isOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
}

const SiteSearchContext = createContext<SiteSearchContextValue | null>(null);

export function SiteSearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openSearch = useCallback(() => setIsOpen(true), []);
  const closeSearch = useCallback(() => setIsOpen(false), []);
  const toggleSearch = useCallback(() => setIsOpen((current) => !current), []);

  const value = useMemo(
    () => ({
      isOpen,
      openSearch,
      closeSearch,
      toggleSearch,
    }),
    [closeSearch, isOpen, openSearch, toggleSearch]
  );

  return (
    <SiteSearchContext.Provider value={value}>
      {children}
    </SiteSearchContext.Provider>
  );
}

export function useSiteSearch() {
  const context = useContext(SiteSearchContext);
  if (!context) {
    throw new Error("useSiteSearch must be used inside SiteSearchProvider");
  }
  return context;
}
