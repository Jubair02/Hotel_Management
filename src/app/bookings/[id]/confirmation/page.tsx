import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { roleHome } from "@/lib/roles";
import { KeyTag } from "@/components/KeyTag";
import { StatusBadge } from "@/components/StatusBadge";
import { formatMoney, formatDate } from "@/lib/format";

export const metadata = { title: "Booking confirmation" };

type Props = { params: Promise<{ id: string }> };

export default async function ConfirmationPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  if (!session)
    redirect(`/login?next=${encodeURIComponent(`/bookings/${id}/confirmation`)}`);

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { room: true, payments: { orderBy: { createdAt: "desc" } } },
  });
  if (!booking) notFound();

  if (booking.guestId !== session.sub) redirect(roleHome(session.role));

  const paid = booking.payments.find((p) => p.status === "PAID");
  const cancelled = booking.status === "CANCELLED";

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
          Booking {booking.id.slice(-8).toUpperCase()}
        </p>
        <h1 className="mt-2 font-display text-4xl text-pine-900">
          {cancelled
            ? "Booking cancelled"
            : paid
              ? "You're all set"
              : "Room held for you"}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-ink-600">
          {cancelled
            ? "This booking has been cancelled. If you paid online, the payment is marked for refund."
            : paid
              ? "Payment received — we'll have your key tag polished and waiting."
              : "Your room is reserved. Settle the bill at the front desk when you arrive."}
        </p>
      </div>

      <div className="mt-10 rounded-xl border border-sand-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-lg text-pine-900">
              {booking.room.name}
            </p>
            <p className="text-xs uppercase tracking-[0.15em] text-ink-400">
              {booking.room.type.toLowerCase()}
            </p>
          </div>
          <KeyTag roomNumber={booking.room.roomNumber} />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-sand-200 pt-5 text-sm">
          <div>
            <dt className="text-ink-400">Guest</dt>
            <dd className="font-medium">{booking.guestName}</dd>
          </div>
          <div>
            <dt className="text-ink-400">Guests</dt>
            <dd className="font-medium">{booking.numberOfGuests}</dd>
          </div>
          <div>
            <dt className="text-ink-400">Check-in</dt>
            <dd className="font-medium">{formatDate(booking.checkInDate)}</dd>
          </div>
          <div>
            <dt className="text-ink-400">Check-out</dt>
            <dd className="font-medium">{formatDate(booking.checkOutDate)}</dd>
          </div>
          <div>
            <dt className="text-ink-400">Total</dt>
            <dd className="font-display text-lg text-pine-900">
              {formatMoney(booking.totalAmount.toString())}
            </dd>
          </div>
          <div>
            <dt className="text-ink-400">Status</dt>
            <dd className="mt-0.5 flex gap-2">
              <StatusBadge status={booking.status} />
              {booking.payments[0] && (
                <StatusBadge status={booking.payments[0].status} />
              )}
            </dd>
          </div>
        </dl>

        {booking.notes && (
          <p className="mt-4 rounded-md bg-sand-50 px-4 py-3 text-sm text-ink-600">
            <span className="font-medium text-ink-900">Your requests: </span>
            {booking.notes}
          </p>
        )}
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/dashboard"
          className="rounded-md bg-pine-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pine-700"
        >
          My bookings
        </Link>
        <Link
          href="/rooms"
          className="rounded-md border border-sand-300 bg-white px-5 py-2.5 text-sm font-medium text-ink-900 hover:border-pine-700"
        >
          Browse rooms
        </Link>
      </div>
    </div>
  );
}
