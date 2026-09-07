const TONES = {
  green: "bg-pine-50 text-pine-800 border-pine-100",
  amber: "bg-marigold-50 text-marigold-700 border-marigold-100",
  red: "bg-red-50 text-red-700 border-red-100",
  blue: "bg-sky-50 text-sky-800 border-sky-100",
  gray: "bg-sand-100 text-ink-600 border-sand-200",
} as const;

type Tone = keyof typeof TONES;

/** One tint system for every status in the app. */
const STATUS_TONE: Record<string, Tone> = {
  // Booking
  PENDING: "amber",
  CONFIRMED: "green",
  CANCELLED: "red",
  CHECKED_IN: "blue",
  CHECKED_OUT: "gray",
  // Room
  AVAILABLE: "green",
  OCCUPIED: "blue",
  RESERVED: "amber",
  CLEANING: "amber",
  MAINTENANCE: "red",
  // Payment
  PAID: "green",
  FAILED: "red",
  REFUNDED: "gray",
  // Housekeeping
  IN_PROGRESS: "blue",
  DONE: "green",
  MAINTENANCE_REPORTED: "red",
  // Account
  ACTIVE: "green",
  SUSPENDED: "red",
};

export function StatusBadge({ status }: { status: string }) {
  const tone = TONES[STATUS_TONE[status] ?? "gray"];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${tone}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
