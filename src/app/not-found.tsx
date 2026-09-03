import Link from "next/link";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
      <span
        aria-hidden
        className="flex h-14 w-20 items-center justify-center rounded-lg border border-marigold-600/40 bg-gradient-to-b from-marigold-400 to-marigold-500 font-display text-lg font-semibold text-pine-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.08)]"
      >
        404
      </span>
      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-400">
        No such room
      </p>
      <h1 className="mt-2 font-display text-4xl text-pine-900 text-balance">
        This page has checked out
      </h1>
      <p className="mt-3 max-w-md text-sm text-ink-600">
        The address may be mistyped, or whatever was here has moved on. The
        front desk can point you the right way.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-md bg-pine-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-pine-700"
        >
          Back to the lobby
        </Link>
        <Link
          href="/rooms"
          className="rounded-md border border-sand-300 bg-white px-5 py-2.5 text-sm font-medium text-ink-900 hover:border-pine-700 hover:text-pine-800"
        >
          Browse rooms
        </Link>
      </div>
    </div>
  );
}
