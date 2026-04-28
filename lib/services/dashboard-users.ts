import "server-only";

import bcrypt from "bcryptjs";
import type { DatabaseRole } from "@/config/db-registry";
import { getMongoClient } from "@/lib/mongodb/client";

export const DASHBOARD_USERS_COLLECTION = "dashboard_users";
export const DASHBOARD_USERS_DB =
  process.env.DASHBOARD_AUTH_DB?.trim() || "RVS-DASHBOARD";

export type DashboardUserRecord = {
  name: string;
  email: string;
  passwordHash: string;
  role: DatabaseRole;
  allowedDatabases: string[];
  isActive: boolean;
  isSystem?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function getDashboardUsersCollection() {
  const client = await getMongoClient();

  return client
    .db(DASHBOARD_USERS_DB)
    .collection<DashboardUserRecord>(DASHBOARD_USERS_COLLECTION);
}

export async function ensureDefaultSuperAdminUser() {
  const adminEmail = (process.env.ADMIN_DEFAULT_EMAIL ?? "admin@example.com")
    .trim()
    .toLowerCase();
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD ?? "change_this";
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  const collection = await getDashboardUsersCollection();
  const existing = await collection.findOne({ email: adminEmail });

  if (existing) {
    return existing;
  }

  const now = new Date();
  const passwordHash = adminPasswordHash || (await bcrypt.hash(adminPassword, 10));

  await collection.insertOne({
    name: "Super Admin",
    email: adminEmail,
    passwordHash,
    role: "super_admin",
    allowedDatabases: [],
    isActive: true,
    isSystem: true,
    createdAt: now,
    updatedAt: now,
  });

  return collection.findOne({ email: adminEmail });
}

export async function findDashboardUserByEmail(email: string) {
  await ensureDefaultSuperAdminUser();
  const collection = await getDashboardUsersCollection();

  return collection.findOne({ email: normalizeEmail(email) });
}

export async function listDashboardUsers() {
  await ensureDefaultSuperAdminUser();
  const collection = await getDashboardUsersCollection();
  const users = await collection.find({}).sort({ createdAt: -1 }).toArray();

  return users.map((user) => {
    const { passwordHash, ...result } = user;
    void passwordHash;

    return result;
  });
}

export async function createDashboardUser(input: {
  name: string;
  email: string;
  password: string;
  role: DatabaseRole;
  allowedDatabases: string[];
}) {
  const collection = await getDashboardUsersCollection();
  const email = normalizeEmail(input.email);
  const existing = await collection.findOne({ email });

  if (existing) {
    throw new Error("A user with this email already exists");
  }

  const now = new Date();
  const passwordHash = await bcrypt.hash(input.password, 10);

  await collection.insertOne({
    name: input.name.trim(),
    email,
    passwordHash,
    role: input.role,
    allowedDatabases: input.role === "super_admin" ? [] : input.allowedDatabases,
    isActive: true,
    isSystem: false,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateDashboardUser(input: {
  email: string;
  name?: string;
  role?: DatabaseRole;
  allowedDatabases?: string[];
  isActive?: boolean;
  password?: string;
}) {
  const collection = await getDashboardUsersCollection();
  const email = normalizeEmail(input.email);
  const existing = await collection.findOne({ email });

  if (!existing) {
    throw new Error("User not found");
  }

  const envAdminEmail = (process.env.ADMIN_DEFAULT_EMAIL ?? "admin@example.com")
    .trim()
    .toLowerCase();

  if (
    existing.email === envAdminEmail &&
    ((input.role && input.role !== "super_admin") || input.isActive === false)
  ) {
    throw new Error("Default super admin must remain active with super admin access");
  }

  const update: Partial<DashboardUserRecord> = {
    updatedAt: new Date(),
  };

  if (typeof input.name === "string") {
    update.name = input.name.trim();
  }

  if (input.role) {
    update.role = input.role;
    update.allowedDatabases = input.role === "super_admin" ? [] : (input.allowedDatabases ?? existing.allowedDatabases);
  } else if (input.allowedDatabases) {
    update.allowedDatabases = input.allowedDatabases;
  }

  if (typeof input.isActive === "boolean") {
    update.isActive = input.isActive;
  }

  if (input.password) {
    update.passwordHash = await bcrypt.hash(input.password, 10);
  }

  await collection.updateOne({ email }, { $set: update });
}
