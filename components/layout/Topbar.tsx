"use client";

import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/Button";
import type { SessionUser } from "@/lib/auth/session";
import { FaArrowRightFromBracket } from "react-icons/fa6";

export function Topbar({
  user,
  sidebarOpen,
  onToggleSidebar,
  onOpenMobileMenu,
}: {
  user: SessionUser;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenMobileMenu: () => void;
}) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/85 px-4 shadow-sm backdrop-blur-xl transition-colors dark:border-slate-800 dark:bg-slate-950/85 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="grid h-10 w-10 place-items-center rounded-md border border-slate-300 bg-white text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 lg:hidden"
          aria-label="Open sidebar menu"
        >
          <span className="space-y-1.5">
            <span className="block h-0.5 w-5 rounded-full bg-current" />
            <span className="block h-0.5 w-5 rounded-full bg-current" />
            <span className="block h-0.5 w-5 rounded-full bg-current" />
          </span>
        </button>
        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden h-10 w-10 place-items-center rounded-md border border-slate-300 bg-white text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 lg:grid"
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <span className={`text-lg transition-transform ${sidebarOpen ? "rotate-180" : ""}`}>
            <FaArrowRightFromBracket />
          </span>
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
            MongoDB Explorer
          </p>
          <p className="hidden truncate text-xs text-slate-500 sm:block">
            Read-only records and controlled exports
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden text-right md:block">
          <p className="max-w-52 truncate text-sm text-slate-700 dark:text-slate-200">{user.email}</p>
          <p className="text-xs uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
            {user.role}
          </p>
        </div>
        <ThemeToggle />
        <Button type="button" variant="secondary" className="hidden sm:inline-flex" onClick={logout}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
