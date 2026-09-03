"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Route-segment error boundary. Renders inside the root layout, so the
 * navbar and footer stay put and only the page body is replaced. The
 * message is deliberately generic — stack traces belong in the server
 * log, not on a guest's screen; the digest lets support find them.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
      <span
        aria-hidden
        className="flex h-14 w-14 items-center justify-center rounded-lg border border-red-200 bg-red-50 font-display text-2xl text-red-700"
      >
        !
      </span>
      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
        Something went wrong
      </p>
      <h1 className="mt-2 font-display text-4xl text-pine-900 text-balance">
        We hit a snag behind the desk
      </h1>
      <p className="mt-3 max-w-md text-sm text-ink-600">
        The page could not be loaded. Nothing has been charged or changed by
        this error. Try again, or head back to the lobby.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-ink-400">
          Reference {error.digest}
        </p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="rounded-md bg-pine-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pine-700"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-md border border-sand-300 bg-white px-5 py-2.5 text-sm font-medium text-ink-900 hover:border-pine-700 hover:text-pine-800"
        >
          Back to the lobby
        </Link>
      </div>
    </div>
  );
}
