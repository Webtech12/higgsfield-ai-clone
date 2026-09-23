"use client";

import { AlertTriangle, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState, type SyntheticEvent } from "react";

import type { AspectRatio } from "@/contracts/brief";
import type { Film, FilmShot } from "@/entities/project";
import { cn } from "@/shared/lib/cn";
import { ASPECT_CLASS } from "@/shared/ui";

import type { Player } from "../hooks/usePlayer";
import { PlayerControls } from "./PlayerControls";

/**
 * The player fills its column, but its stage never grows taller than about half the viewport, so the
 * controls under it stay above the fold on a laptop screen.
 */
const WIDTH_CLASS = {
  "16:9": "max-w-[calc(55vh*16/9)]",
  "9:16": "max-w-[calc(min(55vh,560px)*9/16)]",
  "1:1": "max-w-[55vh]",
} satisfies Record<AspectRatio, string>;

/**
 * Plays the film's shots back to back. Each clip has its own <video>, stacked: the one on screen is
 * visible, the next one preloads, so a cut has no gap (docs/frontend.md §8). Shots still rendering
 * show their storyboard frame instead.
 */
export function SequencePlayer({ film, player }: { film: Film; player: Player }) {
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const [clip, setClip] = useState({ index: 0, progress: 0 });
  const { state, dispatch } = player;
  const current = film.shots[state.index];

  // Leaving a shot rewinds it, so every shot starts from its first frame when it comes round again.
  useEffect(() => {
    videos.current.forEach((video, i) => {
      if (video && i !== state.index) {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [state.index]);

  // Keep the clip on screen in step with the play state. If the browser refuses to play, show Play
  // again rather than pretend. An AbortError only means a newer play/pause superseded this one.
  useEffect(() => {
    const video = videos.current[state.index];
    if (!video) return;
    if (!state.isPlaying) {
      video.pause();
      return;
    }
    video.play().catch((error: unknown) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      dispatch({ type: "pause" });
    });
  }, [state.index, state.isPlaying, dispatch]);

  const trackProgress =
    (index: number, shot: FilmShot) => (event: SyntheticEvent<HTMLVideoElement>) => {
      const video = event.currentTarget;
      // Browser-recorded WebM can report an unknown (infinite) duration; fall back to the planned one.
      const duration =
        Number.isFinite(video.duration) && video.duration > 0 ? video.duration : shot.durationS;
      setClip({ index, progress: Math.min(1, video.currentTime / duration) });
    };

  const fill = (index: number) =>
    state.hasEnded || index < state.index
      ? 1
      : index === state.index && clip.index === index
        ? clip.progress
        : 0;

  return (
    <div className={cn("mx-auto w-full", WIDTH_CLASS[film.aspectRatio])}>
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-xl border border-border bg-black",
          ASPECT_CLASS[film.aspectRatio],
        )}
      >
        {film.shots.map((shot, index) =>
          shot.video.kind === "ready" ? (
            // Muted: the registry's image-to-video clips are silent, and muted playback lets each
            // next shot start without a fresh user gesture. There is no speech to caption.
            <video
              key={shot.id}
              ref={(element) => {
                videos.current[index] = element;
              }}
              src={shot.video.url}
              poster={shot.posterUrl ?? undefined}
              preload={index === state.index || index === state.index + 1 ? "auto" : "metadata"}
              muted
              playsInline
              aria-hidden={index !== state.index}
              data-current={index === state.index ? "true" : undefined}
              className={cn(
                "absolute inset-0 size-full object-contain transition-opacity duration-300",
                index === state.index ? "opacity-100" : "opacity-0",
              )}
              onEnded={player.clipEnded}
              onTimeUpdate={trackProgress(index, shot)}
            />
          ) : null,
        )}
        {current && current.video.kind !== "ready" ? <PendingShot shot={current} /> : null}
      </div>

      <div className="mt-3 flex gap-1" aria-hidden>
        {film.shots.map((shot, index) => (
          <div
            key={shot.id}
            className="h-1 basis-0 overflow-hidden rounded-full bg-muted"
            style={{ flexGrow: shot.durationS }}
          >
            <div
              className="h-full bg-primary transition-[width] duration-300 ease-linear"
              style={{ width: `${String(fill(index) * 100)}%` }}
            />
          </div>
        ))}
      </div>

      <PlayerControls film={film} player={player} />
    </div>
  );
}

/** A shot without a playable video yet: its storyboard frame, dimmed, with what's happening. */
function PendingShot({ shot }: { shot: FilmShot }) {
  const isFailed = shot.video.kind === "failed";
  return (
    <div className="absolute inset-0">
      {shot.posterUrl ? (
        // Plain <img>: a storyboard still from our own origin or bucket, shown behind a status.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={shot.posterUrl} alt="" className="size-full object-contain opacity-40" />
      ) : null}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-sm">
        {isFailed ? (
          <AlertTriangle className="size-5 text-destructive" aria-hidden />
        ) : (
          <LoaderCircle className="size-5 animate-spin text-muted-foreground" aria-hidden />
        )}
        {isFailed
          ? `Shot ${String(shot.number)} didn't render. Retry it from the shot list.`
          : `Rendering shot ${String(shot.number)}…`}
      </div>
    </div>
  );
}
