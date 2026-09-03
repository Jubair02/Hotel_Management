import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/guard";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/bookings/:id/cancel — the guest who owns the booking, or staff.
 * Only PENDING / CONFIRMED bookings can be cancelled; a PAID payment is
 * marked REFUNDED (refund handling itself is out of MVP scope).
 */
export async function POST(_req: NextRequest, { params }: Params) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { payments: true },
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const staff = session.role === "ADMIN" || session.role === "RECEPTIONIST";
  if (!staff && booking.guestId !== session.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
    return NextResponse.json(
      { error: `A ${booking.status} booking cannot be cancelled` },
      { status: 409 }
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.payment.updateMany({
      where: { bookingId: id, status: "PAID" },
      data: { status: "REFUNDED" },
    });
    await tx.payment.updateMany({
      where: { bookingId: id, status: "PENDING" },
      data: { status: "FAILED" },
    });
    return tx.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
  });

  return NextResponse.json({ booking: updated });
}
