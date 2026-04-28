import { getRegistryForUser } from "@/config/db-registry";
import { requireSession } from "@/lib/auth/session";
import { fail, getErrorMessage, ok } from "@/lib/utils/api";

export async function GET() {
  try {
    const session = await requireSession();
    const databases = getRegistryForUser(session.user);

    return ok({ databases });
  } catch (error) {
    return fail(getErrorMessage(error), 401);
  }
}
