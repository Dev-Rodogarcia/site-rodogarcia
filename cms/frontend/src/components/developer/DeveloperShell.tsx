"use client";

import { useEffect, useState } from "react";
import DevSidebar from "./DevSidebar";
import DevTopbar from "./DevTopbar";
import { DeveloperPageHeaderProvider } from "./DeveloperPageHeaderContext";
import { api, external, normalizeCmsPathname } from "@/lib/routes";
import { useSession } from "@/hooks/useSession";
import { useApiRequest } from "@/hooks/useApiRequest";
import { usePathname } from "next/navigation";
import { permissionForAdminPath } from "@/lib/cmsAccess";

const SIDEBAR_STORAGE_KEY = "developer.sidebar.expanded";

export default function DeveloperShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [darkTheme, setDarkTheme] = useState(false);
  const { session, loading: sessionLoading } = useSession();
  const { apiRequest } = useApiRequest();
  const pathname = usePathname();
  const requiredPermission = permissionForAdminPath(normalizeCmsPathname(pathname));
  const accessDenied = Boolean(requiredPermission && session?.authenticated && !session.user?.cmsPermissions?.includes(requiredPermission));

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

  useEffect(() => {
    if (sessionLoading) return;
    const enabled = session?.authenticated === true && session.user?.cmsTheme === "dark";
    setDarkTheme(enabled);
    document.documentElement.dataset.cmsTheme = enabled ? "dark" : "light";
  }, [session?.authenticated, session?.user?.cmsTheme, sessionLoading]);

  function toggleTheme() {
    const nextTheme = darkTheme ? "light" : "dark";
    setDarkTheme(nextTheme === "dark");
    document.documentElement.dataset.cmsTheme = nextTheme;
    void apiRequest(api.auth.cmsTheme, {
      method: "PATCH",
      body: JSON.stringify({ theme: nextTheme }),
    });
  }

  return (
    <div
      data-admin-shell="true"
      data-admin-theme={darkTheme ? "dark" : "light"}
      className={`relative h-dvh overflow-hidden bg-[#f3f6fa] transition-colors duration-300 ${darkTheme ? "cms-dark" : ""}`}
    >
      <div className="relative flex h-full min-w-0">
        <DevSidebar
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          expanded={sidebarExpanded}
          onToggleExpanded={() => setSidebarExpanded((current) => !current)}
        />

        <DeveloperPageHeaderProvider>
          <div data-admin-theme-content="true" className="relative isolate flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            {darkTheme ? <div aria-hidden="true" className="cms-dark-background" /> : null}
            <div
              data-admin-scroll
              className="relative z-10 min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
            >
              <div className="flex min-h-full flex-col">
                <DevTopbar onOpenNavigation={() => setMobileOpen(true)} darkTheme={darkTheme} onToggleTheme={toggleTheme} />
                <div className="flex-1">{accessDenied ? <div className="mx-auto max-w-xl px-6 py-20 text-center"><h1 className="text-2xl font-bold text-[var(--foreground)]">Acesso não permitido</h1><p className="mt-3 text-sm text-[var(--color-muted-raw)]">Sua conta não tem permissão para esta área.</p></div> : children}</div>
                <footer className="mt-auto w-full border-t border-[rgba(15,23,42,0.08)] bg-white/66 px-4 py-3 text-xs text-[var(--color-muted-raw)] backdrop-blur-sm sm:px-5 lg:px-6">
                  <a
                    href={external.developerProfile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold tracking-[-0.02em] text-[var(--foreground)] transition-colors hover:text-[var(--primary)]"
                  >
                    Feito por Lucas
                  </a>
                  {" \u00B7 "}
                  <span>Painel interno Rodogarcia</span>
                </footer>
              </div>
            </div>
          </div>
        </DeveloperPageHeaderProvider>
      </div>
    </div>
  );
}
