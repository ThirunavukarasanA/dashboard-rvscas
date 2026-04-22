import { redirect } from "next/navigation";
import { LoginForm } from "@/components/layout/LoginForm";
import { getSession } from "@/lib/auth/session";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f8fafc_0%,#e8f3ef_100%)] px-4 py-10 text-slate-950 dark:bg-[linear-gradient(180deg,#020617_0%,#07111f_100%)] dark:text-slate-100">
      <LoginForm />
    </main>
  );
}
