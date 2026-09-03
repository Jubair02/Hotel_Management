import { prisma } from "@/lib/db";
import { RoomCard } from "@/components/RoomCard";
import { SearchForm } from "@/components/SearchForm";
import { overlapWhere, parseDateOnly, nightsBetween } from "@/lib/availability";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Rooms" };

type Search = Promise<{
  checkIn?: string;
  checkOut?: string;
  guests?: string;
}>;

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Search;
}) {
  const params = await searchParams;
  const checkIn = params.checkIn ? parseDateOnly(params.checkIn) : null;
  const checkOut = params.checkOut ? parseDateOnly(params.checkOut) : null;
  const guests = Math.max(1, Number(params.guests) || 1);
  const searching = Boolean(checkIn && checkOut && checkOut > checkIn);

  const rooms = await prisma.room.findMany({
    where: searching
      ? {
          capacity: { gte: guests },
          status: { not: "MAINTENANCE" },
          bookings: { none: overlapWhere(checkIn!, checkOut!) },
        }
      : {},
    orderBy: { pricePerNight: "asc" },
  });

  const query = searching
    ? `checkIn=${params.checkIn}&checkOut=${params.checkOut}&guests=${guests}`
    : undefined;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
        {searching ? "Availability" : "All rooms"}
      </p>
      <h1 className="mt-1 font-display text-3xl text-pine-900">
        {searching
          ? `Free ${formatDate(checkIn!)} – ${formatDate(checkOut!)}`
          : "Every room in the house"}
      </h1>
      {searching && (
        <p className="mt-2 text-sm text-ink-600">
          {rooms.length} room{rooms.length === 1 ? "" : "s"} for {guests}{" "}
          guest{guests === 1 ? "" : "s"},{" "}
          {nightsBetween(checkIn!, checkOut!)} night
          {nightsBetween(checkIn!, checkOut!) === 1 ? "" : "s"}
        </p>
      )}

      <div className="mt-6 rounded-xl border border-sand-200 bg-white p-4">
        <SearchForm
          compact
          defaults={{
            checkIn: params.checkIn,
            checkOut: params.checkOut,
            guests: params.guests,
          }}
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
