/**
 * The signature element: room numbers render as a brass hotel key tag —
 * a punched chip that carries the hotel's vernacular from the public
 * site into every staff table.
 */
export function KeyTag({ roomNumber }: { roomNumber: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-marigold-600/40 bg-marigold-100 pl-2 pr-3 py-0.5 text-pine-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
      <span
        aria-hidden
        className="h-1.5 w-1.5 rounded-full border border-marigold-600/50 bg-sand-50"
      />
      <span className="font-mono text-xs font-semibold tracking-wider">
        {roomNumber}
      </span>
    </span>
  );
}
