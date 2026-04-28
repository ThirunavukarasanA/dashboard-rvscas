import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getRegistryForUser } from "@/config/db-registry";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { getSession } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardShell databases={getRegistryForUser(session.user)} user={session.user}>
      {children}
    </DashboardShell>
  );
}
