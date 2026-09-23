import { z } from "zod";

import { CameraMove, ShotDuration } from "./project";

/**
 * The Director's structured output: exactly 3 directions of 3 shots (AGENTS.md §1). Validated with
 * zod after the provider's own structured-output check, because LLM output is a trust boundary.
 */
export const PlannedShot = z.object({
  title: z.string().min(1).max(80),
  description: z.string().min(1).max(400),
  cameraMove: CameraMove,
  durationS: ShotDuration,
  lighting: z.string().min(1).max(120),
  mood: z.string().min(1).max(120),
});
export type PlannedShot = z.infer<typeof PlannedShot>;

export const PlannedDirection = z.object({
  name: z.string().min(1).max(60),
  tagline: z.string().min(1).max(160),
  look: z.string().min(1).max(300),
  shots: z.array(PlannedShot).length(3),
});
export type PlannedDirection = z.infer<typeof PlannedDirection>;

/** Continuity elements injected into every prompt (ADR-017). */
export const Elements = z.object({
  character: z.string().min(1).max(200),
  location: z.string().min(1).max(200),
  style: z.string().min(1).max(200),
});
export type Elements = z.infer<typeof Elements>;

export const DirectorPlan = z.object({
  title: z.string().min(1).max(80),
  elements: Elements,
  directions: z.array(PlannedDirection).length(3),
});
export type DirectorPlan = z.infer<typeof DirectorPlan>;
