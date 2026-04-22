import type { DatabaseRole } from "@/config/db-registry";
import { assertAllowedCollection } from "@/config/db-registry";
import { getDatabase } from "@/lib/mongodb/getDatabase";

export async function getCollection(
  dbName: string,
  collectionName: string,
  role: DatabaseRole,
) {
  assertAllowedCollection(dbName, collectionName, role);
  const db = await getDatabase(dbName, role);

  return db.collection(collectionName);
}
