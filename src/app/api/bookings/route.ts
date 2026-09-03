import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/guard";
import {
  createBookingSchema,
  bookingListQuerySchema,
  pickQuery,
  queryErrorMessage,
} from "@/lib/validation";
import {
  overlapWhere,
  nightsBetween,
  parseDateOnly,
  todayUtc,
} from "@/lib/availability";

/**
 * POST /api/bookings — create a booking (authenticated guest).
 *
 * Double-booking prevention: the overlap check and the insert run inside
 * a SERIALIZABLE transaction, so two concurrent requests for the same
 * room/dates cannot both succeed. On a serialization conflict (P2034)
 * the transaction is retried once, and if the room is now taken the
 * second caller gets a clean 409.
 */
export async function POST(req: NextRequest) {
  // Booking is a guest activity — staff manage bookings through the
  // reception/admin endpoints, they don't create them for themselves.
  const { session, error } = await requireAuth(["GUEST"]);
  if (error) return error;

  const body = await req.json().catch(() => null);
  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const checkIn = parseDateOnly(data.checkIn);
  const checkOut = parseDateOnly(data.checkOut);
  if (!checkIn || !checkOut || checkOut <= checkIn) {
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

  const room = await prisma.room.findUnique({ where: { id: data.roomId } });
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  if (room.status === "MAINTENANCE") {
    return NextResponse.json(
      { error: "This room is under maintenance" },
      { status: 409 }
    );
  }
  if (data.numberOfGuests > room.capacity) {
    return NextResponse.json(
      { error: `This room sleeps at most ${room.capacity} guests` },
      { status: 400 }
    );
  }

  const totalNights = nightsBetween(checkIn, checkOut);
  const totalAmount = room.pricePerNight.mul(totalNights);

  const createTx = () =>
    prisma.$transaction(
      async (tx) => {
        const conflict = await tx.booking.findFirst({
          where: { roomId: room.id, ...overlapWhere(checkIn, checkOut) },
          select: { id: true },
        });
        if (conflict) return null;

        return tx.booking.create({
          data: {
            guestId: session.sub,
            roomId: room.id,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            numberOfGuests: data.numberOfGuests,
            totalNights,
            totalAmount,
            status: "PENDING",
            guestName: data.guestName,
            guestEmail: data.guestEmail,
            guestPhone: data.guestPhone,
            notes: data.notes || null,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

  let booking;
  try {
    booking = await createTx();
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2034"
    ) {
      booking = await createTx(); // one retry after serialization conflict
    } else {
      throw e;
    }
  }

  if (!booking) {
    return NextResponse.json(
      { error: "This room is no longer available for the selected dates" },
      { status: 409 }
    );
  }

  return NextResponse.json({ booking }, { status: 201 });
}

/**
 * GET /api/bookings — list bookings.
 * Guests see their own; ADMIN and RECEPTIONIST see all (with filters).
 */
export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = req.nextUrl;
  const staff = session.role === "ADMIN" || session.role === "RECEPTIONIST";

  const parsed = bookingListQuerySchema.safeParse(
    pickQuery(searchParams, ["status", "guestName", "date"])
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: queryErrorMessage(parsed.error) },
      { status: 400 }
    );
  }
  const { status, guestName, date } = parsed.data;

  // The regex admits "2026-13-45"; make sure it is a real calendar date.
  const day = date ? parseDateOnly(date) : null;
  if (date && !day) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const where: Prisma.BookingWhereInput = {
    ...(staff ? {} : { guestId: session.sub }),
    ...(status ? { status } : {}),
    ...(guestName && staff
      ? { guestName: { contains: guestName, mode: "insensitive" } }
      : {}),
    ...(day
      ? {
          // In house on that day: stay has started by then and not yet ended.
          checkInDate: { lte: day },
          checkOutDate: { gt: day },
        }
      : {}),
  };

  const bookings = await prisma.booking.findMany({
    where,
    include: {
      room: { select: { roomNumber: true, name: true, type: true } },
      payments: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return NextResponse.json({ bookings });
}
