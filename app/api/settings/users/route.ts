import { z } from "zod";
import { getAssignableDatabasesForRole } from "@/config/db-registry";
import { requireSuperAdmin } from "@/lib/auth/guards";
import {
  createDashboardUser,
  listDashboardUsers,
  updateDashboardUser,
} from "@/lib/services/dashboard-users";
import { fail, getErrorMessage, ok } from "@/lib/utils/api";

const roleSchema = z.enum(["super_admin", "manager", "viewer"]);

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(120),
  role: roleSchema,
  allowedDatabases: z.array(z.string().min(1)).default([]),
});

const updateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(2).max(80).optional(),
  password: z.string().min(6).max(120).optional().or(z.literal("")),
  role: roleSchema.optional(),
  allowedDatabases: z.array(z.string().min(1)).optional(),
  isActive: z.boolean().optional(),
});

function sanitizeAllowedDatabases(role: z.infer<typeof roleSchema>, allowedDatabases: string[]) {
  if (role === "super_admin") {
    return [];
  }

  const allowed = new Set(getAssignableDatabasesForRole(role).map((entry) => entry.dbName));

  return allowedDatabases.filter((dbName) => allowed.has(dbName));
}

export async function GET() {
  try {
    await requireSuperAdmin();
    const users = await listDashboardUsers();

    return ok({ users });
  } catch (error) {
    return fail(getErrorMessage(error), 403);
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin();
    const parsed = createUserSchema.parse(await request.json());

    await createDashboardUser({
      ...parsed,
      allowedDatabases: sanitizeAllowedDatabases(parsed.role, parsed.allowedDatabases),
    });

    return ok({ success: true });
  } catch (error) {
    return fail(getErrorMessage(error), 400);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireSuperAdmin();
    const parsed = updateUserSchema.parse(await request.json());

    await updateDashboardUser({
      ...parsed,
      password: parsed.password || undefined,
      allowedDatabases: parsed.role
        ? sanitizeAllowedDatabases(parsed.role, parsed.allowedDatabases ?? [])
        : parsed.allowedDatabases,
    });

    return ok({ success: true });
  } catch (error) {
    return fail(getErrorMessage(error), 400);
  }
}
