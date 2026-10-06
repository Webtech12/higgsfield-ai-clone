import type { AdCardModel } from "@/entities/project";

import { AdCard } from "./AdCard";

/** The library: newest first, as many columns as the screen allows. */
export function AdsGrid({ ads }: { ads: AdCardModel[] }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {ads.map((ad, index) => (
        <li
          key={ad.id}
          className="animate-rise"
          style={{ animationDelay: `${String(Math.min(index, 8) * 60)}ms` }}
        >
          <AdCard ad={ad} />
        </li>
      ))}
    </ul>
  );
}
