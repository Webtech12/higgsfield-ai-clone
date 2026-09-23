import Link from "next/link";

/**
 * App-level composition: the header will host the credits badge and the account menu once those
 * features exist (S3, S6). It lives in app/ because features never import each other.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-display text-2xl tracking-tight focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          Director
        </Link>
      </div>
    </header>
  );
}
