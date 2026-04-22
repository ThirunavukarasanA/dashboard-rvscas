"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { SessionUser } from "@/lib/auth/session";

export function Topbar({ user }: { user: SessionUser }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/95 px-5">
      <div>
        <p className="text-sm font-medium text-white">MongoDB Explorer</p>
        <p className="text-xs text-slate-500">Read-only records and controlled exports</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm text-slate-200">{user.email}</p>
          <p className="text-xs uppercase tracking-wide text-emerald-300">{user.role}</p>
        </div>
        <Button type="button" variant="secondary" onClick={logout}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
