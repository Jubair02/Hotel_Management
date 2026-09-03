import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { SectionNav, ADMIN_NAV } from "@/components/SectionNav";
import { ColumnChart, HorizontalBarChart, type BarDatum } from "@/components/BarChart";
import { formatMoney, formatDate } from "@/lib/format";
import { todayUtc } from "@/lib/availability";

export const metadata = { title: "Reports · Admin" };
export const dynamic = "force-dynamic";

const DAY = 86_400_000;
const WINDOW_DAYS = 30;
const MIX_DAYS = 90;

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked in",
  CHECKED_OUT: "Checked out",
  CANCELLED: "Cancelled",
};
const STATUS_ORDER = ["CHECKED_OUT", "CHECKED_IN", "CONFIRMED", "PENDING", "CANCELLED"];

const TYPE_LABEL: Record<string, string> = {
  SINGLE: "Single",
  DOUBLE: "Double",
  TWIN: "Twin",
  DELUXE: "Deluxe",
  SUITE: "Suite",
  FAMILY: "Family",
};

const shortDay = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(d);

export default async function AdminReportsPage() {
  const today = todayUtc();
  const tomorrow = new Date(today.getTime() + DAY);
  const windowStart = new Date(today.getTime() - (WINDOW_DAYS - 1) * DAY);
  const mixStart = new Date(today.getTime() - (MIX_DAYS - 1) * DAY);

  const [roomCount, stays, paid, recentBookings] = await Promise.all([
    prisma.room.count(),
    // Every stay that touches the 30-day window and actually happened (or
    // is happening / firmly booked). Cancelled bookings never occupied a
    // room; PENDING ones are unconfirmed holds, so they don't count either.
    prisma.booking.findMany({
      where: {
        status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
        checkInDate: { lt: tomorrow },
        checkOutDate: { gt: windowStart },
      },
      select: { checkInDate: true, checkOutDate: true, room: { select: { type: true } } },
    }),
    prisma.payment.findMany({
      where: { status: "PAID", paidAt: { gte: windowStart, lt: tomorrow } },
      select: { amount: true, paidAt: true },
    }),
    prisma.booking.findMany({
      where: { createdAt: { gte: mixStart } },
      select: { status: true, totalNights: true, room: { select: { type: true } } },
    }),
  ]);

  // ---- Occupancy per night (last 30 days) ----
  const days: Date[] = Array.from({ length: WINDOW_DAYS }, (_, i) =>
    new Date(windowStart.getTime() + i * DAY)
  );
  const occupiedByDay = days.map((day) => {
    const next = new Date(day.getTime() + DAY);
    return stays.filter((s) => s.checkInDate < next && s.checkOutDate > day).length;
  });
  const occupancyData: BarDatum[] = days.map((day, i) => {
    const pct = roomCount > 0 ? Math.round((occupiedByDay[i]! / roomCount) * 100) : 0;
    return {
      label: i % 5 === WINDOW_DAYS % 5 || i === WINDOW_DAYS - 1 ? shortDay(day) : "",
      value: pct,
      tooltip: `${formatDate(day)}: ${occupiedByDay[i]} of ${roomCount} rooms (${pct}%)`,
    };
  });
  const occupiedNights = occupiedByDay.reduce((a, b) => a + b, 0);
  const avgOccupancy =
    roomCount > 0 ? Math.round((occupiedNights / (roomCount * WINDOW_DAYS)) * 100) : 0;
  const tonight = occupiedByDay[WINDOW_DAYS - 1]!;

  // ---- Revenue per day (settled payments, last 30 days) ----
  const revenueByDay = days.map((day) => {
    const next = new Date(day.getTime() + DAY);
    return paid
      .filter((p) => p.paidAt && p.paidAt >= day && p.paidAt < next)
      .reduce((sum, p) => sum.add(p.amount), new Prisma.Decimal(0));
  });
  const revenueData: BarDatum[] = days.map((day, i) => ({
    label: i % 5 === WINDOW_DAYS % 5 || i === WINDOW_DAYS - 1 ? shortDay(day) : "",
    value: revenueByDay[i]!.toNumber(),
    tooltip: `${formatDate(day)}: ${formatMoney(revenueByDay[i]!.toString())}`,
  }));
  const revenueTotal = revenueByDay.reduce((s, v) => s.add(v), new Prisma.Decimal(0));
  const adr = occupiedNights > 0 ? revenueTotal.div(occupiedNights) : new Prisma.Decimal(0);
  const revpar =
    roomCount > 0 ? revenueTotal.div(roomCount * WINDOW_DAYS) : new Prisma.Decimal(0);

  // ---- Bookings by status & room-type mix (last 90 days of bookings) ----
  const byStatus = STATUS_ORDER.map((status) => ({
    status,
    count: recentBookings.filter((b) => b.status === status).length,
  })).filter((s) => s.count > 0);
  const statusData: BarDatum[] = byStatus.map((s) => ({
    label: STATUS_LABEL[s.status] ?? s.status,
    value: s.count,
    tooltip: `${STATUS_LABEL[s.status]}: ${s.count} booking${s.count === 1 ? "" : "s"}`,
  }));
  const cancelled = recentBookings.filter((b) => b.status === "CANCELLED").length;
  const cancelRate =
    recentBookings.length > 0 ? Math.round((cancelled / recentBookings.length) * 100) : 0;

  const nightsByType = new Map<string, number>();
  for (const b of recentBookings) {
    if (b.status === "CANCELLED") continue;
    nightsByType.set(b.room.type, (nightsByType.get(b.room.type) ?? 0) + b.totalNights);
  }
  const typeData: BarDatum[] = [...nightsByType.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type, nights]) => ({
      label: TYPE_LABEL[type] ?? type,
      value: nights,
      tooltip: `${TYPE_LABEL[type] ?? type}: ${nights} night${nights === 1 ? "" : "s"} booked`,
    }));

  const kpis = [
    {
      label: "Occupancy tonight",
      value: `${roomCount > 0 ? Math.round((tonight / roomCount) * 100) : 0}%`,
      hint: `${tonight} of ${roomCount} rooms`,
    },
    {
      label: `Revenue, ${WINDOW_DAYS} days`,
      value: formatMoney(revenueTotal.toString()),
      hint: `${paid.length} settled payment${paid.length === 1 ? "" : "s"}`,
    },
    {
      label: "Avg nightly rate",
      value: formatMoney(adr.toFixed(0)),
      hint: `RevPAR ${formatMoney(revpar.toFixed(0))}`,
    },
    {
      label: "Cancellation rate",
      value: `${cancelRate}%`,
      hint: `${cancelled} of ${recentBookings.length} in ${MIX_DAYS} days`,
    },
  ];

  const compactMoney = (v: number) =>
    v >= 100_000 ? `৳${(v / 1000).toFixed(0)}k` : v >= 1000 ? `৳${(v / 1000).toFixed(1)}k` : `৳${v}`;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
        Admin · {formatDate(windowStart)} – {formatDate(today)}
      </p>
      <h1 className="mt-1 font-display text-3xl text-pine-900">Reports</h1>
      <SectionNav items={ADMIN_NAV} active="/admin/reports" />

      <section
        className="mt-8 grid grid-cols-2 divide-sand-200 rounded-xl border border-sand-200 bg-white sm:grid-cols-4 sm:divide-x"
        aria-label="Key figures"
      >
        {kpis.map((k) => (
          <div key={k.label} className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
              {k.label}
            </p>
            <p className="mt-1 text-2xl font-semibold text-pine-900">{k.value}</p>
            <p className="text-xs text-ink-400">{k.hint}</p>
          </div>
        ))}
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-sand-200 bg-white p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-xl text-pine-900">Occupancy by night</h2>
            <p className="text-sm text-ink-600">
              <span className="font-semibold text-ink-900">{avgOccupancy}%</span> average
            </p>
          </div>
          <p className="mt-1 text-sm text-ink-600">
            Share of rooms with a confirmed or in-house stay each night, last {WINDOW_DAYS} days.
          </p>
          <div className="mt-4">
            <ColumnChart
              data={occupancyData}
              max={100}
              format={(v) => `${v}%`}
              ariaLabel={`Nightly occupancy for the last ${WINDOW_DAYS} days, averaging ${avgOccupancy} percent`}
            />
          </div>
        </section>

        <section className="rounded-xl border border-sand-200 bg-white p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-xl text-pine-900">Revenue by day</h2>
            <p className="text-sm text-ink-600">
              <span className="font-semibold text-ink-900">{formatMoney(revenueTotal.toString())}</span>{" "}
              total
            </p>
          </div>
          <p className="mt-1 text-sm text-ink-600">
            Payments settled per day (cash and online), last {WINDOW_DAYS} days.
          </p>
          <div className="mt-4">
            <ColumnChart
              data={revenueData}
              format={compactMoney}
              ariaLabel={`Daily settled revenue for the last ${WINDOW_DAYS} days, totalling ${formatMoney(revenueTotal.toString())}`}
            />
          </div>
        </section>

        <section className="rounded-xl border border-sand-200 bg-white p-6">
          <h2 className="font-display text-xl text-pine-900">Bookings by status</h2>
          <p className="mt-1 text-sm text-ink-600">
            Bookings made in the last {MIX_DAYS} days, by where they are now.
          </p>
          <div className="mt-4">
            <HorizontalBarChart
              data={statusData}
              ariaLabel={`Bookings from the last ${MIX_DAYS} days grouped by status`}
            />
          </div>
        </section>

        <section className="rounded-xl border border-sand-200 bg-white p-6">
          <h2 className="font-display text-xl text-pine-900">Room-type demand</h2>
          <p className="mt-1 text-sm text-ink-600">
            Nights booked per room type, last {MIX_DAYS} days (excluding cancellations).
          </p>
          <div className="mt-4">
            <HorizontalBarChart
              data={typeData}
              ariaLabel={`Nights booked per room type over the last ${MIX_DAYS} days`}
            />
          </div>
        </section>
      </div>

      {/* Table view — the same numbers, for screen readers, copy-paste and print. */}
      <details className="mt-8 rounded-xl border border-sand-200 bg-white">
        <summary className="cursor-pointer px-6 py-4 text-sm font-medium text-pine-900">
          Show the daily figures as a table
        </summary>
        <div className="overflow-x-auto border-t border-sand-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-200 text-left text-[11px] uppercase tracking-[0.1em] text-ink-400">
                <th className="px-4 py-3 font-semibold">Night</th>
                <th className="px-4 py-3 font-semibold text-right">Rooms occupied</th>
                <th className="px-4 py-3 font-semibold text-right">Occupancy</th>
                <th className="px-4 py-3 font-semibold text-right">Revenue settled</th>
              </tr>
            </thead>
            <tbody>
              {days.map((day, i) => (
                <tr key={i} className="border-b border-sand-100 last:border-0">
                  <td className="whitespace-nowrap px-4 py-2 [font-variant-numeric:tabular-nums]">
                    {formatDate(day)}
                  </td>
                  <td className="px-4 py-2 text-right [font-variant-numeric:tabular-nums]">
                    {occupiedByDay[i]} / {roomCount}
                  </td>
                  <td className="px-4 py-2 text-right [font-variant-numeric:tabular-nums]">
                    {occupancyData[i]!.value}%
                  </td>
                  <td className="px-4 py-2 text-right [font-variant-numeric:tabular-nums]">
                    {formatMoney(revenueByDay[i]!.toString())}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
