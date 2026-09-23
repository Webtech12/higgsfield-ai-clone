import Link from "next/link";

import { Button } from "@/shared/ui";

export default function ProjectNotFound() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-16 sm:px-6">
      <h1 className="font-display text-4xl">We couldn&apos;t find that film</h1>
      <p className="mt-3 max-w-lg text-muted-foreground">
        It may belong to someone else, or the link is incomplete.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Start a new brief</Link>
      </Button>
    </main>
  );
}
