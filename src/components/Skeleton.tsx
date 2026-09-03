/**
 * Loading skeletons for route segments (loading.tsx). They mirror the real
 * page anatomy — eyebrow, display title, then the content shape — so the
 * layout doesn't jump when data arrives. Purely decorative for AT.
 */
function Bar({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-sand-200 ${className}`} />;
}

function Header({ wide }: { wide?: boolean }) {
  return (
    <>
      <Bar className="h-3 w-24" />
      <Bar className={`mt-3 h-8 ${wide ? "w-96 max-w-full" : "w-64"}`} />
    </>
  );
}

function TableRows({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-sand-200 bg-white">
      <div className="flex gap-6 border-b border-sand-200 px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Bar key={i} className="h-2.5 w-16" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-6 border-b border-sand-100 px-4 py-4 last:border-0"
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Bar key={c} className={`h-3.5 ${c === 0 ? "w-32" : "w-20"}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

function Cards({ count }: { count: number }) {
  return (
    <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-sand-200 bg-white"
        >
          <div className="aspect-[4/3] animate-pulse bg-sand-100" />
          <div className="p-4">
            <Bar className="h-4 w-40" />
            <Bar className="mt-2 h-2.5 w-28" />
            <Bar className="mt-4 h-2.5 w-52 max-w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Tiles({ count }: { count: number }) {
  return (
    <div className={`mt-6 grid gap-4 grid-cols-2 sm:grid-cols-${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-sand-200 bg-white p-4">
          <Bar className="h-2.5 w-20" />
          <Bar className="mt-3 h-7 w-12" />
        </div>
      ))}
    </div>
  );
}

export type SkeletonVariant = "cards" | "table" | "dashboard" | "detail" | "form";

export function PageSkeleton({
  variant,
  className = "max-w-6xl",
}: {
  variant: SkeletonVariant;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className={`mx-auto ${className} px-6 py-12`}
    >
      <Header wide={variant === "detail"} />
      {variant === "cards" && (
        <>
          <div className="mt-6 rounded-xl border border-sand-200 bg-white p-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <Bar key={i} className="h-10" />
              ))}
            </div>
          </div>
          <Cards count={6} />
        </>
      )}
      {variant === "table" && (
        <>
          <Bar className="mt-6 h-9 w-full max-w-2xl" />
          <TableRows rows={6} cols={5} />
        </>
      )}
      {variant === "dashboard" && (
        <>
          <Tiles count={4} />
          <div className="mt-8 grid gap-4 lg:grid-cols-[1.7fr_1fr]">
            <div className="rounded-xl border border-sand-200 bg-white p-6">
              <Bar className="h-2.5 w-28" />
              <Bar className="mt-5 h-9 w-full" />
              <Bar className="mt-4 h-2.5 w-3/4" />
            </div>
            <div className="rounded-xl bg-pine-950/90 p-6">
              <Bar className="h-2.5 w-24 bg-white/20" />
              <Bar className="mt-4 h-10 w-40 bg-white/20" />
            </div>
          </div>
          <TableRows rows={5} cols={5} />
        </>
      )}
      {variant === "detail" && (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="aspect-[16/10] animate-pulse rounded-xl bg-sand-100" />
            <Bar className="mt-6 h-3 w-full" />
            <Bar className="mt-2 h-3 w-11/12" />
            <Bar className="mt-2 h-3 w-2/3" />
          </div>
          <div className="rounded-xl border border-sand-200 bg-white p-6">
            <Bar className="h-7 w-32" />
            <Bar className="mt-6 h-10 w-full" />
            <Bar className="mt-3 h-10 w-full" />
            <Bar className="mt-6 h-11 w-full" />
          </div>
        </div>
      )}
      {variant === "form" && (
        <div className="mt-8 rounded-xl border border-sand-200 bg-white p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i}>
                <Bar className="h-2.5 w-20" />
                <Bar className="mt-2 h-10 w-full" />
              </div>
            ))}
          </div>
          <Bar className="mt-6 h-10 w-36" />
        </div>
      )}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
