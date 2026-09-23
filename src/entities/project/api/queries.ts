import { WorkspaceView } from "@/contracts/project";
import { apiGetIfChanged } from "@/shared/lib/apiClient";

export const projectKeys = {
  detail: (projectId: string) => ["project", projectId] as const,
};

/** What the query cache holds: the view plus the ETag it came with. */
export interface WorkspaceSnapshot {
  view: WorkspaceView;
  etag: string | null;
}

/** Fetches the workspace, reusing `previous` when the server answers 304 Not Modified. */
export async function fetchWorkspace(
  projectId: string,
  previous: WorkspaceSnapshot | undefined,
): Promise<WorkspaceSnapshot> {
  const result = await apiGetIfChanged(
    `/projects/${encodeURIComponent(projectId)}`,
    WorkspaceView,
    previous?.etag ?? null,
  );
  if (result === null && previous) return previous;
  if (result === null) return fetchWorkspace(projectId, undefined);
  return { view: result.data, etag: result.etag };
}
