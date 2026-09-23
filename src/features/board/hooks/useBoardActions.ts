"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import type { UpdateShotInput } from "@/contracts/project";
import { projectKeys } from "@/entities/project";
import { apiRequest } from "@/shared/lib/apiClient";

const Ok = z.object({ ok: z.literal(true) });
const Updated = z.object({ frameStale: z.boolean() });
const Accepted = z.object({ assetId: z.string() });

/** Board mutations. Each refreshes the workspace, which restarts polling while work is in flight. */
export function useBoardActions(projectId: string) {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
  const base = `/projects/${encodeURIComponent(projectId)}`;

  const selectDirection = useMutation({
    mutationFn: (directionId: string) =>
      apiRequest(`${base}/selection`, Ok, { method: "POST", body: { directionId } }),
    onSettled: refresh,
  });

  const updateShot = useMutation({
    mutationFn: ({ shotId, patch }: { shotId: string; patch: UpdateShotInput }) =>
      apiRequest(`${base}/shots/${encodeURIComponent(shotId)}`, Updated, {
        method: "PATCH",
        body: patch,
      }),
    onSettled: refresh,
  });

  const redrawFrame = useMutation({
    mutationFn: (shotId: string) =>
      apiRequest(`${base}/shots/${encodeURIComponent(shotId)}/frame`, Accepted, { method: "POST" }),
    onSettled: refresh,
  });

  return { selectDirection, updateShot, redrawFrame };
}
