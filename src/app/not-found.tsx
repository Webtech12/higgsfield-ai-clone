import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/shared/ui";

export const metadata: Metadata = { title: "Page not found" };

/** A designed dead end: say what happened, and offer the two places most people want to go. */
export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 py-24 sm:px-6">
      <p className="text-sm font-semibold tracking-[0.2em] text-primary uppercase">404</p>
      <h1 className="mt-5 max-w-3xl font-display text-5xl leading-[0.95] font-semibold tracking-[-0.03em] sm:text-7xl">
        This page went off script.
      </h1>
      <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
        The link may be incomplete, or the page has moved.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/">Start a new ad</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/talent">Meet the talent</Link>
        </Button>
      </div>
    </main>
  );
}
