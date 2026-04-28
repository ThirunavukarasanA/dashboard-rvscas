import { assertAllowedDatabase } from "@/config/db-registry";
import { requireSession } from "@/lib/auth/session";
import { fail, getErrorMessage, ok } from "@/lib/utils/api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ dbName: string }> },
) {
  try {
    const session = await requireSession();
    const { dbName } = await context.params;
    const database = assertAllowedDatabase(
      decodeURIComponent(dbName),
      session.user.role,
      session.user.allowedDatabases,
    );

    return ok({ collections: database.collections });
  } catch (error) {
    return fail(getErrorMessage(error), 403);
  }
}
