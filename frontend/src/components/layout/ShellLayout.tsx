"use client";

import { usePathname } from "next/navigation";
import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";
import ClientPopup from "./ClientPopup";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { getAppChrome } from "@/lib/routes";
import { SiteSearchProvider } from "@/components/search/SiteSearchProvider";

/** Renders public site chrome and mounts public-only providers outside auth/admin routes. */
export function ShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const chrome = getAppChrome(pathname);

  if (chrome !== "public") {
    return <>{children}</>;
  }

  return (
    <AnalyticsProvider>
      <SiteSearchProvider>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <ClientPopup />
      </SiteSearchProvider>
    </AnalyticsProvider>
  );
}
