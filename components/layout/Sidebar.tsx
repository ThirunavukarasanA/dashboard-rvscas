"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DatabaseRegistryEntry } from "@/config/db-registry";

type SidebarProps = {
  databases: DatabaseRegistryEntry[];
};

export function Sidebar({ databases }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-full flex-col border-r border-slate-800 bg-slate-950">
      <div className="border-b border-slate-800 px-5 py-5">
        <Link href="/dashboard" className="block text-lg font-semibold text-white">
          RVS CAS
        </Link>
        <p className="mt-1 text-xs uppercase tracking-[0.24em] text-emerald-300">
          Data Dashboard
        </p>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-3">
          {databases.map((database) => (
            <section key={database.dbName}>
              <div className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {database.label}
              </div>
              <div className="mt-1 space-y-1">
                {database.collections.length === 0 ? (
                  <div className="px-2 py-1.5 text-xs text-slate-600">No collections configured</div>
                ) : (
                  database.collections.map((collection) => {
                    const href = `/dashboard/${encodeURIComponent(database.dbName)}/${encodeURIComponent(collection)}`;
                    const active = pathname === href;

                    return (
                      <Link
                        key={collection}
                        href={href}
                        className={`block rounded-md px-2 py-2 text-sm transition ${
                          active
                            ? "bg-emerald-500 text-slate-950"
                            : "text-slate-300 hover:bg-slate-900 hover:text-white"
                        }`}
                      >
                        {collection}
                      </Link>
                    );
                  })
                )}
              </div>
            </section>
          ))}
        </div>
      </nav>
    </aside>
  );
}
