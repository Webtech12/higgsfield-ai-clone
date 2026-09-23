import Link from "next/link";

import { CreditsBadge } from "@/features/credits";

/**
 * App-level composition: features never import each other, so the header composes them here. The
 * account menu joins the credits badge in S6.
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
        <CreditsBadge />
      </div>
    </header>
  );
}
