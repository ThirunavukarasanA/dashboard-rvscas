import { getRegistryForRole } from "@/config/db-registry";
import { requireSession } from "@/lib/auth/session";
import { fail, getErrorMessage, ok } from "@/lib/utils/api";

export async function GET() {
  try {
    const session = await requireSession();
    const databases = getRegistryForRole(session.user.role);

    return ok({ databases });
  } catch (error) {
    return fail(getErrorMessage(error), 401);
  }
}
