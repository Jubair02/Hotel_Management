import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { roleHome } from "@/lib/roles";
import { PaymentOptions } from "@/components/PaymentOptions";
import { KeyTag } from "@/components/KeyTag";
import { StatusBadge } from "@/components/StatusBadge";
import { formatMoney, formatDate, formatDateTime } from "@/lib/format";

export const metadata = { title: "Payment" };

type Props = { params: Promise<{ id: string }> };

export default async function PaymentPage({ params }: Props) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(`/bookings/${id}/payment`)}`);

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { room: true, payments: true },
  });
  if (!booking) notFound();

  if (booking.guestId !== session.sub) redirect(roleHome(session.role));

  const paid = booking.payments.some((p) => p.status === "PAID");
  if (paid || booking.status === "CANCELLED") {
    redirect(`/bookings/${id}/confirmation`);
  }

  const pendingCash = booking.payments.find(
    (p) => p.provider === "CASH" && p.status === "PENDING"
  );
  // An online payment the guest started but didn't finish — offer to pick
  // it back up rather than presenting the menu as if nothing happened.
  const pendingOnline = booking.payments.find(
    (p) => p.provider !== "CASH" && p.status === "PENDING" && p.transactionId
  );

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
        Step 2 of 2
      </p>
      <h1 className="mt-1 font-display text-3xl text-pine-900">
        How would you like to pay?
      </h1>

      <div className="mt-8 rounded-xl border border-sand-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-display text-lg text-pine-900">
              {booking.room.name}
            </p>
            <p className="mt-0.5 text-sm text-ink-600">
              {formatDate(booking.checkInDate)} →{" "}
              {formatDate(booking.checkOutDate)} · {booking.totalNights} night
              {booking.totalNights === 1 ? "" : "s"}
            </p>
          </div>
          <KeyTag roomNumber={booking.room.roomNumber} />
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-sand-200 pt-4">
          <span className="text-sm text-ink-600">Total due</span>
          <span className="font-display text-2xl text-pine-900">
            {formatMoney(booking.totalAmount.toString())}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-ink-400">Booking status</span>
          <StatusBadge status={booking.status} />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-sand-200 bg-white p-6">
        {pendingCash ? (
          <div className="space-y-4">
            <p className="rounded-md border border-marigold-100 bg-marigold-50 px-4 py-3 text-sm text-marigold-700">
              Your booking is confirmed with payment due at the front desk.
            </p>
            <Link
              href={`/bookings/${id}/confirmation`}
              className="block rounded-md bg-pine-800 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-pine-700"
            >
              View confirmation
            </Link>
          </div>
        ) : pendingOnline ? (
          <div className="space-y-5">
            <div className="rounded-md border border-marigold-100 bg-marigold-50 px-4 py-3 text-sm text-marigold-700">
              <p className="font-medium">You have a payment in progress.</p>
              <p className="mt-1">
                Started {formatDateTime(pendingOnline.createdAt)} · ref{" "}
                <span className="font-mono text-xs">{pendingOnline.transactionId}</span>
              </p>
            </div>
            <Link
              href={`/payment/${pendingOnline.id}/gateway`}
              className="block rounded-md bg-pine-800 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-pine-700"
            >
              Continue to payment
            </Link>
            <details className="group">
              <summary className="cursor-pointer text-center text-sm text-ink-600 underline underline-offset-4 hover:text-pine-800">
                Pay a different way
              </summary>
              <div className="mt-4">
                <PaymentOptions bookingId={booking.id} />
              </div>
            </details>
          </div>
        ) : (
          <PaymentOptions bookingId={booking.id} />
        )}
      </div>
    </div>
  );
}
