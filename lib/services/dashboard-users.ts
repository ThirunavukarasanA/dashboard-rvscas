import "server-only";

import bcrypt from "bcryptjs";
import type { DatabaseRole } from "@/config/db-registry";
import { getMongoClient } from "@/lib/mongodb/client";

export const DASHBOARD_USERS_COLLECTION = "dashboard_users";

export type DashboardUserRecord = {
  name: string;
  email: string;
  passwordHash: string;
  role: DatabaseRole;
  allowedDatabases: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function getDashboardUsersCollection() {
  const client = await getMongoClient();

  return client.db("admin").collection<DashboardUserRecord>(DASHBOARD_USERS_COLLECTION);
}

export async function findDashboardUserByEmail(email: string) {
  const collection = await getDashboardUsersCollection();

  return collection.findOne({ email: normalizeEmail(email) });
}

export async function listDashboardUsers() {
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
