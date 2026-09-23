import type { AssetView, ShotView, WorkspaceView } from "@/contracts/project";

/** Test builders for the workspace read model (used by the view-model tests only). */

export const asset = (
  status: AssetView["status"],
  url: string | null = null,
  kind: AssetView["kind"] = "frame",
): AssetView => ({
  id: `ast_${kind}_${status}`,
  kind,
  status,
  version: 1,
  url,
  error: null,
});

export const shot = (overrides: Partial<ShotView> = {}): ShotView => ({
  id: "sht_1",
  ordinal: 0,
  title: "Set-up",
  description: "A lighthouse at dusk",
  cameraMove: "dolly-in",
  durationS: 5,
  lighting: "dusk",
  mood: "still",
  frameStale: false,
  frame: null,
  frameJob: null,
  video: null,
  videoJob: null,
  ...overrides,
});

export const view = (
  status: WorkspaceView["status"],
  shots: ShotView[],
  overrides: Partial<WorkspaceView> = {},
): WorkspaceView => ({
  id: "prj_1",
  title: "The Keeper",
  brief: "brief",
  aspectRatio: "16:9",
  styles: [],
  status,
  version: 1,
  selectedDirectionId: null,
  isDemo: false,
  isOwner: true,
  directions: [{ id: "dir_1", ordinal: 0, name: "Quiet", tagline: "t", look: "l", shots }],
  ...overrides,
});
