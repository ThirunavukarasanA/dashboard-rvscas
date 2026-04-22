import { cookies } from "next/headers";
import { z } from "zod";
import { audit } from "@/lib/services/audit";
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
  validateCredentials,
} from "@/lib/auth/session";
import { fail, ok } from "@/lib/utils/api";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return fail("Enter a valid email and password", 422);
  }

  const user = await validateCredentials(parsed.data.email, parsed.data.password);

  if (!user) {
    return fail("Invalid credentials", 401);
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(user), sessionCookieOptions());
  audit({ action: "login", user });

  return ok({ user });
}
