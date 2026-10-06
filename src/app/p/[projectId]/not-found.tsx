import Link from "next/link";

import { Button } from "@/shared/ui";

export default function ProjectNotFound() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-20 pb-24 sm:px-6">
      <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
        We couldn&apos;t find that ad
      </h1>
      <p className="mt-4 max-w-lg text-muted-foreground">
        It may belong to someone else, or the link is incomplete.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/">Start a new ad</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/ads">Go to my ads</Link>
        </Button>
      </div>
    </main>
  );
}
