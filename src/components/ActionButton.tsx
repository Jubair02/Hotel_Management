"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  /** API endpoint to call. */
  url: string;
  method?: "POST" | "PATCH" | "DELETE";
  body?: Record<string, unknown>;
  children: React.ReactNode;
  /** ask before firing (e.g. cancel / delete) */
  confirmText?: string;
  variant?: "primary" | "quiet" | "danger";
};

const VARIANTS = {
  primary:
    "bg-pine-800 text-white hover:bg-pine-700 disabled:bg-pine-800/50",
  quiet:
    "border border-sand-300 bg-white text-ink-900 hover:border-pine-700 hover:text-pine-800 disabled:opacity-50",
  danger:
    "border border-red-200 bg-white text-red-700 hover:bg-red-50 disabled:opacity-50",
};

/**
 * Generic mutation button: calls an API route, surfaces the API's error
 * message inline, and refreshes the server-rendered page on success.
 */
export function ActionButton({
  url,
  method = "POST",
  body,
  children,
  confirmText,
  variant = "quiet",
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Something went wrong");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        onClick={run}
        disabled={busy}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${VARIANTS[variant]}`}
      >
        {busy ? "Working…" : children}
      </button>
      {error && <span className="text-xs text-red-700">{error}</span>}
    </span>
  );
}
