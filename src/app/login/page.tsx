import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { getVerifiedSession } from "@/lib/session";
import { roleHome } from "@/lib/roles";

export const metadata = { title: "Sign in" };

type Search = Promise<{ reason?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const { reason } = await searchParams;
  const { session, revoked } = await getVerifiedSession();
  if (session) redirect(roleHome(session.role));

  // A token that no longer matches the account (role changed, account
  // removed) lands here; the next successful sign-in overwrites it.
  const showRevoked = revoked || reason === "session";

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
        Welcome back
      </p>
      <h1 className="mt-1 font-display text-3xl text-pine-900">Sign in</h1>
      {showRevoked && (
        <p className="mt-4 rounded-md border border-marigold-100 bg-marigold-50 px-4 py-3 text-sm text-marigold-600">
          Your account access has changed, so you were signed out. Sign in
          again to continue.
        </p>
      )}
      <div className="mt-8 rounded-xl border border-sand-200 bg-white p-6">
        <AuthForm mode="login" />
      </div>
      <p className="mt-4 text-center text-xs text-ink-400">
        Demo accounts: admin@grandtulip.com · reception@grandtulip.com ·
        housekeeping@grandtulip.com · guest@example.com — all use{" "}
        <span className="font-mono">password123</span>
      </p>
    </div>
  );
}
