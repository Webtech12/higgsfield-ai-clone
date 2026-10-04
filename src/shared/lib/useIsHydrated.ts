"use client";

import { useSyncExternalStore } from "react";

const noSubscription = () => () => undefined;

/**
 * False in the server's HTML, true once React has hydrated. A form submitted before then would fall
 * back to a plain browser submit and lose what was typed, so its submit button waits for this.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    noSubscription,
    () => true,
    () => false,
  );
}
