"use client";

import Link from "next/link";

import { Button } from "@/shared/ui";

export default function ProjectError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-16 sm:px-6">
      <h1 className="font-display text-4xl">This film didn&apos;t load</h1>
      <p className="mt-3 max-w-lg text-muted-foreground">
        Something went wrong on our side. Your project is safe; try again in a moment.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/">Back to the brief</Link>
        </Button>
      </div>
    </main>
  );
}
