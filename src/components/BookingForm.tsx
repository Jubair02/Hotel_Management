"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const inputCls =
  "w-full rounded-md border border-sand-300 bg-white px-3 py-2.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-pine-700/40 focus:border-pine-700";

type Props = {
  roomId: string;
  checkIn: string;
  checkOut: string;
  maxGuests: number;
  defaultGuests: number;
  defaults: { name: string; email: string };
};

export function BookingForm({
  roomId,
  checkIn,
  checkOut,
  maxGuests,
  defaultGuests,
  defaults,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    guestName: defaults.name,
    guestEmail: defaults.email,
    guestPhone: "",
    numberOfGuests: String(Math.min(defaultGuests, maxGuests)),
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          checkIn,
          checkOut,
          numberOfGuests: Number(form.numberOfGuests),
          guestName: form.guestName,
          guestEmail: form.guestEmail,
          guestPhone: form.guestPhone,
          notes: form.notes,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Could not create the booking");
        return;
      }
      router.push(`/bookings/${data.booking.id}/payment`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Guest name</span>
          <input
            required
            minLength={2}
            value={form.guestName}
            onChange={(e) => setForm({ ...form, guestName: e.target.value })}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Email</span>
          <input
            type="email"
            required
            value={form.guestEmail}
            onChange={(e) => setForm({ ...form, guestEmail: e.target.value })}
            className={inputCls}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Phone</span>
          <input
            required
            minLength={6}
            value={form.guestPhone}
            onChange={(e) => setForm({ ...form, guestPhone: e.target.value })}
            className={inputCls}
            placeholder="+880…"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Guests</span>
          <select
            value={form.numberOfGuests}
            onChange={(e) =>
              setForm({ ...form, numberOfGuests: e.target.value })
            }
            className={inputCls}
          >
            {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">
          Special requests <span className="text-ink-400">(optional)</span>
        </span>
        <textarea
          rows={3}
          maxLength={500}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className={inputCls}
          placeholder="Early check-in, extra pillows, airport pick-up…"
        />
      </label>

      {error && (
        <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-pine-800 px-4 py-3 text-sm font-semibold text-white hover:bg-pine-700 disabled:opacity-60"
      >
        {busy ? "Holding your room…" : "Continue to payment"}
      </button>
      <p className="text-center text-xs text-ink-400">
        Nothing is charged yet — you choose how to pay on the next step.
      </p>
    </form>
  );
}
