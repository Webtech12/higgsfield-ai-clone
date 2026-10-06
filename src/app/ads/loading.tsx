/** The library's shape while it loads: the header, then cards where the ads will be. */
export default function Loading() {
  return (
    <main
      className="mx-auto w-full max-w-7xl flex-1 px-4 pt-12 pb-24 sm:px-6 sm:pt-16"
      aria-busy="true"
    >
      <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
      <div className="mt-4 h-14 w-64 animate-pulse rounded-xl bg-muted" />
      <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <li key={i} className="overflow-hidden rounded-2xl border border-border">
            <div className="aspect-[4/5] animate-pulse bg-muted" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            </div>
          </li>
        ))}
      </ul>
      <p className="sr-only">Loading your ads…</p>
    </main>
  );
}
