"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Simulates the gateway's hosted payment page. "Success" here does NOT
 * confirm the booking directly — it triggers the IPN callback, and the
 * server verifies the transaction before updating anything. That is the
 * exact shape of a real SSLCOMMERZ integration.
 */
export function MockGateway({
  paymentId,
  bookingId,
  transactionId,
}: {
  paymentId: string;
  bookingId: string;
  transactionId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function settle(status: "success" | "failed") {
    setBusy(status);
    setError(null);
    try {
      const res = await fetch(`/api/payments/${paymentId}/ipn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, status }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Gateway error");
        return;
      }
      router.push(
        status === "success"
          ? `/bookings/${bookingId}/confirmation`
          : `/bookings/${bookingId}/payment`
      );
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => settle("success")}
        disabled={busy !== null}
        className="w-full rounded-md bg-pine-800 px-4 py-3 text-sm font-semibold text-white hover:bg-pine-700 disabled:opacity-60"
      >
        {busy === "success" ? "Verifying with gateway…" : "Simulate successful payment"}
      </button>
      <button
        onClick={() => settle("failed")}
        disabled={busy !== null}
        className="w-full rounded-md border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
      >
        {busy === "failed" ? "Reporting failure…" : "Simulate failed payment"}
      </button>
      {error && (
        <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
