import type { DatabaseRole } from "@/config/db-registry";
import { assertAllowedCollection, assertAllowedDatabase } from "@/config/db-registry";
import { requireSession } from "@/lib/auth/session";

export async function requireRoleForDatabase(dbName: string) {
  const session = await requireSession();
  assertAllowedDatabase(dbName, session.user.role);

  return session;
}

export async function requireRoleForCollection(dbName: string, collectionName: string) {
  const session = await requireSession();
  assertAllowedCollection(dbName, collectionName, session.user.role);

  return session;
}

export function canExport(role: DatabaseRole) {
  return role === "super_admin" || role === "manager";
}
