import { ArrowRight } from "lucide-react";
import Link from "next/link";

import type { AdCardModel } from "@/entities/project";

import { AdCard } from "./AdCard";

/**
 * For a returning visitor: their latest ads before the new brief, so the page opens on what
 * they've already made (the return loop, ADR-028).
 */
export function RecentAds({ ads }: { ads: AdCardModel[] }) {
  return (
    <section aria-labelledby="recent-ads">
      <div className="flex items-end justify-between gap-4">
        <h2
          id="recent-ads"
          className="font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl"
        >
          Pick up where you left off
        </h2>
        <Link
          href="/ads"
          className="inline-flex shrink-0 items-center gap-1 rounded-full text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          All my ads <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      <ul className="-mx-4 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4">
        {ads.map((ad) => (
          <li key={ad.id} className="w-[72%] shrink-0 snap-start sm:w-auto">
            <AdCard ad={ad} />
          </li>
        ))}
      </ul>
    </section>
  );
}
