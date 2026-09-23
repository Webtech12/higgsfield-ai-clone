"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { MeView } from "@/contracts/viewer";
import { apiRequest } from "@/shared/lib/apiClient";

export const viewerKeys = { me: ["me"] as const };

/**
 * The one source of "who am I" on the client (docs/frontend.md §10): user, guest flag, credits,
 * today's video allowance and prices. Components never read the auth session directly.
 */
export function useMe() {
  return useQuery({
    queryKey: viewerKeys.me,
    queryFn: () => apiRequest("/me", MeView),
    staleTime: 10_000,
  });
}

/** Re-reads the balance after the server changed it on its own, e.g. refunding a failed video. */
export function useRefreshMe(): () => Promise<void> {
  const queryClient = useQueryClient();
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: viewerKeys.me }),
    [queryClient],
  );
}
