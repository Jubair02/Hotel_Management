"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

function plusDays(base: string, days: number): string {
  const d = new Date(`${base}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const inputCls =
  "w-full rounded-md border border-sand-300 bg-white px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-pine-700/40 focus:border-pine-700";

type Props = {
  defaults?: { checkIn?: string; checkOut?: string; guests?: string };
  compact?: boolean;
  /** Page to submit to — defaults to the listing; a room page passes its
      own path so changing dates keeps the guest on that room. */
  basePath?: string;
};

export function SearchForm({ defaults, compact, basePath = "/rooms" }: Props) {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  const [checkIn, setCheckIn] = useState(defaults?.checkIn ?? plusDays(today, 1));
  const [checkOut, setCheckOut] = useState(
    defaults?.checkOut ?? plusDays(today, 3)
  );
  const [guests, setGuests] = useState(defaults?.guests ?? "2");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (checkOut <= checkIn) {
      setError("Check-out must be after check-in");
      return;
    }
    setError(null);
    router.push(
      `${basePath}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`
    );
  }

  return (
    <form
      onSubmit={submit}
      className={
        compact
          ? "grid grid-cols-2 sm:grid-cols-[1fr_1fr_auto_auto] gap-3 items-end"
          : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto] gap-4 items-end"
      }
    >
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-600">
          Check-in
        </span>
        <input
          type="date"
          required
          min={today}
          value={checkIn}
          onChange={(e) => {
            setCheckIn(e.target.value);
            if (checkOut <= e.target.value)
              setCheckOut(plusDays(e.target.value, 1));
          }}
          className={inputCls}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-600">
          Check-out
        </span>
        <input
          type="date"
          required
          min={plusDays(checkIn, 1)}
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className={inputCls}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-600">
          Guests
        </span>
        <select
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          className={`${inputCls} min-w-20`}
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-1">
        <button
          type="submit"
          className="rounded-md bg-pine-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-pine-700 transition-colors"
        >
          Check availability
        </button>
        {error && <span className="text-xs text-red-700">{error}</span>}
      </div>
    </form>
  );
}
