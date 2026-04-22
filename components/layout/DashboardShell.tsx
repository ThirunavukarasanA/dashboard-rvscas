"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { DatabaseRegistryEntry } from "@/config/db-registry";
import type { SessionUser } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export function DashboardShell({
  children,
  databases,
  user,
}: {
  children: ReactNode;
  databases: DatabaseRegistryEntry[];
  user: SessionUser;
}) {
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div
      className={`grid min-h-screen bg-slate-100 text-slate-950 transition-[grid-template-columns,background-color,color] duration-300 dark:bg-slate-950 dark:text-slate-100 ${
        desktopOpen ? "lg:grid-cols-[310px_1fr]" : "lg:grid-cols-[72px_1fr]"
      }`}
    >
      <div className="hidden h-screen overflow-hidden lg:sticky lg:top-0 lg:block">
        <Sidebar
          databases={databases}
          collapsed={!desktopOpen}
          onToggleCollapse={() => setDesktopOpen((current) => !current)}
        />
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close menu overlay"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="animate-slide-down absolute inset-y-0 left-0 w-[86vw] max-w-[330px] shadow-2xl">
            <Sidebar
              databases={databases}
              onNavigate={() => setMobileOpen(false)}
              onToggleCollapse={() => setMobileOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col">
        <Topbar
          user={user}
          sidebarOpen={desktopOpen}
          onToggleSidebar={() => setDesktopOpen((current) => !current)}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />
        <main className="relative flex-1 overflow-x-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#eef4f8_45%,#e5edf3_100%)] transition-colors duration-300 dark:bg-[linear-gradient(180deg,#020617_0%,#07111f_52%,#020617_100%)]">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:48px_48px] opacity-70 dark:bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)]" />
          <div className="relative">{children}</div>
        </main>
      </div>
    </div>
  );
}
