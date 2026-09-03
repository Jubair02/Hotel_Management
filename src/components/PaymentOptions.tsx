"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * The guest picks how to pay. Online payment goes through the mock
 * gateway page (IPN-verified); cash confirms the booking with payment
 * collected at the desk.
 */
export function PaymentOptions({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pay(provider: "MOCK" | "CASH") {
    setBusy(provider);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Payment could not be started");
        return;
      }
      router.push(data.next);
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => pay("MOCK")}
        disabled={busy !== null}
        className="w-full rounded-md bg-pine-800 px-4 py-3 text-sm font-semibold text-white hover:bg-pine-700 disabled:opacity-60"
      >
        {busy === "MOCK" ? "Opening gateway…" : "Pay online now"}
      </button>
      <p className="text-center text-xs text-ink-400">
        Sandbox gateway — stands in for SSLCOMMERZ / bKash
      </p>

      <button
        onClick={() => pay("CASH")}
        disabled={busy !== null}
        className="w-full rounded-md border border-sand-300 bg-white px-4 py-3 text-sm font-semibold text-ink-900 hover:border-pine-700 hover:text-pine-800 disabled:opacity-60"
      >
        {busy === "CASH" ? "Reserving…" : "Pay at the hotel"}
      </button>
      <p className="text-center text-xs text-ink-400">
        Your room is held — settle the bill at the front desk
      </p>

      {error && (
        <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
