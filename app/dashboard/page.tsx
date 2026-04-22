import { getRegistryForRole } from "@/config/db-registry";
import { requireSession } from "@/lib/auth/session";

export default async function DashboardPage() {
  const session = await requireSession();
  const databases = getRegistryForRole(session.user.role);
  const collectionCount = databases.reduce((total, database) => total + database.collections.length, 0);

  return (
    <div className="px-5 py-6 lg:px-8">
      <div className="max-w-5xl">
        <h1 className="text-3xl font-semibold text-white">Dashboard overview</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Choose a configured collection from the sidebar to browse records, search safely, and export the current filtered dataset.
        </p>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-md border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-500">Allowed databases</p>
          <p className="mt-3 text-3xl font-semibold text-white">{databases.length}</p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-500">Configured collections</p>
          <p className="mt-3 text-3xl font-semibold text-white">{collectionCount}</p>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm text-slate-500">Access role</p>
          <p className="mt-3 text-2xl font-semibold text-emerald-300">{session.user.role}</p>
        </div>
      </section>

      <section className="mt-8 rounded-md border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-5 py-4">
          <h2 className="text-lg font-semibold text-white">Configured sources</h2>
        </div>
        <div className="divide-y divide-slate-800">
          {databases.map((database) => (
            <div key={database.dbName} className="grid gap-2 px-5 py-4 md:grid-cols-[240px_1fr]">
              <div>
                <p className="font-medium text-white">{database.label}</p>
                <p className="font-mono text-xs text-slate-500">{database.dbName}</p>
              </div>
              <p className="text-sm text-slate-400">
                {database.collections.length > 0
                  ? database.collections.join(", ")
                  : "No collections configured in registry yet."}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
