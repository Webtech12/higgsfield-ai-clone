import { z } from "zod";

import { ON_SCREEN_LIMITS } from "./ad";
import { CameraMove, ShotDuration } from "./project";

/**
 * The Director's structured output: exactly 3 ad concepts of 3 shots (AGENTS.md §1). Validated with
 * zod after the provider's own structured-output check, because LLM output is a trust boundary.
 */
export const PlannedShot = z.object({
  title: z.string().min(1).max(80),
  /** The first frame: what the camera sees, in concrete visual terms. */
  description: z.string().min(1).max(400),
  /** What happens during the shot: the action and the product moment, for the video model. */
  motion: z.string().min(1).max(300),
  cameraMove: CameraMove,
  durationS: ShotDuration,
  lighting: z.string().min(1).max(120),
  mood: z.string().min(1).max(120),
});
export type PlannedShot = z.infer<typeof PlannedShot>;

export const PlannedDirection = z.object({
  name: z.string().min(1).max(60),
  /** The concept's angle in one line. */
  tagline: z.string().min(1).max(160),
  look: z.string().min(1).max(300),
  /** What stops the scroll in the first two seconds. */
  hook: z.string().min(1).max(160),
  /** The end card's headline. */
  headline: z.string().min(1).max(ON_SCREEN_LIMITS.headline),
  /** The end card's call to action. */
  cta: z.string().min(1).max(ON_SCREEN_LIMITS.cta),
  /** Genre, mood, tempo and instruments for the music bed. */
  musicBrief: z.string().min(1).max(240),
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
