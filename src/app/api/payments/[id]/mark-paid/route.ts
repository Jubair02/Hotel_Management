import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/guard";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/payments/:id/mark-paid (ADMIN, RECEPTIONIST)
 * Used when cash is collected at the desk.
 *
 * Refuses when the booking already has a PAID payment (so a settled or
 * checked-out booking can never be charged twice) or when the booking is
 * no longer live. Any other pending payment on the same booking is voided
 * in the same transaction so it cannot be settled later via the gateway.
 */
export async function POST(_req: NextRequest, { params }: Params) {
  const { error } = await requireAuth(["ADMIN", "RECEPTIONIST"]);
  if (error) return error;

  const { id } = await params;
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      booking: {
        select: {
          id: true,
          status: true,
          payments: { select: { id: true, status: true } },
        },
      },
    },
  });
  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }
  if (payment.status !== "PENDING") {
    return NextResponse.json(
      { error: `Payment already ${payment.status}` },
      { status: 409 }
    );
  }
  if (payment.booking.payments.some((p) => p.status === "PAID")) {
    return NextResponse.json(
      { error: "This booking is already paid" },
      { status: 409 }
    );
  }
  if (
    payment.booking.status === "CANCELLED" ||
    payment.booking.status === "CHECKED_OUT"
  ) {
    return NextResponse.json(
      { error: `Cannot take payment for a ${payment.booking.status} booking` },
      { status: 409 }
    );
  }

  // Confirm the booking only if it is still PENDING — a CHECKED_IN guest
  // paying cash at the desk must not be moved back to CONFIRMED.
  const updated = await prisma.$transaction(async (tx) => {
    const paid = await tx.payment.update({
      where: { id },
      data: { status: "PAID", paidAt: new Date() },
    });
    await tx.payment.updateMany({
      where: { bookingId: payment.bookingId, status: "PENDING", id: { not: id } },
      data: { status: "FAILED" },
    });
    if (payment.booking.status === "PENDING") {
      await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: "CONFIRMED" },
      });
    }
    return paid;
  });

  return NextResponse.json({ payment: updated });
}
