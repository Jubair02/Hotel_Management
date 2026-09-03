import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/guard";
import { todayUtc } from "@/lib/availability";
import { formatDate } from "@/lib/format";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z
  .object({ earlyCheckIn: z.boolean().optional() })
  .nullable()
  .optional();

/**
 * POST /api/bookings/:id/check-in (ADMIN, RECEPTIONIST)
 * CONFIRMED booking → CHECKED_IN, room → OCCUPIED, actualCheckIn stamped.
 *
 * Date rules:
 *  - today must be on/after the booking's check-in date, unless the caller
 *    sends `{ "earlyCheckIn": true }` as an explicit override;
 *  - a booking whose stay has already ended cannot be checked in;
 *  - the room must not be occupied by another in-house guest.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const { error } = await requireAuth(["ADMIN", "RECEPTIONIST"]);
  if (error) return error;

  const { id } = await params;
  const raw = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  const earlyCheckIn = parsed.success ? parsed.data?.earlyCheckIn === true : false;

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.status !== "CONFIRMED") {
    return NextResponse.json(
      {
        error:
          booking.status === "PENDING"
            ? "Booking is not confirmed yet — verify payment first"
            : `A ${booking.status} booking cannot be checked in`,
      },
      { status: 409 }
    );
  }

  const today = todayUtc();
  if (today >= booking.checkOutDate) {
    return NextResponse.json(
      {
        error: `This stay ended on ${formatDate(booking.checkOutDate)} and can no longer be checked in`,
      },
      { status: 409 }
    );
  }
  if (today < booking.checkInDate && !earlyCheckIn) {
    return NextResponse.json(
      {
        error: `Check-in is scheduled for ${formatDate(booking.checkInDate)} — use early check-in to override`,
        code: "EARLY_CHECK_IN_REQUIRED",
      },
      { status: 409 }
    );
  }

  const occupant = await prisma.booking.findFirst({
    where: { roomId: booking.roomId, status: "CHECKED_IN", id: { not: id } },
    select: { guestName: true, checkOutDate: true },
  });
  if (occupant) {
    return NextResponse.json(
      {
        error: `Room is still occupied by ${occupant.guestName} until ${formatDate(occupant.checkOutDate)}`,
      },
      { status: 409 }
    );
  }

  const [updated] = await prisma.$transaction([
    prisma.booking.update({
      where: { id },
      data: { status: "CHECKED_IN", actualCheckIn: new Date() },
    }),
    prisma.room.update({
      where: { id: booking.roomId },
      data: { status: "OCCUPIED" },
    }),
  ]);

  return NextResponse.json({ booking: updated });
}
