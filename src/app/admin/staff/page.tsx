import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { SectionNav, ADMIN_NAV } from "@/components/SectionNav";
import { StatusBadge } from "@/components/StatusBadge";
import { RoleSelect } from "@/components/RoleSelect";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Staff · Admin" };
export const dynamic = "force-dynamic";

const ROLE_ORDER = ["ADMIN", "RECEPTIONIST", "HOUSEKEEPING"] as const;

const USER_FIELDS = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  createdAt: true,
} as const;

type Search = Promise<{ q?: string }>;

export default async function AdminStaffPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const { q } = await searchParams;
  const session = await getSession();
  const query = q?.trim();

  const [staff, matches] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: [...ROLE_ORDER] } },
      select: USER_FIELDS,
      orderBy: [{ name: "asc" }],
    }),
    query
      ? prisma.user.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          },
          select: USER_FIELDS,
          orderBy: [{ name: "asc" }],
          take: 20,
        })
      : Promise.resolve([]),
  ]);

  const sortedStaff = [...staff].sort(
    (a, b) =>
      ROLE_ORDER.indexOf(a.role as (typeof ROLE_ORDER)[number]) -
      ROLE_ORDER.indexOf(b.role as (typeof ROLE_ORDER)[number])
  );
  const counts = ROLE_ORDER.map((role) => ({
    label: role === "ADMIN" ? "Admins" : role === "RECEPTIONIST" ? "Reception" : "Housekeeping",
    value: staff.filter((u) => u.role === role && u.status === "ACTIVE").length,
  }));
  const suspended = staff.filter((u) => u.status === "SUSPENDED").length;

  function UserRow({ u }: { u: (typeof staff)[number] }) {
    const isSelf = u.id === session?.sub;
    const off = u.status === "SUSPENDED";
    return (
      <tr className={`border-b border-sand-100 align-top last:border-0 ${off ? "bg-sand-50/60" : ""}`}>
        <td className="px-4 py-3">
          <p className={`font-medium ${off ? "text-ink-600" : ""}`}>
            {u.name}
            {isSelf && (
              <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                you
              </span>
            )}
          </p>
          <p className="text-xs text-ink-400">{u.email}</p>
        </td>
        <td className="px-4 py-3 text-ink-600">{u.phone ?? "—"}</td>
        <td className="px-4 py-3">
          <StatusBadge status={u.role} />
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={u.status} />
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-ink-600 [font-variant-numeric:tabular-nums]">
          {formatDate(u.createdAt)}
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap items-start justify-end gap-2">
            <RoleSelect
              userId={u.id}
              role={u.role}
              userName={u.name}
              disabled={isSelf}
              disabledReason={isSelf ? "Ask another admin to change your role" : undefined}
            />
            <Link
              href={`/admin/staff/${u.id}/edit`}
              className="rounded-md border border-sand-300 bg-white px-3 py-1.5 text-sm font-medium text-ink-900 transition-colors hover:border-pine-700 hover:text-pine-800"
            >
              Edit
            </Link>
          </div>
        </td>
      </tr>
    );
  }

  function Table({ rows, empty }: { rows: typeof staff; empty: string }) {
    return (
      <div className="overflow-x-auto rounded-xl border border-sand-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand-200 text-left text-[11px] uppercase tracking-[0.1em] text-ink-400">
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Account</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
              <th className="px-4 py-3 font-semibold text-right">Manage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <UserRow key={u.id} u={u} />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-400">
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
        Admin
      </p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl text-pine-900">Staff</h1>
        <Link
          href="/admin/staff/new"
          className="rounded-md bg-pine-800 px-4 py-2 text-sm font-semibold text-white hover:bg-pine-700"
        >
          Add staff member
        </Link>
      </div>
      <SectionNav items={ADMIN_NAV} active="/admin/staff" />

      <div className="mt-8 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
        {[...counts, { label: "Suspended", value: suspended }].map((c) => (
          <div key={c.label} className="rounded-xl border border-sand-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
              {c.label}
            </p>
            <p className="mt-1 font-display text-2xl text-pine-900 [font-variant-numeric:tabular-nums]">
              {c.value}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl text-pine-900">The team</h2>
        <p className="max-w-3xl text-sm text-ink-600">
          Edit opens the full account — name, sign-in email, phone, role, status
          and a password reset. The dropdown is a shortcut for role alone.
          Changing a role, changing an email or suspending an account signs that
          person out straight away.
        </p>
        <div className="mt-3">
          <Table rows={sortedStaff} empty="No staff accounts yet — add the first one." />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-pine-900">Find any account</h2>
        <p className="text-sm text-ink-600">
          Search every account, guests included — give someone a staff role, or
          open their record to edit it.
        </p>
        <form method="get" className="mt-3 flex max-w-md gap-2">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by name or email…"
            className="w-full rounded-md border border-sand-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pine-700/40"
          />
          <button
            type="submit"
            className="rounded-md bg-pine-800 px-4 py-2 text-sm font-semibold text-white hover:bg-pine-700"
          >
            Search
          </button>
          {query && (
            <Link
              href="/admin/staff"
              className="px-2 py-2 text-sm text-ink-600 hover:text-pine-800"
            >
              Clear
            </Link>
          )}
        </form>
        {query && (
          <div className="mt-3">
            <Table rows={matches} empty={`No accounts match “${query}”.`} />
          </div>
        )}
      </section>
    </div>
  );
}
