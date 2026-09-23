"use client";

import { useReducer } from "react";

import type { FilmShot } from "@/entities/project";

/** The sequential player: which shot is on screen, and whether the film is running. */
export interface PlayerState {
  index: number;
  isPlaying: boolean;
  /** The last playable shot has finished; Play starts the film again. */
  hasEnded: boolean;
}

/**
 * `playable[i]` is true when shot i has a finished video. Actions carry it because it changes while
 * the film renders, and the reducer stays pure.
 */
export type PlayerAction =
  | { type: "play"; playable: readonly boolean[] }
  | { type: "pause" }
  | { type: "select"; index: number; playable: readonly boolean[] }
  | { type: "clipEnded"; playable: readonly boolean[] };

export const INITIAL_PLAYER: PlayerState = { index: 0, isPlaying: false, hasEnded: false };

const firstPlayableFrom = (playable: readonly boolean[], from: number) =>
  playable.findIndex((isReady, i) => isReady && i >= from);

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case "play": {
      // From the shot on screen (or the top, after the end), skipping shots that aren't ready.
      const from = state.hasEnded ? 0 : state.index;
      const index = [
        firstPlayableFrom(action.playable, from),
        firstPlayableFrom(action.playable, 0),
      ].find((i) => i !== -1);
      return index === undefined ? state : { index, isPlaying: true, hasEnded: false };
    }
    case "pause":
      return { ...state, isPlaying: false };
    case "select":
      return {
        index: action.index,
        isPlaying: state.isPlaying && action.playable[action.index] === true,
        hasEnded: false,
      };
    case "clipEnded": {
      const next = firstPlayableFrom(action.playable, state.index + 1);
      return next === -1
        ? { ...state, isPlaying: false, hasEnded: true }
        : { ...state, index: next };
    }
  }
}

export type Player = ReturnType<typeof usePlayer>;

/** Player state for one film, with actions bound to which of its shots can play right now. */
export function usePlayer(shots: readonly FilmShot[]) {
  const [state, dispatch] = useReducer(playerReducer, INITIAL_PLAYER);
  const playable = shots.map((shot) => shot.video.kind === "ready");

  return {
    state,
    canPlay: playable.some(Boolean),
    /** Stable across renders, so effects can use it. */
    dispatch,
    toggle: () => {
      dispatch(state.isPlaying ? { type: "pause" } : { type: "play", playable });
    },
    select: (index: number) => {
      dispatch({ type: "select", index, playable });
    },
    clipEnded: () => {
      dispatch({ type: "clipEnded", playable });
    },
  };
}
