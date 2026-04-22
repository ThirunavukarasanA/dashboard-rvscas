import { getRegistryForRole } from "@/config/db-registry";
import { requireSession } from "@/lib/auth/session";

export default async function DashboardPage() {
  const session = await requireSession();
  const databases = getRegistryForRole(session.user.role);
  const collectionCount = databases.reduce((total, database) => total + database.collections.length, 0);
  const databasesWithCollections = databases.filter((database) => database.collections.length > 0).length;
  const emptyDatabases = databases.length - databasesWithCollections;
  const coveragePercent =
    databases.length > 0 ? Math.round((databasesWithCollections / databases.length) * 100) : 0;
  const topDatabases = [...databases]
    .sort((left, right) => right.collections.length - left.collections.length)
    .slice(0, 7);
  const maxCollections = Math.max(...topDatabases.map((database) => database.collections.length), 1);
  const distributionPoints = topDatabases
    .map((database, index) => {
      const x = topDatabases.length === 1 ? 240 : (index / (topDatabases.length - 1)) * 480;
      const y = 160 - (database.collections.length / maxCollections) * 130;

      return `${x},${y}`;
    })
    .join(" ");
  const donutDegrees = Math.round((coveragePercent / 100) * 360);

  return (
    <div className="animate-fade-up px-5 py-6 lg:px-8">
      <div className="max-w-5xl">
        <p className="font-mono text-sm uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-300">
          Control Center
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950 dark:text-white">
          Dashboard overview
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
          Choose a configured collection from the sidebar to browse records, search safely, and export the current filtered dataset.
        </p>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-md border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/85">
          <p className="text-sm text-slate-500">Allowed databases</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{databases.length}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/85">
          <p className="text-sm text-slate-500">Configured collections</p>
          <p className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">{collectionCount}</p>
        </div>
        <div className="rounded-md border border-emerald-200 bg-emerald-50/85 p-5 shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-md dark:border-emerald-900/70 dark:bg-emerald-950/30">
          <p className="text-sm text-slate-500">Access role</p>
          <p className="mt-3 text-2xl font-semibold text-emerald-700 dark:text-emerald-300">{session.user.role}</p>
        </div>
      </section>

      <section className="mt-8 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-md border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
                Collection volume
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Top databases by configured collection count
              </p>
            </div>
            <p className="font-mono text-sm text-emerald-600 dark:text-emerald-300">
              {collectionCount} total
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {topDatabases.map((database, index) => {
              const percent = Math.max(3, Math.round((database.collections.length / maxCollections) * 100));

              return (
                <div key={database.dbName} className="grid gap-2 sm:grid-cols-[190px_1fr_44px] sm:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                      {database.dbName}
                    </p>
                    <p className="text-xs text-slate-500">{database.label}</p>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="animate-bar-grow h-full rounded-full bg-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.35)]"
                      style={{
                        width: `${percent}%`,
                        animationDelay: `${index * 80}ms`,
                      }}
                    />
                  </div>
                  <p className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {database.collections.length}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-md border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Registry coverage</h2>
            <div className="mt-5 flex items-center gap-5">
              <div
                className="grid h-32 w-32 shrink-0 place-items-center rounded-full shadow-inner"
                style={{
                  background: `conic-gradient(#10b981 0deg ${donutDegrees}deg, rgba(148,163,184,0.24) ${donutDegrees}deg 360deg)`,
                }}
              >
                <div className="grid h-20 w-20 place-items-center rounded-full bg-white text-center shadow-sm dark:bg-slate-950">
                  <span className="font-mono text-2xl font-semibold text-slate-950 dark:text-white">
                    {coveragePercent}%
                  </span>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-500">With collections</p>
                  <p className="text-2xl font-semibold text-slate-950 dark:text-white">
                    {databasesWithCollections}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Empty registry entries</p>
                  <p className="text-2xl font-semibold text-slate-950 dark:text-white">
                    {emptyDatabases}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white/85 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Distribution trend</h2>
            <p className="mt-1 text-sm text-slate-500">Collection spread across the largest sources</p>
            <svg viewBox="0 0 480 170" className="mt-4 h-40 w-full overflow-visible">
              <polyline
                points={distributionPoints}
                fill="none"
                stroke="#10b981"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="5"
                className="drop-shadow-sm"
              />
              {topDatabases.map((database, index) => {
                const x = topDatabases.length === 1 ? 240 : (index / (topDatabases.length - 1)) * 480;
                const y = 160 - (database.collections.length / maxCollections) * 130;

                return (
                  <circle
                    key={database.dbName}
                    cx={x}
                    cy={y}
                    r="6"
                    className="fill-white stroke-emerald-500 dark:fill-slate-950"
                    strokeWidth="4"
                  />
                );
              })}
            </svg>
          </div>
        </div>
      </section>
    </div>
  );
}
