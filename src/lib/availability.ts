import { Prisma, BookingStatus } from "@prisma/client";

/**
 * Booking statuses that block a room from being booked again for
 * overlapping dates. CANCELLED and CHECKED_OUT bookings release the dates.
 */
export const ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.CHECKED_IN,
];

/**
 * Two date ranges overlap when:
 *   newCheckIn < existingCheckOut AND newCheckOut > existingCheckIn
 * Check-out day is exclusive, so back-to-back bookings
 * (A checks out 15th, B checks in 15th) are allowed.
 *
 * Overdue stays: a CHECKED_IN guest physically occupies the room until
 * they actually check out, whatever their planned check-out date says.
 * So when the requested stay starts today (or earlier), ANY in-house
 * booking on the room blocks it — planned dates only matter for stays
 * that begin in the future, by which time the room will have turned over.
 */
export function overlapWhere(
  checkIn: Date,
  checkOut: Date,
  today: Date = todayUtc()
): Prisma.BookingWhereInput {
  const plannedOverlap: Prisma.BookingWhereInput = {
    status: { in: ACTIVE_BOOKING_STATUSES },
    checkInDate: { lt: checkOut },
    checkOutDate: { gt: checkIn },
  };
  if (checkIn > today) return plannedOverlap;
  return {
    OR: [plannedOverlap, { status: BookingStatus.CHECKED_IN }],
  };
}

export function nightsBetween(checkIn: Date, checkOut: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((checkOut.getTime() - checkIn.getTime()) / MS_PER_DAY);
}

/** Parse a YYYY-MM-DD string as a UTC date (avoids timezone drift). */
export function parseDateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function todayUtc(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}
