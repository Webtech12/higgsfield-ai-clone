"use client";

import { useEffect } from "react";

import type { Film } from "@/entities/project";
import { useRefreshMe } from "@/entities/viewer";

import { usePlayer } from "../hooks/usePlayer";
import { SequencePlayer } from "./SequencePlayer";
import { ShotTimeline } from "./ShotTimeline";

/**
 * The Studio: the chosen direction as a film. The player and its shot list sit side by side on wide
 * screens, so Play, every shot's status and its actions are all in view without scrolling.
 */
export function Studio({ film }: { film: Film }) {
  const player = usePlayer(film.shots);
  const refreshMe = useRefreshMe();

  // The server refunds a failed shot on its own; re-read the balance when a failure shows up.
  const failed = film.progress.failed;
  useEffect(() => {
    if (failed > 0) void refreshMe();
  }, [failed, refreshMe]);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
      <section aria-label="Player" className="min-w-0">
        <p className="mb-3 font-mono text-xs text-muted-foreground">
          Direction · {film.directionName}
        </p>
        <SequencePlayer film={film} player={player} />
      </section>
      <ShotTimeline film={film} currentIndex={player.state.index} onSelect={player.select} />
    </div>
  );
}
