"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWorkspace, projectKeys, type WorkspaceSnapshot } from "../api/queries";
import { isSettled } from "../model/viewModels";

const POLL_MS = 2000;

/**
 * The live workspace: polls every 2 s with If-None-Match while anything is in flight, and stops by
 * itself once everything is settled (ADR-013). Replacing polling with push is a change to this file.
 */
export function useProject(projectId: string, initial: WorkspaceSnapshot) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () =>
      fetchWorkspace(
        projectId,
        queryClient.getQueryData<WorkspaceSnapshot>(projectKeys.detail(projectId)),
      ),
    initialData: initial,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data && isSettled(data.view) ? false : POLL_MS;
    },
    refetchIntervalInBackground: false,
  });
}
