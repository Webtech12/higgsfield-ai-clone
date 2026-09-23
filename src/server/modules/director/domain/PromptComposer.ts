import type { AspectRatio } from "@/contracts/brief";
import type { Elements } from "@/contracts/plan";
import type { CameraMove } from "@/contracts/project";

/**
 * The one place prompts are assembled (AGENTS.md §8). Continuity elements go into every frame and
 * video prompt so shots in a direction stay consistent (ADR-017). Camera moves are rendered as prompt
 * text because the image-to-video models don't take them as parameters.
 */

const CAMERA_MOVE_PHRASES = {
  static: "locked-off static camera",
  "dolly-in": "slow dolly in toward the subject",
  "dolly-out": "slow dolly out, revealing the surroundings",
  pan: "smooth horizontal pan",
  "tilt-up": "tilt up from ground level",
  "crane-up": "crane up and over the scene",
  orbit: "orbiting camera circling the subject",
  handheld: "handheld camera with subtle natural shake",
  "crash-zoom": "sudden crash zoom onto the subject",
  fpv: "fast FPV drone flythrough",
} satisfies Record<CameraMove, string>;

const FRAMING_BY_RATIO = {
  "16:9": "cinematic widescreen composition",
  "9:16": "vertical composition framed for mobile",
  "1:1": "square composition",
} satisfies Record<AspectRatio, string>;

export interface ShotRecipe {
  description: string;
  cameraMove: CameraMove;
  lighting: string;
  mood: string;
}

export interface DirectionLook {
  name: string;
  look: string;
}

export interface PromptContext {
  elements: Elements;
  direction: DirectionLook;
  shot: ShotRecipe;
  aspectRatio: AspectRatio;
}

const clean = (parts: string[]) =>
  parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join(". ")
    .replace(/\.\./g, ".");

/** The storyboard frame: a single still that will also be the video's first frame. */
export function composeFramePrompt({
  elements,
  direction,
  shot,
  aspectRatio,
}: PromptContext): string {
  return clean([
    shot.description,
    `Character: ${elements.character}`,
    `Location: ${elements.location}`,
    `Look: ${direction.look}, ${elements.style}`,
    `Lighting: ${shot.lighting}. Mood: ${shot.mood}`,
    `${FRAMING_BY_RATIO[aspectRatio]}, film still, no text, no watermark`,
  ]);
}

/** The motion prompt for image-to-video: what moves, and how the camera moves. */
export function composeVideoPrompt({ elements, direction, shot }: PromptContext): string {
  return clean([
    shot.description,
    `Camera: ${CAMERA_MOVE_PHRASES[shot.cameraMove]}`,
    `Keep ${elements.character} consistent with the first frame`,
    `Look: ${direction.look}. Mood: ${shot.mood}`,
  ]);
}

export function describeCameraMove(move: CameraMove): string {
  return CAMERA_MOVE_PHRASES[move];
}
