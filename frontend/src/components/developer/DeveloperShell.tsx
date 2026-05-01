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
      className="relative h-dvh overflow-hidden bg-[#f3f6fa]"
    >
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
              <footer className="mt-auto w-full border-t border-[rgba(15,23,42,0.08)] bg-white/66 px-4 py-3 text-xs text-[var(--color-muted-raw)] backdrop-blur-sm sm:px-5 lg:px-6">
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
