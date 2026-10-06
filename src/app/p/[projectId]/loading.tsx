export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10 sm:px-6" aria-busy="true">
      <div className="h-10 w-72 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-4 w-full max-w-xl animate-pulse rounded bg-muted" />
      <p className="sr-only">Loading your ad…</p>
    </main>
  );
}
