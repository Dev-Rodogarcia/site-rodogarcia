"use client";

import { useEffect, useState } from "react";
import DevSidebar from "./DevSidebar";
import DevTopbar from "./DevTopbar";

const SIDEBAR_STORAGE_KEY = "developer.sidebar.expanded";

export default function DeveloperShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (storedValue === "0") {
      setSidebarExpanded(false);
      return;
    }
    if (storedValue === "1") {
      setSidebarExpanded(true);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarExpanded ? "1" : "0");
  }, [sidebarExpanded]);

  return (
    <div
      data-admin-shell="true"
      className="relative h-dvh overflow-hidden bg-[linear-gradient(180deg,#f8fbff_0%,#eef3f9_46%,#f8fbff_100%)]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,rgba(29,78,216,0.09),transparent_22%),radial-gradient(circle_at_86%_10%,rgba(6,182,212,0.08),transparent_24%)]" />
      <div className="relative flex h-full min-w-0">
        <DevSidebar
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          expanded={sidebarExpanded}
          onToggleExpanded={() => setSidebarExpanded((current) => !current)}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div
            data-admin-scroll
            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
          >
            <div className="flex min-h-full flex-col">
              <DevTopbar onOpenNavigation={() => setMobileOpen(true)} />
              <div className="flex-1">{children}</div>
              <footer className="mt-auto w-full border-t border-[rgba(15,23,42,0.08)] bg-white/66 px-5 py-6 text-sm text-[var(--color-muted-raw)] backdrop-blur-sm sm:px-6 lg:px-8">
                <span className="font-semibold tracking-[-0.02em] text-[var(--foreground)]">
                  Feito por Lucas
                </span>
                {" \u00B7 "}
                <span>Painel interno Rodogarcia</span>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
