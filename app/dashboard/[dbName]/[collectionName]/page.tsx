import { notFound } from "next/navigation";
import { assertAllowedCollection } from "@/config/db-registry";
import { CollectionExplorer } from "@/components/tables/CollectionExplorer";
import { requireSession } from "@/lib/auth/session";
import { titleFromSlug } from "@/lib/utils/format";

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ dbName: string; collectionName: string }>;
}) {
  const session = await requireSession();
  const { dbName, collectionName } = await params;
  const decodedDbName = decodeURIComponent(dbName);
  const decodedCollectionName = decodeURIComponent(collectionName);

  try {
    assertAllowedCollection(decodedDbName, decodedCollectionName, session.user.role);
  } catch {
    notFound();
  }

  return (
    <div className="animate-fade-up px-5 py-6 lg:px-8">
      <div className="mb-6">
        <p className="font-mono text-sm text-emerald-600 dark:text-emerald-300">{decodedDbName}</p>
        <h1 className="mt-1 text-3xl font-semibold text-slate-950 dark:text-white">
          {titleFromSlug(decodedCollectionName)}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">
          Browse this collection with server-side pagination, safe keyword search, exact field filtering, and controlled exports.
        </p>
      </div>
      <CollectionExplorer dbName={decodedDbName} collectionName={decodedCollectionName} />
    </div>
  );
}
