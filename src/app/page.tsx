import { prisma } from "@/lib/db";
import { SearchForm } from "@/components/SearchForm";
import { RoomCard } from "@/components/RoomCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

const FACILITIES = [
  {
    title: "Rooftop tea lounge",
    body: "Sylhet-grown single-estate teas, poured over the Gulshan skyline every afternoon.",
  },
  {
    title: "Courtyard pool",
    body: "A shaded plunge pool wrapped in banana palms — open dawn to dusk.",
  },
  {
    title: "24-hour front desk",
    body: "Late flight in from Hazrat Shahjalal? The desk keeps your key ready at any hour.",
  },
  {
    title: "Home kitchen",
    body: "Bhuna, bhorta, and a proper breakfast paratha — cooked the way the city eats.",
  },
];

export default async function HomePage() {
  const featured = await prisma.room.findMany({
    orderBy: { pricePerNight: "desc" },
    take: 3,
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-pine-950">
        <div className="absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=2000&q=80"
            alt=""
            className="h-full w-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-pine-950 via-pine-950/60 to-pine-950/30" />
        </div>
        <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-40">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-marigold-400">
            Gulshan · Dhaka
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl leading-tight text-white sm:text-6xl">
            Rest like the city is
            <span className="text-marigold-400 italic"> someone else&apos;s </span>
            problem.
          </h1>
          <p className="mt-5 max-w-xl text-pine-100/80">
            Eight rooms above the lake, a rooftop of Sylheti tea, and a front
            desk that never sleeps. Grand Tulip is Dhaka at its quietest.
          </p>
        </div>
      </section>

      {/* Front-desk search card — the page's working centre */}
      <section className="relative z-10 mx-auto -mt-20 max-w-4xl px-6">
        <div className="rounded-2xl border border-sand-200 bg-white p-6 shadow-xl shadow-pine-950/20">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-pine-800">
            Find your room
          </p>
          <SearchForm />
        </div>
      </section>

      {/* Featured rooms */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
              Featured
            </p>
            <h2 className="mt-1 font-display text-3xl text-pine-900">
              Rooms worth the jet lag
            </h2>
          </div>
          <Link
            href="/rooms"
            className="shrink-0 text-sm font-medium text-pine-800 hover:text-pine-700 underline underline-offset-4"
          >
            See all rooms
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((room) => (
            <RoomCard
              key={room.id}
              room={{ ...room, pricePerNight: room.pricePerNight.toString() }}
            />
          ))}
        </div>
      </section>

      {/* Facilities */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
          The house
        </p>
        <h2 className="mt-1 font-display text-3xl text-pine-900">
          Small hotel, long list
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-sand-200 bg-sand-200 sm:grid-cols-2 lg:grid-cols-4">
          {FACILITIES.map((f) => (
            <div key={f.title} className="bg-white p-6">
              <h3 className="font-display text-lg text-pine-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Location */}
      <section className="border-t border-sand-200 bg-sand-100">
        <div className="mx-auto max-w-6xl px-6 py-16 grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
              Getting here
            </p>
            <h2 className="mt-1 font-display text-3xl text-pine-900">
              On the lake, off the noise
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-600">
              12 Lake Drive Road, Gulshan 2 — twenty minutes from Hazrat
              Shahjalal International, two from the lakeside walk. Airport
              pick-up can be arranged at booking.
            </p>
            <p className="mt-4 text-sm text-ink-600">
              +880 1700 000000 · reception@grandtulip.com
            </p>
          </div>
          <div className="overflow-hidden rounded-xl border border-sand-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1400&q=80"
              alt="The lakeside terrace at Grand Tulip"
              className="h-64 w-full object-cover lg:h-80"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
