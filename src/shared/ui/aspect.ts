import type { AspectRatio } from "@/contracts/brief";

/** Aspect classes per supported ratio, shared by storyboard frames, thumbnails and the player. */
export const ASPECT_CLASS = {
  "16:9": "aspect-video",
  "9:16": "aspect-[9/16]",
  "1:1": "aspect-square",
} satisfies Record<AspectRatio, string>;
