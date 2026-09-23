import { z } from "zod";

/** Aspect ratios a brief can ask for; fixed before any frame is drawn (AGENTS.md §1). */
export const ASPECT_RATIOS = ["16:9", "9:16", "1:1"] as const;
export const AspectRatio = z.enum(ASPECT_RATIOS);
export type AspectRatio = z.infer<typeof AspectRatio>;

/** Optional style chips: hints for the Director, never a model choice. */
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

export const BRIEF_IDEA_MIN = 12;
export const BRIEF_IDEA_MAX = 600;
export const BRIEF_MAX_STYLES = 3;

export const BriefInput = z.object({
  idea: z.string().trim().min(BRIEF_IDEA_MIN).max(BRIEF_IDEA_MAX),
  aspectRatio: AspectRatio,
  styles: z.array(StyleTag).max(BRIEF_MAX_STYLES),
});
export type BriefInput = z.infer<typeof BriefInput>;
