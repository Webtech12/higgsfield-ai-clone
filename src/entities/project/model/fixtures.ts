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
  createdAt: "2026-10-06T12:00:00Z",
});

export const shot = (overrides: Partial<ShotView> = {}): ShotView => ({
  id: "sht_1",
  ordinal: 0,
  title: "Hook",
  description: "Close-up: the talent holds the product beside her cheek",
  motion: "She brings the bottle toward the lens",
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
  title: "LUMA · UGC testimonial",
  brief: "UGC testimonial for LUMA. Brighter skin in two weeks",
  ad: null,
  cast: null,
  references: [],
  aspectRatio: "9:16",
  styles: [],
  status,
  version: 1,
  selectedDirectionId: null,
  isDemo: false,
  isOwner: true,
  directions: [
    {
      id: "dir_1",
      ordinal: 0,
      name: "Real Talk",
      tagline: "t",
      look: "l",
      hook: "h",
      headline: "Glow in 7 days",
      cta: "Shop now",
      musicBrief: "Warm indie pop",
      shots,
    },
  ],
  ...overrides,
});
