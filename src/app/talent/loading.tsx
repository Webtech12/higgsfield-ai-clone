/** The roster's shape while it loads: the header, then portraits where the talent will be. */
export default function Loading() {
  return (
    <main
      className="mx-auto w-full max-w-7xl flex-1 px-4 pt-12 pb-24 sm:px-6 sm:pt-16"
      aria-busy="true"
    >
      <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
      <div className="mt-4 h-14 w-48 animate-pulse rounded-xl bg-muted" />
      <ul className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <div className="aspect-[3/4] animate-pulse rounded-2xl bg-muted" />
            <div className="mt-5 h-6 w-2/5 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-4 w-3/5 animate-pulse rounded bg-muted" />
          </li>
        ))}
      </ul>
      <p className="sr-only">Loading the roster…</p>
    </main>
  );
}
