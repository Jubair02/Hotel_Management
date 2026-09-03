"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ROLES = ["ADMIN", "RECEPTIONIST", "HOUSEKEEPING", "GUEST"] as const;

const LABELS: Record<(typeof ROLES)[number], string> = {
  ADMIN: "Admin",
  RECEPTIONIST: "Receptionist",
  HOUSEKEEPING: "Housekeeping",
  GUEST: "Guest",
};

/**
 * Inline role picker for the staff list. Changing the value PATCHes the
 * user immediately; the API refuses self-changes and demoting the last
 * admin, and the message is surfaced under the control.
 */
export function RoleSelect({
  userId,
  role,
  userName,
  disabled,
  disabledReason,
}: {
  userId: string;
  role: string;
  userName: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(role);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(next: string) {
    if (next === value) return;
    const toGuest = next === "GUEST";
    if (
      toGuest &&
      !window.confirm(
        `Remove ${userName} from staff? They will keep their account as a guest.`
      )
    ) {
      return;
    }
    const previous = value;
    setValue(next);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Could not change role");
        setValue(previous);
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <select
        value={value}
        onChange={(e) => change(e.target.value)}
        disabled={disabled || busy}
        title={disabled ? disabledReason : undefined}
        aria-label={`Role for ${userName}`}
        className="rounded-md border border-sand-300 bg-white px-2.5 py-1.5 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-pine-700/40 disabled:cursor-not-allowed disabled:bg-sand-50 disabled:text-ink-400"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {LABELS[r]}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-700">{error}</span>}
      {disabled && disabledReason && (
        <span className="text-xs text-ink-400">{disabledReason}</span>
      )}
    </span>
  );
}
