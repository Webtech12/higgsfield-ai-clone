"use client";

import Link from "next/link";

import { renderClock, type Film, type VideoState } from "@/entities/project";
import { cn } from "@/shared/lib/cn";

import { useNow } from "../hooks/useNow";

const TRACK_CLASS = {
  waiting: "bg-muted",
  rendering: "bg-primary/20",
  failed: "bg-destructive",
  ready: "bg-primary",
} satisfies Record<VideoState["kind"], string>;

/**
 * While the ad renders (about 8 minutes): a track per shot, sized by its length, how long the render
 * has run and what's left, and the reassurance that it doesn't need this tab open (ADR-028).
 */
export function RenderProgress({ film }: { film: Film }) {
  const now = useNow();
  const clock = film.renderStartedAt && now ? renderClock(film.renderStartedAt, now) : null;

  return (
    <section
      aria-labelledby="render-heading"
      className="animate-rise rounded-2xl border border-border bg-card p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 id="render-heading" className="font-display text-xl font-semibold tracking-tight">
          Rendering your ad
        </h2>
        {clock ? (
          <p className="text-sm text-muted-foreground tabular-nums">
            {clock.started} · {clock.remaining}
          </p>
        ) : null}
      </div>
      <ol className="mt-5 flex gap-1.5">
        {film.shots.map((shot) => (
          <li key={shot.id} className="min-w-0 basis-0" style={{ flexGrow: shot.durationS }}>
            <span
              aria-hidden
              className={cn(
                "relative block h-1.5 overflow-hidden rounded-full",
                TRACK_CLASS[shot.video.kind],
              )}
            >
              {shot.video.kind === "rendering" ? (
                <span className="absolute inset-0 animate-sweep bg-linear-to-r from-transparent via-neon/80 to-transparent" />
              ) : null}
            </span>
            <span className="mt-2 block truncate text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Shot {shot.number}</span> ·{" "}
              {shot.status.label}
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        You can close this tab. Rendering carries on without it, and your ad will be waiting in{" "}
        <Link
          href="/ads"
          className="font-medium text-foreground underline underline-offset-4 hover:text-primary focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          My ads
        </Link>
        .
      </p>
    </section>
  );
}
