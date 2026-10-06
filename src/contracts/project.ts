import { z } from "zod";

import { AdBriefFields, ReferenceRole } from "./ad";
import { AspectRatio, StyleTag } from "./brief";
import { CastView } from "./talent";

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
  /** When it was ordered (ISO), so a long render can say how long it has run. */
  createdAt: z.string(),
});
export type AssetView = z.infer<typeof AssetView>;

export const ShotView = z.object({
  id: z.string(),
  ordinal: z.number().int(),
  title: z.string(),
  description: z.string(),
  /** What happens during the shot; null for films planned before ads (ADR-024). */
  motion: z.string().nullable(),
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

/** A concept. The ad fields are null for films planned before ads (ADR-024). */
export const DirectionView = z.object({
  id: z.string(),
  ordinal: z.number().int(),
  name: z.string(),
  tagline: z.string(),
  look: z.string(),
  hook: z.string().nullable(),
  headline: z.string().nullable(),
  cta: z.string().nullable(),
  musicBrief: z.string().nullable(),
  shots: z.array(ShotView),
});
export type DirectionView = z.infer<typeof DirectionView>;

export const ReferenceView = z.object({ url: z.string(), role: ReferenceRole });
export type ReferenceView = z.infer<typeof ReferenceView>;

export const WorkspaceView = z.object({
  id: z.string(),
  title: z.string(),
  /** A one-line summary of the brief, for headers and the gallery. */
  brief: z.string(),
  /** The full ad brief; null for films made before ads. */
  ad: AdBriefFields.nullable(),
  cast: CastView.nullable(),
  references: z.array(ReferenceView),
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

/**
 * "luma-serum-shot-2.mp4": the ad's title, the shot number and the clip's real extension. Shared,
 * so a download link's suggested name and the name the server sends always agree.
 */
export function shotFilename(adTitle: string, shotNumber: number, url: string): string {
  const slug =
    adTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 48)
      .replace(/^-+|-+$/g, "") || "ad";
  const extension = /\.(mp4|webm|mov)(?=$|[?#])/i.exec(url)?.[1]?.toLowerCase() ?? "mp4";
  return `${slug}-shot-${String(shotNumber)}.${extension}`;
}

// --- Commands --------------------------------------------------------------------------------

// POST /api/v1/projects takes the ad brief: AdBriefInput in ./ad.
export const CreateProjectResponse = z.object({ projectId: z.string() });
export type CreateProjectResponse = z.infer<typeof CreateProjectResponse>;

export const ProduceResponse = z.object({ assetIds: z.array(z.string()) });
export type ProduceResponse = z.infer<typeof ProduceResponse>;

export const RetryResponse = z.object({ assetId: z.string() });
export type RetryResponse = z.infer<typeof RetryResponse>;

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
