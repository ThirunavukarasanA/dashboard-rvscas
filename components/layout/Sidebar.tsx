"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import type { DatabaseRegistryEntry } from "@/config/db-registry";
import { IoIosArrowForward } from "react-icons/io";
import Image from "next/image";

type SidebarProps = {
  databases: DatabaseRegistryEntry[];
  showSettings?: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
};

export function Sidebar({
  databases,
  showSettings = false,
  collapsed = false,
  onNavigate,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const activeDbName = useMemo(() => {
    const [, dashboard, dbName] = pathname.split("/");

    if (dashboard !== "dashboard" || !dbName) {
      return null;
    }

    return decodeURIComponent(dbName);
  }, [pathname]);
  const [openDatabases, setOpenDatabases] = useState<Set<string>>(
    () =>
      new Set(
        activeDbName ? [activeDbName] : [databases[0]?.dbName].filter(Boolean),
      ),
  );

  function toggleDatabase(dbName: string) {
    if (collapsed) {
      onToggleCollapse?.();
      setOpenDatabases((current) => new Set(current).add(dbName));
      return;
    }

    setOpenDatabases((current) => {
      const next = new Set(current);

      if (next.has(dbName)) {
        next.delete(dbName);
      } else {
        next.add(dbName);
      }

      return next;
    });
  }

  return (
    <aside
      className={`flex h-full min-h-0 w-full flex-col border-r border-slate-200 bg-white/90 text-slate-900 shadow-sm backdrop-blur-xl transition-colors duration-300 dark:border-slate-800 dark:bg-slate-950/90 dark:text-slate-100 ${
        collapsed ? "items-center" : ""
      }`}
    >
      <div
        className={`w-full border-b border-slate-200 dark:border-slate-800 ${collapsed ? "px-3 py-4" : "px-5 py-5"}`}
      >
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className={`group flex items-center gap-3 text-lg font-semibold text-slate-950 dark:text-white ${
            collapsed ? "justify-center" : ""
          }`}
          title="RVS CAS"
        >
          {/* <div className="grid shrink-0 place-items-center rounded-md bg-slate-950 text-sm font-bold text-white shadow-md transition group-hover:-translate-y-0.5 dark:bg-emerald-400 dark:text-slate-950"> */}
            <Image
              src="/images/logo.jpg"
              alt="RVS CAS Logo"
              width={54}
              height={54}
              className="rounded-md object-cover"
            />
          {/* </div> */}
          {/* <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-950 text-sm font-bold text-white shadow-md transition group-hover:-translate-y-0.5 dark:bg-emerald-400 dark:text-slate-950">
            RV
          </span> */}
          {!collapsed ? <span>RVS CAS</span> : null}
        </Link>
        {!collapsed ? (
          <>
            <p className="mt-3 text-xs uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">
              Data Dashboard
            </p>
            <div className="mt-4 h-1 rounded-full bg-slate-200 dark:bg-slate-800">
              <div className="h-full w-2/3 rounded-full bg-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.45)]" />
            </div>
          </>
        ) : null}
      </div>

      <nav className="rvscas-sidebar-scroll min-h-0 w-full flex-1 overflow-y-auto py-2">
        <div className="space-y-0.5">
          {showSettings ? (
            <Link
              href="/dashboard/settings"
              onClick={onNavigate}
              className={`grid h-8 w-full items-center text-left text-sm transition ${
                collapsed
                  ? "grid-cols-1 justify-items-center px-0"
                  : "grid-cols-[18px_18px_1fr] gap-1 px-3"
              } ${
                pathname === "/dashboard/settings"
                  ? "bg-emerald-200 text-slate-950 shadow-inner dark:bg-slate-800 dark:text-white"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
              }`}
              title="Settings"
            >
              {!collapsed ? (
                <span className="text-xs text-slate-500 dark:text-slate-400">+</span>
              ) : null}
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-sm bg-emerald-500 shadow-sm"
              />
              {!collapsed ? <span className="truncate font-medium">Settings</span> : null}
            </Link>
          ) : null}
          {databases.map((database) => {
            const open = openDatabases.has(database.dbName);
            const activeDatabase = activeDbName === database.dbName;

            return (
              <section key={database.dbName} className="select-none">
                <button
                  type="button"
                  onClick={() => toggleDatabase(database.dbName)}
                  className={`grid h-8 w-full items-center text-left text-sm transition ${
                    collapsed
                      ? "grid-cols-1 justify-items-center px-0"
                      : "grid-cols-[18px_18px_1fr_24px] gap-1 px-3"
                  } ${
                    activeDatabase
                      ? "bg-emerald-100 text-slate-950 shadow-inner dark:bg-slate-800 dark:text-white"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
                  }`}
                  aria-expanded={open}
                  title={database.dbName}
                >
                  {!collapsed ? (
                    <span
                      className={`text-xs text-slate-500 transition-transform dark:text-slate-400 ${
                        open ? "rotate-90" : ""
                      }`}
                    >
                      <IoIosArrowForward />
                    </span>
                  ) : null}
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full bg-slate-500 shadow-sm dark:bg-slate-400"
                  />
                  {!collapsed ? (
                    <>
                      <span className="truncate font-medium">
                        {database.dbName}
                      </span>
                      <span className="text-center text-base leading-none text-slate-500 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-300">
                        +
                      </span>
                    </>
                  ) : null}
                </button>

                {open && !collapsed ? (
                  <div className="animate-slide-down pb-1">
                    {database.collections.length === 0 ? (
                      <div className="grid h-7 grid-cols-[18px_1fr] items-center gap-2 pl-12 pr-3 text-xs text-slate-500">
                        <span
                          aria-hidden="true"
                          className="h-2 w-2 rounded-full border border-slate-400 dark:border-slate-600"
                        />
                        <span className="truncate">
                          No collections configured
                        </span>
                      </div>
                    ) : (
                      database.collections.map((collection) => {
                        const href = `/dashboard/${encodeURIComponent(database.dbName)}/${encodeURIComponent(collection)}`;
                        const active = pathname === href;

                        return (
                          <Link
                            key={collection}
                            href={href}
                            onClick={onNavigate}
                            className={`grid h-8 grid-cols-[18px_1fr] items-center gap-2 pl-12 pr-3 text-sm transition ${
                              active
                                ? "bg-emerald-300 text-slate-950 shadow-sm dark:bg-emerald-400"
                                : "text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
                            }`}
                          >
                            <span
                              aria-hidden="true"
                              className={`h-2.5 w-2.5 rounded-sm ${
                                active
                                  ? "bg-slate-950"
                                  : "bg-slate-500 dark:bg-slate-500"
                              }`}
                            />
                            <span className="truncate">{collection}</span>
                          </Link>
                        );
                      })
                    )}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
