import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { Prisma, type Payment } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/guard";
import { payBookingSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

type PayResult =
  | { error: string; status: number }
  | { payment: Payment; next: string };

/**
 * POST /api/bookings/:id/pay — start (or resume) a payment for a booking.
 *
 * CASH  → payment stays PENDING (collected at the desk), but the booking
 *         is CONFIRMED so the room is held.
 * MOCK  → simulates an online gateway (SSLCOMMERZ-shaped flow): a PENDING
 *         payment is created and the caller is redirected to a gateway
 *         page. The booking is confirmed ONLY when the gateway IPN
 *         callback verifies the transaction — never on frontend success.
 *
 * Invariant: a booking has at most ONE pending payment. If the guest
 * abandons the gateway and comes back, the existing pending payment is
 * reused (and re-pointed at the newly chosen provider) instead of a
 * second record being created. The read-and-write runs in a SERIALIZABLE
 * transaction so two concurrent clicks cannot both create one.
 */
export async function POST(req: NextRequest, { params }: Params) {
  // Guests pay their own bookings; staff settle cash via
  // /api/payments/:id/mark-paid instead.
  const { session, error } = await requireAuth(["GUEST"]);
  if (error) return error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = payBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment provider" }, { status: 400 });
  }
  const provider = parsed.data.provider;

  const run = () =>
    prisma.$transaction(
      async (tx): Promise<PayResult> => {
        const booking = await tx.booking.findUnique({
          where: { id },
          include: { payments: true },
        });
        if (!booking) return { error: "Booking not found", status: 404 };
        if (booking.guestId !== session.sub) {
          return { error: "Forbidden", status: 403 };
        }
        if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
          return {
            error: `A ${booking.status} booking cannot be paid`,
            status: 409,
          };
        }
        if (booking.payments.some((p) => p.status === "PAID")) {
          return { error: "This booking is already paid", status: 409 };
        }

        const pending = booking.payments.find((p) => p.status === "PENDING");

        if (provider === "CASH") {
          const payment = pending
            ? await tx.payment.update({
                where: { id: pending.id },
                data: { provider: "CASH", transactionId: null },
              })
            : await tx.payment.create({
                data: {
                  bookingId: booking.id,
                  amount: booking.totalAmount,
                  provider: "CASH",
                  status: "PENDING",
                },
              });
          if (booking.status === "PENDING") {
            await tx.booking.update({
              where: { id: booking.id },
              data: { status: "CONFIRMED" },
            });
          }
          return { payment, next: `/bookings/${booking.id}/confirmation` };
        }

        // Online providers (MOCK stands in for SSLCOMMERZ/bKash in the MVP).
        let payment: Payment;
        if (!pending) {
          payment = await tx.payment.create({
            data: {
              bookingId: booking.id,
              amount: booking.totalAmount,
              provider,
              transactionId: `TXN-${randomUUID()}`,
              status: "PENDING",
            },
          });
        } else if (pending.provider === provider && pending.transactionId) {
          // Same gateway, still open — resume it.
          payment = pending;
        } else {
          // Switching provider (or moving from CASH to online): keep the
          // single pending record, just re-point it.
          payment = await tx.payment.update({
            where: { id: pending.id },
            data: {
              provider,
              transactionId: pending.transactionId ?? `TXN-${randomUUID()}`,
            },
          });
        }

        return { payment, next: `/payment/${payment.id}/gateway` };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

  let result: PayResult;
  try {
    result = await run();
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2034"
    ) {
      result = await run(); // one retry after a serialization conflict
    } else {
      throw e;
    }
  }

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result);
}
