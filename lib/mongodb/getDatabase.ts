import type { DatabaseRole } from "@/config/db-registry";
import { assertAllowedDatabase } from "@/config/db-registry";
import { getMongoClient } from "@/lib/mongodb/client";

export async function getDatabase(dbName: string, role: DatabaseRole) {
  assertAllowedDatabase(dbName, role);
  const client = await getMongoClient();

  return client.db(dbName);
}
