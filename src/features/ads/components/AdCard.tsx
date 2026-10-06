import { Copy, LoaderCircle, TriangleAlert } from "lucide-react";
import Link from "next/link";

import type { AdCardModel } from "@/entities/project";
import { cn } from "@/shared/lib/cn";
import { FadeInImage, StatusBadge } from "@/shared/ui";

/**
 * One ad in the library: its cover frame, where it stands, who's in it, and a shortcut to make
 * another from the same brief. The whole card opens the ad (a stretched link), so the one other
 * action sits above it.
 */
export function AdCard({ ad }: { ad: AdCardModel }) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-[border-color,transform] duration-500 ease-out-expo focus-within:border-primary/60 hover:-translate-y-1 hover:border-foreground/20">
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {ad.coverUrl ? (
          <FadeInImage
            src={ad.coverUrl}
            alt=""
            className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]"
          />
        ) : (
          <CoverPlaceholder ad={ad} />
        )}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/85 to-transparent"
        />
        <StatusBadge tone={ad.status.tone} className="absolute top-3 left-3">
          {ad.status.label}
        </StatusBadge>
        {ad.talent ? (
          <p className="absolute bottom-3 left-3 flex items-center gap-2 text-xs font-medium text-white">
            <span className="relative size-7 overflow-hidden rounded-full border border-white/30 bg-muted">
              <FadeInImage
                src={ad.talent.photoUrl}
                alt=""
                className="absolute inset-0 size-full object-cover"
              />
            </span>
            {ad.talent.name}
          </p>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-display text-lg leading-snug font-semibold tracking-[-0.01em]">
          <Link
            href={ad.href}
            className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
          >
            {ad.title}
          </Link>
        </h3>
        <p className="text-xs text-muted-foreground">
          {[ad.format, ad.madeAgo].filter(Boolean).join(" · ")}
        </p>
        {ad.detail ? <p className="text-xs font-medium text-primary">{ad.detail}</p> : null}
        {ad.makeAnotherHref ? (
          <Link
            href={ad.makeAnotherHref}
            aria-label={`Make another ad like ${ad.title}`}
            className="relative z-10 mt-auto inline-flex items-center gap-1.5 self-start rounded-full pt-3 text-sm font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Copy className="size-3.5" aria-hidden /> Make another
          </Link>
        ) : null}
      </div>
    </article>
  );
}

/** No frame yet: say what's happening rather than show an empty box. */
function CoverPlaceholder({ ad }: { ad: AdCardModel }) {
  const isFailed = ad.status.tone === "danger";
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center gap-2 bg-linear-to-br from-accent via-muted to-background p-6 text-center text-sm text-muted-foreground",
        ad.status.isInProgress && "animate-pulse",
      )}
    >
      {isFailed ? (
        <TriangleAlert className="size-5 text-destructive" aria-hidden />
      ) : (
        <LoaderCircle className="size-5 animate-spin" aria-hidden />
      )}
      {isFailed ? "This one needs another try" : "Storyboards on their way"}
    </div>
  );
}
