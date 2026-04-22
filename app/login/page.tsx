import { redirect } from "next/navigation";
import { LoginForm } from "@/components/layout/LoginForm";
import { getSession } from "@/lib/auth/session";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <LoginForm />
    </main>
  );
}
