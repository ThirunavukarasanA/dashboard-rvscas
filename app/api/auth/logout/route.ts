import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { ok } from "@/lib/utils/api";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });

  return ok({ success: true });
}
