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
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
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
          select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
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
    role,
    count: staff.filter((u) => u.role === role).length,
  }));

  function UserRow({ u }: { u: (typeof staff)[number] }) {
    const isSelf = u.id === session?.sub;
    return (
      <tr className="border-b border-sand-100 last:border-0 align-top">
        <td className="px-4 py-3">
          <p className="font-medium">
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
        <td className="whitespace-nowrap px-4 py-3 text-ink-600 [font-variant-numeric:tabular-nums]">
          {formatDate(u.createdAt)}
        </td>
        <td className="px-4 py-3">
          <div className="flex justify-end">
            <RoleSelect
              userId={u.id}
              role={u.role}
              userName={u.name}
              disabled={isSelf}
              disabledReason={isSelf ? "Ask another admin to change your role" : undefined}
            />
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
              <th className="px-4 py-3 font-semibold">Joined</th>
              <th className="px-4 py-3 font-semibold text-right">Change role</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <UserRow key={u.id} u={u} />
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-400">
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

      <div className="mt-8 grid max-w-lg grid-cols-3 gap-4">
        {counts.map((c) => (
          <div key={c.role} className="rounded-xl border border-sand-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
              {c.role === "ADMIN"
                ? "Admins"
                : c.role === "RECEPTIONIST"
                  ? "Reception"
                  : "Housekeeping"}
            </p>
            <p className="mt-1 font-display text-2xl text-pine-900 [font-variant-numeric:tabular-nums]">
              {c.count}
            </p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl text-pine-900">The team</h2>
        <p className="text-sm text-ink-600">
          Change a role from the dropdown. Setting it to Guest removes someone
          from staff without deleting their account. People see their new
          dashboard after they sign in again.
        </p>
        <div className="mt-3">
          <Table rows={sortedStaff} empty="No staff accounts yet — add the first one." />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-pine-900">Promote an existing account</h2>
        <p className="text-sm text-ink-600">
          Someone already registered as a guest? Find them by name or email and
          give them a staff role.
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
