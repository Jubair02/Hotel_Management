import { prisma } from "@/lib/db";
import { RoomCard } from "@/components/RoomCard";
import { SearchForm } from "@/components/SearchForm";
import {
  overlapWhere,
  parseDateOnly,
  nightsBetween,
  todayUtc,
} from "@/lib/availability";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Rooms" };

type Search = Promise<{
  checkIn?: string;
  checkOut?: string;
  guests?: string;
}>;

/**
 * Same rules as /api/rooms/available: real dates, check-out after check-in,
 * check-in not in the past. A bad query never silently "searches" — the
 * page falls back to the full catalogue and says why.
 */
function validateSearch(params: {
  checkIn?: string;
  checkOut?: string;
  guests?: string;
}):
  | { ok: true; checkIn: Date; checkOut: Date; guests: number }
  | { ok: false; problem: string | null } {
  if (!params.checkIn && !params.checkOut) return { ok: false, problem: null };

  const checkIn = params.checkIn ? parseDateOnly(params.checkIn) : null;
  const checkOut = params.checkOut ? parseDateOnly(params.checkOut) : null;
  if (!checkIn || !checkOut) {
    return { ok: false, problem: "Those dates weren't recognised — pick them again below." };
  }
  if (checkOut <= checkIn) {
    return { ok: false, problem: "Check-out must be after check-in." };
  }
  if (checkIn < todayUtc()) {
    return {
      ok: false,
      problem: `${formatDate(checkIn)} is in the past — choose a check-in from today onwards.`,
    };
  }
  const guests = Math.min(20, Math.max(1, Number(params.guests) || 1));
  return { ok: true, checkIn, checkOut, guests };
}

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const params = await searchParams;
  const search = validateSearch(params);

  const rooms = await prisma.room.findMany({
    where: search.ok
      ? {
          capacity: { gte: search.guests },
          status: { not: "MAINTENANCE" },
          bookings: { none: overlapWhere(search.checkIn, search.checkOut) },
        }
      : {},
    orderBy: { pricePerNight: "asc" },
  });

  const query = search.ok
    ? `checkIn=${params.checkIn}&checkOut=${params.checkOut}&guests=${search.guests}`
    : undefined;
  const nights = search.ok ? nightsBetween(search.checkIn, search.checkOut) : 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
        {search.ok ? "Availability" : "All rooms"}
      </p>
      <h1 className="mt-1 font-display text-3xl text-pine-900">
        {search.ok
          ? `Free ${formatDate(search.checkIn)} – ${formatDate(search.checkOut)}`
          : "Every room in the house"}
      </h1>
      {search.ok && (
        <p className="mt-2 text-sm text-ink-600">
          {rooms.length} room{rooms.length === 1 ? "" : "s"} for {search.guests}{" "}
          guest{search.guests === 1 ? "" : "s"}, {nights} night
          {nights === 1 ? "" : "s"}
        </p>
      )}
      {!search.ok && search.problem && (
        <p
          role="alert"
          className="mt-4 max-w-2xl rounded-md border border-marigold-100 bg-marigold-50 px-4 py-3 text-sm text-marigold-700"
        >
          {search.problem} Showing every room instead.
        </p>
      )}

      <div className="mt-6 rounded-xl border border-sand-200 bg-white p-4">
        <SearchForm
          compact
          defaults={
            search.ok
              ? {
                  checkIn: params.checkIn,
                  checkOut: params.checkOut,
                  guests: String(search.guests),
                }
              : undefined
          }
        />
      </div>

      {rooms.length === 0 ? (
        <div className="mt-12 rounded-xl border border-sand-200 bg-white p-12 text-center">
          <p className="font-display text-xl text-pine-900">
            Nothing free for those dates
          </p>
          <p className="mt-2 text-sm text-ink-600">
            Try shifting your stay by a day or two, or reduce the guest count.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={{ ...room, pricePerNight: room.pricePerNight.toString() }}
              query={query}
            />
          ))}
        </div>
      )}
    </div>
  );
}
