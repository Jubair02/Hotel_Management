import type { PaymentStatus } from "@prisma/client";

type PaymentLike = { status: PaymentStatus; createdAt: Date };

/**
 * The one payment status worth showing for a booking:
 * PAID beats everything, an open PENDING beats history, and otherwise
 * the most recent record speaks (so a retried-then-failed payment shows
 * FAILED, not whichever row happened to be inserted first).
 */
export function displayPaymentStatus(payments: PaymentLike[]): PaymentStatus {
  if (payments.some((p) => p.status === "PAID")) return "PAID";
  if (payments.some((p) => p.status === "PENDING")) return "PENDING";
  const latest = [...payments].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  )[0];
  return latest?.status ?? "PENDING";
}
