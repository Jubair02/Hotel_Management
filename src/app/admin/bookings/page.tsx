import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { SectionNav, ADMIN_NAV } from "@/components/SectionNav";
import { StatusBadge } from "@/components/StatusBadge";
import { KeyTag } from "@/components/KeyTag";
import { ActionButton } from "@/components/ActionButton";
import { formatMoney, formatDate } from "@/lib/format";
import { displayPaymentStatus } from "@/lib/payments";

export const metadata = { title: "Bookings · Admin" };

const STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "CHECKED_IN", "CHECKED_OUT"];

type Search = Promise<{ status?: string; guestName?: string; date?: string }>;

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const sp = await searchParams;

  const where: Prisma.BookingWhereInput = {
    ...(sp.status && STATUSES.includes(sp.status)
      ? { status: sp.status as never }
      : {}),
    ...(sp.guestName
      ? { guestName: { contains: sp.guestName, mode: "insensitive" } }
      : {}),
    ...(sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date)
      ? {
          checkInDate: { lte: new Date(`${sp.date}T23:59:59Z`) },
          checkOutDate: { gte: new Date(`${sp.date}T00:00:00Z`) },
        }
      : {}),
  };

  const bookings = await prisma.booking.findMany({
    where,
    include: { room: true, payments: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const inputCls =
    "rounded-md border border-sand-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pine-700/40";

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
        Admin
      </p>
      <h1 className="mt-1 font-display text-3xl text-pine-900">Bookings</h1>
      <SectionNav items={ADMIN_NAV} active="/admin/bookings" />

      <form
        method="get"
        className="mt-8 flex flex-wrap items-end gap-3 rounded-xl border border-sand-200 bg-white p-4"
      >
        <label className="block text-sm">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
            Status
          </span>
          <select name="status" defaultValue={sp.status ?? ""} className={inputCls}>
            <option value="">Any</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
            Guest name
          </span>
          <input
            name="guestName"
            defaultValue={sp.guestName ?? ""}
            className={inputCls}
            placeholder="Search…"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
            In house on
          </span>
          <input
            type="date"
            name="date"
            defaultValue={sp.date ?? ""}
            className={inputCls}
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-pine-800 px-4 py-2 text-sm font-semibold text-white hover:bg-pine-700"
        >
          Filter
        </button>
        <a
          href="/admin/bookings"
          className="px-2 py-2 text-sm text-ink-600 hover:text-pine-800"
        >
          Clear
        </a>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-sand-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand-200 text-left text-[11px] uppercase tracking-[0.1em] text-ink-400">
              <th className="px-4 py-3 font-semibold">Guest</th>
              <th className="px-4 py-3 font-semibold">Room</th>
              <th className="px-4 py-3 font-semibold">Stay</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Booking</th>
              <th className="px-4 py-3 font-semibold">Payment</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => {
              const paid = b.payments.some((p) => p.status === "PAID");
              const pendingPayment = b.payments.find(
                (p) => p.status === "PENDING"
              );
              const live = b.status !== "CANCELLED" && b.status !== "CHECKED_OUT";
              return (
                <tr key={b.id} className="border-b border-sand-100 last:border-0 align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium">{b.guestName}</p>
                    <p className="text-xs text-ink-400">{b.guestPhone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <KeyTag roomNumber={b.room.roomNumber} />
                  </td>
                  <td className="px-4 py-3 text-ink-600 whitespace-nowrap">
                    {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatMoney(b.totalAmount.toString())}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={b.status} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={displayPaymentStatus(b.payments)} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      {b.status === "PENDING" && (
                        <ActionButton
                          url={`/api/bookings/${b.id}`}
                          method="PATCH"
                          body={{ status: "CONFIRMED" }}
                        >
                          Confirm
                        </ActionButton>
                      )}
                      {!paid && pendingPayment && live && (
                        <ActionButton
                          url={`/api/payments/${pendingPayment.id}/mark-paid`}
                        >
                          Mark paid
                        </ActionButton>
                      )}
                      {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                        <ActionButton
                          url={`/api/bookings/${b.id}/cancel`}
                          variant="danger"
                          confirmText={`Cancel ${b.guestName}'s booking?`}
                        >
                          Cancel
                        </ActionButton>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-400">
                  No bookings match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
