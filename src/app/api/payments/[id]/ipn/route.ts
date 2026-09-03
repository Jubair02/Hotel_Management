import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const ipnSchema = z.object({
  transactionId: z.string().min(1),
  status: z.enum(["success", "failed"]),
});

/**
 * POST /api/payments/:id/ipn — mock gateway IPN / callback.
 *
 * Mirrors the real SSLCOMMERZ flow: the gateway calls the server, the
 * server VERIFIES the transaction against its own record (here: the
 * transactionId must match the pending payment), and only then updates
 * payment + booking status. With a real gateway this handler would also
 * call the gateway's validation API before trusting the payload.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = ipnSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid IPN payload" }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      booking: { include: { payments: { select: { id: true, status: true } } } },
    },
  });
  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  // Transaction verification step — reject payloads that don't match.
  if (payment.transactionId !== parsed.data.transactionId) {
    return NextResponse.json(
      { error: "Transaction verification failed" },
      { status: 400 }
    );
  }
  if (payment.status !== "PENDING") {
    return NextResponse.json(
      { error: `Payment already ${payment.status}` },
      { status: 409 }
    );
  }

  if (parsed.data.status === "failed") {
    const updated = await prisma.payment.update({
      where: { id },
      data: { status: "FAILED" },
    });
    return NextResponse.json({ payment: updated });
  }

  // The booking was settled another way (e.g. cash at the desk) while this
  // gateway session was open — never record a second PAID payment.
  if (payment.booking.payments.some((p) => p.status === "PAID")) {
    await prisma.payment.update({ where: { id }, data: { status: "FAILED" } });
    return NextResponse.json(
      { error: "This booking is already paid" },
      { status: 409 }
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const paid = await tx.payment.update({
      where: { id },
      data: { status: "PAID", paidAt: new Date() },
    });
    await tx.payment.updateMany({
      where: { bookingId: payment.bookingId, status: "PENDING", id: { not: id } },
      data: { status: "FAILED" },
    });
    // Only a PENDING booking moves to CONFIRMED; a guest already in house
    // keeps their CHECKED_IN status.
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
