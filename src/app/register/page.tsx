import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getSession } from "@/lib/session";
import { roleHome } from "@/lib/roles";

export const metadata = { title: "Create account" };

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect(roleHome(session.role));
  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
        Join us
      </p>
      <h1 className="mt-1 font-display text-3xl text-pine-900">
        Create your account
      </h1>
      <div className="mt-8 rounded-xl border border-sand-200 bg-white p-6">
        <AuthForm mode="register" />
      </div>
    </div>
  );
}
