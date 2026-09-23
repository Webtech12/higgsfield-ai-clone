"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { RetryResponse } from "@/contracts/project";
import { projectKeys } from "@/entities/project";
import { viewerKeys } from "@/entities/viewer";
import { apiRequest } from "@/shared/lib/apiClient";

/**
 * Retries a failed shot. The failed attempt was refunded, so a retry reserves the shot's price again;
 * a second click can't charge twice, because only a failed shot can be re-queued (the server says 409).
 */
export function useRetryAsset(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assetId: string) =>
      apiRequest(
        `/projects/${encodeURIComponent(projectId)}/assets/${encodeURIComponent(assetId)}/retries`,
        RetryResponse,
        { method: "POST" },
      ),
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) }),
        queryClient.invalidateQueries({ queryKey: viewerKeys.me }),
      ]);
    },
  });
}
