"use client";

import AnalyticsProvider from "@/components/analytics/AnalyticsProvider";
import ClientPopup from "./ClientPopup";
import { SiteHeader } from "./SiteHeader";
import { SiteSearchProvider } from "@/components/search/SiteSearchProvider";

/** Renders the public-site chrome. Administrative routes are served by the CMS process. */
export function ShellLayout({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <AnalyticsProvider>
      <SiteSearchProvider>
        <SiteHeader />
        <main>{children}</main>
        {footer}
        <ClientPopup />
      </SiteSearchProvider>
    </AnalyticsProvider>
  );
}
