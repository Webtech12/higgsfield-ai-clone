"use client";

import { Download, RotateCcw } from "lucide-react";

import type { AspectRatio } from "@/contracts/brief";
import type { Film, FilmShot } from "@/entities/project";
import { spendCheck, useMe, type SpendCheck } from "@/entities/viewer";
import { errorMessage } from "@/shared/lib/apiErrors";
import { cn } from "@/shared/lib/cn";
import { ASPECT_CLASS, Button, FadeInImage, StatusBadge } from "@/shared/ui";

import { useRetryAsset } from "../hooks/useRetryAsset";

type RetryMutation = ReturnType<typeof useRetryAsset>;

/** Thumbnails keep the film's shape at roughly the same visual weight. */
const THUMB_WIDTH = { "16:9": "w-28", "9:16": "w-16", "1:1": "w-20" } satisfies Record<
  AspectRatio,
  string
>;

/** The film's shots in order, like a playlist: status, a jump into the player, download or retry. */
export function ShotTimeline({
  film,
  currentIndex,
  onSelect,
}: {
  film: Film;
  currentIndex: number;
  onSelect: (index: number) => void;
}) {
  const retry = useRetryAsset(film.projectId);
  const { data: me } = useMe();
  const spend = spendCheck(me, 1);

  return (
    <section aria-labelledby="shots-heading">
      <h2
        id="shots-heading"
        className="mb-4 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase"
      >
        Shots
      </h2>
      <ol className="space-y-2">
        {film.shots.map((shot, index) => (
          <li
            key={shot.id}
            className={cn(
              "flex gap-3.5 rounded-2xl border p-2.5 transition-colors duration-200 ease-out-quart",
              index === currentIndex
                ? "border-primary/50 bg-card"
                : "border-transparent hover:bg-card/60",
            )}
          >
            <button
              type="button"
              onClick={() => {
                onSelect(index);
              }}
              aria-current={index === currentIndex ? "true" : undefined}
              aria-label={`Show shot ${String(shot.number)} in the player`}
              className={cn(
                "relative shrink-0 self-start overflow-hidden rounded-lg border border-border bg-muted outline-none focus-visible:ring-[3px] focus-visible:ring-ring",
                ASPECT_CLASS[film.aspectRatio],
                THUMB_WIDTH[film.aspectRatio],
              )}
            >
              {shot.posterUrl ? (
                <FadeInImage src={shot.posterUrl} alt="" className="size-full object-cover" />
              ) : null}
            </button>
            <ShotDetails shot={shot} canRetry={film.canManage} retry={retry} spend={spend} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function ShotDetails({
  shot,
  canRetry,
  retry,
  spend,
}: {
  shot: FilmShot;
  canRetry: boolean;
  retry: RetryMutation;
  spend: SpendCheck;
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 truncate text-sm font-semibold">
          <span className="mr-1.5 font-display text-xs text-primary tabular-nums" aria-hidden>
            {String(shot.number).padStart(2, "0")}
          </span>
          <span className="sr-only">Shot {shot.number}: </span>
          {shot.title}
        </h3>
        <StatusBadge tone={shot.status.tone} className="shrink-0">
          {shot.status.label}
        </StatusBadge>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{shot.recipe}</p>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {shot.description}
      </p>
      {shot.download ? (
        <Button asChild variant="ghost" size="sm" className="mt-1 -ml-3">
          <a
            href={shot.download.href}
            download={shot.download.filename}
            aria-label={`Download shot ${String(shot.number)}`}
          >
            <Download aria-hidden /> Download
          </a>
        </Button>
      ) : null}
      {shot.video.kind === "failed" && canRetry ? (
        <RetryButton assetId={shot.video.assetId} retry={retry} spend={spend} />
      ) : null}
    </div>
  );
}

/** Retrying costs the shot's price again (the failed attempt was refunded), so it shows the cost. */
function RetryButton({
  assetId,
  retry,
  spend,
}: {
  assetId: string;
  retry: RetryMutation;
  spend: SpendCheck;
}) {
  const isThisShot = retry.variables === assetId;
  return (
    <div className="mt-2 flex flex-col items-start gap-1">
      <Button
        variant="outline"
        size="sm"
        disabled={spend.kind !== "ok" || retry.isPending}
        onClick={() => {
          retry.mutate(assetId);
        }}
      >
        <RotateCcw aria-hidden />
        {retry.isPending && isThisShot
          ? "Retrying…"
          : spend.kind === "loading"
            ? "Retry"
            : `Retry · ${String(spend.cost)} credits`}
      </Button>
      {spend.kind === "blocked" ? <p className="text-xs text-primary">{spend.message}</p> : null}
      {retry.isError && isThisShot ? (
        <p role="alert" className="text-xs text-destructive">
          {errorMessage(retry.error)}
        </p>
      ) : null}
    </div>
  );
}
