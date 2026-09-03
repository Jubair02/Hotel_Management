import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { availabilityQuerySchema } from "@/lib/validation";
import { overlapWhere, parseDateOnly, todayUtc } from "@/lib/availability";

/**
 * GET /api/rooms/available?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD&guests=2
 *
 * The availability engine: a room qualifies when it has enough capacity,
 * is not under maintenance, and has NO active booking whose date range
 * overlaps the requested stay.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const parsed = availabilityQuerySchema.safeParse({
    checkIn: searchParams.get("checkIn"),
    checkOut: searchParams.get("checkOut"),
    guests: searchParams.get("guests") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "checkIn and checkOut are required as YYYY-MM-DD" },
      { status: 400 }
    );
  }

  const checkIn = parseDateOnly(parsed.data.checkIn);
  const checkOut = parseDateOnly(parsed.data.checkOut);
  if (!checkIn || !checkOut) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
  }
  if (checkOut <= checkIn) {
    return NextResponse.json(
      { error: "Check-out must be after check-in" },
      { status: 400 }
    );
  }
  if (checkIn < todayUtc()) {
    return NextResponse.json(
      { error: "Check-in date is in the past" },
      { status: 400 }
    );
  }

  const rooms = await prisma.room.findMany({
    where: {
      capacity: { gte: parsed.data.guests },
      status: { not: "MAINTENANCE" },
      bookings: { none: overlapWhere(checkIn, checkOut) },
    },
    orderBy: { pricePerNight: "asc" },
  });

  return NextResponse.json({ rooms });
}
