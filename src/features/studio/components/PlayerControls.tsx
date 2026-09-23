"use client";

import { Pause, Play, RotateCcw, SkipBack, SkipForward } from "lucide-react";

import type { Film } from "@/entities/project";
import { Button } from "@/shared/ui";

import type { Player } from "../hooks/usePlayer";

/** Play/pause for the whole film, previous/next shot, and which shot is on screen (announced). */
export function PlayerControls({ film, player }: { film: Film; player: Player }) {
  const { state } = player;
  const current = film.shots[state.index];
  const lastIndex = film.shots.length - 1;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <Button onClick={player.toggle} disabled={!player.canPlay} className="min-w-32">
        {state.isPlaying ? (
          <>
            <Pause aria-hidden /> Pause
          </>
        ) : state.hasEnded ? (
          <>
            <RotateCcw aria-hidden /> Play again
          </>
        ) : (
          <>
            <Play aria-hidden /> Play film
          </>
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Previous shot"
        disabled={state.index === 0}
        onClick={() => {
          player.select(state.index - 1);
        }}
      >
        <SkipBack aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Next shot"
        disabled={state.index >= lastIndex}
        onClick={() => {
          player.select(state.index + 1);
        }}
      >
        <SkipForward aria-hidden />
      </Button>
      <p aria-live="polite" className="ml-1 min-w-0 text-sm">
        <span className="font-medium">
          Shot {state.index + 1} of {film.shots.length}
        </span>
        {current ? <span className="text-muted-foreground"> · {current.title}</span> : null}
      </p>
    </div>
  );
}
