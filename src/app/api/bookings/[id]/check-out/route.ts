import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/guard";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/bookings/:id/check-out (ADMIN, RECEPTIONIST)
 * CHECKED_IN booking → CHECKED_OUT, room → CLEANING, and a housekeeping
 * task is created so the room re-enters the AVAILABLE pool only after
 * it has actually been cleaned.
 */
export async function POST(_req: NextRequest, { params }: Params) {
  const { error } = await requireAuth(["ADMIN", "RECEPTIONIST"]);
  if (error) return error;

  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { payments: true, room: true },
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.status !== "CHECKED_IN") {
    return NextResponse.json(
      { error: `A ${booking.status} booking cannot be checked out` },
      { status: 409 }
    );
  }

  const hasPaid = booking.payments.some((p) => p.status === "PAID");
  if (!hasPaid) {
    return NextResponse.json(
      { error: "Outstanding payment — collect payment before check-out" },
      { status: 409 }
    );
  }

  const [updated] = await prisma.$transaction([
    prisma.booking.update({
      where: { id },
      data: { status: "CHECKED_OUT", actualCheckOut: new Date() },
    }),
    prisma.room.update({
      where: { id: booking.roomId },
      data: { status: "CLEANING" },
    }),
    prisma.housekeepingTask.create({
      data: {
        roomId: booking.roomId,
        status: "PENDING",
        notes: `Post check-out cleaning — room ${booking.room.roomNumber}`,
      },
    }),
  ]);

  return NextResponse.json({ booking: updated });
}
