import { z } from "zod";

/** Aspect ratios a brief can ask for; fixed before any frame is drawn (AGENTS.md §1). */
export const ASPECT_RATIOS = ["16:9", "9:16", "1:1"] as const;
export const AspectRatio = z.enum(ASPECT_RATIOS);
export type AspectRatio = z.infer<typeof AspectRatio>;

/**
 * Style chips from the film briefs made before ads (ADR-024). Kept so those projects still read;
 * ad briefs use moods instead (contracts/ad.ts).
 */
export const STYLE_TAGS = [
  "noir",
  "dreamy",
  "documentary",
  "commercial",
  "anime",
  "retro",
] as const;
export const StyleTag = z.enum(STYLE_TAGS);
export type StyleTag = z.infer<typeof StyleTag>;
