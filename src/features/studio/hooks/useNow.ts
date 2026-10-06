"use client";

import { useSyncExternalStore } from "react";

/** Minutes are the finest unit on screen, so a tick every 15 seconds is plenty. */
const TICK_MS = 15_000;

const subscribe = (onTick: () => void) => {
  const timer = window.setInterval(onTick, TICK_MS);
  return () => {
    window.clearInterval(timer);
  };
};

/** The current tick: the same number between ticks, so React re-renders only when it changes. */
const currentTick = () => Math.floor(Date.now() / TICK_MS);

/**
 * The time, kept current. Null on the server and during hydration, so a clock rendered on the
 * server can never disagree with the browser's.
 */
export function useNow(): Date | null {
  const tick = useSyncExternalStore(subscribe, currentTick, () => null);
  return tick === null ? null : new Date(tick * TICK_MS);
}
