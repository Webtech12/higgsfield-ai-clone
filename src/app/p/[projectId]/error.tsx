"use client";

import Link from "next/link";

import { Button } from "@/shared/ui";

export default function ProjectError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-20 pb-24 sm:px-6">
      <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
        This ad didn&apos;t load
      </h1>
      <p className="mt-4 max-w-lg text-muted-foreground">
        Something went wrong on our side. Your ad is safe; try again in a moment.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/ads">Go to my ads</Link>
        </Button>
      </div>
    </main>
  );
}
