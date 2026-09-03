"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const inputCls =
  "w-full rounded-md border border-sand-300 bg-white px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-pine-700/40 focus:border-pine-700";

const ROOM_TYPES = ["SINGLE", "DOUBLE", "TWIN", "DELUXE", "SUITE", "FAMILY"];
const ROOM_STATUSES = [
  "AVAILABLE",
  "OCCUPIED",
  "RESERVED",
  "CLEANING",
  "MAINTENANCE",
];

export type RoomFormValues = {
  roomNumber: string;
  name: string;
  type: string;
  description: string;
  pricePerNight: string;
  capacity: string;
  status: string;
  images: string; // newline-separated in the form
  amenities: string; // comma-separated in the form
};

export function RoomForm({
  roomId,
  initial,
  statusLock,
}: {
  roomId?: string;
  initial?: RoomFormValues;
  /**
   * Set by the edit page when the room's status is dictated by the
   * workflow (guest in house, open housekeeping task). `locked` disables
   * the select entirely; otherwise the note is advisory and the API is
   * the final arbiter.
   */
  statusLock?: { locked: boolean; note: string };
}) {
  const router = useRouter();
  const [form, setForm] = useState<RoomFormValues>(
    initial ?? {
      roomNumber: "",
      name: "",
      type: "DOUBLE",
      description: "",
      pricePerNight: "",
      capacity: "2",
      status: "AVAILABLE",
      images: "",
      amenities: "",
    }
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof RoomFormValues>(key: K) {
    return (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = {
        roomNumber: form.roomNumber.trim(),
        name: form.name.trim(),
        type: form.type,
        description: form.description.trim(),
        pricePerNight: Number(form.pricePerNight),
        capacity: Number(form.capacity),
        status: form.status,
        images: form.images
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        amenities: form.amenities
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const res = await fetch(roomId ? `/api/rooms/${roomId}` : "/api/rooms", {
        method: roomId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Could not save the room");
        return;
      }
      router.push("/admin/rooms");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Room number</span>
          <input
            required
            value={form.roomNumber}
            onChange={set("roomNumber")}
            className={inputCls}
            placeholder="304"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium">Room name</span>
          <input
            required
            minLength={2}
            value={form.name}
            onChange={set("name")}
            className={inputCls}
            placeholder="Deluxe King"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Type</span>
          <select value={form.type} onChange={set("type")} className={inputCls}>
            {ROOM_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">
            Price / night (৳)
          </span>
          <input
            type="number"
            required
            min={1}
            value={form.pricePerNight}
            onChange={set("pricePerNight")}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Capacity</span>
          <input
            type="number"
            required
            min={1}
            max={20}
            value={form.capacity}
            onChange={set("capacity")}
            className={inputCls}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Status</span>
          <select
            value={form.status}
            onChange={set("status")}
            disabled={statusLock?.locked}
            aria-describedby={statusLock ? "room-status-note" : undefined}
            className={`${inputCls} disabled:cursor-not-allowed disabled:bg-sand-50 disabled:text-ink-400`}
          >
            {ROOM_STATUSES.map((s) => (
              <option key={s} value={s} disabled={s === "OCCUPIED" && !statusLock?.locked}>
                {s}{s === "OCCUPIED" && !statusLock?.locked ? " (via check-in)" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>
      {statusLock && (
        <p
          id="room-status-note"
          className="rounded-md border border-marigold-100 bg-marigold-50 px-3 py-2 text-sm text-marigold-700"
        >
          {statusLock.note}
        </p>
      )}

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Description</span>
        <textarea
          required
          minLength={10}
          rows={3}
          value={form.description}
          onChange={set("description")}
          className={inputCls}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">
          Image URLs <span className="text-ink-400">(one per line)</span>
        </span>
        <textarea
          rows={3}
          value={form.images}
          onChange={set("images")}
          className={`${inputCls} font-mono text-xs`}
          placeholder="https://…"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">
          Amenities <span className="text-ink-400">(comma separated)</span>
        </span>
        <input
          value={form.amenities}
          onChange={set("amenities")}
          className={inputCls}
          placeholder="Wi-Fi, Air Conditioning, Minibar"
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
        className="rounded-md bg-pine-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pine-700 disabled:opacity-60"
      >
        {busy ? "Saving…" : roomId ? "Save changes" : "Create room"}
      </button>
    </form>
  );
}
