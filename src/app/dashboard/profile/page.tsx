import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { SectionNav } from "@/components/SectionNav";
import { ProfileForm, PasswordForm } from "@/components/ProfileForms";
import { roleHome } from "@/lib/roles";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard/profile");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { name: true, email: true, phone: true, role: true, createdAt: true },
  });
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
        Your account
      </p>
      <h1 className="mt-1 font-display text-3xl text-pine-900">Profile</h1>
      <p className="mt-2 text-sm text-ink-600">
        {user.role === "GUEST" ? "Guest" : user.role.toLowerCase()} since{" "}
        {formatDate(user.createdAt)}
      </p>

      <SectionNav
        items={[
          user.role === "GUEST"
            ? { href: "/dashboard", label: "My bookings" }
            : { href: roleHome(user.role), label: "Back to dashboard" },
          { href: "/dashboard/profile", label: "Profile" },
        ]}
        active="/dashboard/profile"
      />

      <div className="mt-8 rounded-xl border border-sand-200 bg-white p-6">
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
          Personal details
        </h2>
        <ProfileForm
          initial={{
            name: user.name,
            email: user.email,
            phone: user.phone ?? "",
          }}
        />
      </div>

      <div className="mt-6 rounded-xl border border-sand-200 bg-white p-6">
        <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
          Password
        </h2>
        <PasswordForm />
      </div>
    </div>
  );
}
