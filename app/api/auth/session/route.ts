import { getSession } from "@/lib/auth/session";
import { fail, ok } from "@/lib/utils/api";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return fail("Authentication required", 401);
  }

  return ok({ user: session.user, expiresAt: session.expiresAt });
}
