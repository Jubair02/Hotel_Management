import Link from "next/link";
import { KeyTag } from "@/components/KeyTag";
import { formatMoney } from "@/lib/format";

export type RoomCardData = {
  id: string;
  roomNumber: string;
  name: string;
  type: string;
  pricePerNight: string; // Decimal serialized
  capacity: number;
  images: string[];
  amenities: string[];
};

export function RoomCard({
  room,
  query,
}: {
  room: RoomCardData;
  query?: string;
}) {
  const href = `/rooms/${room.id}${query ? `?${query}` : ""}`;
  return (
    <Link
      href={href}
      className="group overflow-hidden rounded-xl border border-sand-200 bg-white transition-shadow hover:shadow-lg hover:shadow-pine-900/10"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-sand-100">
        {room.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={room.images[0]}
            alt={room.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-400 text-sm">
            No photo yet
          </div>
        )}
        <div className="absolute left-3 top-3">
          <KeyTag roomNumber={room.roomNumber} />
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg text-pine-900">{room.name}</h3>
            <p className="mt-0.5 text-xs uppercase tracking-[0.15em] text-ink-400">
              {room.type.toLowerCase()} · sleeps {room.capacity}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-display text-lg text-pine-900">
              {formatMoney(room.pricePerNight)}
            </p>
            <p className="text-[11px] text-ink-400">per night</p>
          </div>
        </div>
        {room.amenities.length > 0 && (
          <p className="mt-3 line-clamp-1 text-xs text-ink-600">
            {room.amenities.slice(0, 4).join(" · ")}
            {room.amenities.length > 4 ? " · …" : ""}
          </p>
        )}
      </div>
    </Link>
  );
}
