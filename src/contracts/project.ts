import { z } from "zod";

import { AspectRatio, StyleTag } from "./brief";

/** Higgsfield-style named camera moves. The Director picks one per shot; the user can change it. */
export const CAMERA_MOVES = [
  "static",
  "dolly-in",
  "dolly-out",
  "pan",
  "tilt-up",
  "crane-up",
  "orbit",
  "handheld",
  "crash-zoom",
  "fpv",
] as const;
export const CameraMove = z.enum(CAMERA_MOVES);
export type CameraMove = z.infer<typeof CameraMove>;

export const SHOT_DURATIONS = [4, 5, 6, 8] as const;
export const ShotDuration = z.union(SHOT_DURATIONS.map((d) => z.literal(d)));
export type ShotDuration = (typeof SHOT_DURATIONS)[number];

export const PROJECT_STATUSES = [
  "planning",
  "planned",
  "selected",
  "producing",
  "ready",
  "failed",
] as const;
export const ProjectStatus = z.enum(PROJECT_STATUSES);
export type ProjectStatus = z.infer<typeof ProjectStatus>;

export const ASSET_STATUSES = [
  "queued",
  "submitted",
  "running",
  "persisting",
  "succeeded",
  "failed",
] as const;
export const AssetStatus = z.enum(ASSET_STATUSES);
export type AssetStatus = z.infer<typeof AssetStatus>;

export const ASSET_KINDS = ["frame", "video"] as const;
export const AssetKind = z.enum(ASSET_KINDS);
export type AssetKind = z.infer<typeof AssetKind>;

// --- The workspace read model (GET /api/v1/projects/:id) ---------------------------------------

export const AssetView = z.object({
  id: z.string(),
  kind: AssetKind,
  status: AssetStatus,
  version: z.number().int(),
  url: z.string().nullable(),
  error: z.string().nullable(),
});
export type AssetView = z.infer<typeof AssetView>;

export const ShotView = z.object({
  id: z.string(),
  ordinal: z.number().int(),
  title: z.string(),
  description: z.string(),
  cameraMove: CameraMove,
  durationS: ShotDuration,
  lighting: z.string(),
  mood: z.string(),
  frameStale: z.boolean(),
  /** The frame to display: the current version, or the latest attempt if none has succeeded yet. */
  frame: AssetView.nullable(),
  /** A newer frame attempt still in flight or failed (e.g. a redraw), shown over `frame`. */
  frameJob: AssetView.nullable(),
  video: AssetView.nullable(),
  videoJob: AssetView.nullable(),
});
export type ShotView = z.infer<typeof ShotView>;

export const DirectionView = z.object({
  id: z.string(),
  ordinal: z.number().int(),
  name: z.string(),
  tagline: z.string(),
  look: z.string(),
  shots: z.array(ShotView),
});
export type DirectionView = z.infer<typeof DirectionView>;

export const WorkspaceView = z.object({
  id: z.string(),
  title: z.string(),
  brief: z.string(),
  aspectRatio: AspectRatio,
  styles: z.array(StyleTag),
  status: ProjectStatus,
  version: z.number().int(),
  selectedDirectionId: z.string().nullable(),
  isDemo: z.boolean(),
  isOwner: z.boolean(),
  directions: z.array(DirectionView),
});
export type WorkspaceView = z.infer<typeof WorkspaceView>;

// --- Commands --------------------------------------------------------------------------------

export const CreateProjectResponse = z.object({ projectId: z.string() });
export type CreateProjectResponse = z.infer<typeof CreateProjectResponse>;

export const SelectDirectionInput = z.object({ directionId: z.string().min(1) });
export type SelectDirectionInput = z.infer<typeof SelectDirectionInput>;

export const UpdateShotInput = z
  .object({
    description: z.string().trim().min(3).max(400),
    cameraMove: CameraMove,
    durationS: ShotDuration,
  })
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "Nothing to update" });
export type UpdateShotInput = z.infer<typeof UpdateShotInput>;
