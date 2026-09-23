/** Designed loading state while the Director writes the plan: three direction outlines. */
export function PlanningSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      {[0, 1, 2].map((d) => (
        <div key={d} className="rounded-xl border border-border p-5">
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-7 w-56 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-3 w-full max-w-xl animate-pulse rounded bg-muted" />
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((s) => (
              <div key={s} className="aspect-video animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
