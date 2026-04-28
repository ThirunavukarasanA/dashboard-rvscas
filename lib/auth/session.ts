import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import type { DatabaseRole } from "@/config/db-registry";

export const SESSION_COOKIE = "rvscas_session";

export type SessionUser = {
  email: string;
  name: string;
  role: DatabaseRole;
  allowedDatabases?: string[] | null;
};

export type Session = {
  user: SessionUser;
  expiresAt: number;
};

const encoder = new TextEncoder();

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret || secret === "your_secret") {
    return "dashboard-rvscas-development-secret";
  }

  return secret;
}

function base64Url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function signPayload(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = encoder.encode(left);
  const rightBuffer = encoder.encode(right);

  if (leftBuffer.byteLength !== rightBuffer.byteLength) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function createSessionToken(user: SessionUser) {
  const session: Session = {
    user,
    expiresAt: Date.now() + 1000 * 60 * 60 * 8,
  };
  const payload = base64Url(JSON.stringify(session));
  const signature = signPayload(payload);

  return `${payload}.${signature}`;
}

export function readSessionToken(token?: string | null): Session | null {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature || !constantTimeEqual(signature, signPayload(payload))) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;

    if (!session.expiresAt || session.expiresAt < Date.now()) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();

  return readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    throw new Error("Authentication required");
  }

  return session;
}

export async function validateCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD ?? "change_this";
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

  if (normalizedEmail === adminEmail.trim().toLowerCase()) {
    const isValid = adminPasswordHash
      ? await bcrypt.compare(password, adminPasswordHash)
      : constantTimeEqual(password, adminPassword);

    if (!isValid) {
      return null;
    }

    return {
      email: adminEmail,
      name: "Admin",
      role: "super_admin" as const,
      allowedDatabases: null,
    };
  }

  const { findDashboardUserByEmail } = await import("@/lib/services/dashboard-users");
  const dashboardUser = await findDashboardUserByEmail(normalizedEmail);

  if (!dashboardUser || !dashboardUser.isActive) {
    return null;
  }

  const isValid = await bcrypt.compare(password, dashboardUser.passwordHash);

  if (!isValid) {
    return null;
  }

  return {
    email: dashboardUser.email,
    name: dashboardUser.name,
    role: dashboardUser.role,
    allowedDatabases: dashboardUser.role === "super_admin" ? null : dashboardUser.allowedDatabases,
  };
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  };
}
