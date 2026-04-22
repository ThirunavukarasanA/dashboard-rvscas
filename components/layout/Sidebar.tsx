"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import type { DatabaseRegistryEntry } from "@/config/db-registry";

type SidebarProps = {
  databases: DatabaseRegistryEntry[];
};

export function Sidebar({ databases }: SidebarProps) {
  const pathname = usePathname();
  const activeDbName = useMemo(() => {
    const [, dashboard, dbName] = pathname.split("/");

    if (dashboard !== "dashboard" || !dbName) {
      return null;
    }

    return decodeURIComponent(dbName);
  }, [pathname]);
  const [openDatabases, setOpenDatabases] = useState<Set<string>>(
    () => new Set(activeDbName ? [activeDbName] : [databases[0]?.dbName].filter(Boolean)),
  );

  function toggleDatabase(dbName: string) {
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
    <aside className="flex h-full w-full flex-col border-r border-slate-300 bg-slate-100 text-slate-900">
      <div className="border-b border-slate-300 px-5 py-5">
        <Link href="/dashboard" className="block text-lg font-semibold text-slate-950">
          RVS CAS
        </Link>
        <p className="mt-1 text-xs uppercase tracking-[0.24em] text-emerald-700">
          Data Dashboard
        </p>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        <div className="space-y-0.5">
          {databases.map((database) => (
            <section key={database.dbName} className="select-none">
              <button
                type="button"
                onClick={() => toggleDatabase(database.dbName)}
                className={`grid h-7 w-full grid-cols-[18px_18px_1fr_24px] items-center gap-1 px-2 text-left text-sm transition ${
                  activeDbName === database.dbName
                    ? "bg-slate-300 text-slate-950"
                    : "text-slate-800 hover:bg-slate-200"
                }`}
                aria-expanded={openDatabases.has(database.dbName)}
              >
                <span className="text-xs text-slate-700">
                  {openDatabases.has(database.dbName) ? "▾" : "▸"}
                </span>
                <span aria-hidden="true" className="text-sm text-slate-700">
                  ●
                </span>
                <span className="truncate font-medium">{database.dbName}</span>
                <span className="text-center text-lg leading-none text-slate-600">+</span>
              </button>
              {openDatabases.has(database.dbName) ? (
                <div className="pb-1">
                  {database.collections.length === 0 ? (
                    <div className="grid h-7 grid-cols-[18px_1fr] items-center gap-2 pl-11 pr-2 text-xs text-slate-500">
                      <span aria-hidden="true">○</span>
                      <span className="truncate">No collections configured</span>
                    </div>
                  ) : (
                    database.collections.map((collection) => {
                      const href = `/dashboard/${encodeURIComponent(database.dbName)}/${encodeURIComponent(collection)}`;
                      const active = pathname === href;

                      return (
                        <Link
                          key={collection}
                          href={href}
                          className={`grid h-7 grid-cols-[18px_1fr] items-center gap-2 pl-11 pr-2 text-sm transition ${
                            active
                              ? "bg-emerald-200 text-slate-950"
                              : "text-slate-800 hover:bg-slate-200"
                          }`}
                        >
                          <span aria-hidden="true" className="text-sm text-slate-700">
                            ■
                          </span>
                          <span className="truncate">{collection}</span>
                        </Link>
                      );
                    })
                  )}
                </div>
              ) : null}
            </section>
          ))}
        </div>
      </nav>
    </aside>
  );
}
