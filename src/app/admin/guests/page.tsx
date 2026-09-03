import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { SectionNav, ADMIN_NAV } from "@/components/SectionNav";
import { StatusBadge } from "@/components/StatusBadge";
import { formatMoney, formatDate } from "@/lib/format";
import { todayUtc } from "@/lib/availability";

export const metadata = { title: "Guests · Admin" };
export const dynamic = "force-dynamic";

type Search = Promise<{ q?: string; sort?: string }>;

const SORTS = ["recent", "stays", "spend", "name"] as const;
type Sort = (typeof SORTS)[number];

export default async function AdminGuestsPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() || "";
  const sort: Sort = SORTS.find((s) => s === sp.sort) ?? "recent";
  const today = todayUtc();

  const guests = await prisma.user.findMany({
    where: {
      role: "GUEST",
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      bookings: {
        select: {
          status: true,
          checkInDate: true,
          checkOutDate: true,
          payments: { select: { amount: true, status: true } },
        },
      },
    },
    take: 300,
  });

  const rows = guests
    .map((g) => {
      const stays = g.bookings.filter((b) => b.status !== "CANCELLED");
      const spent = g.bookings
        .flatMap((b) => b.payments)
        .filter((p) => p.status === "PAID")
        .reduce((sum, p) => sum.add(p.amount), new Prisma.Decimal(0));
      const inHouse = g.bookings.find((b) => b.status === "CHECKED_IN");
      const upcoming = g.bookings
        .filter((b) => (b.status === "CONFIRMED" || b.status === "PENDING") && b.checkInDate >= today)
        .sort((a, b) => a.checkInDate.getTime() - b.checkInDate.getTime())[0];
      const lastStay = g.bookings
        .filter((b) => b.status === "CHECKED_OUT" || b.status === "CHECKED_IN")
        .sort((a, b) => b.checkInDate.getTime() - a.checkInDate.getTime())[0];
      const mostRecent = g.bookings
        .map((b) => b.checkInDate.getTime())
        .reduce((m, t) => Math.max(m, t), g.createdAt.getTime());
      return { ...g, stays: stays.length, spent, inHouse, upcoming, lastStay, mostRecent };
    })
    .sort((a, b) => {
      switch (sort) {
        case "stays":
          return b.stays - a.stays || a.name.localeCompare(b.name);
        case "spend":
          return b.spent.comparedTo(a.spent) || a.name.localeCompare(b.name);
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return b.mostRecent - a.mostRecent;
      }
    });

  const totals = {
    guests: rows.length,
    inHouse: rows.filter((r) => r.inHouse).length,
    returning: rows.filter((r) => r.stays >= 2).length,
  };

  const sortLink = (s: Sort, label: string) => (
    <Link
      key={s}
      href={`/admin/guests?${new URLSearchParams({ ...(q ? { q } : {}), sort: s })}`}
      className={`rounded-md px-3 py-1.5 text-sm ${
        sort === s
          ? "bg-pine-800 text-white"
          : "border border-sand-300 bg-white text-ink-900 hover:border-pine-700 hover:text-pine-800"
      }`}
      aria-current={sort === s ? "true" : undefined}
    >
      {label}
    </Link>
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
        Admin
      </p>
      <h1 className="mt-1 font-display text-3xl text-pine-900">Guests</h1>
      <SectionNav items={ADMIN_NAV} active="/admin/guests" />

      <div className="mt-8 grid max-w-lg grid-cols-3 gap-4">
        {[
          { label: "Guest accounts", value: totals.guests },
          { label: "In house now", value: totals.inHouse },
          { label: "Returning", value: totals.returning },
        ].map((t) => (
          <div key={t.label} className="rounded-xl border border-sand-200 bg-white p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
              {t.label}
            </p>
            <p className="mt-1 font-display text-2xl text-pine-900 [font-variant-numeric:tabular-nums]">
              {t.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <form method="get" className="flex max-w-md flex-1 gap-2">
          <input type="hidden" name="sort" value={sort} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name, email or phone…"
            className="w-full rounded-md border border-sand-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pine-700/40"
          />
          <button
            type="submit"
            className="rounded-md bg-pine-800 px-4 py-2 text-sm font-semibold text-white hover:bg-pine-700"
          >
            Search
          </button>
          {q && (
            <Link href={`/admin/guests?sort=${sort}`} className="px-2 py-2 text-sm text-ink-600 hover:text-pine-800">
              Clear
            </Link>
          )}
        </form>
        <div className="flex items-center gap-2" aria-label="Sort guests">
          <span className="text-xs uppercase tracking-[0.1em] text-ink-400">Sort</span>
          {sortLink("recent", "Recent")}
          {sortLink("stays", "Most stays")}
          {sortLink("spend", "Top spend")}
          {sortLink("name", "Name")}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-sand-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand-200 text-left text-[11px] uppercase tracking-[0.1em] text-ink-400">
              <th className="px-4 py-3 font-semibold">Guest</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
              <th className="px-4 py-3 font-semibold text-right">Stays</th>
              <th className="px-4 py-3 font-semibold text-right">Spent</th>
              <th className="px-4 py-3 font-semibold">Now</th>
              <th className="px-4 py-3 font-semibold">Last / next stay</th>
              <th className="px-4 py-3 font-semibold">Member since</th>
              <th className="px-4 py-3 font-semibold text-right"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g) => (
              <tr key={g.id} className="border-b border-sand-100 last:border-0 align-top">
                <td className="px-4 py-3">
                  <p className="font-medium">{g.name}</p>
                  <p className="text-xs text-ink-400">{g.email}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-600">{g.phone ?? "—"}</td>
                <td className="px-4 py-3 text-right [font-variant-numeric:tabular-nums]">{g.stays}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right [font-variant-numeric:tabular-nums]">
                  {formatMoney(g.spent.toString())}
                </td>
                <td className="px-4 py-3">
                  {g.inHouse ? (
                    <StatusBadge status="CHECKED_IN" />
                  ) : g.upcoming ? (
                    <StatusBadge status={g.upcoming.status} />
                  ) : (
                    <span className="text-xs text-ink-400">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-600 [font-variant-numeric:tabular-nums]">
                  {g.upcoming
                    ? `arrives ${formatDate(g.upcoming.checkInDate)}`
                    : g.lastStay
                      ? `${formatDate(g.lastStay.checkInDate)} → ${formatDate(g.lastStay.checkOutDate)}`
                      : "No stays yet"}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-600 [font-variant-numeric:tabular-nums]">
                  {formatDate(g.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  {g.bookings.length > 0 && (
                    <Link
                      href={`/admin/bookings?guestName=${encodeURIComponent(g.name)}`}
                      className="whitespace-nowrap text-sm text-pine-800 underline underline-offset-4 hover:text-pine-700"
                    >
                      Bookings
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <p className="font-display text-lg text-pine-900">No guests found</p>
                  <p className="mt-1 text-sm text-ink-400">
                    {q ? `Nothing matches “${q}”.` : "Guest accounts appear here as people register."}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
