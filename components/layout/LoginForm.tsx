"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Login failed");
        return;
      }

      const sessionResponse = await fetch("/api/auth/session", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!sessionResponse.ok) {
        setError("Login succeeded but session was not established. Please try again.");
        return;
      }

      window.location.assign("/dashboard");
    } catch {
      setError("Unable to login right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="animate-fade-up w-full max-w-md rounded-md border border-slate-200 bg-white/90 p-6 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/90"
    >
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-300">
          RVS CAS
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Dashboard login</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Sign in to browse configured databases and export records.
        </p>
      </div>
      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</span>
          <Input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Password</span>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
      </div>
      {error ? (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="mt-6 w-full" disabled={loading}>
        {loading ? "Signing in" : "Sign in"}
      </Button>
    </form>
  );
}
