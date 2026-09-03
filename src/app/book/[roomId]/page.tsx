import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { BookingForm } from "@/components/BookingForm";
import { KeyTag } from "@/components/KeyTag";
import { formatMoney, formatDate } from "@/lib/format";
import { nightsBetween, parseDateOnly } from "@/lib/availability";

export const metadata = { title: "Book your stay" };

type Props = {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ checkIn?: string; checkOut?: string; guests?: string }>;
};

export default async function BookPage({ params, searchParams }: Props) {
  const { roomId } = await params;
  const sp = await searchParams;

  const checkIn = sp.checkIn ? parseDateOnly(sp.checkIn) : null;
  const checkOut = sp.checkOut ? parseDateOnly(sp.checkOut) : null;
  if (!checkIn || !checkOut || checkOut <= checkIn) {
    redirect(`/rooms/${roomId}`);
  }

  const session = await getSession();
  if (!session) {
    const back = `/book/${roomId}?checkIn=${sp.checkIn}&checkOut=${sp.checkOut}&guests=${sp.guests ?? 1}`;
    redirect(`/login?next=${encodeURIComponent(back)}`);
  }

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) notFound();

  const nights = nightsBetween(checkIn, checkOut);
  const total = room.pricePerNight.mul(nights);
  const guests = Math.max(1, Number(sp.guests) || 1);

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
        Booking
      </p>
      <h1 className="mt-1 font-display text-3xl text-pine-900">
        Almost yours
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-sand-200 bg-white p-6">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
            Guest information
          </h2>
          <BookingForm
            roomId={room.id}
            checkIn={sp.checkIn!}
            checkOut={sp.checkOut!}
            maxGuests={room.capacity}
            defaultGuests={guests}
            defaults={{ name: session.name, email: session.email }}
          />
        </div>

        <aside className="h-fit rounded-xl border border-sand-200 bg-white p-6">
          <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
            Booking summary
          </h2>
          {room.images[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={room.images[0]}
              alt={room.name}
              className="mb-4 aspect-[16/9] w-full rounded-lg object-cover"
            />
          )}
          <div className="flex items-center justify-between">
            <p className="font-display text-lg text-pine-900">{room.name}</p>
            <KeyTag roomNumber={room.roomNumber} />
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-600">Check-in</dt>
              <dd className="font-medium">{formatDate(checkIn)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-600">Check-out</dt>
              <dd className="font-medium">{formatDate(checkOut)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-600">
                {formatMoney(room.pricePerNight.toString())} × {nights} night
                {nights === 1 ? "" : "s"}
              </dt>
              <dd className="font-medium">{formatMoney(total.toString())}</dd>
            </div>
            <div className="flex justify-between border-t border-sand-200 pt-3">
              <dt className="font-semibold text-pine-900">Total</dt>
              <dd className="font-display text-lg text-pine-900">
                {formatMoney(total.toString())}
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
