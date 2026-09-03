import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { roleHome } from "@/lib/roles";
import { MockGateway } from "@/components/MockGateway";
import { formatMoney } from "@/lib/format";

export const metadata = { title: "Payment gateway" };

type Props = { params: Promise<{ paymentId: string }> };

export default async function GatewayPage({ params }: Props) {
  const { paymentId } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { booking: { include: { room: true } } },
  });
  if (!payment || !payment.transactionId) notFound();

  if (payment.booking.guestId !== session.sub) redirect(roleHome(session.role));

  if (payment.status === "PAID") {
    redirect(`/bookings/${payment.bookingId}/confirmation`);
  }
  if (payment.status !== "PENDING") {
    redirect(`/bookings/${payment.bookingId}/payment`);
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      {/* Deliberately styled unlike the rest of the site — you have left
          Grand Tulip and are on the "gateway's" page. */}
      <div className="rounded-xl border-2 border-dashed border-sand-300 bg-white p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
          Sandbox payment gateway
        </p>
        <h1 className="mt-2 text-2xl font-bold text-ink-900">
          TulipPay <span className="text-ink-400 font-normal">(mock)</span>
        </h1>

        <dl className="mt-6 space-y-2 rounded-lg bg-sand-50 p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-600">Merchant</dt>
            <dd className="font-medium">Grand Tulip Hotel</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-600">Reference</dt>
            <dd className="font-mono text-xs">{payment.transactionId}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-600">Amount</dt>
            <dd className="font-semibold">
              {formatMoney(payment.amount.toString())}
            </dd>
          </div>
        </dl>

        <div className="mt-6">
          <MockGateway
            paymentId={payment.id}
            bookingId={payment.bookingId}
            transactionId={payment.transactionId}
          />
        </div>

        <p className="mt-4 text-center text-xs text-ink-400">
          In production this page is hosted by SSLCOMMERZ / bKash; the booking
          is only confirmed after the server verifies the gateway&apos;s IPN
          callback.
        </p>
      </div>
    </div>
  );
}
