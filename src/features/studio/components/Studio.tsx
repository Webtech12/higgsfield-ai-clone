"use client";

import { useEffect } from "react";

import type { Film } from "@/entities/project";
import { useRefreshMe } from "@/entities/viewer";

import { usePlayer } from "../hooks/usePlayer";
import { RenderProgress } from "./RenderProgress";
import { SequencePlayer } from "./SequencePlayer";
import { ShotTimeline } from "./ShotTimeline";

/**
 * The Studio: the chosen concept as a finished ad. While it renders, a progress panel leads; the
 * player and its shot list sit side by side on wide screens, so Play, every shot's status and its
 * actions are all in view without scrolling.
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
    <div className="flex flex-col gap-10">
      {film.progress.inFlight > 0 ? <RenderProgress film={film} /> : null}
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] xl:gap-14">
        <section aria-labelledby="player-heading" className="min-w-0">
          <h2
            id="player-heading"
            className="mb-4 text-xs font-semibold tracking-[0.18em] text-primary uppercase"
          >
            Concept · {film.directionName}
          </h2>
          <SequencePlayer film={film} player={player} />
        </section>
        <ShotTimeline film={film} currentIndex={player.state.index} onSelect={player.select} />
      </div>
    </div>
  );
}
