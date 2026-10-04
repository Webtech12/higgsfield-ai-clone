import type { AspectRatio } from "@/contracts/brief";
import type { Elements } from "@/contracts/plan";
import type { CameraMove } from "@/contracts/project";

/**
 * The one place prompts are assembled (AGENTS.md §8). Continuity elements go into every frame prompt
 * so shots in a concept stay consistent (ADR-017). Reference photos travel with frame requests in a
 * fixed order (talent, then product, then scene), and the prompt names each one, so the model knows
 * whose face and which product to keep (ADR-024). Camera moves are rendered as prompt text because
 * the image-to-video models don't take them as parameters.
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
  "9:16": "vertical composition framed for social feeds, subject centred",
  "1:1": "square composition, subject centred",
} satisfies Record<AspectRatio, string>;

/** How many reference photos come before the prompt, in this order. */
export interface ReferenceCounts {
  talent: number;
  product: number;
  scene: number;
}

export const NO_REFERENCES: ReferenceCounts = { talent: 0, product: 0, scene: 0 };

export interface ShotRecipe {
  description: string;
  /** What happens during the shot; null for films planned before ads. */
  motion: string | null;
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
  references: ReferenceCounts;
}

const clean = (parts: string[]) =>
  parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join(". ")
    .replace(/\.\./g, ".");

const images = (first: number, count: number) =>
  count === 1 ? `image ${String(first)}` : `images ${String(first)}–${String(first + count - 1)}`;

/** Names each reference photo by its position, so the model keeps the right face and product. */
export function describeReferences({ talent, product, scene }: ReferenceCounts): string[] {
  const lines: string[] = [];
  let next = 1;
  if (talent > 0) {
    lines.push(
      `The talent is the person in ${images(next, talent)}: keep their face, hair, skin tone and build exactly`,
    );
    next += talent;
  }
  if (product > 0) {
    lines.push(
      `The product is the one in ${images(next, product)}: keep its shape, colours, materials and label text exactly`,
    );
    next += product;
  }
  if (scene > 0) lines.push(`Use ${images(next, scene)} as the reference for the location`);
  return lines;
}

/** The storyboard frame: a single still that will also be the video's first frame (ADR-017). */
export function composeFramePrompt({
  elements,
  direction,
  shot,
  aspectRatio,
  references,
}: PromptContext): string {
  return clean([
    shot.description,
    ...describeReferences(references),
    `Styling: ${elements.character}`,
    `Location: ${elements.location}`,
    `Look: ${direction.look}, ${elements.style}`,
    `Lighting: ${shot.lighting}. Mood: ${shot.mood}`,
    `${FRAMING_BY_RATIO[aspectRatio]}, photorealistic commercial photography, natural skin texture, crisp detail`,
    references.product > 0
      ? "No added text, captions or watermarks: the only lettering is the product's own label"
      : "No text, captions or watermarks",
  ]);
}

/** The motion prompt for image-to-video: what moves, and how the camera moves. */
export function composeVideoPrompt({ direction, shot, references }: PromptContext): string {
  return clean([
    shot.motion ?? shot.description,
    `Camera: ${CAMERA_MOVE_PHRASES[shot.cameraMove]}`,
    references.product > 0
      ? "Keep the person and the product exactly as in the first frame, with the product label sharp and readable"
      : "Keep every person and object consistent with the first frame",
    `Look: ${direction.look}. Mood: ${shot.mood}`,
    "Photorealistic commercial footage, smooth natural motion, no on-screen text",
  ]);
}

export function describeCameraMove(move: CameraMove): string {
  return CAMERA_MOVE_PHRASES[move];
}
