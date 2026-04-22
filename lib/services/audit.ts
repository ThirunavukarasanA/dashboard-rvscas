import type { SessionUser } from "@/lib/auth/session";

type AuditEvent = {
  action: "login" | "export";
  user?: SessionUser;
  target?: string;
  metadata?: Record<string, unknown>;
};

export function audit(event: AuditEvent) {
  console.info(
    JSON.stringify({
      ...event,
      at: new Date().toISOString(),
      app: "dashboard-rvscas",
    }),
  );
}
