import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { SectionNav, ADMIN_NAV } from "@/components/SectionNav";
import { StaffForm } from "@/components/StaffForm";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/format";
import { ROLE_LABEL } from "@/lib/users";

export const metadata = { title: "Edit account · Admin" };
// No `force-dynamic` here: reading the session cookie already makes this
// page dynamic, and forcing it streams the loading shell first, which
// commits a 200 before notFound() can set the 404 status.

type Props = { params: Promise<{ id: string }> };

export default async function EditStaffPage({ params }: Props) {
  const { id } = await params;
  const [session, user] = await Promise.all([
    getSession(),
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        _count: { select: { bookings: true, housekeepingTasks: true } },
      },
    }),
  ]);
  if (!user) notFound();

  const selfEdit = user.id === session?.sub;

  const facts = [
    { label: "Current role", value: ROLE_LABEL[user.role] ?? user.role },
    { label: "Joined", value: formatDate(user.createdAt) },
    { label: "Bookings", value: String(user._count.bookings) },
    { label: "Housekeeping tasks", value: String(user._count.housekeepingTasks) },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
        Admin ·{" "}
        <Link href="/admin/staff" className="underline underline-offset-4 hover:text-pine-800">
          Staff
        </Link>
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl text-pine-900">{user.name}</h1>
        <StatusBadge status={user.status} />
        {selfEdit && (
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
            your account
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-ink-600">{user.email}</p>
      <SectionNav items={ADMIN_NAV} active="/admin/staff" />

      <section
        className="mt-8 grid grid-cols-2 divide-sand-200 rounded-xl border border-sand-200 bg-white sm:grid-cols-4 sm:divide-x"
        aria-label="Account summary"
      >
        {facts.map((f) => (
          <div key={f.label} className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
              {f.label}
            </p>
            <p className="mt-1 text-sm font-medium text-ink-900 [font-variant-numeric:tabular-nums]">
              {f.value}
            </p>
          </div>
        ))}
      </section>

      {user.status === "SUSPENDED" && (
        <p className="mt-4 rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          This account is suspended. They cannot sign in until you set the status
          back to Active.
        </p>
      )}

      <div className="mt-6 rounded-xl border border-sand-200 bg-white p-6">
        <StaffForm
          userId={user.id}
          selfEdit={selfEdit}
          initial={{
            name: user.name,
            email: user.email,
            phone: user.phone ?? "",
            role: user.role,
            status: user.status,
          }}
        />
      </div>

      <p className="mt-4 text-xs text-ink-400">
        Accounts are never deleted — bookings and housekeeping history are kept
        against them. Suspend an account, or set its role to Guest, to take away
        staff access.
      </p>
    </div>
  );
}
