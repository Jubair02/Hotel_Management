import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { KeyTag } from "@/components/KeyTag";
import { StatusBadge } from "@/components/StatusBadge";
import { formatMoney, formatDate } from "@/lib/format";
import {
  overlapWhere,
  parseDateOnly,
  nightsBetween,
} from "@/lib/availability";
import { SearchForm } from "@/components/SearchForm";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ checkIn?: string; checkOut?: string; guests?: string }>;
};

export default async function RoomDetailsPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;

  const checkIn = sp.checkIn ? parseDateOnly(sp.checkIn) : null;
  const checkOut = sp.checkOut ? parseDateOnly(sp.checkOut) : null;
  const guests = Math.max(1, Number(sp.guests) || 1);
  const hasDates = Boolean(checkIn && checkOut && checkOut > checkIn);

  // Both queries key off the route param, so they run in parallel — one
  // database round trip of latency instead of two.
  const [room, conflict] = await Promise.all([
    prisma.room.findUnique({ where: { id } }),
    hasDates
      ? prisma.booking.findFirst({
          where: { roomId: id, ...overlapWhere(checkIn!, checkOut!) },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);
  if (!room) notFound();

  let availableForDates = false;
  let nights = 0;
  if (hasDates) {
    availableForDates =
      !conflict && room.status !== "MAINTENANCE" && guests <= room.capacity;
    nights = nightsBetween(checkIn!, checkOut!);
  }

  const query = hasDates
    ? `checkIn=${sp.checkIn}&checkOut=${sp.checkOut}&guests=${guests}`
    : "";

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <Link
        href={`/rooms${query ? `?${query}` : ""}`}
        className="text-sm text-ink-600 hover:text-pine-800"
      >
        ← Back to rooms
      </Link>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        {/* Gallery + description */}
        <div>
          <div className="overflow-hidden rounded-xl border border-sand-200 bg-sand-100">
            {room.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={room.images[0]}
                alt={room.name}
                className="aspect-[16/10] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[16/10] items-center justify-center text-ink-400">
                No photo yet
              </div>
            )}
          </div>
          {room.images.length > 1 && (
            <div className="mt-3 grid grid-cols-3 gap-3">
              {room.images.slice(1, 4).map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={src}
                  src={src}
                  alt=""
                  className="aspect-[4/3] w-full rounded-lg border border-sand-200 object-cover"
                />
              ))}
            </div>
          )}

          <div className="mt-8">
            <div className="flex flex-wrap items-center gap-3">
              <KeyTag roomNumber={room.roomNumber} />
              <span className="text-xs uppercase tracking-[0.15em] text-ink-400">
                {room.type.toLowerCase()} · sleeps {room.capacity}
              </span>
            </div>
            <h1 className="mt-3 font-display text-4xl text-pine-900">
              {room.name}
            </h1>
            <p className="mt-4 max-w-2xl leading-relaxed text-ink-600">
              {room.description}
            </p>

            <h2 className="mt-8 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
              Amenities
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {room.amenities.map((a) => (
                <li
                  key={a}
                  className="rounded-full border border-sand-200 bg-white px-3 py-1 text-sm text-ink-600"
                >
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Booking panel */}
        <aside className="lg:sticky lg:top-24 h-fit rounded-xl border border-sand-200 bg-white p-6 shadow-sm">
          <div className="flex items-baseline justify-between">
            <p className="font-display text-2xl text-pine-900">
              {formatMoney(room.pricePerNight.toString())}
            </p>
            <p className="text-xs text-ink-400">per night</p>
          </div>

          {hasDates ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-lg bg-sand-50 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-600">Stay</span>
                  <span className="font-medium">
                    {formatDate(checkIn!)} → {formatDate(checkOut!)}
                  </span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-ink-600">
                    {nights} night{nights === 1 ? "" : "s"} · {guests} guest
                    {guests === 1 ? "" : "s"}
                  </span>
                  <span className="font-semibold text-pine-900">
                    {formatMoney(room.pricePerNight.mul(nights).toString())}
                  </span>
                </div>
              </div>

              {availableForDates ? (
                <Link
                  href={`/book/${room.id}?${query}`}
                  className="block rounded-md bg-pine-800 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-pine-700"
                >
                  Book this room
                </Link>
              ) : (
                <div className="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Not available for these dates
                  {guests > room.capacity
                    ? ` — this room sleeps ${room.capacity}`
                    : ""}
                  . Try different dates below.
                </div>
              )}
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-600">
              Pick your dates to see the total and book.
            </p>
          )}

          <div className="mt-6 border-t border-sand-200 pt-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
              Change dates
            </p>
            <SearchForm
              compact
              defaults={{
                checkIn: sp.checkIn,
                checkOut: sp.checkOut,
                guests: String(guests),
              }}
            />
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-sand-200 pt-4">
            <span className="text-xs text-ink-400">Current room status</span>
            <StatusBadge status={room.status} />
          </div>
        </aside>
      </div>
    </div>
  );
}
