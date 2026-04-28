import { redirect } from "next/navigation";
import { getAssignableDatabasesForRole } from "@/config/db-registry";
import { UserManagement } from "@/components/settings/UserManagement";
import { requireSession } from "@/lib/auth/session";

export default async function SettingsPage() {
  const session = await requireSession();

  if (session.user.role !== "super_admin") {
    redirect("/dashboard");
  }

  return (
    <div className="animate-fade-up px-5 py-6 lg:px-8">
      <div className="max-w-5xl">
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-300">
          Super Admin
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">
          Settings
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
          Create dashboard users, set their roles, and decide which databases each user can access.
        </p>
      </div>

      <div className="mt-8">
        <UserManagement databases={getAssignableDatabasesForRole("viewer")} />
      </div>
    </div>
  );
}
