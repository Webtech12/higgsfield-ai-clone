import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/shared/ui";

/** The first visit to My ads: what will live here, and the way to make the first one. */
export function EmptyAds() {
  return (
    <div className="flex flex-col items-start gap-6 rounded-3xl border border-dashed border-border p-8 sm:p-14">
      <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
        No ads yet.
      </h2>
      <p className="max-w-lg leading-relaxed text-muted-foreground">
        Every ad you make in this browser lands here, with its storyboards and finished shots, so
        you can pick up where you left off or make another from the same brief.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button asChild size="lg">
          <Link href="/">
            Start your first ad <ArrowRight aria-hidden />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/talent">Meet the talent</Link>
        </Button>
      </div>
    </div>
  );
}
