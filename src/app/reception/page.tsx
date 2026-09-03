import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/StatusBadge";
import { KeyTag } from "@/components/KeyTag";
import { ActionButton } from "@/components/ActionButton";
import { formatMoney, formatDate, formatDateTime } from "@/lib/format";
import { todayUtc } from "@/lib/availability";

export const metadata = { title: "Reception" };

type Search = Promise<{ q?: string }>;

export default async function ReceptionPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const { q } = await searchParams;
  const today = todayUtc();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const [arrivals, inHouse, searchResults] = await Promise.all([
    // Due to arrive: stay starts today (or started earlier) and hasn't begun.
    prisma.booking.findMany({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] },
        checkInDate: { lt: tomorrow },
        checkOutDate: { gt: today },
      },
      include: { room: true, payments: true },
      orderBy: { checkInDate: "asc" },
    }),
    prisma.booking.findMany({
      where: { status: "CHECKED_IN" },
      include: { room: true, payments: true },
      orderBy: { checkOutDate: "asc" },
    }),
    q
      ? prisma.booking.findMany({
          where: { guestName: { contains: q, mode: "insensitive" } },
          include: { room: true, payments: true },
          orderBy: { createdAt: "desc" },
          take: 20,
        })
      : Promise.resolve([]),
  ]);

  const departuresToday = inHouse.filter((b) => b.checkOutDate < tomorrow);

  function paymentState(b: (typeof arrivals)[number]) {
    const paid = b.payments.some((p) => p.status === "PAID");
    const pending = b.payments.find((p) => p.status === "PENDING");
    return { paid, pending };
  }

  function BookingRow({
    b,
    context,
  }: {
    b: (typeof arrivals)[number];
    context: "arrival" | "inhouse" | "search";
  }) {
    const { paid, pending } = paymentState(b);
    const live = b.status !== "CANCELLED" && b.status !== "CHECKED_OUT";
    const early = b.checkInDate > today;
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-sand-100 px-5 py-4 last:border-0">
        <div className="flex items-center gap-4">
          <KeyTag roomNumber={b.room.roomNumber} />
          <div>
            <p className="font-medium">{b.guestName}</p>
            <p className="text-xs text-ink-400">
              {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)} ·{" "}
              {b.numberOfGuests} guest{b.numberOfGuests === 1 ? "" : "s"} ·{" "}
              {formatMoney(b.totalAmount.toString())}
              {b.actualCheckIn &&
                ` · arrived ${formatDateTime(b.actualCheckIn)}`}
            </p>
            {b.notes && (
              <p className="mt-1 text-xs text-marigold-700">✱ {b.notes}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={b.status} />
          <StatusBadge status={paid ? "PAID" : pending?.status ?? "PENDING"} />
          {!paid && pending && live && (
            <ActionButton url={`/api/payments/${pending.id}/mark-paid`}>
              Take payment
            </ActionButton>
          )}
          {context !== "inhouse" && b.status === "PENDING" && !pending && (
            <ActionButton
              url={`/api/bookings/${b.id}`}
              method="PATCH"
              body={{ status: "CONFIRMED" }}
            >
              Confirm
            </ActionButton>
          )}
          {b.status === "CONFIRMED" && !early && (
            <ActionButton url={`/api/bookings/${b.id}/check-in`} variant="primary">
              Check in
            </ActionButton>
          )}
          {b.status === "CONFIRMED" && early && (
            <ActionButton
              url={`/api/bookings/${b.id}/check-in`}
              body={{ earlyCheckIn: true }}
              confirmText={`This stay starts on ${formatDate(b.checkInDate)}. Check ${b.guestName} in early?`}
            >
              Early check-in
            </ActionButton>
          )}
          {b.status === "CHECKED_IN" && (
            <ActionButton
              url={`/api/bookings/${b.id}/check-out`}
              variant="primary"
              confirmText={
                paid
                  ? `Check out ${b.guestName}? Room ${b.room.roomNumber} will move to cleaning.`
                  : undefined
              }
            >
              Check out
            </ActionButton>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
        Reception · {formatDate(today)}
      </p>
      <h1 className="mt-1 font-display text-3xl text-pine-900">Front desk</h1>

      <div className="mt-6 grid grid-cols-3 gap-4 max-w-lg">
        {[
          { label: "Arriving", value: arrivals.length },
          { label: "In house", value: inHouse.length },
          { label: "Departing today", value: departuresToday.length },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-xl border border-sand-200 bg-white p-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
              {kpi.label}
            </p>
            <p className="mt-1 font-display text-2xl text-pine-900">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <form method="get" className="mt-8 flex max-w-md gap-2">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Find a booking by guest name…"
          className="w-full rounded-md border border-sand-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pine-700/40"
        />
        <button
          type="submit"
          className="rounded-md bg-pine-800 px-4 py-2 text-sm font-semibold text-white hover:bg-pine-700"
        >
          Search
        </button>
      </form>

      {q && (
        <section className="mt-8">
          <h2 className="font-display text-xl text-pine-900">
            Results for “{q}”
          </h2>
          <div className="mt-3 rounded-xl border border-sand-200 bg-white">
            {searchResults.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-ink-400">
                No bookings found for that name.
              </p>
            ) : (
              searchResults.map((b) => (
                <BookingRow key={b.id} b={b} context="search" />
              ))
            )}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-display text-xl text-pine-900">
          Today&apos;s arrivals
        </h2>
        <p className="text-sm text-ink-600">
          Confirm payment, then check the guest in — their room flips to
          occupied.
        </p>
        <div className="mt-3 rounded-xl border border-sand-200 bg-white">
          {arrivals.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-400">
              No arrivals due — a quiet morning at the desk.
            </p>
          ) : (
            arrivals.map((b) => <BookingRow key={b.id} b={b} context="arrival" />)
          )}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-pine-900">Current guests</h2>
        <p className="text-sm text-ink-600">
          Check-out settles the stay and hands the room to housekeeping.
        </p>
        <div className="mt-3 rounded-xl border border-sand-200 bg-white">
          {inHouse.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-ink-400">
              Nobody in house right now.
            </p>
          ) : (
            inHouse.map((b) => <BookingRow key={b.id} b={b} context="inhouse" />)
          )}
        </div>
      </section>
    </div>
  );
}
