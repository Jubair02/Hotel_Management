import Link from "next/link";
import { prisma } from "@/lib/db";
import { SectionNav, ADMIN_NAV } from "@/components/SectionNav";
import { StatusBadge } from "@/components/StatusBadge";
import { KeyTag } from "@/components/KeyTag";
import { formatMoney, formatDate } from "@/lib/format";
import { todayUtc } from "@/lib/availability";

export const metadata = { title: "Admin" };
export const dynamic = "force-dynamic";

const ROOM_STATUS_ORDER = [
  "OCCUPIED",
  "AVAILABLE",
  "RESERVED",
  "CLEANING",
  "MAINTENANCE",
] as const;

const ROOM_STATUS_STYLE: Record<
  (typeof ROOM_STATUS_ORDER)[number],
  { bar: string; dot: string; label: string }
> = {
  OCCUPIED: { bar: "bg-sky-600", dot: "bg-sky-600", label: "Occupied" },
  AVAILABLE: { bar: "bg-pine-600", dot: "bg-pine-600", label: "Available" },
  RESERVED: { bar: "bg-marigold-400", dot: "bg-marigold-400", label: "Reserved" },
  CLEANING: { bar: "bg-marigold-500", dot: "bg-marigold-500", label: "Cleaning" },
  MAINTENANCE: { bar: "bg-red-400", dot: "bg-red-400", label: "Maintenance" },
};

export default async function AdminDashboard() {
  const today = todayUtc();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const monthStart = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)
  );

  const [
    rooms,
    arrivalsToday,
    departuresToday,
    pendingCount,
    currentGuests,
    todaysPayments,
    monthPayments,
    recentBookings,
    needsAttention,
  ] = await Promise.all([
    prisma.room.findMany({ select: { status: true } }),
    prisma.booking.count({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        checkInDate: { gte: today, lt: tomorrow },
      },
    }),
    prisma.booking.count({
      where: { status: "CHECKED_IN", checkOutDate: { gte: today, lt: tomorrow } },
    }),
    prisma.booking.count({ where: { status: "PENDING" } }),
    prisma.booking.aggregate({
      where: { status: "CHECKED_IN" },
      _sum: { numberOfGuests: true },
    }),
    prisma.payment.aggregate({
      where: { status: "PAID", paidAt: { gte: today, lt: tomorrow } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: { status: "PAID", paidAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
    prisma.booking.findMany({
      include: {
        room: { select: { roomNumber: true } },
        payments: { select: { status: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 7,
    }),
    // Bookings holding a room without settled payment — the admin's queue.
    prisma.booking.findMany({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        payments: { none: { status: "PAID" } },
      },
      include: { room: { select: { roomNumber: true } } },
      orderBy: { checkInDate: "asc" },
      take: 5,
    }),
  ]);

  const totalRooms = rooms.length;
  const byStatus = ROOM_STATUS_ORDER.map((status) => ({
    status,
    count: rooms.filter((r) => r.status === status).length,
  })).filter((s) => s.count > 0);
  const occupied = rooms.filter((r) => r.status === "OCCUPIED").length;
  const occupancy = totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0;

  const stats = [
    { label: "Arrivals today", value: arrivalsToday, hint: "due at the desk" },
    { label: "Departures today", value: departuresToday, hint: "check-outs due" },
    {
      label: "Guests in house",
      value: currentGuests._sum.numberOfGuests ?? 0,
      hint: "staying tonight",
    },
    { label: "Awaiting confirmation", value: pendingCount, hint: "pending bookings" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
            Admin · {formatDate(today)}
          </p>
          <h1 className="mt-1 font-display text-3xl text-pine-900 text-balance">
            The house at a glance
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/rooms/new"
            className="rounded-md border border-sand-300 bg-white px-4 py-2 text-sm font-medium text-ink-900 transition-colors hover:border-pine-700 hover:text-pine-800"
          >
            Add room
          </Link>
          <Link
            href="/admin/bookings"
            className="rounded-md bg-pine-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-pine-700 active:translate-y-px"
          >
            All bookings
          </Link>
        </div>
      </div>

      <SectionNav items={ADMIN_NAV} active="/admin" />

      {/* House tonight — occupancy board + revenue */}
      <div className="mt-8 grid gap-4 lg:grid-cols-[1.7fr_1fr]">
        <section
          className="rise-in rounded-xl border border-sand-200 bg-white p-6"
          aria-label="Room occupancy"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
              The house tonight
            </h2>
            <p className="text-sm text-ink-600">
              <span className="font-display text-2xl text-pine-900 [font-variant-numeric:tabular-nums]">
                {occupancy}%
              </span>{" "}
              occupancy · {occupied} of {totalRooms} rooms
            </p>
          </div>

          {totalRooms === 0 ? (
            <p className="mt-6 text-sm text-ink-400">
              No rooms yet —{" "}
              <Link href="/admin/rooms/new" className="text-pine-800 underline underline-offset-4">
                add the first room
              </Link>{" "}
              to see the board.
            </p>
          ) : (
            <>
              <div
                className="mt-5 flex h-9 w-full gap-1 overflow-hidden rounded-lg"
                role="img"
                aria-label={byStatus
                  .map((s) => `${s.count} ${ROOM_STATUS_STYLE[s.status].label.toLowerCase()}`)
                  .join(", ")}
              >
                {byStatus.map((s) => (
                  <div
                    key={s.status}
                    className={`${ROOM_STATUS_STYLE[s.status].bar} rounded-sm transition-all duration-300`}
                    style={{ flexGrow: s.count, flexBasis: 0, minWidth: "1.25rem" }}
                  />
                ))}
              </div>
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-600">
                {byStatus.map((s) => (
                  <li key={s.status} className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className={`h-2.5 w-2.5 rounded-full ${ROOM_STATUS_STYLE[s.status].dot}`}
                    />
                    <span className="[font-variant-numeric:tabular-nums] font-medium text-ink-900">
                      {s.count}
                    </span>
                    {ROOM_STATUS_STYLE[s.status].label.toLowerCase()}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section
          className="rise-in relative overflow-hidden rounded-xl bg-pine-950 p-6 text-white"
          style={{ animationDelay: "80ms" }}
          aria-label="Revenue"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-marigold-500/15 blur-2xl"
          />
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-marigold-400">
            Today&apos;s takings
          </h2>
          <p className="mt-3 font-display text-4xl [font-variant-numeric:tabular-nums]">
            {formatMoney(todaysPayments._sum.amount?.toString() ?? "0")}
          </p>
          <p className="mt-1 text-sm text-pine-100/70">
            {todaysPayments._count} payment{todaysPayments._count === 1 ? "" : "s"} settled today
          </p>
          <div className="mt-5 border-t border-white/10 pt-4 text-sm">
            <span className="text-pine-100/70">This month</span>
            <span className="float-right font-medium [font-variant-numeric:tabular-nums]">
              {formatMoney(monthPayments._sum.amount?.toString() ?? "0")}
            </span>
          </div>
        </section>
      </div>

      {/* Operational stat strip */}
      <section
        className="rise-in mt-4 grid grid-cols-2 divide-sand-200 rounded-xl border border-sand-200 bg-white sm:grid-cols-4 sm:divide-x"
        style={{ animationDelay: "160ms" }}
        aria-label="Today's operations"
      >
        {stats.map((s) => (
          <div key={s.label} className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
              {s.label}
            </p>
            <p className="mt-1 font-display text-2xl text-pine-900 [font-variant-numeric:tabular-nums]">
              {s.value}
            </p>
            <p className="text-xs text-ink-400">{s.hint}</p>
          </div>
        ))}
      </section>

      {/* Latest bookings + attention queue */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[1.7fr_1fr] lg:items-start">
        <section className="rise-in" style={{ animationDelay: "240ms" }}>
          <div className="flex items-end justify-between">
            <h2 className="font-display text-xl text-pine-900">Latest bookings</h2>
            <Link
              href="/admin/bookings"
              className="text-sm text-pine-800 underline underline-offset-4 hover:text-pine-700"
            >
              All bookings
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto rounded-xl border border-sand-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand-200 text-left text-[11px] uppercase tracking-[0.1em] text-ink-400">
                  <th className="px-4 py-3 font-semibold">Guest</th>
                  <th className="px-4 py-3 font-semibold">Room</th>
                  <th className="px-4 py-3 font-semibold">Stay</th>
                  <th className="px-4 py-3 font-semibold text-right">Total</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => {
                  const paid = b.payments.some((p) => p.status === "PAID");
                  return (
                    <tr
                      key={b.id}
                      className="border-b border-sand-100 transition-colors last:border-0 hover:bg-sand-50"
                    >
                      <td className="px-4 py-3 font-medium">{b.guestName}</td>
                      <td className="px-4 py-3">
                        <KeyTag roomNumber={b.room.roomNumber} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink-600 [font-variant-numeric:tabular-nums]">
                        {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right [font-variant-numeric:tabular-nums]">
                        {formatMoney(b.totalAmount.toString())}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          <StatusBadge status={b.status} />
                          {!paid && b.status !== "CANCELLED" && (
                            <StatusBadge status="PENDING" />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {recentBookings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <p className="font-display text-lg text-pine-900">
                        The ledger is empty
                      </p>
                      <p className="mt-1 text-sm text-ink-400">
                        Bookings appear here the moment a guest reserves a room.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rise-in" style={{ animationDelay: "320ms" }}>
          <h2 className="font-display text-xl text-pine-900">Needs attention</h2>
          <div className="mt-4 rounded-xl border border-sand-200 bg-white">
            {needsAttention.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="font-display text-lg text-pine-900">All settled</p>
                <p className="mt-1 text-sm text-ink-400">
                  Every active booking is paid and confirmed.
                </p>
              </div>
            ) : (
              <ul>
                {needsAttention.map((b) => (
                  <li
                    key={b.id}
                    className="border-b border-sand-100 px-4 py-3 last:border-0"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{b.guestName}</p>
                        <p className="text-xs text-ink-400 [font-variant-numeric:tabular-nums]">
                          arrives {formatDate(b.checkInDate)} ·{" "}
                          {formatMoney(b.totalAmount.toString())} due
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <KeyTag roomNumber={b.room.roomNumber} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {needsAttention.length > 0 && (
              <div className="border-t border-sand-200 px-4 py-3">
                <Link
                  href="/admin/bookings?status=PENDING"
                  className="text-sm text-pine-800 underline underline-offset-4 hover:text-pine-700"
                >
                  Review in bookings
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
