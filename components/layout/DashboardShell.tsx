import type { ReactNode } from "react";
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
  return (
    <div className="grid min-h-screen bg-slate-950 text-slate-100 lg:grid-cols-[300px_1fr]">
      <div className="hidden lg:block">
        <Sidebar databases={databases} />
      </div>
      <div className="flex min-w-0 flex-col">
        <Topbar user={user} />
        <div className="border-b border-slate-800 lg:hidden">
          <Sidebar databases={databases} />
        </div>
        <main className="flex-1 overflow-x-hidden bg-slate-950">{children}</main>
      </div>
    </div>
  );
}
